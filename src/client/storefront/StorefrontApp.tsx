import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import {
  CheckoutScreen,
  formatCartItemSummary,
  type PaymentMethod,
} from '../../components/CheckoutScreen';
import { CustomizerModal } from '../../components/CustomizerModal';
import { HearthScreen } from '../../components/HearthScreen';
import { MenuScreen } from '../../components/MenuScreen';
import { OrdersScreen } from '../../components/OrdersScreen';
import { TopNav } from '../../components/TopNav';
import { MENU_ITEMS } from '../../data/menu';
import { hasFirebaseConfig } from '../../shared/firebase';
import {
  buildWhatsAppOrderMessage,
  buildWhatsAppOrderUrl,
  computeEstimatedReadyTime,
  createPersistedOrder,
  fetchTrackedOrderSnapshot,
  formatCartItemCustomizationsOnly,
  generateOrderCode,
  subscribeToTrackedOrder,
  type CreateOrderInput,
} from '../../shared/orderRepository';
import {
  formatOrderPlacedAt,
  loadTrackedOrders,
  saveTrackedOrder,
  updateTrackedOrderStageLocally,
} from '../../shared/orderStorage';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_DELIVERY_FEES,
  DEFAULT_STORE_SETTINGS,
  fetchPublicCatalog,
} from '../../shared/storeRepository';
import {
  AppScreen,
  BuyerData,
  CartItem,
  DeliveryFeeOption,
  FulfillmentType,
  MenuItem,
  PlacedOrder,
  StoreCategoryConfig,
  StoreSettingsRecord,
} from '../../types';
import { formatBRL } from '../../utils/format';

function createDefaultSelections(item: MenuItem): {
  selectedSingle: Record<string, string>;
  selectedMulti: Record<string, string[]>;
} {
  const selectedSingle: Record<string, string> = {};
  const selectedMulti: Record<string, string[]> = {};
  item.customizationGroups.forEach((group) => {
    if (group.type === 'single' && group.choices.length > 0) {
      selectedSingle[group.id] = group.choices[0].id;
    } else if (group.type === 'multi') {
      selectedMulti[group.id] = [];
    }
  });
  return { selectedSingle, selectedMulti };
}

function openExternalUrl(url: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.click();
}

interface StorefrontAppProps {
  canOpenAdmin?: boolean;
  onOpenAdmin?: () => void;
}

