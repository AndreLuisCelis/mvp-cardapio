import comboCasalSimplesImg from '../assets/images/combo_casal_simples.jpg';
import comboCasalSaladaImg from '../assets/images/combo_casal_salada.jpg';
import comboCasalSaladaBaconImg from '../assets/images/combo_casal_salada_bacon.jpg';
import comboCasalBaconImg from '../assets/images/combo_casal_bacon.jpg';
import comboCasalTudoImg from '../assets/images/combo_casal_tudo.jpg';
import comboIndividualTudoImg from '../assets/images/combo_individual_tudo.jpg';
import comboIndividualSimplesImg from '../assets/images/combo_individual_simples.jpg';
import comboIndividualSaladaImg from '../assets/images/combo_individual_salada.jpg';
import comboIndividualBaconImg from '../assets/images/combo_individual_bacon.jpg';
import comboIndividualSaladaBaconImg from '../assets/images/combo_individual_salada_bacon.jpg';
import comboIndividualTudaoImg from '../assets/images/combo_individual_tudao.jpg';
import comboDogImg from '../assets/images/combo_dog.jpg';
import comboBurgerIndividualImg from '../assets/images/combo_burger_individual.jpg';
import dogTradicionalImg from '../assets/images/dog_tradicional.jpg';
import dogDuploBigImg from '../assets/images/dog_duplo_big.jpg';
import dogLinguicaImg from '../assets/images/dog_linguica.jpg';
import xTudoImg from '../assets/images/x_tudo.jpg';
import hamburguerSimplesImg from '../assets/images/hamburguer_simples.jpg';
import xTudaoImg from '../assets/images/x_tudao.jpg';
import hamburguerEspecialImg from '../assets/images/hamburguer_especial.jpg';
import xEggImg from '../assets/images/x_egg.jpg';
import xSaladaImg from '../assets/images/x_salada.jpg';
import xSaladaBaconImg from '../assets/images/x_salada_bacon.jpg';
import xEggBaconImg from '../assets/images/x_egg_bacon.jpg';
import xBaconDuploImg from '../assets/images/x_bacon_duplo.jpg';
import porcaoBatataImg from '../assets/images/porcao_batata.jpg';
import cocaCola350Img from '../assets/images/coca_cola_350ml.jpeg';
import fantaLaranja350Img from '../assets/images/fanta_laranja_350ml.png';
import fantaUva350Img from '../assets/images/fanta_uva_350ml.jpg';
import guarana350Img from '../assets/images/guarana_350ml.png';
import delValleMaracujaImg from '../assets/images/del_valle_maracuja.jpg';
import delValleUvaImg from '../assets/images/del_valle_uva.jpeg';
import delVallePessegoImg from '../assets/images/del_valle_pessego.png';
import convencao2lImg from '../assets/images/convencao_2l.jpg';
import cocaCola600Img from '../assets/images/coca_cola_600ml.jpg';
import guarana2lImg from '../assets/images/guarana_2l.png';
import cocaCola2lImg from '../assets/images/coca_cola_2l.jpeg';
import {
  CustomizationGroup,
  CustomizationGroupKey,
  ImageKey,
  MenuCategory,
  MenuItem,
  PlacedOrder,
  StoreInfo,
} from '../types';

export const STORE_INFO: StoreInfo = {
  name: 'TOP Lanches',
  neighborhood: 'Jardim Rosas',
  city: 'Francisco Morato - SP',
  minOrder: 20.0,
  deliveryFee: 3.99,
  deliveryTimeMin: '20-30',
};

export const MENU_CATEGORIES: {
  key: Exclude<MenuCategory, 'all' | 'combos'>;
  title: string;
  isCombo?: boolean;
}[] = [
  { key: 'combos-casal', title: 'Combos Casal', isCombo: true },
  { key: 'combos-grande-fome', title: 'Combos Grande Fome', isCombo: true },
  { key: 'combos-individuais', title: 'Combos Individuais', isCombo: true },
  { key: 'dog-saboroso', title: 'Dog Saboroso' },
  { key: 'hamburguer-sensacional', title: 'Hambúrguer Sensacional' },
  { key: 'porcao-de-batata', title: 'Porção de Batata' },
  { key: 'bebidas', title: 'Bebidas' },
];

