import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { auth, db, hasFirebaseConfig, OperationType } from './firebase';
import { formatBRL } from '../utils/format';
import type {
  BuyerData,
  CartItem,
  FulfillmentType,
  OrderStage,
  PlacedOrderItem,
  StaffOrderRecord,
} from '../types';

const FORBIDDEN_PII_KEYS = new Set([
  'nome',
  'buyerName',
  'customerName',
  'buyer',
  'whatsapp',
  'phone',
  'telefone',
  'endereco',
  'address',
  'bairro',
  'neighborhood',
  'neighborhoodLabel',
  'observacao',
  'kitchenNote',
  'notes',
  'trackingToken',
]);

const ORDER_ALLOWED_KEYS = [
  'orderCode',
  'trackerId',
  'fulfillment',
  'pickupWindow',
  'subtotal',
  'deliveryFee',
  'tip',
  'total',
  'stage',
  'estimatedReady',
  'createdAt',
  'updatedAt',
] as const;

const TRACKER_ALLOWED_KEYS = [
  'orderId',
  'orderCode',
  'fulfillment',
  'pickupWindow',
  'subtotal',
  'deliveryFee',
  'tip',
  'total',
  'stage',
  'estimatedReady',
  'createdAt',
  'updatedAt',
] as const;

const ORDER_ITEM_ALLOWED_KEYS = [
  'menuItemId',
  'name',
  'quantity',
  'summary',
  'lineTotal',
] as const;

export function formatCartItemCustomizationsOnly(cartItem: CartItem): string {
  const parts: string[] = [];
  cartItem.menuItem.customizationGroups.forEach((group) => {
    if (group.type === 'single') {
      const choiceId = cartItem.selectedSingle[group.id];
      const choice = group.choices.find((c) => c.id === choiceId);
      if (choice) parts.push(choice.label);
    } else {
      const ids = cartItem.selectedMulti[group.id] || [];
      ids.forEach((id) => {
        const choice = group.choices.find((c) => c.id === id);
        if (choice) parts.push(`+ ${choice.label}`);
      });
    }
  });
  return parts.join(' · ').slice(0, 400);
}

function getCryptoProvider(): Crypto {
  if (typeof globalThis.crypto !== 'undefined' && 'getRandomValues' in globalThis.crypto) {
    return globalThis.crypto;
  }
  throw new Error('Web Crypto API indisponível neste ambiente.');
}