export function StorefrontApp({ canOpenAdmin = false, onOpenAdmin }: StorefrontAppProps) {
  const [activeScreen, setActiveScreen] = useState<AppScreen>('menu');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<PlacedOrder[]>([]);
  const [isRestoringOrders, setIsRestoringOrders] = useState<boolean>(true);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);

  const failedOrderInputsRef = useRef<Map<string, CreateOrderInput>>(new Map());

  const [storeSettings, setStoreSettings] = useState<StoreSettingsRecord>(DEFAULT_STORE_SETTINGS);
  const [categories, setCategories] = useState<StoreCategoryConfig[]>(DEFAULT_CATEGORIES);
  const [deliveryFees, setDeliveryFees] = useState<DeliveryFeeOption[]>(DEFAULT_DELIVERY_FEES);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);

  const [customizerItem, setCustomizerItem] = useState<MenuItem | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPublicCatalog()
      .then((catalog) => {
        if (cancelled) return;
        setStoreSettings(catalog.settings);
        setCategories(catalog.categories);
        setDeliveryFees(catalog.deliveryFees);
        setMenuItems(catalog.menuItems);
        document.title = `${catalog.settings.name} — Cardápio Digital`;
      })
      .catch(() => {
        // Fallback defaults already set
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Restore persisted tracked orders from localStorage & reconcile with Firestore
  useEffect(() => {
    let cancelled = false;
    const restored = loadTrackedOrders();

    if (restored.length === 0) {
      setIsRestoringOrders(false);
      return;
    }

    setOrders(
      restored.map((o) => ({
        ...o,
        syncStatus: hasFirebaseConfig ? 'connecting' : 'inactive',
      }))
    );

    if (!hasFirebaseConfig) {
      setIsRestoringOrders(false);
      return;
    }

    Promise.all(
      restored.map(async (order) => {
        if (!order.trackingToken) return order;
        const result = await fetchTrackedOrderSnapshot(order.id, order.trackingToken);
        if (result.status === 'found') {
          updateTrackedOrderStageLocally(order.id, result.stage);
          return {
            ...order,
            stage: result.stage,
            estimatedReady: result.estimatedReady || order.estimatedReady,
            syncStatus: 'live' as const,
          };
        }
        if (result.status === 'unavailable') {
          return { ...order, syncStatus: 'inactive' as const };
        }
        return {
          ...order,
          syncStatus: 'error' as const,
        };
      })
    )
      .then((hydrated) => {
        if (cancelled) return;
        setOrders(hydrated);
      })
      .finally(() => {
        if (!cancelled) setIsRestoringOrders(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Real-time onSnapshot listeners for persisted active orders
  const trackedSubscriptionKey = useMemo(
    () =>
      orders
        .filter(
          (o) =>
            o.persistenceStatus === 'persisted' &&
            Boolean(o.trackingToken) &&
            o.stage < 3
        )
        .map((o) => `${o.id}:${o.trackingToken}`)
        .join('|'),
    [orders]
  );

  useEffect(() => {
    if (!hasFirebaseConfig || !trackedSubscriptionKey) return;

    const pairs = trackedSubscriptionKey.split('|').map((entry) => {
      const idx = entry.indexOf(':');
      return {
        orderId: entry.slice(0, idx),
        trackingToken: entry.slice(idx + 1),
      };
    });

    const unsubscribers = pairs.map(({ orderId, trackingToken }) =>
      subscribeToTrackedOrder(orderId, trackingToken, {
        onUpdate: ({ stage, estimatedReady }) => {
          updateTrackedOrderStageLocally(orderId, stage);
          setOrders((prev) =>
            prev.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    stage,
                    estimatedReady: estimatedReady || o.estimatedReady,
                    syncStatus: 'live',
                  }
                : o
            )
          );
        },
        onMissing: () => {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, syncStatus: 'error' } : o))
          );
        },
        onError: () => {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, syncStatus: 'error' } : o))
          );
        },
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [trackedSubscriptionKey]);

  const bagCount = useMemo(
    () => cartItems.reduce((sum, ci) => sum + ci.quantidade, 0),
    [cartItems]
  );

  const bagSubtotal = useMemo(
    () => cartItems.reduce((sum, ci) => sum + ci.preco * ci.quantidade, 0),
    [cartItems]
  );

  const suggestedPairings = useMemo(
    () =>
      menuItems
        .filter(
          (m) =>
            m.published !== false &&
            (m.category === 'porcao-de-batata' || m.category === 'bebidas')
        )
        .slice(0, 4),
    [menuItems]
  );

  const handleNavigate = (screen: AppScreen) => {
    setActiveScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCustomizer = (item: MenuItem) => {
    setEditingCartItem(null);
    setCustomizerItem(item);
  };

  const handleEditCartItem = (cartItem: CartItem) => {
    setEditingCartItem(cartItem);
    setCustomizerItem(cartItem.menuItem);
  };

  const handleQuickAdd = (item: MenuItem) => {
    const { selectedSingle, selectedMulti } = createDefaultSelections(item);
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (ci) =>
          ci.id === item.id &&
          !ci.observacao &&
          JSON.stringify(ci.selectedSingle) === JSON.stringify(selectedSingle) &&
          JSON.stringify(ci.selectedMulti) === JSON.stringify(selectedMulti)
      );

      if (existingIndex >= 0) {
        return prev.map((ci, idx) =>
          idx === existingIndex
            ? { ...ci, quantidade: ci.quantidade + 1, quantity: ci.quantity + 1 }
            : ci
        );
      }

      const newCartItem: CartItem = {
        cartItemId: `${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        id: item.id,
        nome: item.name,
        preco: item.price,
        quantidade: 1,
        observacao: '',
        menuItem: item,
        quantity: 1,
        selectedSingle,
        selectedMulti,
        kitchenNote: '',
        unitPrice: item.price,
      };
      return [...prev, newCartItem];
    });
  };

  const handleAdjustMenuItemQuantity = (menuItemId: string, delta: number) => {
    setCartItems((prev) => {
      const targetIndex = [...prev]
        .reverse()
        .findIndex((ci) => ci.id === menuItemId);
      if (targetIndex === -1) return prev;

      const actualIndex = prev.length - 1 - targetIndex;
      const target = prev[actualIndex];
      const nextQty = target.quantidade + delta;

      if (nextQty <= 0) {
        return prev.filter((_, idx) => idx !== actualIndex);
      }

      return prev.map((ci, idx) =>
        idx === actualIndex
          ? { ...ci, quantidade: nextQty, quantity: nextQty }
          : ci
      );
    });
  };

  const handleUpdateCartItemQuantity = (cartItemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((ci) => {
          if (ci.cartItemId !== cartItemId) return ci;
          const nextQty = ci.quantidade + delta;
          return { ...ci, quantidade: nextQty, quantity: nextQty };
        })
        .filter((ci) => ci.quantidade > 0)
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((ci) => ci.cartItemId !== cartItemId));
  };

  const handleSubmitCustomization = (payload: {
    menuItem: MenuItem;
    quantity: number;
    selectedSingle: Record<string, string>;
    selectedMulti: Record<string, string[]>;
    kitchenNote: string;
    unitPrice: number;
    editingCartItemId?: string;
  }) => {
    if (payload.editingCartItemId) {
      setCartItems((prev) =>
        prev.map((ci) =>
          ci.cartItemId === payload.editingCartItemId
            ? {
                ...ci,
                preco: payload.unitPrice,
                quantidade: payload.quantity,
                observacao: payload.kitchenNote,
                quantity: payload.quantity,
                selectedSingle: payload.selectedSingle,
                selectedMulti: payload.selectedMulti,
                kitchenNote: payload.kitchenNote,
                unitPrice: payload.unitPrice,
              }
            : ci
        )
      );
    } else {
      setCartItems((prev) => {
        const existingIndex = prev.findIndex(
          (ci) =>
            ci.id === payload.menuItem.id &&
            ci.observacao === payload.kitchenNote &&
            JSON.stringify(ci.selectedSingle) === JSON.stringify(payload.selectedSingle) &&
            JSON.stringify(ci.selectedMulti) === JSON.stringify(payload.selectedMulti)
        );

        if (existingIndex >= 0) {
          return prev.map((ci, idx) =>
            idx === existingIndex
              ? {
                  ...ci,
                  quantidade: ci.quantidade + payload.quantity,
                  quantity: ci.quantity + payload.quantity,
                }
              : ci
          );
        }

        const newCartItem: CartItem = {
          cartItemId: `${payload.menuItem.id}-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 6)}`,
          id: payload.menuItem.id,
          nome: payload.menuItem.name,
          preco: payload.unitPrice,
          quantidade: payload.quantity,
          observacao: payload.kitchenNote,
          menuItem: payload.menuItem,
          quantity: payload.quantity,
          selectedSingle: payload.selectedSingle,
          selectedMulti: payload.selectedMulti,
          kitchenNote: payload.kitchenNote,
          unitPrice: payload.unitPrice,
        };
        return [...prev, newCartItem];
      });
    }

    setCustomizerItem(null);
    setEditingCartItem(null);
  };

  const handlePlaceOrder = async (details: {
    fulfillment: FulfillmentType;
    neighborhoodLabel: string;
    deliveryFee: number;
    buyer: BuyerData;
    tipPercent: number;
    paymentMethod: PaymentMethod;
    troco: string;
  }) => {
    setIsSubmittingOrder(true);
    try {
      const subtotal = bagSubtotal;
      const tip = subtotal * (details.tipPercent / 100);
      const total = subtotal + details.deliveryFee + tip;
      const estimatedMinutes =
        details.fulfillment === 'pickup'
          ? storeSettings.pickupEstimatedMinutes
          : storeSettings.deliveryEstimatedMinutes;

      const orderItems = cartItems.map((ci) => ({
        menuItemId: ci.id,
        name: ci.nome,
        quantity: ci.quantidade,
        summary: formatCartItemSummary(ci),
        firestoreSummary: formatCartItemCustomizationsOnly(ci),
        lineTotal: ci.preco * ci.quantidade,
      }));

      const createInput: CreateOrderInput = {
        orderCodePrefix: storeSettings.orderCodePrefix,
        fulfillment: details.fulfillment,
        estimatedMinutes,
        subtotal,
        deliveryFee: details.deliveryFee,
        tip,
        total,
        items: orderItems,
      };

      const persisted = await createPersistedOrder(createInput);
      const fallbackOrderCode = generateOrderCode(storeSettings.orderCodePrefix);
      const effectiveOrderCode = persisted.ok ? persisted.orderCode : fallbackOrderCode;

      const whatsappMessage = buildWhatsAppOrderMessage({
        orderCode: persisted.ok ? persisted.orderCode : undefined,
        buyer: details.buyer,
        fulfillment: details.fulfillment,
        neighborhoodLabel: details.neighborhoodLabel,
        cartItems,
        paymentMethod: details.paymentMethod,
        troco: details.troco,
        subtotal,
        deliveryFee: details.deliveryFee,
        tip,
        tipPercent: details.tipPercent,
        total,
      });
      const whatsappUrl = buildWhatsAppOrderUrl(storeSettings.whatsappNumber, whatsappMessage);
      openExternalUrl(whatsappUrl);

      if (persisted.ok) {
        const newOrder: PlacedOrder = {
          id: persisted.orderId,
          orderCode: persisted.orderCode,
          trackingToken: persisted.trackingToken,
          trackerId: persisted.trackerId,
          placedAt: formatOrderPlacedAt(persisted.placedAtIso),
          placedAtIso: persisted.placedAtIso,
          fulfillment: details.fulfillment,
          neighborhoodLabel: details.neighborhoodLabel,
          buyer: details.buyer,
          items: orderItems,
          subtotal,
          deliveryFee: details.deliveryFee,
          tip,
          total,
          stage: 0,
          estimatedReady: persisted.estimatedReady,
          persistenceStatus: 'persisted',
          syncStatus: 'live',
          whatsappUrl,
        };
        saveTrackedOrder(newOrder);
        setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
      } else {
        const localId = `unsaved-${Date.now()}`;
        failedOrderInputsRef.current.set(localId, createInput);
        const nowIso = new Date().toISOString();
        const unsavedOrder: PlacedOrder = {
          id: localId,
          orderCode: effectiveOrderCode,
          placedAt: formatOrderPlacedAt(nowIso),
          placedAtIso: nowIso,
          fulfillment: details.fulfillment,
          neighborhoodLabel: details.neighborhoodLabel,
          buyer: details.buyer,
          items: orderItems,
          subtotal,
          deliveryFee: details.deliveryFee,
          tip,
          total,
          stage: 0,
          estimatedReady: computeEstimatedReadyTime(estimatedMinutes),
          persistenceStatus: persisted.reason,
          persistenceError: persisted.message,
          syncStatus: 'inactive',
          whatsappUrl,
        };
        setOrders((prev) => [unsavedOrder, ...prev]);
      }

      setCartItems([]);
      handleNavigate('orders');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleRetryOrderPersistence = useCallback(async (localOrderId: string) => {
    const createInput = failedOrderInputsRef.current.get(localOrderId);
    if (!createInput) return;

    setRetryingOrderId(localOrderId);
    try {
      const persisted = await createPersistedOrder(createInput);
      if (persisted.ok) {
        failedOrderInputsRef.current.delete(localOrderId);
        setOrders((prev) =>
          prev.map((order) => {
            if (order.id !== localOrderId) return order;
            const updated: PlacedOrder = {
              ...order,
              id: persisted.orderId,
              orderCode: persisted.orderCode,
              trackingToken: persisted.trackingToken,
              trackerId: persisted.trackerId,
              placedAt: formatOrderPlacedAt(persisted.placedAtIso),
              placedAtIso: persisted.placedAtIso,
              estimatedReady: persisted.estimatedReady,
              stage: 0,
              persistenceStatus: 'persisted',
              persistenceError: undefined,
              syncStatus: 'live',
            };
            saveTrackedOrder(updated);
            return updated;
          })
        );
      } else {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === localOrderId
              ? {
                  ...order,
                  persistenceStatus: persisted.reason,
                  persistenceError: persisted.message,
                }
              : order
          )
        );
      }
    } finally {
      setRetryingOrderId(null);
    }
  }, []);

  const handleRefreshOrderStatus = useCallback(
    async (orderId: string) => {
      const target = orders.find((o) => o.id === orderId);
      if (!target || !target.trackingToken || target.persistenceStatus !== 'persisted') return;

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, syncStatus: 'connecting' } : o))
      );

      const snapshot = await fetchTrackedOrderSnapshot(orderId, target.trackingToken);
      if (snapshot.status === 'found') {
        updateTrackedOrderStageLocally(orderId, snapshot.stage);
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  stage: snapshot.stage,
                  estimatedReady: snapshot.estimatedReady || o.estimatedReady,
                  syncStatus: 'live',
                }
              : o
          )
        );
      } else {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  syncStatus: snapshot.status === 'unavailable' ? 'inactive' : 'error',
                }
              : o
          )
        );
      }
    },
    [orders]
  );

  const showStickyOrderBar = bagCount > 0 && activeScreen !== 'checkout';
  const activePersistedOrdersCount = orders.filter(
    (o) => o.persistenceStatus === 'persisted' && o.stage < 3
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-surface text-[#1C1B1B]">
      <TopNav
        activeScreen={activeScreen}
        onNavigate={handleNavigate}
        bagCount={bagCount}
        bagTotal={bagSubtotal}
        activeOrdersCount={activePersistedOrdersCount}
        storeSettings={storeSettings}
      />

      <main className="flex-1 w-full max-w-[980px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {(activeScreen === 'menu' || activeScreen === 'combos') && (
          <MenuScreen
            key={activeScreen}
            items={menuItems}
            categories={categories}
            storeSettings={storeSettings}
            initialCategory={activeScreen === 'combos' ? 'combos' : 'all'}
            cartItems={cartItems}
            onOpenCustomizer={handleOpenCustomizer}
            onQuickAdd={handleQuickAdd}
            onAdjustItemQuantity={handleAdjustMenuItemQuantity}
          />
        )}

        {activeScreen === 'checkout' && (
          <CheckoutScreen
            cartItems={cartItems}
            suggestedItems={suggestedPairings}
            deliveryFees={deliveryFees}
            storeSettings={storeSettings}
            isSubmittingOrder={isSubmittingOrder}
            onBackToMenu={() => handleNavigate('menu')}
            onUpdateQuantity={handleUpdateCartItemQuantity}
            onRemoveItem={handleRemoveCartItem}
            onEditItem={handleEditCartItem}
            onQuickAdd={handleQuickAdd}
            onPlaceOrder={handlePlaceOrder}
          />
        )}

        {activeScreen === 'orders' && (
          <OrdersScreen
            orders={orders}
            storeSettings={storeSettings}
            isRestoringOrders={isRestoringOrders}
            retryingOrderId={retryingOrderId}
            onRetryPersistence={handleRetryOrderPersistence}
            onRefreshOrderStatus={handleRefreshOrderStatus}
            onBackToMenu={() => handleNavigate('menu')}
          />
        )}

        {activeScreen === 'hearth' && (
          <HearthScreen
            storeSettings={storeSettings}
            onExploreMenu={() => handleNavigate('menu')}
          />
        )}
      </main>

      <footer className="border-t border-[#EAEAEA] bg-[#FFFFFF] py-6 px-4 sm:px-6 mt-auto">
        <div className="max-w-[980px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[13px] text-[#5A413A]">
          <p>
            {storeSettings.name} · {storeSettings.neighborhood}, {storeSettings.city} · Entrega em{' '}
            {storeSettings.deliveryTimeMin} min · Pedido mín. {formatBRL(storeSettings.minOrder)}
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => handleNavigate('menu')}
              className="hover:text-[#1C1B1B] cursor-pointer"
            >
              Cardápio
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('hearth')}
              className="hover:text-[#1C1B1B] cursor-pointer"
            >
              {storeSettings.aboutNavLabel}
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('orders')}
              className="hover:text-[#1C1B1B] cursor-pointer"
            >
              Status do Pedido
            </button>
            {canOpenAdmin && onOpenAdmin && (
              <a
                href="/admin"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenAdmin();
                }}
                className="text-[#8E7069] hover:text-[#1C1B1B] cursor-pointer"
              >
                Admin
              </a>
            )}
          </div>
        </div>
      </footer>

      {showStickyOrderBar && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF] border-t border-[#EAEAEA] px-4 py-2.5"
          style={{ boxShadow: '0px 4px 20px rgba(26, 26, 26, 0.06)' }}
        >
          <div className="max-w-[980px] mx-auto flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[#5A413A] tabular-nums">
                {bagCount} {bagCount === 1 ? 'item' : 'itens'} na sacola
              </p>
              <p className="text-[16px] font-extrabold text-[#1C1B1B] tabular-nums">
                {formatBRL(bagSubtotal)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleNavigate('checkout')}
              className="min-h-[46px] px-5 sm:px-7 py-2.5 rounded-lg bg-brand hover:bg-brand-hover active:scale-[0.98] text-[#FFFFFF] text-[14px] sm:text-[15px] font-bold inline-flex items-center gap-2 transition-all cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <ShoppingBag className="w-4 h-4" strokeWidth={2.2} />
              <span>Ver Sacola e Finalizar</span>
            </button>
          </div>
        </div>
      )}

      <CustomizerModal
        item={customizerItem}
        editingCartItem={editingCartItem}
        onClose={() => {
          setCustomizerItem(null);
          setEditingCartItem(null);
        }}
        onSubmit={handleSubmitCustomization}
      />
    </div>
  );
}