export const IMAGE_MAP: Record<ImageKey, string> = {
  hero_smash: comboIndividualTudoImg,
  truffle_brisket: xBaconDuploImg,
  spicy_chicken: xEggBaconImg,
  classic_ember: xSaladaImg,
  rosemary_fries: porcaoBatataImg,
  craft_soda: cocaCola600Img,
  combo_casal: comboCasalTudoImg,
  brazilian_dog: dogTradicionalImg,
  cheddar_fries: porcaoBatataImg,
  soda_cans: cocaCola350Img,
  fruit_juice: delValleMaracujaImg,
};

export const IMAGE_OPTIONS: { key: ImageKey; label: string }[] = [
  { key: 'combo_casal', label: 'Combo Completo' },
  { key: 'hero_smash', label: 'Hambúrguer Duplo' },
  { key: 'truffle_brisket', label: 'Hambúrguer Bacon' },
  { key: 'classic_ember', label: 'Hambúrguer Clássico' },
  { key: 'brazilian_dog', label: 'Hot Dog Completo' },
  { key: 'cheddar_fries', label: 'Batata com Cheddar e Bacon' },
  { key: 'soda_cans', label: 'Refrigerante Gelado' },
  { key: 'fruit_juice', label: 'Suco de Fruta' },
];

export const CUSTOMIZATION_GROUP_MAP: Record<CustomizationGroupKey, CustomizationGroup> = {
  bun: {
    id: 'bun',
    title: 'Ponto / Montagem',
    type: 'single',
    required: true,
    choices: [
      { id: 'padrao', label: 'Preparo Padrão da Casa', priceDelta: 0 },
      { id: 'sem-salada', label: 'Sem Alface e Tomate', priceDelta: 0 },
      { id: 'sem-maionese', label: 'Sem Maionese', priceDelta: 0 },
    ],
  },
  sear: {
    id: 'sear',
    title: 'Molho do Lanche',
    type: 'single',
    required: true,
    choices: [
      { id: 'maionese-casa', label: 'Maionese da Casa (Padrão)', priceDelta: 0 },
      { id: 'molho-cheddar', label: 'Trocar por Molho Cheddar', priceDelta: 2.0 },
      { id: 'sem-molho', label: 'Sem Molhos', priceDelta: 0 },
    ],
  },
  addons: {
    id: 'addons',
    title: 'Adicionais',
    type: 'multi',
    choices: [
      { id: 'extra-cheddar', label: 'Fatia de Cheddar Extra', priceDelta: 3.5 },
      { id: 'extra-bacon', label: 'Porção de Bacon Extra', priceDelta: 5.0 },
      { id: 'extra-ovo', label: 'Ovo na Chapa', priceDelta: 2.5 },
      { id: 'extra-hamburguer', label: 'Hambúrguer Extra', priceDelta: 6.0 },
      { id: 'extra-molho-cheddar', label: 'Molho Cheddar Cremoso', priceDelta: 3.5 },
    ],
  },
  dip: {
    id: 'dip',
    title: 'Acompanhamento de Molho',
    type: 'single',
    required: true,
    choices: [
      { id: 'maionese-temperada', label: 'Maionese Temperada da Casa', priceDelta: 0 },
      { id: 'ketchup-mostarda', label: 'Sachês Ketchup e Mostarda', priceDelta: 0 },
      { id: 'cheddar-extra-potinho', label: 'Potinho Extra de Cheddar', priceDelta: 3.5 },
    ],
  },
  ice: {
    id: 'ice',
    title: 'Temperatura',
    type: 'single',
    required: true,
    choices: [
      { id: 'bem-gelada', label: 'Bem Gelada (Padrão)', priceDelta: 0 },
      { id: 'natural', label: 'Temperatura Ambiente', priceDelta: 0 },
    ],
  },
};

export const CUSTOMIZATION_GROUP_OPTIONS: { key: CustomizationGroupKey; label: string }[] = [
  { key: 'bun', label: 'Ponto / Montagem' },
  { key: 'sear', label: 'Molho do Lanche' },
  { key: 'addons', label: 'Adicionais' },
  { key: 'dip', label: 'Acompanhamento de Molho' },
  { key: 'ice', label: 'Temperatura' },
];

export function resolveCustomizationGroups(keys: CustomizationGroupKey[]): CustomizationGroup[] {
  return keys.map((k) => CUSTOMIZATION_GROUP_MAP[k]).filter(Boolean);
}

interface RawCatalogItem {
  id: string;
  name: string;
  category: Exclude<MenuCategory, 'all' | 'combos'>;
  categoryLabel: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  imageKey: ImageKey;
  imageUrl?: string;
  customizationGroupKeys: CustomizationGroupKey[];
  featured?: boolean;
  isHero?: boolean;
  dietaryNote?: string;
}