export function generateOrderId(): string {
  const cryptoApi = getCryptoProvider();
  const maybeRandomUuid = (cryptoApi as { randomUUID?: () => string }).randomUUID;
  if (typeof maybeRandomUuid === 'function') {
    return maybeRandomUuid.call(cryptoApi);
  }
  const bytes = new Uint8Array(16);
  cryptoApi.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateTrackingToken(): string {
  const cryptoApi = getCryptoProvider();
  const bytes = new Uint8Array(24);
  cryptoApi.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function deriveTrackerId(orderId: string, trackingToken: string): Promise<string> {
  const cryptoApi = getCryptoProvider();
  if (!cryptoApi.subtle) {
    throw new Error('crypto.subtle indisponível para derivar trackerId.');
  }
  const encoded = new TextEncoder().encode(`${orderId}:${trackingToken}`);
  const digest = await cryptoApi.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateOrderCode(prefix: string): string {
  const cryptoApi = getCryptoProvider();
  const cleanPrefix =
    prefix
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6) || 'TL';
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(5);
  cryptoApi.getRandomValues(bytes);
  let suffix = '';
  for (const b of bytes) {
    suffix += alphabet[b % alphabet.length];
  }
  return `${cleanPrefix}-${suffix}`.slice(0, 20);
}

export function computeEstimatedReadyTime(minutesAhead: number, now = new Date()): string {
  const clamped = Math.max(1, Math.min(240, Math.round(minutesAhead)));
  const readyDate = new Date(now.getTime() + clamped * 60000);
  const hours = String(readyDate.getHours()).padStart(2, '0');
  const minutes = String(readyDate.getMinutes()).padStart(2, '0');
  return `${hours}h${minutes}`;
}

export interface SanitizedOrderPayloads {
  orderDoc: Record<string, unknown>;
  trackerDoc: Record<string, unknown>;
  itemDocs: { itemId: string; data: Record<string, unknown> }[];
}

export interface CreateOrderInput {
  orderCodePrefix: string;
  fulfillment: FulfillmentType;
  estimatedMinutes: number;
  subtotal: number;
  deliveryFee: number;
  tip: number;
  total: number;
  items: PlacedOrderItem[];
}

function assertOnlyAllowedKeys(
  payload: Record<string, unknown>,
  allowed: readonly string[],
  label: string
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(payload)) {
    if (FORBIDDEN_PII_KEYS.has(key) || !allowedSet.has(key)) {
      throw new Error(`Campo não permitido em ${label}: ${key}`);
    }
  }
}

export function buildSanitizedOrderPayloads(params: {
  orderId: string;
  trackerId: string;
  orderCode: string;
  fulfillment: FulfillmentType;
  subtotal: number;
  deliveryFee: number;
  tip: number;
  total: number;
  estimatedReady: string;
  items: PlacedOrderItem[];
  timestampValue: unknown;
}): SanitizedOrderPayloads {
  const pickupWindow =
    params.fulfillment === 'pickup' ? 'Retirada no balcão' : 'Entrega padrão';

  const subtotal = Math.round(Number(params.subtotal) * 100) / 100;
  const deliveryFee = Math.round(Math.max(0, Number(params.deliveryFee)) * 100) / 100;
  const tip = Math.round(Math.max(0, Number(params.tip)) * 100) / 100;
  const total = Math.round(Number(params.total) * 100) / 100;

  const orderDoc: Record<string, unknown> = {
    orderCode: params.orderCode,
    trackerId: params.trackerId,
    fulfillment: params.fulfillment,
    pickupWindow,
    subtotal,
    deliveryFee,
    tip,
    total,
    stage: 0,
    estimatedReady: params.estimatedReady.slice(0, 20),
    createdAt: params.timestampValue,
    updatedAt: params.timestampValue,
  };

  const trackerDoc: Record<string, unknown> = {
    orderId: params.orderId,
    orderCode: params.orderCode,
    fulfillment: params.fulfillment,
    pickupWindow,
    subtotal,
    deliveryFee,
    tip,
    total,
    stage: 0,
    estimatedReady: params.estimatedReady.slice(0, 20),
    createdAt: params.timestampValue,
    updatedAt: params.timestampValue,
  };

  const itemDocs = params.items.slice(0, 50).map((item, index) => {
    const cleanMenuItemId =
      item.menuItemId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128) || `item-${index + 1}`;
    const cleanSummary = (item.firestoreSummary ?? '').trim().slice(0, 400);
    const data: Record<string, unknown> = {
      menuItemId: cleanMenuItemId,
      name: item.name.trim().slice(0, 100),
      quantity: Math.min(20, Math.max(1, Math.round(Number(item.quantity)))),
      summary: cleanSummary,
      lineTotal: Math.round(Math.max(0.01, Number(item.lineTotal)) * 100) / 100,
    };
    assertOnlyAllowedKeys(data, ORDER_ITEM_ALLOWED_KEYS, 'OrderItem');
    return {
      itemId: `item-${index + 1}`,
      data,
    };
  });

  assertOnlyAllowedKeys(orderDoc, ORDER_ALLOWED_KEYS, 'Order');
  assertOnlyAllowedKeys(trackerDoc, TRACKER_ALLOWED_KEYS, 'OrderTracker');

  return { orderDoc, trackerDoc, itemDocs };
}

export interface WhatsAppOrderMessageInput {
  orderCode?: string;
  buyer: BuyerData;
  fulfillment: FulfillmentType;
  neighborhoodLabel: string;
  cartItems: CartItem[];
  paymentMethod: 'Pix' | 'Cartão' | 'Dinheiro';
  troco?: string;
  subtotal: number;
  deliveryFee: number;
  tip: number;
  tipPercent: number;
  total: number;
}

export function buildWhatsAppOrderMessage(input: WhatsAppOrderMessageInput): string {
  const cleanTroco = (input.troco || '').trim().replace(/^R\$\s*/i, '');
  const paymentLine =
    input.paymentMethod === 'Dinheiro' && cleanTroco
      ? `*Pagamento:* Dinheiro (Troco para R$ ${cleanTroco})`
      : `*Pagamento:* ${input.paymentMethod}`;

  const isPickup = input.fulfillment === 'pickup';
  const entregaLine = isPickup
    ? `*Entrega:* ${input.neighborhoodLabel}`
    : `*Entrega:* ${input.buyer.endereco.trim()} - ${input.neighborhoodLabel}`;

  const itemLines = input.cartItems.map((ci) => {
    const line = `• ${ci.quantidade}x ${ci.nome} - ${formatBRL(ci.preco * ci.quantidade)}`;
    const customizations = formatCartItemCustomizationsOnly(ci);
    const obs = ci.observacao.trim();
    const parts = [line];
    if (customizations) parts.push(`  _${customizations}_`);
    if (obs) parts.push(`  _Obs: ${obs}_`);
    return parts.join('\n');
  });

  const header = input.orderCode
    ? `*NOVO PEDIDO #${input.orderCode} - ${input.buyer.nome.trim()}*`
    : `*NOVO PEDIDO - ${input.buyer.nome.trim()}*`;

  return [
    header,
    '',
    ...itemLines,
    '',
    entregaLine,
    paymentLine,
    '',
    `Subtotal: ${formatBRL(input.subtotal)}`,
    `Taxa de Entrega: ${formatBRL(input.deliveryFee)}`,
    ...(input.tip > 0 ? [`Gorjeta (${input.tipPercent}%): ${formatBRL(input.tip)}`] : []),
    `*TOTAL: ${formatBRL(input.total)}*`,
  ].join('\n');
}

