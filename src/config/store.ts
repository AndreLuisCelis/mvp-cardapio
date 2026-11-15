import storeBannerImg from '../assets/images/banner_top_lanches.jpeg';
import { FulfillmentType, OrderStage, StoreInfo } from '../types';

export interface NeighborhoodFeeOption {
  id: string;
  label: string;
  fee: number;
  fulfillment: FulfillmentType;
}

export interface AboutPillar {
  number: string;
  title: string;
  body: string;
}

export interface KitchenStageConfig {
  stage: OrderStage;
  title: string;
  subtitle: string;
}

export interface StoreConfig extends StoreInfo {
  whatsappNumber: string;
  orderCodePrefix: string;
  pickupEstimatedMinutes: number;
  deliveryEstimatedMinutes: number;
  aboutNavLabel: string;
  heroHeadline: string;
  searchPlaceholder: string;
  emptyBagDescription: string;
  paymentMethodsLabel: string;
  bannerImg: string;
}

export const STORE_INFO: StoreConfig = {
  name: 'TOP Lanches',
  neighborhood: 'Jardim Rosas',
  city: 'Francisco Morato - SP',
  minOrder: 20.0,
  deliveryFee: 3.99,
  deliveryTimeMin: '20-30',
  whatsappNumber: '5511991625833',
  orderCodePrefix: 'TL',
  pickupEstimatedMinutes: 20,
  deliveryEstimatedMinutes: 35,
  aboutNavLabel: 'A Lanchonete',
  heroHeadline: 'TOP Lanches: lanches, dogs e combos caprichados.',
  searchPlaceholder: 'Buscar combos, X-Tudo, hot dog, batata, bebidas...',
  emptyBagDescription:
    'Comece escolhendo um dos nossos combos, hot dogs, hambúrgueres, porções de batata ou bebidas da TOP Lanches.',
  paymentMethodsLabel: 'Pagamento via Pix, cartão ou dinheiro na retirada e entrega.',
  bannerImg: storeBannerImg,
};

export const NEIGHBORHOOD_FEES: NeighborhoodFeeOption[] = [
  {
    id: 'jardim-rosas',
    label: `Entrega · ${STORE_INFO.neighborhood} (${STORE_INFO.city})`,
    fee: STORE_INFO.deliveryFee,
    fulfillment: 'delivery',
  },
  {
    id: 'retirada',
    label: 'Retirada no Balcão',
    fee: 0,
    fulfillment: 'pickup',
  },
];

export const ABOUT_SECTION: {
  headline: string;
  description: string;
  pillars: AboutPillar[];
} = {
  headline: 'Lanches caprichados, porções e combos com preço justo.',
  description: `Atendendo ${STORE_INFO.neighborhood} e toda a região de ${STORE_INFO.city} com hambúrgueres no pão de brioche, hot dogs tradicionais paulistas, porções de batata com cheddar e bebidas sempre geladas.`,
  pillars: [
    {
      number: '01.',
      title: 'Combos Casal, Grande Fome e Individuais',
      body: 'Opções pensadas para matar qualquer tamanho de fome, com batata frita crocante, nuggets e refrigerantes gelados.',
    },
    {
      number: '02.',
      title: 'Hambúrgueres no Brioche e Hot Dogs Completos',
      body: 'Do clássico X-Salada ao X-Tudão e nossa linha Dog Saboroso com purê de batata, batata palha, bacon e molho cheddar.',
    },
    {
      number: '03.',
      title: `Entrega Rápida no ${STORE_INFO.neighborhood} e Região`,
      body: `Pedido mínimo de R$ ${STORE_INFO.minOrder.toFixed(2).replace('.', ',')}, taxa de entrega fixa de R$ ${STORE_INFO.deliveryFee.toFixed(2).replace('.', ',')} e tempo médio de ${STORE_INFO.deliveryTimeMin} minutos.`,
    },
  ],
};

export const KITCHEN_STAGES: KitchenStageConfig[] = [
  {
    stage: 0,
    title: 'Pedido Confirmado',
    subtitle: 'Comanda enviada para a chapa e estação de preparo',
  },
  {
    stage: 1,
    title: 'Na Chapa e Preparo',
    subtitle: 'Preparando os lanches e porções na hora com ingredientes frescos',
  },
  {
    stage: 2,
    title: 'Montagem e Embalagem',
    subtitle: 'Finalizando o pedido, conferindo itens e lacrando a sacola',
  },
  {
    stage: 3,
    title: 'Pronto',
    subtitle: 'Aguardando retirada no balcão ou em rota com o entregador',
  },
];
