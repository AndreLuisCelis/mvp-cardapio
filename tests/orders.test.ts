import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSanitizedOrderPayloads,
  buildWhatsAppOrderMessage,
  createPersistedOrder,
  deriveTrackerId,
  fetchTrackedOrderSnapshot,
  formatCartItemCustomizationsOnly,
  generateOrderCode,
  generateOrderId,
  generateTrackingToken,
  subscribeToTrackedOrder,
  type OrderWriteBatchLike,
} from '../src/shared/orderRepository.ts';
import {
  loadBuyerProfile,
  loadTrackedOrders,
  saveBuyerProfile,
  saveTrackedOrder,
  updateTrackedOrderStageLocally,
  type StorageLike,
} from '../src/shared/orderStorage.ts';
import type { CartItem, MenuItem, PlacedOrder } from '../src/types.ts';

function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

const SAMPLE_MENU_ITEM: MenuItem = {
  id: 'smash-duplo',
  name: 'Smash Duplo na Brasa',
  category: 'smash-burgers',
  categoryLabel: 'Smash Burgers',
  description: 'Dois blends na brasa',
  ingredientsSummary: 'Blend 160g, cheddar',
  price: 38.9,
  prepMinutes: '20 min',
  rating: 4.9,
  reviewCount: 42,
  featured: true,
  isHero: false,
  published: true,
  imageKey: 'hero_smash',
  imageUrl: '/assets/hero.jpg',
  customizationGroupKeys: ['bun', 'addons'],
  customizationGroups: [
    {
      id: 'bun',
      title: 'Pão',
      type: 'single',
      required: true,
      choices: [
        { id: 'brioche', label: 'Brioche na Brasa', priceDelta: 0 },
        { id: 'australiano', label: 'Pão Australiano', priceDelta: 3 },
      ],
    },
    {
      id: 'addons',
      title: 'Adicionais',
      type: 'multi',
      choices: [{ id: 'bacon', label: 'Bacon Crocante', priceDelta: 5 }],
    },
  ],
  sortOrder: 1,
};

const SAMPLE_CART_ITEM: CartItem = {
  cartItemId: 'ci-1',
  id: SAMPLE_MENU_ITEM.id,
  nome: SAMPLE_MENU_ITEM.name,
  preco: 43.9,
  quantidade: 2,
  observacao: 'Entregar na portaria, falar com João 11999990000',
  menuItem: SAMPLE_MENU_ITEM,
  quantity: 2,
  selectedSingle: { bun: 'brioche' },
  selectedMulti: { addons: ['bacon'] },
  kitchenNote: 'Entregar na portaria, falar com João 11999990000',
  unitPrice: 43.9,
};

test('generates unpredictable orderId, high-entropy trackingToken, and bound SHA-256 trackerId', async () => {
  const idA = generateOrderId();
  const idB = generateOrderId();
  const tokenA = generateTrackingToken();
  const tokenB = generateTrackingToken();

  assert.notEqual(idA, idB);
  assert.ok(idA.length >= 32);
  assert.match(idA, /^[a-zA-Z0-9_-]+$/);

  assert.notEqual(tokenA, tokenB);
  assert.ok(tokenA.length >= 32);

  const trackerA1 = await deriveTrackerId(idA, tokenA);
  const trackerA2 = await deriveTrackerId(idA, tokenA);
  const trackerWrongToken = await deriveTrackerId(idA, tokenB);
  const trackerWrongOrder = await deriveTrackerId(idB, tokenA);

  assert.equal(trackerA1, trackerA2);
  assert.match(trackerA1, /^[a-f0-9]{64}$/);
  assert.notEqual(trackerA1, trackerWrongToken);
  assert.notEqual(trackerA1, trackerWrongOrder);

  const code = generateOrderCode('tl');
  assert.match(code, /^TL-[A-Z0-9]{5}$/);
});

test('strips all buyer PII and free-text observacao from Firestore order payloads', async () => {
  const orderId = generateOrderId();
  const token = generateTrackingToken();
  const trackerId = await deriveTrackerId(orderId, token);

  const firestoreSummary = formatCartItemCustomizationsOnly(SAMPLE_CART_ITEM);
  assert.equal(firestoreSummary, 'Brioche na Brasa · + Bacon Crocante');
  assert.ok(!firestoreSummary.includes('portaria'));
  assert.ok(!firestoreSummary.includes('11999990000'));

  const payloads = buildSanitizedOrderPayloads({
    orderId,
    trackerId,
    orderCode: 'TL-AB12C',
    fulfillment: 'delivery',
    subtotal: 87.8,
    deliveryFee: 6.5,
    tip: 0,
    total: 94.3,
    estimatedReady: '20h45',
    items: [
      {
        menuItemId: SAMPLE_CART_ITEM.id,
        name: SAMPLE_CART_ITEM.nome,
        quantity: SAMPLE_CART_ITEM.quantidade,
        summary: `${firestoreSummary} · Obs: "${SAMPLE_CART_ITEM.observacao}"`,
        firestoreSummary,
        lineTotal: 87.8,
      },
    ],
    timestampValue: 'SERVER_TS',
  });

  const serialized = JSON.stringify(payloads);
  assert.ok(!serialized.includes('João'));
  assert.ok(!serialized.includes('portaria'));
  assert.ok(!serialized.includes('11999990000'));
  assert.ok(!serialized.includes('Moema'));
  assert.ok(!serialized.includes(token));
  assert.equal(payloads.orderDoc.pickupWindow, 'Entrega padrão');
  assert.equal(payloads.trackerDoc.orderId, orderId);
  assert.equal(payloads.itemDocs[0].data.summary, 'Brioche na Brasa · + Bacon Crocante');
});