export function buildWhatsAppOrderUrl(whatsappNumber: string, message: string): string {
  const cleanPhone = whatsappNumber.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export interface OrderWriteBatchLike {
  set: (docRef: unknown, data: Record<string, unknown>) => void;
  update?: (docRef: unknown, data: Record<string, unknown>) => void;
  commit: () => Promise<void>;
}

export interface OrderPersistenceDeps {
  isAvailable?: boolean;
  firestore?: Firestore | null;
  createBatch?: () => OrderWriteBatchLike;
  createDocRef?: (collectionPath: string, ...segments: string[]) => unknown;
  serverTimestampFn?: () => unknown;
  getTrackerDoc?: (trackerId: string) => Promise<{ exists: boolean; data?: Record<string, unknown> }>;
  subscribeTrackerDoc?: (
    trackerId: string,
    onNext: (snap: { exists: boolean; data?: Record<string, unknown> }) => void,
    onError: (err: unknown) => void
  ) => () => void;
}

export type CreatePersistedOrderResult =
  | {
      ok: true;
      orderId: string;
      trackingToken: string;
      trackerId: string;
      orderCode: string;
      estimatedReady: string;
      placedAtIso: string;
    }
  | {
      ok: false;
      reason: 'unavailable' | 'failed';
      message: string;
    };

function logOrderFirestoreError(error: unknown, operationType: OperationType, path: string): void {
  const currentUser = auth?.currentUser;
  console.error(
    'Firestore Error: ',
    JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      operationType,
      path,
      authInfo: {
        userId: currentUser?.uid ?? null,
        emailVerified: currentUser?.emailVerified ?? null,
      },
    })
  );
}

export async function createPersistedOrder(
  input: CreateOrderInput,
  deps?: OrderPersistenceDeps
): Promise<CreatePersistedOrderResult> {
  const firestore = deps?.firestore !== undefined ? deps.firestore : db;
  const available = deps?.isAvailable !== undefined ? deps.isAvailable : hasFirebaseConfig && Boolean(firestore);

  if (!available || (!firestore && !deps?.createBatch)) {
    return {
      ok: false,
      reason: 'unavailable',
      message: 'Firebase indisponível neste ambiente. O pedido foi preparado para envio pelo WhatsApp.',
    };
  }

  if (input.items.length === 0 || input.subtotal <= 0 || input.total <= 0) {
    return {
      ok: false,
      reason: 'failed',
      message: 'Não é possível registrar um pedido vazio.',
    };
  }

  const orderId = generateOrderId();
  const trackingToken = generateTrackingToken();
  const trackerId = await deriveTrackerId(orderId, trackingToken);
  const orderCode = generateOrderCode(input.orderCodePrefix);
  const estimatedReady = computeEstimatedReadyTime(input.estimatedMinutes);
  const placedAtIso = new Date().toISOString();

  const timestampValue = deps?.serverTimestampFn ? deps.serverTimestampFn() : serverTimestamp();
  const payloads = buildSanitizedOrderPayloads({
    orderId,
    trackerId,
    orderCode,
    fulfillment: input.fulfillment,
    subtotal: input.subtotal,
    deliveryFee: input.deliveryFee,
    tip: input.tip,
    total: input.total,
    estimatedReady,
    items: input.items,
    timestampValue,
  });

  const makeRef =
    deps?.createDocRef ??
    ((collectionPath: string, ...segments: string[]) => {
      if (!firestore) throw new Error('Firestore não inicializado.');
      return doc(firestore, collectionPath, ...segments);
    });

  const batch: OrderWriteBatchLike = deps?.createBatch
    ? deps.createBatch()
    : (() => {
        const fbBatch = writeBatch(firestore as Firestore);
        return {
          set: (docRef, data) => {
            fbBatch.set(docRef as ReturnType<typeof doc>, data);
          },
          commit: () => fbBatch.commit(),
        };
      })();

  batch.set(makeRef('orders', orderId), payloads.orderDoc);
  payloads.itemDocs.forEach((item) => {
    batch.set(makeRef('orders', orderId, 'items', item.itemId), item.data);
  });

  batch.set(makeRef('order_trackers', trackerId), payloads.trackerDoc);
  payloads.itemDocs.forEach((item) => {
    batch.set(makeRef('order_trackers', trackerId, 'items', item.itemId), item.data);
  });

  try {
    await batch.commit();
    return {
      ok: true,
      orderId,
      trackingToken,
      trackerId,
      orderCode,
      estimatedReady,
      placedAtIso,
    };
  } catch (error) {
    logOrderFirestoreError(error, OperationType.WRITE, `orders/${orderId}`);
    return {
      ok: false,
      reason: 'failed',
      message:
        'Não foi possível salvar o acompanhamento em tempo real no servidor. Você ainda pode concluir via WhatsApp ou tentar registrar novamente.',
    };
  }
}