const RAW_ITEMS: RawCatalogItem[] = [
  // Combos Casal
  {
    id: 'combo-casal-simples',
    name: 'Combo Casal Simples',
    category: 'combos-casal',
    categoryLabel: 'Combos Casal',
    description: '2 X-Burguer, 300g de batata frita, 12 Nuggets, Coca-Cola 600ml',
    price: 59.9,
    originalPrice: null,
    imageKey: 'combo_casal',
    imageUrl: comboCasalSimplesImg,
    customizationGroupKeys: ['addons', 'dip'],
    dietaryNote: 'Serve 2 pessoas',
  },
  {
    id: 'combo-casal-salada',
    name: 'Combo Casal Salada',
    category: 'combos-casal',
    categoryLabel: 'Combos Casal',
    description: '2 X-Salada, 300g de batata frita, 12 Nuggets, Coca-Cola 600ml',
    price: 64.9,
    originalPrice: null,
    imageKey: 'combo_casal',
    imageUrl: comboCasalSaladaImg,
    customizationGroupKeys: ['addons', 'dip'],
    dietaryNote: 'Serve 2 pessoas',
  },
  {
    id: 'combo-casal-salada-bacon',
    name: 'Combo Casal Salada Bacon',
    category: 'combos-casal',
    categoryLabel: 'Combos Casal',
    description: '2 X-Salada Bacon, 300g de batata frita, 12 Nuggets, Coca-Cola 600ml',
    price: 69.9,
    originalPrice: null,
    imageKey: 'combo_casal',
    imageUrl: comboCasalSaladaBaconImg,
    customizationGroupKeys: ['addons', 'dip'],
    dietaryNote: 'Serve 2 pessoas',
  },
  {
    id: 'combo-casal-bacon',
    name: 'Combo Casal Bacon',
    category: 'combos-casal',
    categoryLabel: 'Combos Casal',
    description: '2 X-Bacon, 300g de batata frita, 12 Nuggets, Coca-Cola 600ml',
    price: 74.9,
    originalPrice: null,
    imageKey: 'combo_casal',
    imageUrl: comboCasalBaconImg,
    customizationGroupKeys: ['addons', 'dip'],
    dietaryNote: 'Serve 2 pessoas',
  },
  {
    id: 'combo-casal-tudo',
    name: 'Combo Casal Tudo',
    category: 'combos-casal',
    categoryLabel: 'Combos Casal',
    description: '2 X-Tudo, 300g de batata frita, 12 Nuggets, Coca-Cola 600ml',
    price: 79.9,
    originalPrice: null,
    imageKey: 'combo_casal',
    imageUrl: comboCasalTudoImg,
    customizationGroupKeys: ['addons', 'dip'],
    dietaryNote: 'Serve 2 pessoas',
  },
  {
    id: 'combo-casal-tudao',
    name: 'Combo Casal Tudão',
    category: 'combos-casal',
    categoryLabel: 'Combos Casal',
    description: '2 X-Tudão, 300g de batata frita, 12 Nuggets, Coca-Cola 600ml',
    price: 84.9,
    originalPrice: null,
    imageKey: 'combo_casal',
    imageUrl: comboCasalBaconImg,
    customizationGroupKeys: ['addons', 'dip'],
    dietaryNote: 'Mais completo',
  },

  // Combos Grande Fome
  {
    id: 'combo-individual-tudo',
    name: 'Combo Individual Tudo',
    category: 'combos-grande-fome',
    categoryLabel: 'Combos Grande Fome',
    description: '2 X-Tudo, 300g de batata frita',
    price: 38.9,
    originalPrice: 49.9,
    imageKey: 'hero_smash',
    imageUrl: comboIndividualTudoImg,
    customizationGroupKeys: ['addons', 'dip'],
    featured: true,
    isHero: true,
    dietaryNote: 'Oferta especial',
  },
  {
    id: 'combo-individual-simples',
    name: 'Combo Individual Simples',
    category: 'combos-grande-fome',
    categoryLabel: 'Combos Grande Fome',
    description: '2 X-Burguer, 300g de batata frita',
    price: 44.9,
    originalPrice: null,
    imageKey: 'classic_ember',
    imageUrl: comboIndividualSimplesImg,
    customizationGroupKeys: ['addons', 'dip'],
  },
  {
    id: 'combo-individual-salada',
    name: 'Combo Individual Salada',
    category: 'combos-grande-fome',
    categoryLabel: 'Combos Grande Fome',
    description: '2 X-Salada, 300g de batata frita',
    price: 44.9,
    originalPrice: null,
    imageKey: 'classic_ember',
    imageUrl: comboIndividualSaladaImg,
    customizationGroupKeys: ['addons', 'dip'],
  },
  {
    id: 'combo-individual-bacon',
    name: 'Combo Individual Bacon',
    category: 'combos-grande-fome',
    categoryLabel: 'Combos Grande Fome',
    description: '2 X-Bacon, 300g de batata frita',
    price: 49.9,
    originalPrice: null,
    imageKey: 'truffle_brisket',
    imageUrl: comboIndividualBaconImg,
    customizationGroupKeys: ['addons', 'dip'],
  },
  {
    id: 'combo-individual-salada-bacon',
    name: 'Combo Individual Salada Bacon',
    category: 'combos-grande-fome',
    categoryLabel: 'Combos Grande Fome',
    description: '2 X-Salada Bacon, 300g de batata frita',
    price: 49.9,
    originalPrice: null,
    imageKey: 'truffle_brisket',
    imageUrl: comboIndividualSaladaBaconImg,
    customizationGroupKeys: ['addons', 'dip'],
  },
  {
    id: 'combo-individual-tudao',
    name: 'Combo Individual Tudão',
    category: 'combos-grande-fome',
    categoryLabel: 'Combos Grande Fome',
    description: '2 X-Tudão, 300g de batata frita',
    price: 54.9,
    originalPrice: null,
    imageKey: 'hero_smash',
    imageUrl: comboIndividualTudaoImg,
    customizationGroupKeys: ['addons', 'dip'],
  },

  // Combos Individuais
  {
    id: 'combo-dog-simples',
    name: 'Combo Dog Simples',
    category: 'combos-individuais',
    categoryLabel: 'Combos Individuais',
    description: '1 Dog Simples, batata frita, 1 bebida em lata',
    price: 27.0,
    originalPrice: 36.0,
    imageKey: 'brazilian_dog',
    imageUrl: comboDogImg,
    customizationGroupKeys: ['addons', 'dip'],
    dietaryNote: 'Oferta',
  },
  {
    id: 'combo-dog-bacon',
    name: 'Combo Dog Bacon',
    category: 'combos-individuais',
    categoryLabel: 'Combos Individuais',
    description: '1 Dog Bacon, batata frita, 1 bebida em lata',
    price: 30.5,
    originalPrice: 39.5,
    imageKey: 'brazilian_dog',
    imageUrl: comboDogImg,
    customizationGroupKeys: ['addons', 'dip'],
    dietaryNote: 'Oferta',
  },
  {
    id: 'combo-x-bacon-duplo',
    name: 'Combo X-Bacon Duplo',
    category: 'combos-individuais',
    categoryLabel: 'Combos Individuais',
    description: '1 X-Bacon Duplo, batata frita, 1 bebida em lata',
    price: 31.5,
    originalPrice: 42.5,
    imageKey: 'truffle_brisket',
    imageUrl: comboBurgerIndividualImg,
    customizationGroupKeys: ['addons', 'dip'],
    dietaryNote: 'Oferta',
  },
  {
    id: 'combo-x-tudao',
    name: 'Combo X-Tudão',
    category: 'combos-individuais',
    categoryLabel: 'Combos Individuais',
    description: '1 X-Tudão, batata frita, 1 bebida em lata',
    price: 34.5,
    originalPrice: 45.5,
    imageKey: 'hero_smash',
    imageUrl: comboBurgerIndividualImg,
    customizationGroupKeys: ['addons', 'dip'],
    dietaryNote: 'Oferta',
  },
  {
    id: 'combo-x-salada',
    name: 'Combo X-Salada',
    category: 'combos-individuais',
    categoryLabel: 'Combos Individuais',
    description: '1 X-Salada, batata frita, 1 bebida em lata',
    price: 40.0,
    originalPrice: null,
    imageKey: 'classic_ember',
    imageUrl: comboBurgerIndividualImg,
    customizationGroupKeys: ['addons', 'dip'],
  },
  {
    id: 'combo-big-dog',
    name: 'Combo Big Dog',
    category: 'combos-individuais',
    categoryLabel: 'Combos Individuais',
    description: '1 Big Dog, batata frita, 1 bebida em lata',
    price: 41.0,
    originalPrice: null,
    imageKey: 'brazilian_dog',
    imageUrl: comboDogImg,
    customizationGroupKeys: ['addons', 'dip'],
  },
  {
    id: 'combo-x-tudo',
    name: 'Combo X-Tudo',
    category: 'combos-individuais',
    categoryLabel: 'Combos Individuais',
    description: '1 X-Tudo, batata frita, 1 bebida em lata',
    price: 43.5,
    originalPrice: null,
    imageKey: 'hero_smash',
    imageUrl: comboBurgerIndividualImg,
    customizationGroupKeys: ['addons', 'dip'],
  },

  // Dog Saboroso
  {
    id: 'x-hot-bacon-egg-especial',
    name: 'X-Hot Bacon Egg Especial',
    category: 'dog-saboroso',
    categoryLabel: 'Dog Saboroso',
    description:
      'Pão de dog, 1 salsicha, maionese, molho de tomate, batata palha, purê de batata, bacon, ovo e molho cheddar',
    price: 12.5,
    originalPrice: 18.5,
    imageKey: 'brazilian_dog',
    imageUrl: dogTradicionalImg,
    customizationGroupKeys: ['addons'],
    featured: true,
    dietaryNote: 'Oferta',
  },
  {
    id: 'dog-simples',
    name: 'Dog Simples',
    category: 'dog-saboroso',
    categoryLabel: 'Dog Saboroso',
    description:
      'Pão de dog, 1 salsicha, maionese, molho de tomate, batata palha e purê de batata',
    price: 13.0,
    originalPrice: null,
    imageKey: 'brazilian_dog',
    imageUrl: dogTradicionalImg,
    customizationGroupKeys: ['addons'],
  },
  {
    id: 'dog-especial',
    name: 'Dog Especial',
    category: 'dog-saboroso',
    categoryLabel: 'Dog Saboroso',
    description:
      'Pão de dog, 1 salsicha, maionese, molho de tomate, batata palha, purê de batata e molho cheddar',
    price: 13.5,
    originalPrice: null,
    imageKey: 'brazilian_dog',
    imageUrl: dogTradicionalImg,
    customizationGroupKeys: ['addons'],
  },
  {
    id: 'dog-duplo',
    name: 'Dog Duplo',
    category: 'dog-saboroso',
    categoryLabel: 'Dog Saboroso',
    description:
      'Pão de dog, 2 salsichas, maionese, molho de tomate, batata palha, purê de batata e molho cheddar',
    price: 16.0,
    originalPrice: null,
    imageKey: 'brazilian_dog',
    imageUrl: dogDuploBigImg,
    customizationGroupKeys: ['addons'],
  },
  {
    id: 'x-hot-bacon',
    name: 'X-Hot Bacon',
    category: 'dog-saboroso',
    categoryLabel: 'Dog Saboroso',
    description:
      'Pão de dog, 1 salsicha, maionese, molho de tomate, batata palha, purê de batata e bacon',
    price: 16.5,
    originalPrice: null,
    imageKey: 'brazilian_dog',
    imageUrl: dogTradicionalImg,
    customizationGroupKeys: ['addons'],
  },
  {
    id: 'x-hot-bacon-especial',
    name: 'X-Hot Bacon Especial',
    category: 'dog-saboroso',
    categoryLabel: 'Dog Saboroso',
    description:
      'Pão de dog, 1 salsicha, maionese, molho de tomate, batata palha, purê de batata, bacon e molho cheddar',
    price: 17.0,
    originalPrice: null,
    imageKey: 'brazilian_dog',
    imageUrl: dogTradicionalImg,
    customizationGroupKeys: ['addons'],
  },
  {
    id: 'big-dog',
    name: 'Big Dog',
    category: 'dog-saboroso',
    categoryLabel: 'Dog Saboroso',
    description:
      'Pão de dog, 2 salsichas, maionese, molho de tomate, batata palha, purê de batata, bacon e molho cheddar',
    price: 18.0,
    originalPrice: null,
    imageKey: 'brazilian_dog',
    imageUrl: dogDuploBigImg,
    customizationGroupKeys: ['addons'],
  },
  {
    id: 'x-hot-bacon-egg',
    name: 'X-Hot Bacon Egg',
    category: 'dog-saboroso',
    categoryLabel: 'Dog Saboroso',
    description:
      'Pão de dog, 1 salsicha, maionese, molho de tomate, batata palha, purê de batata, bacon e ovo',
    price: 18.0,
    originalPrice: null,
    imageKey: 'brazilian_dog',
    imageUrl: dogTradicionalImg,
    customizationGroupKeys: ['addons'],
  },
  {
    id: 'hot-dog-linguica-especial',
    name: 'Hot Dog Linguiça Especial',
    category: 'dog-saboroso',
    categoryLabel: 'Dog Saboroso',
    description:
      'Pão de dog, 1 linguiça toscana, maionese, 2 fatias de queijo, batata palha, purê de batata e molho cheddar',
    price: 19.0,
    originalPrice: null,
    imageKey: 'brazilian_dog',
    imageUrl: dogLinguicaImg,
    customizationGroupKeys: ['addons'],
  },
  {
    id: 'hot-dog-linguica-bacon',
    name: 'Hot Dog Linguiça Bacon',
    category: 'dog-saboroso',
    categoryLabel: 'Dog Saboroso',
    description:
      'Pão de dog, 1 linguiça toscana, bacon, maionese, 1 fatia de queijo, purê de batata e molho cheddar',
    price: 22.0,
    originalPrice: null,
    imageKey: 'brazilian_dog',
    imageUrl: dogLinguicaImg,
    customizationGroupKeys: ['addons'],
  },

  // Hambúrguer Sensacional
  {
    id: 'x-tudo',
    name: 'X-Tudo',
    category: 'hamburguer-sensacional',
    categoryLabel: 'Hambúrguer Sensacional',
    description:
      'Pão de brioche, 2 hambúrgueres, maionese, 1 fatia de queijo cheddar, bacon, ovo, alface e tomate',
    price: 14.5,
    originalPrice: 20.5,
    imageKey: 'hero_smash',
    imageUrl: xTudoImg,
    customizationGroupKeys: ['bun', 'sear', 'addons'],
    featured: true,
    dietaryNote: 'Oferta',
  },
  {
    id: 'hamburguer-simples',
    name: 'Hambúrguer Simples',
    category: 'hamburguer-sensacional',
    categoryLabel: 'Hambúrguer Sensacional',
    description: 'Pão de brioche, 1 hambúrguer, maionese e 1 fatia de queijo cheddar',
    price: 15.5,
    originalPrice: null,
    imageKey: 'classic_ember',
    imageUrl: hamburguerSimplesImg,
    customizationGroupKeys: ['bun', 'sear', 'addons'],
  },
  {
    id: 'x-tudao',
    name: 'X-Tudão',
    category: 'hamburguer-sensacional',
    categoryLabel: 'Hambúrguer Sensacional',
    description:
      'Pão de brioche, 2 hambúrgueres, maionese, 2 fatias de queijo cheddar, bacon, ovo, alface, tomate e molho cheddar',
    price: 16.5,
    originalPrice: 22.5,
    imageKey: 'hero_smash',
    imageUrl: xTudaoImg,
    customizationGroupKeys: ['bun', 'sear', 'addons'],
    dietaryNote: 'Oferta',
  },
  {
    id: 'hamburguer-especial',
    name: 'Hambúrguer Especial',
    category: 'hamburguer-sensacional',
    categoryLabel: 'Hambúrguer Sensacional',
    description:
      'Pão de brioche, 1 hambúrguer, maionese, 2 fatias de queijo cheddar, alface e purê de batata',
    price: 16.5,
    originalPrice: null,
    imageKey: 'classic_ember',
    imageUrl: hamburguerEspecialImg,
    customizationGroupKeys: ['bun', 'sear', 'addons'],
  },
  {
    id: 'x-egg',
    name: 'X-Egg',
    category: 'hamburguer-sensacional',
    categoryLabel: 'Hambúrguer Sensacional',
    description: 'Pão de brioche, 1 hambúrguer, maionese, 1 fatia de queijo cheddar, ovo e alface',
    price: 16.5,
    originalPrice: null,
    imageKey: 'classic_ember',
    imageUrl: xEggImg,
    customizationGroupKeys: ['bun', 'sear', 'addons'],
  },
  {
    id: 'x-salada',
    name: 'X-Salada',
    category: 'hamburguer-sensacional',
    categoryLabel: 'Hambúrguer Sensacional',
    description:
      'Pão de brioche, 1 hambúrguer, maionese, 1 fatia de queijo cheddar, alface e tomate',
    price: 17.0,
    originalPrice: null,
    imageKey: 'classic_ember',
    imageUrl: xSaladaImg,
    customizationGroupKeys: ['bun', 'sear', 'addons'],
  },
  {
    id: 'x-salada-especial',
    name: 'X-Salada Especial',
    category: 'hamburguer-sensacional',
    categoryLabel: 'Hambúrguer Sensacional',
    description:
      'Pão de brioche, 1 hambúrguer, maionese, 1 fatia de queijo cheddar, alface, tomate, batata palha e purê de batata',
    price: 17.5,
    originalPrice: null,
    imageKey: 'classic_ember',
    imageUrl: xSaladaImg,
    customizationGroupKeys: ['bun', 'sear', 'addons'],
  },
  {
    id: 'x-salada-bacon',
    name: 'X-Salada Bacon',
    category: 'hamburguer-sensacional',
    categoryLabel: 'Hambúrguer Sensacional',
    description:
      'Pão de brioche, 1 hambúrguer, maionese, 1 fatia de queijo cheddar, alface, tomate e bacon',
    price: 18.0,
    originalPrice: null,
    imageKey: 'truffle_brisket',
    imageUrl: xSaladaBaconImg,
    customizationGroupKeys: ['bun', 'sear', 'addons'],
  },
  {
    id: 'x-egg-bacon',
    name: 'X-Egg Bacon',
    category: 'hamburguer-sensacional',
    categoryLabel: 'Hambúrguer Sensacional',
    description:
      'Pão de brioche, 1 hambúrguer, maionese, 1 fatia de queijo cheddar, bacon, ovo e alface',
    price: 18.5,
    originalPrice: null,
    imageKey: 'truffle_brisket',
    imageUrl: xEggBaconImg,
    customizationGroupKeys: ['bun', 'sear', 'addons'],
  },
  {
    id: 'x-bacon-duplo',
    name: 'X-Bacon Duplo',
    category: 'hamburguer-sensacional',
    categoryLabel: 'Hambúrguer Sensacional',
    description:
      'Pão de brioche, 2 hambúrgueres, maionese, 2 fatias de queijo cheddar, bacon e molho cheddar',
    price: 19.5,
    originalPrice: null,
    imageKey: 'truffle_brisket',
    imageUrl: xBaconDuploImg,
    customizationGroupKeys: ['bun', 'sear', 'addons'],
  },

  // Porção de Batata
  {
    id: 'batata-grande',
    name: 'Batata Grande',
    category: 'porcao-de-batata',
    categoryLabel: 'Porção de Batata',
    description: 'Batatas palito cobertas com molho cheddar',
    price: 19.0,
    originalPrice: 28.0,
    imageKey: 'cheddar_fries',
    imageUrl: porcaoBatataImg,
    customizationGroupKeys: ['dip', 'addons'],
    dietaryNote: 'Oferta',
  },
  {
    id: 'batata-pequena',
    name: 'Batata Pequena',
    category: 'porcao-de-batata',
    categoryLabel: 'Porção de Batata',
    description: 'Batatas palito cobertas com molho cheddar',
    price: 20.0,
    originalPrice: null,
    imageKey: 'cheddar_fries',
    imageUrl: porcaoBatataImg,
    customizationGroupKeys: ['dip'],
  },
  {
    id: 'batata-media',
    name: 'Batata Média',
    category: 'porcao-de-batata',
    categoryLabel: 'Porção de Batata',
    description: 'Batatas palito cobertas com molho cheddar',
    price: 24.0,
    originalPrice: null,
    imageKey: 'cheddar_fries',
    imageUrl: porcaoBatataImg,
    customizationGroupKeys: ['dip', 'addons'],
  },
  {
    id: 'batata-especial',
    name: 'Batata Especial',
    category: 'porcao-de-batata',
    categoryLabel: 'Porção de Batata',
    description: 'Batatas palito cobertas com molho cheddar e finalizadas com bacon',
    price: 24.0,
    originalPrice: 33.0,
    imageKey: 'cheddar_fries',
    imageUrl: porcaoBatataImg,
    customizationGroupKeys: ['dip', 'addons'],
    dietaryNote: 'Oferta',
  },

  // Bebidas
  {
    id: 'coca-cola-lata-350ml',
    name: 'Coca-Cola (Lata 350ml)',
    category: 'bebidas',
    categoryLabel: 'Bebidas',
    description: 'Lata 350ml',
    price: 8.0,
    originalPrice: null,
    imageKey: 'soda_cans',
    imageUrl: cocaCola350Img,
    customizationGroupKeys: ['ice'],
  },
  {
    id: 'fanta-laranja-lata-350ml',
    name: 'Fanta Laranja',
    category: 'bebidas',
    categoryLabel: 'Bebidas',
    description: 'Lata 350ml',
    price: 8.0,
    originalPrice: null,
    imageKey: 'soda_cans',
    imageUrl: fantaLaranja350Img,
    customizationGroupKeys: ['ice'],
  },
  {
    id: 'fanta-uva-lata-350ml',
    name: 'Fanta Uva',
    category: 'bebidas',
    categoryLabel: 'Bebidas',
    description: 'Lata 350ml',
    price: 8.0,
    originalPrice: null,
    imageKey: 'soda_cans',
    imageUrl: fantaUva350Img,
    customizationGroupKeys: ['ice'],
  },
  {
    id: 'guarana-antarctica-lata-350ml',
    name: 'Guaraná Antarctica (Lata 350ml)',
    category: 'bebidas',
    categoryLabel: 'Bebidas',
    description: 'Lata 350ml',
    price: 8.0,
    originalPrice: null,
    imageKey: 'soda_cans',
    imageUrl: guarana350Img,
    customizationGroupKeys: ['ice'],
  },
  {
    id: 'suco-del-valle-maracuja-290ml',
    name: 'Suco Del Valle Maracujá',
    category: 'bebidas',
    categoryLabel: 'Bebidas',
    description: 'Lata 290ml',
    price: 9.0,
    originalPrice: null,
    imageKey: 'fruit_juice',
    imageUrl: delValleMaracujaImg,
    customizationGroupKeys: ['ice'],
  },
  {
    id: 'suco-del-valle-uva-290ml',
    name: 'Suco Del Valle Uva',
    category: 'bebidas',
    categoryLabel: 'Bebidas',
    description: 'Lata 290ml',
    price: 9.0,
    originalPrice: null,
    imageKey: 'fruit_juice',
    imageUrl: delValleUvaImg,
    customizationGroupKeys: ['ice'],
  },
  {
    id: 'suco-del-valle-pessego-290ml',
    name: 'Suco Del Valle Pêssego',
    category: 'bebidas',
    categoryLabel: 'Bebidas',
    description: 'Lata 290ml',
    price: 9.0,
    originalPrice: null,
    imageKey: 'fruit_juice',
    imageUrl: delVallePessegoImg,
    customizationGroupKeys: ['ice'],
  },
  {
    id: 'convencao-2l',
    name: 'Convenção',
    category: 'bebidas',
    categoryLabel: 'Bebidas',
    description: 'Garrafa 2 Litros',
    price: 12.0,
    originalPrice: null,
    imageKey: 'soda_cans',
    imageUrl: convencao2lImg,
    customizationGroupKeys: ['ice'],
  },
  {
    id: 'coca-cola-600ml',
    name: 'Coca-Cola (Garrafa 600ml)',
    category: 'bebidas',
    categoryLabel: 'Bebidas',
    description: 'Garrafa 600ml',
    price: 13.0,
    originalPrice: null,
    imageKey: 'soda_cans',
    imageUrl: cocaCola600Img,
    customizationGroupKeys: ['ice'],
  },
  {
    id: 'guarana-antarctica-2l',
    name: 'Guaraná Antarctica (Garrafa 2 Litros)',
    category: 'bebidas',
    categoryLabel: 'Bebidas',
    description: 'Garrafa 2 Litros',
    price: 20.0,
    originalPrice: null,
    imageKey: 'soda_cans',
    imageUrl: guarana2lImg,
    customizationGroupKeys: ['ice'],
  },
  {
    id: 'coca-cola-2l',
    name: 'Coca-Cola (Garrafa 2 Litros)',
    category: 'bebidas',
    categoryLabel: 'Bebidas',
    description: 'Garrafa 2 Litros',
    price: 25.0,
    originalPrice: null,
    imageKey: 'soda_cans',
    imageUrl: cocaCola2lImg,
    customizationGroupKeys: ['ice'],
  },
];

export const MENU_ITEMS: MenuItem[] = RAW_ITEMS.map((item, idx) => ({
  id: item.id,
  name: item.name,
  category: item.category,
  categoryLabel: item.categoryLabel,
  description: item.description,
  ingredientsSummary: item.description,
  price: item.price,
  originalPrice: item.originalPrice ?? null,
  prepMinutes: `${STORE_INFO.deliveryTimeMin} min`,
  rating: 4.9,
  reviewCount: 120 + ((idx * 17) % 180),
  dietaryNote: item.dietaryNote,
  featured: Boolean(item.featured),
  isHero: Boolean(item.isHero),
  published: true,
  imageKey: item.imageKey,
  imageUrl: item.imageUrl ?? IMAGE_MAP[item.imageKey],
  customizationGroupKeys: item.customizationGroupKeys,
  customizationGroups: resolveCustomizationGroups(item.customizationGroupKeys),
  sortOrder: idx + 1,
}));

export const INITIAL_ORDERS: PlacedOrder[] = [];