test('preserves customizations and observacao in WhatsApp checkout message', () => {
  const message = buildWhatsAppOrderMessage({
    orderCode: 'TL-XYZ99',
    buyer: {
      nome: 'Maria Souza',
      whatsapp: '(11) 98888-7777',
      endereco: 'Rua Augusta, 100',
      bairro: 'Consolação',
    },
    fulfillment: 'delivery',
    neighborhoodLabel: 'Consolação',
    cartItems: [SAMPLE_CART_ITEM],
    paymentMethod: 'Dinheiro',
    troco: 'R$ 150,00',
    subtotal: 87.8,
    deliveryFee: 8,
    tip: 0,
    tipPercent: 0,
    total: 95.8,
  });

  assert.ok(message.includes('*NOVO PEDIDO #TL-XYZ99 - Maria Souza*'));
  assert.ok(message.includes('Brioche na Brasa · + Bacon Crocante'));
  assert.ok(message.includes('_Obs: Entregar na portaria, falar com João 11999990000_'));
  assert.ok(message.includes('Rua Augusta, 100 - Consolação'));
  assert.ok(message.includes('Dinheiro (Troco para R$ 150,00)'));
});

test('createPersistedOrder writes atomic batch with order + tracker + subcollections and handles unavailable/failed states', async () => {
  const unavailableResult = await createPersistedOrder(
    {
      orderCodePrefix: 'TL',
      fulfillment: 'pickup',
      estimatedMinutes: 20,
      subtotal: 40,
      deliveryFee: 0,
      tip: 0,
      total: 40,
      items: [
        {
          menuItemId: 'smash-duplo',
          name: 'Smash Duplo',
          quantity: 1,
          summary: 'Brioche',
          firestoreSummary: 'Brioche',
          lineTotal: 40,
        },
      ],
    },
    { isAvailable: false }
  );
  assert.equal(unavailableResult.ok, false);
  if (!unavailableResult.ok) {
    assert.equal(unavailableResult.reason, 'unavailable');
  }

  const writes: { path: string; data: Record<string, unknown> }[] = [];
  let committed = false;

  const okResult = await createPersistedOrder(
    {
      orderCodePrefix: 'TL',
      fulfillment: 'delivery',
      estimatedMinutes: 30,
      subtotal: 87.8,
      deliveryFee: 6.5,
      tip: 4.39,
      total: 98.69,
      items: [
        {
          menuItemId: SAMPLE_CART_ITEM.id,
          name: SAMPLE_CART_ITEM.nome,
          quantity: SAMPLE_CART_ITEM.quantidade,
          summary: 'Brioche · Obs: "sem cebola"',
          firestoreSummary: 'Brioche',
          lineTotal: 87.8,
        },
      ],
    },
    {
      isAvailable: true,
      serverTimestampFn: () => 'SERVER_TIMESTAMP',
      createDocRef: (col, ...segments) => [col, ...segments].join('/'),
      createBatch: (): OrderWriteBatchLike => ({
        set: (docRef, data) => {
          writes.push({ path: String(docRef), data });
        },
        commit: async () => {
          committed = true;
        },
      }),
    }
  );

  assert.equal(committed, true);
  assert.equal(okResult.ok, true);
  if (okResult.ok) {
    assert.equal(writes.length, 4);
    assert.equal(writes[0].path, `orders/${okResult.orderId}`);
    assert.equal(writes[1].path, `orders/${okResult.orderId}/items/item-1`);
    assert.equal(writes[2].path, `order_trackers/${okResult.trackerId}`);
    assert.equal(writes[3].path, `order_trackers/${okResult.trackerId}/items/item-1`);
    assert.equal(writes[0].data.stage, 0);
    assert.equal(writes[2].data.stage, 0);
    assert.equal(writes[1].data.summary, 'Brioche');
  }

  const failedResult = await createPersistedOrder(
    {
      orderCodePrefix: 'TL',
      fulfillment: 'pickup',
      estimatedMinutes: 20,
      subtotal: 40,
      deliveryFee: 0,
      tip: 0,
      total: 40,
      items: [
        {
          menuItemId: 'smash-duplo',
          name: 'Smash Duplo',
          quantity: 1,
          summary: 'Brioche',
          firestoreSummary: 'Brioche',
          lineTotal: 40,
        },
      ],
    },
    {
      isAvailable: true,
      serverTimestampFn: () => 'SERVER_TIMESTAMP',
      createDocRef: (col, ...segments) => [col, ...segments].join('/'),
      createBatch: (): OrderWriteBatchLike => ({
        set: () => {},
        commit: async () => {
          throw new Error('PERMISSION_DENIED');
        },
      }),
    }
  );
  assert.equal(failedResult.ok, false);
  if (!failedResult.ok) {
    assert.equal(failedResult.reason, 'failed');
  }
});

