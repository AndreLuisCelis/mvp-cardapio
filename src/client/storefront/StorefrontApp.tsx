import { useEffect, useMemo, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { CheckoutScreen, formatCartItemSummary } from '../../components/CheckoutScreen';
import { CustomizerModal } from '../../components/CustomizerModal';
import { HearthScreen } from '../../components/HearthScreen';
import { MenuScreen } from '../../components/MenuScreen';
import { OrdersScreen } from '../../components/OrdersScreen';
import { TopNav } from '../../components/TopNav';
import { MENU_ITEMS } from '../../data/menu';
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
  OrderStage,
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

interface StorefrontAppProps {
  canOpenAdmin?: boolean;
  onOpenAdmin?: () => void;
}

export function StorefrontApp({ canOpenAdmin = false, onOpenAdmin }: StorefrontAppProps) {
  const [activeScreen, setActiveScreen] = useState<AppScreen>('menu');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<PlacedOrder[]>([]);

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

  const handlePlaceOrder = (details: {
    fulfillment: FulfillmentType;
    neighborhoodLabel: string;
    deliveryFee: number;
    buyer: BuyerData;
    tipPercent: number;
  }) => {
    const subtotal = bagSubtotal;
    const tip = subtotal * (details.tipPercent / 100);
    const total = subtotal + details.deliveryFee + tip;

    const suffix = 1043 + orders.length;
    const orderCode = `${storeSettings.orderCodePrefix}-${suffix}`;
    const now = new Date();
    const readyDate = new Date(
      now.getTime() +
        (details.fulfillment === 'pickup'
          ? storeSettings.pickupEstimatedMinutes
          : storeSettings.deliveryEstimatedMinutes) *
          60000
    );
    const hours = String(readyDate.getHours()).padStart(2, '0');
    const minutes = String(readyDate.getMinutes()).padStart(2, '0');
    const estimatedReady = `${hours}h${minutes}`;

    const newOrder: PlacedOrder = {
      id: `order-${Date.now()}`,
      orderCode,
      placedAt: 'Agora mesmo',
      fulfillment: details.fulfillment,
      neighborhoodLabel: details.neighborhoodLabel,
      buyer: details.buyer,
      items: cartItems.map((ci) => ({
        menuItemId: ci.id,
        name: ci.nome,
        quantity: ci.quantidade,
        summary: formatCartItemSummary(ci),
        lineTotal: ci.preco * ci.quantidade,
      })),
      subtotal,
      deliveryFee: details.deliveryFee,
      tip,
      total,
      stage: 0,
      estimatedReady,
    };

    const existingOrders = orders.filter((o) => o.id !== newOrder.id);
    setOrders([newOrder, ...existingOrders]);
    setCartItems([]);
    handleNavigate('orders');
  };

  const handleAdvanceOrderStage = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const nextStage = Math.min(3, order.stage + 1) as OrderStage;
        return { ...order, stage: nextStage };
      })
    );
  };

  const showStickyOrderBar = bagCount > 0 && activeScreen !== 'checkout';

  return (
    <div className="min-h-screen flex flex-col bg-surface text-[#1C1B1B]">
      <TopNav
        activeScreen={activeScreen}
        onNavigate={handleNavigate}
        bagCount={bagCount}
        bagTotal={bagSubtotal}
        activeOrdersCount={orders.filter((o) => o.stage < 3).length}
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
            onAdvanceStage={handleAdvanceOrderStage}
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

      {/* Barra Fixa Inferior: quantidade total + subtotal em R$, oculta se vazio */}
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

      {/* Modal / Sheet de Personalização */}
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
