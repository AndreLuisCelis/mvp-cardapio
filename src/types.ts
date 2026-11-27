export type MenuCategory = 'all' | 'combos' | string;

export type AppScreen = 'menu' | 'combos' | 'hearth' | 'checkout' | 'orders';

export type ImageKey =
  | 'hero_smash'
  | 'truffle_brisket'
  | 'spicy_chicken'
  | 'classic_ember'
  | 'rosemary_fries'
  | 'craft_soda'
  | 'combo_casal'
  | 'brazilian_dog'
  | 'cheddar_fries'
  | 'soda_cans'
  | 'fruit_juice';

export type CustomizationGroupKey = 'bun' | 'sear' | 'addons' | 'dip' | 'ice';

export interface CustomizationChoice {
  id: string;
  label: string;
  priceDelta: number;
}

export interface CustomizationGroup {
  id: CustomizationGroupKey;
  title: string;
  type: 'single' | 'multi';
  required?: boolean;
  choices: CustomizationChoice[];
}

export interface StoreInfo {
  name: string;
  neighborhood: string;
  city: string;
  minOrder: number;
  deliveryFee: number;
  deliveryTimeMin: string;
}

export interface StoreSettingsRecord {
  name: string;
  neighborhood: string;
  city: string;
  minOrder: number;
  deliveryFee: number;
  deliveryTimeMin: string;
  whatsappNumber: string;
  orderCodePrefix: string;
  pickupEstimatedMinutes: number;
  deliveryEstimatedMinutes: number;
  aboutNavLabel: string;
  heroHeadline: string;
  searchPlaceholder: string;
  emptyBagDescription: string;
  paymentMethodsLabel: string;
  logoUrl: string;
  bannerUrl: string;
  aboutHeadline: string;
  aboutDescription: string;
}

export interface StoreCategoryConfig {
  id: string;
  key: string;
  title: string;
  isCombo: boolean;
  active: boolean;
  sortOrder: number;
}

export interface DeliveryFeeOption {
  id: string;
  label: string;
  fee: number;
  fulfillment: FulfillmentType;
  active: boolean;
  sortOrder: number;
}

export type StaffUserRole = 'admin' | 'editor';

export interface StaffUserRecord {
  uid: string;
  email: string;
  displayName: string;
  role: StaffUserRole;
  canManageUsers: boolean;
  active: boolean;
  createdBy: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  description: string;
  ingredientsSummary: string;
  price: number;
  originalPrice?: number | null;
  calories?: number;
  prepMinutes: string;
  rating: number;
  reviewCount: number;
  dietaryNote?: string;
  featured: boolean;
  isHero: boolean;
  published: boolean;
  imageKey: ImageKey;
  imageUrl: string;
  customizationGroupKeys: CustomizationGroupKey[];
  customizationGroups: CustomizationGroup[];
  sortOrder: number;
}

export interface CartItem {
  cartItemId: string;
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  observacao: string;
  menuItem: MenuItem;
  quantity: number;
  selectedSingle: Record<string, string>;
  selectedMulti: Record<string, string[]>;
  kitchenNote: string;
  unitPrice: number;
}

export type FulfillmentType = 'pickup' | 'delivery';

export type OrderStage = 0 | 1 | 2 | 3;

export interface BuyerData {
  nome: string;
  whatsapp: string;
  endereco: string;
  bairro: string;
}

export interface PlacedOrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  summary: string;
  firestoreSummary?: string;
  lineTotal: number;
}

export type OrderPersistenceStatus = 'persisted' | 'unavailable' | 'failed';
export type OrderSyncStatus = 'live' | 'connecting' | 'error' | 'inactive';

export interface PlacedOrder {
  id: string;
  orderCode: string;
  trackingToken?: string;
  trackerId?: string;
  placedAt: string;
  placedAtIso?: string;
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
  persistenceStatus: OrderPersistenceStatus;
  persistenceError?: string;
  syncStatus?: OrderSyncStatus;
  whatsappUrl?: string;
}

export interface StaffOrderRecord {
  id: string;
  orderCode: string;
  trackerId: string;
  fulfillment: FulfillmentType;
  pickupWindow: string;
  subtotal: number;
  deliveryFee: number;
  tip: number;
  total: number;
  stage: OrderStage;
  estimatedReady: string;
  createdAtIso: string;
  updatedAtIso: string;
  items?: PlacedOrderItem[];
}