export type TrackedOrderSnapshotResult =
  | {
      status: 'found';
      orderId: string;
      orderCode: string;
      stage: OrderStage;
      estimatedReady: string;
      fulfillment: FulfillmentType;
      subtotal: number;
      deliveryFee: number;
      tip: number;
      total: number;
    }
  | { status: 'not_found' }
  | { status: 'unavailable' }
  | { status: 'error'; message: string };

function normalizeStage(value: unknown): OrderStage {
  const num = Number(value);
  if (num >= 3) return 3;
  if (num === 2) return 2;
  if (num === 1) return 1;
  return 0;
}

export async function fetchTrackedOrderSnapshot(
  orderId: string,
  trackingToken: string,
  deps?: OrderPersistenceDeps
): Promise<TrackedOrderSnapshotResult> {
  const firestore = deps?.firestore !== undefined ? deps.firestore : db;
  const available = deps?.isAvailable !== undefined ? deps.isAvailable : hasFirebaseConfig && Boolean(firestore);

  if (!available || (!firestore && !deps?.getTrackerDoc)) {
    return { status: 'unavailable' };
  }

  try {
    const trackerId = await deriveTrackerId(orderId, trackingToken);
    const snap = deps?.getTrackerDoc
      ? await deps.getTrackerDoc(trackerId)
      : await getDoc(doc(firestore as Firestore, 'order_trackers', trackerId)).then((s) => ({
          exists: s.exists(),
          data: s.data() as Record<string, unknown> | undefined,
        }));

    if (!snap.exists || !snap.data) {
      return { status: 'not_found' };
    }
    if (String(snap.data.orderId || '') !== orderId) {
      return { status: 'not_found' };
    }

    return {
      status: 'found',
      orderId,
      orderCode: String(snap.data.orderCode || ''),
      stage: normalizeStage(snap.data.stage),
      estimatedReady: String(snap.data.estimatedReady || ''),
      fulfillment: snap.data.fulfillment === 'pickup' ? 'pickup' : 'delivery',
      subtotal: Number(snap.data.subtotal ?? 0),
      deliveryFee: Number(snap.data.deliveryFee ?? 0),
      tip: Number(snap.data.tip ?? 0),
      total: Number(snap.data.total ?? 0),
    };
  } catch (error) {
    logOrderFirestoreError(error, OperationType.GET, `order_trackers/${orderId}`);
    return {
      status: 'error',
      message: 'Não foi possível consultar o status atualizado do pedido.',
    };
  }
}

