import type { BuyerData, FulfillmentType, OrderStage, PlacedOrder, PlacedOrderItem } from '../types';

export const ORDER_STORAGE_KEY = 'mvp_cardapio_orders_v1';
const MAX_STORED_ORDERS = 20;

export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem?: (key: string) => void;
}

export interface StoredBuyerProfile {
  nome: string;
  whatsapp: string;
  endereco: string;
  selectedNeighborhoodId: string;
}

export interface StoredTrackedOrderRef {
  orderId: string;
  trackingToken: string;
  trackerId: string;
  orderCode: string;
  placedAtIso: string;
  fulfillment: FulfillmentType;
  neighborhoodLabel: string;
  buyer: BuyerData;
  items: PlacedOrderItem[];
  subtotal: number;
  deliveryFee: number;
  tip: number;
  total: number;
  stage: OrderStage;
  estimatedReady: string;
  whatsappUrl?: string;
}

interface PersistedClientEnvelope {
  version: 1;
  buyerProfile: StoredBuyerProfile | null;
  trackedOrders: StoredTrackedOrderRef[];
}

function resolveStorage(customStorage?: StorageLike | null): StorageLike | null {
  if (customStorage !== undefined) return customStorage;
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

function readEnvelope(storage?: StorageLike | null): PersistedClientEnvelope {
  const target = resolveStorage(storage);
  if (!target) {
    return { version: 1, buyerProfile: null, trackedOrders: [] };
  }
  try {
    const raw = target.getItem(ORDER_STORAGE_KEY);
    if (!raw) {
      return { version: 1, buyerProfile: null, trackedOrders: [] };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedClientEnvelope>;
    const trackedOrders = Array.isArray(parsed.trackedOrders)
      ? parsed.trackedOrders.filter(isValidStoredOrderRef)
      : [];
    const buyerProfile = isValidBuyerProfile(parsed.buyerProfile) ? parsed.buyerProfile : null;
    return {
      version: 1,
      buyerProfile,
      trackedOrders,
    };
  } catch {
    return { version: 1, buyerProfile: null, trackedOrders: [] };
  }
}

function writeEnvelope(envelope: PersistedClientEnvelope, storage?: StorageLike | null): void {
  const target = resolveStorage(storage);
  if (!target) return;
  try {
    target.setItem(ORDER_STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // Ignore storage quota / privacy mode errors gracefully
  }
}

function isValidBuyerProfile(value: unknown): value is StoredBuyerProfile {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.nome === 'string' &&
    typeof v.whatsapp === 'string' &&
    typeof v.endereco === 'string' &&
    typeof v.selectedNeighborhoodId === 'string'
  );
}

function isValidStoredOrderRef(value: unknown): value is StoredTrackedOrderRef {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.orderId === 'string' &&
    v.orderId.length > 0 &&
    typeof v.trackingToken === 'string' &&
    v.trackingToken.length >= 16 &&
    typeof v.trackerId === 'string' &&
    /^[a-f0-9]{64}$/.test(v.trackerId) &&
    typeof v.orderCode === 'string' &&
    typeof v.placedAtIso === 'string' &&
    (v.fulfillment === 'pickup' || v.fulfillment === 'delivery') &&
    typeof v.subtotal === 'number' &&
    typeof v.total === 'number' &&
    typeof v.stage === 'number' &&
    v.stage >= 0 &&
    v.stage <= 3
  );
}

export function formatOrderPlacedAt(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'Agora mesmo';
  const now = new Date();
  const sameDay =
    parsed.getFullYear() === now.getFullYear() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getDate() === now.getDate();

  const hh = String(parsed.getHours()).padStart(2, '0');
  const mm = String(parsed.getMinutes()).padStart(2, '0');
  if (sameDay) {
    return `Hoje às ${hh}h${mm}`;
  }
  const dd = String(parsed.getDate()).padStart(2, '0');
  const mo = String(parsed.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mo} às ${hh}h${mm}`;
}

export function loadBuyerProfile(storage?: StorageLike | null): StoredBuyerProfile | null {
  return readEnvelope(storage).buyerProfile;
}

export function saveBuyerProfile(
  profile: StoredBuyerProfile,
  storage?: StorageLike | null
): void {
  const envelope = readEnvelope(storage);
  writeEnvelope(
    {
      ...envelope,
      buyerProfile: {
        nome: profile.nome.trim(),
        whatsapp: profile.whatsapp.trim(),
        endereco: profile.endereco.trim(),
        selectedNeighborhoodId: profile.selectedNeighborhoodId,
      },
    },
    storage
  );
}

export function saveTrackedOrder(
  order: PlacedOrder,
  storage?: StorageLike | null
): void {
  if (
    order.persistenceStatus !== 'persisted' ||
    !order.trackingToken ||
    !order.trackerId
  ) {
    return;
  }

  const envelope = readEnvelope(storage);
  const placedAtIso = order.placedAtIso || new Date().toISOString();
  const nextRef: StoredTrackedOrderRef = {
    orderId: order.id,
    trackingToken: order.trackingToken,
    trackerId: order.trackerId,
    orderCode: order.orderCode,
    placedAtIso,
    fulfillment: order.fulfillment,
    neighborhoodLabel: order.neighborhoodLabel,
    buyer: order.buyer,
    items: order.items,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    tip: order.tip,
    total: order.total,
    stage: order.stage,
    estimatedReady: order.estimatedReady,
    whatsappUrl: order.whatsappUrl,
  };

  const deduped = envelope.trackedOrders.filter((o) => o.orderId !== order.id);
  writeEnvelope(
    {
      ...envelope,
      trackedOrders: [nextRef, ...deduped].slice(0, MAX_STORED_ORDERS),
    },
    storage
  );
}

export function updateTrackedOrderStageLocally(
  orderId: string,
  stage: OrderStage,
  storage?: StorageLike | null
): void {
  const envelope = readEnvelope(storage);
  let changed = false;
  const updated = envelope.trackedOrders.map((entry) => {
    if (entry.orderId !== orderId) return entry;
    changed = true;
    return { ...entry, stage };
  });
  if (changed) {
    writeEnvelope({ ...envelope, trackedOrders: updated }, storage);
  }
}

export function loadTrackedOrders(storage?: StorageLike | null): PlacedOrder[] {
  const envelope = readEnvelope(storage);
  return envelope.trackedOrders.map((entry) => ({
    id: entry.orderId,
    orderCode: entry.orderCode,
    trackingToken: entry.trackingToken,
    trackerId: entry.trackerId,
    placedAt: formatOrderPlacedAt(entry.placedAtIso),
    placedAtIso: entry.placedAtIso,
    fulfillment: entry.fulfillment,
    neighborhoodLabel: entry.neighborhoodLabel,
    buyer: entry.buyer,
    items: entry.items,
    subtotal: entry.subtotal,
    deliveryFee: entry.deliveryFee,
    tip: entry.tip,
    total: entry.total,
    stage: entry.stage,
    estimatedReady: entry.estimatedReady,
    persistenceStatus: 'persisted',
    syncStatus: 'connecting',
    whatsappUrl: entry.whatsappUrl,
  }));
}

export function removeTrackedOrder(orderId: string, storage?: StorageLike | null): void {
  const envelope = readEnvelope(storage);
  writeEnvelope(
    {
      ...envelope,
      trackedOrders: envelope.trackedOrders.filter((entry) => entry.orderId !== orderId),
    },
    storage
  );
}
