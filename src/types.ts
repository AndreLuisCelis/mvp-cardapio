export type MenuCategory = 'all' | 'burgers' | 'combos' | 'sides' | 'drinks';

export type AppScreen = 'menu' | 'combos' | 'hearth' | 'checkout' | 'orders';

export type ImageKey =
  | 'hero_smash'
  | 'truffle_brisket'
  | 'spicy_chicken'
  | 'classic_ember'
  | 'rosemary_fries'
  | 'craft_soda';

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

export interface MenuItem {
  id: string;
  name: string;
  category: Exclude<MenuCategory, 'all'>;
  description: string;
  ingredientsSummary: string;
  price: number;
  calories: number;
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
  lineTotal: number;
}

export interface PlacedOrder {
  id: string;
  orderCode: string;
  placedAt: string;
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
}