export function subscribeToTrackedOrder(
  orderId: string,
  trackingToken: string,
  callbacks: {
    onUpdate: (update: { stage: OrderStage; estimatedReady: string }) => void;
    onMissing: () => void;
    onError: (message: string) => void;
  },
  deps?: OrderPersistenceDeps
): () => void {
  const firestore = deps?.firestore !== undefined ? deps.firestore : db;
  const available = deps?.isAvailable !== undefined ? deps.isAvailable : hasFirebaseConfig && Boolean(firestore);

  if (!available || (!firestore && !deps?.subscribeTrackerDoc)) {
    return () => {};
  }

  let cancelled = false;
  let unsubscribeInner: (() => void) | null = null;

  deriveTrackerId(orderId, trackingToken)
    .then((trackerId) => {
      if (cancelled) return;
      if (deps?.subscribeTrackerDoc) {
        unsubscribeInner = deps.subscribeTrackerDoc(
          trackerId,
          (snap) => {
            if (cancelled) return;
            if (!snap.exists || !snap.data || String(snap.data.orderId || '') !== orderId) {
              callbacks.onMissing();
              return;
            }
            callbacks.onUpdate({
              stage: normalizeStage(snap.data.stage),
              estimatedReady: String(snap.data.estimatedReady || ''),
            });
          },
          (err) => {
            if (cancelled) return;
            logOrderFirestoreError(err, OperationType.GET, `order_trackers/${trackerId}`);
            callbacks.onError('Falha ao sincronizar status em tempo real.');
          }
        );
        return;
      }

      unsubscribeInner = onSnapshot(
        doc(firestore as Firestore, 'order_trackers', trackerId),
        (snap) => {
          if (cancelled) return;
          if (!snap.exists()) {
            callbacks.onMissing();
            return;
          }
          const d = snap.data();
          if (String(d.orderId || '') !== orderId) {
            callbacks.onMissing();
            return;
          }
          callbacks.onUpdate({
            stage: normalizeStage(d.stage),
            estimatedReady: String(d.estimatedReady || ''),
          });
        },
        (err) => {
          if (cancelled) return;
          logOrderFirestoreError(err, OperationType.GET, `order_trackers/${trackerId}`);
          callbacks.onError('Falha ao sincronizar status em tempo real.');
        }
      );
    })
    .catch((err) => {
      if (cancelled) return;
      callbacks.onError(err instanceof Error ? err.message : 'Erro ao iniciar acompanhamento.');
    });

  return () => {
    cancelled = true;
    if (unsubscribeInner) {
      unsubscribeInner();
    }
  };
}

function toIsoString(ts: unknown): string {
  if (ts && typeof ts === 'object' && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

export function subscribeToStaffOrders(callbacks: {
  onOrders: (orders: StaffOrderRecord[]) => void;
  onError: (message: string) => void;
}): () => void {
  if (!hasFirebaseConfig || !db) {
    callbacks.onError('Firebase não configurado.');
    return () => {};
  }

  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snapshot) => {
      const records: StaffOrderRecord[] = snapshot.docs.map((snap) => {
        const d = snap.data();
        return {
          id: snap.id,
          orderCode: String(d.orderCode || ''),
          trackerId: String(d.trackerId || ''),
          fulfillment: d.fulfillment === 'pickup' ? 'pickup' : 'delivery',
          pickupWindow: String(d.pickupWindow || ''),
          subtotal: Number(d.subtotal ?? 0),
          deliveryFee: Number(d.deliveryFee ?? 0),
          tip: Number(d.tip ?? 0),
          total: Number(d.total ?? 0),
          stage: normalizeStage(d.stage),
          estimatedReady: String(d.estimatedReady || ''),
          createdAtIso: toIsoString(d.createdAt),
          updatedAtIso: toIsoString(d.updatedAt),
        };
      });
      callbacks.onOrders(records);
    },
    (err) => {
      logOrderFirestoreError(err, OperationType.LIST, 'orders');
      callbacks.onError('Não foi possível carregar a fila de pedidos.');
    }
  );
}

export async function fetchStaffOrderItems(orderId: string): Promise<PlacedOrderItem[]> {
  if (!db) throw new Error('Firestore não inicializado.');
  try {
    const snap = await getDocs(collection(db, 'orders', orderId, 'items'));
    return snap.docs.map((itemSnap) => {
      const d = itemSnap.data();
      return {
        menuItemId: String(d.menuItemId || ''),
        name: String(d.name || ''),
        quantity: Number(d.quantity ?? 1),
        summary: String(d.summary || ''),
        lineTotal: Number(d.lineTotal ?? 0),
      };
    });
  } catch (err) {
    logOrderFirestoreError(err, OperationType.LIST, `orders/${orderId}/items`);
    throw new Error('Falha ao carregar itens do pedido.');
  }
}

export async function updateStaffOrderStage(
  orderId: string,
  trackerId: string,
  nextStage: OrderStage
): Promise<void> {
  if (!db) throw new Error('Firestore não inicializado.');
  const batch = writeBatch(db);
  const now = serverTimestamp();

  batch.update(doc(db, 'orders', orderId), {
    stage: nextStage,
    updatedAt: now,
  });
  batch.update(doc(db, 'order_trackers', trackerId), {
    stage: nextStage,
    updatedAt: now,
  });

  try {
    await batch.commit();
  } catch (err) {
    logOrderFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    throw new Error('Permissão negada ou falha ao atualizar etapa do pedido.');
  }
}