test('localStorage persists buyer profile and ONLY valid persisted orders across reload', async () => {
  const storage = createMemoryStorage();
  const orderId = generateOrderId();
  const trackingToken = generateTrackingToken();
  const trackerId = await deriveTrackerId(orderId, trackingToken);

  saveBuyerProfile(
    {
      nome: 'Ana Paula',
      whatsapp: '(11) 97777-6666',
      endereco: 'Rua das Acácias, 45',
      selectedNeighborhoodId: 'moema',
    },
    storage
  );

  const restoredBuyer = loadBuyerProfile(storage);
  assert.deepEqual(restoredBuyer, {
    nome: 'Ana Paula',
    whatsapp: '(11) 97777-6666',
    endereco: 'Rua das Acácias, 45',
    selectedNeighborhoodId: 'moema',
  });

  const unsavedOrder: PlacedOrder = {
    id: 'unsaved-1',
    orderCode: 'TL-00001',
    placedAt: 'Agora mesmo',
    fulfillment: 'delivery',
    neighborhoodLabel: 'Moema',
    buyer: {
      nome: 'Ana Paula',
      whatsapp: '(11) 97777-6666',
      endereco: 'Rua das Acácias, 45',
      bairro: 'Moema',
    },
    items: [],
    subtotal: 40,
    deliveryFee: 5,
    tip: 0,
    total: 45,
    stage: 0,
    estimatedReady: '20h30',
    persistenceStatus: 'failed',
  };
  saveTrackedOrder(unsavedOrder, storage);
  assert.equal(loadTrackedOrders(storage).length, 0);

  const persistedOrder: PlacedOrder = {
    ...unsavedOrder,
    id: orderId,
    trackingToken,
    trackerId,
    orderCode: 'TL-88888',
    placedAtIso: new Date().toISOString(),
    persistenceStatus: 'persisted',
  };
  saveTrackedOrder(persistedOrder, storage);

  const restoredOrders = loadTrackedOrders(storage);
  assert.equal(restoredOrders.length, 1);
  assert.equal(restoredOrders[0].id, orderId);
  assert.equal(restoredOrders[0].trackingToken, trackingToken);
  assert.equal(restoredOrders[0].trackerId, trackerId);
  assert.equal(restoredOrders[0].buyer.nome, 'Ana Paula');

  updateTrackedOrderStageLocally(orderId, 2, storage);
  const restoredAfterStage = loadTrackedOrders(storage);
  assert.equal(restoredAfterStage[0].stage, 2);
});

test('fetchTrackedOrderSnapshot and subscribeToTrackedOrder synchronize real-time stage updates via derived trackerId', async () => {
  const orderId = generateOrderId();
  const trackingToken = generateTrackingToken();
  const expectedTrackerId = await deriveTrackerId(orderId, trackingToken);

  const snapshot = await fetchTrackedOrderSnapshot(orderId, trackingToken, {
    isAvailable: true,
    getTrackerDoc: async (requestedTrackerId) => {
      assert.equal(requestedTrackerId, expectedTrackerId);
      return {
        exists: true,
        data: {
          orderId,
          orderCode: 'TL-REAL1',
          stage: 2,
          estimatedReady: '21h00',
          fulfillment: 'pickup',
          subtotal: 39.9,
          deliveryFee: 0,
          tip: 0,
          total: 39.9,
        },
      };
    },
  });

  assert.equal(snapshot.status, 'found');
  if (snapshot.status === 'found') {
    assert.equal(snapshot.stage, 2);
    assert.equal(snapshot.orderCode, 'TL-REAL1');
  }

  const emitter: {
    fn?: (snap: { exists: boolean; data?: Record<string, unknown> }) => void;
  } = {};
  const receivedStages: number[] = [];

  const unsubscribe = subscribeToTrackedOrder(
    orderId,
    trackingToken,
    {
      onUpdate: ({ stage }) => receivedStages.push(stage),
      onMissing: () => assert.fail('Should not be missing'),
      onError: (msg) => assert.fail(msg),
    },
    {
      isAvailable: true,
      subscribeTrackerDoc: (trackerId, onNext) => {
        assert.equal(trackerId, expectedTrackerId);
        emitter.fn = onNext;
        return () => {};
      },
    }
  );

  // Wait microtask for async deriveTrackerId inside subscribeToTrackedOrder
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.ok(emitter.fn);
  emitter.fn({ exists: true, data: { orderId, stage: 1, estimatedReady: '21h00' } });
  emitter.fn({ exists: true, data: { orderId, stage: 3, estimatedReady: '21h00' } });

  assert.deepEqual(receivedStages, [1, 3]);
  unsubscribe();
});
