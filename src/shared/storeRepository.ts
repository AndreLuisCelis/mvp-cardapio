import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { ABOUT_SECTION, NEIGHBORHOOD_FEES, STORE_INFO } from '../config/store';
import { CUSTOMIZATION_GROUP_MAP, IMAGE_MAP, MENU_CATEGORIES, MENU_ITEMS } from '../data/menu';
import type {
  CustomizationGroupKey,
  DeliveryFeeOption,
  ImageKey,
  MenuItem,
  StaffUserRecord,
  StaffUserRole,
  StoreCategoryConfig,
  StoreSettingsRecord,
} from '../types';
import {
  BOOTSTRAP_ADMIN_EMAIL,
  createSecondaryStaffAccount,
  db,
  handleFirestoreError,
  hasFirebaseConfig,
  OperationType,
} from './firebase';

export const DEFAULT_STORE_SETTINGS: StoreSettingsRecord = {
  name: STORE_INFO.name,
  neighborhood: STORE_INFO.neighborhood,
  city: STORE_INFO.city,
  minOrder: STORE_INFO.minOrder,
  deliveryFee: STORE_INFO.deliveryFee,
  deliveryTimeMin: STORE_INFO.deliveryTimeMin,
  whatsappNumber: STORE_INFO.whatsappNumber,
  orderCodePrefix: STORE_INFO.orderCodePrefix,
  pickupEstimatedMinutes: STORE_INFO.pickupEstimatedMinutes,
  deliveryEstimatedMinutes: STORE_INFO.deliveryEstimatedMinutes,
  aboutNavLabel: STORE_INFO.aboutNavLabel,
  heroHeadline: STORE_INFO.heroHeadline,
  searchPlaceholder: STORE_INFO.searchPlaceholder,
  emptyBagDescription: STORE_INFO.emptyBagDescription,
  paymentMethodsLabel: STORE_INFO.paymentMethodsLabel,
  logoUrl: '',
  bannerUrl: '',
  aboutHeadline: ABOUT_SECTION.headline,
  aboutDescription: ABOUT_SECTION.description,
};

export const DEFAULT_CATEGORIES: StoreCategoryConfig[] = MENU_CATEGORIES.map((c, idx) => ({
  id: c.key,
  key: c.key,
  title: c.title,
  isCombo: Boolean(c.isCombo),
  active: true,
  sortOrder: (idx + 1) * 10,
}));

export const DEFAULT_DELIVERY_FEES: DeliveryFeeOption[] = NEIGHBORHOOD_FEES.map((f, idx) => ({
  id: f.id,
  label: f.label,
  fee: f.fee,
  fulfillment: f.fulfillment,
  active: true,
  sortOrder: (idx + 1) * 10,
}));

const DEFAULT_ASSET_BY_ITEM_ID = new Map<string, string>(
  MENU_ITEMS.map((item) => [item.id, item.imageUrl])
);

export function resolveItemImageUrl(id: string, imageKey: ImageKey, rawUrl?: string): string {
  const trimmed = (rawUrl || '').trim();
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('data:image/')
  ) {
    return trimmed;
  }
  return DEFAULT_ASSET_BY_ITEM_ID.get(id) || IMAGE_MAP[imageKey] || trimmed;
}

export function resolveStoreBannerUrl(rawBannerUrl?: string): string {
  const trimmed = (rawBannerUrl || '').trim();
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('data:image/')
  ) {
    return trimmed;
  }
  return STORE_INFO.bannerImg;
}

function hydrateMenuItem(id: string, data: Record<string, unknown>): MenuItem {
  const rawImageKey = String(data.imageKey || 'classic_ember') as ImageKey;
  const imageKey: ImageKey = rawImageKey in IMAGE_MAP ? rawImageKey : 'classic_ember';
  const groupKeys = Array.isArray(data.customizationGroupKeys)
    ? (data.customizationGroupKeys.filter((k) => typeof k === 'string' && k in CUSTOMIZATION_GROUP_MAP) as CustomizationGroupKey[])
    : [];

  return {
    id,
    name: String(data.name || ''),
    category: String(data.category || 'combos-casal'),
    categoryLabel: String(data.categoryLabel || 'Cardápio'),
    description: String(data.description || ''),
    ingredientsSummary: String(data.ingredientsSummary || ''),
    price: Number(data.price || 0),
    originalPrice:
      typeof data.originalPrice === 'number' && data.originalPrice > 0
        ? data.originalPrice
        : null,
    prepMinutes: String(data.prepMinutes || '20-30 min'),
    rating: Number(data.rating ?? 4.9),
    reviewCount: Number(data.reviewCount ?? 0),
    dietaryNote: typeof data.dietaryNote === 'string' ? data.dietaryNote : undefined,
    featured: Boolean(data.featured),
    isHero: Boolean(data.isHero),
    published: data.published !== false,
    imageKey,
    imageUrl: resolveItemImageUrl(id, imageKey, String(data.imageUrl || '')),
    customizationGroupKeys: groupKeys,
    customizationGroups: groupKeys.map((k) => CUSTOMIZATION_GROUP_MAP[k]),
    sortOrder: Number(data.sortOrder ?? 100),
  };
}

export interface PublicCatalogData {
  settings: StoreSettingsRecord;
  categories: StoreCategoryConfig[];
  deliveryFees: DeliveryFeeOption[];
  menuItems: MenuItem[];
  isFromDatabase: boolean;
}

export async function fetchPublicCatalog(): Promise<PublicCatalogData> {
  if (!hasFirebaseConfig || !db) {
    return {
      settings: DEFAULT_STORE_SETTINGS,
      categories: DEFAULT_CATEGORIES,
      deliveryFees: DEFAULT_DELIVERY_FEES,
      menuItems: MENU_ITEMS,
      isFromDatabase: false,
    };
  }

  let settings = DEFAULT_STORE_SETTINGS;
  let categories = DEFAULT_CATEGORIES;
  let deliveryFees = DEFAULT_DELIVERY_FEES;
  let menuItems = MENU_ITEMS;
  let hasAnyDbData = false;

  try {
    const settingsSnap = await getDoc(doc(db, 'store_settings', 'main'));
    if (settingsSnap.exists()) {
      const d = settingsSnap.data();
      settings = {
        ...DEFAULT_STORE_SETTINGS,
        name: String(d.name || DEFAULT_STORE_SETTINGS.name),
        neighborhood: String(d.neighborhood || DEFAULT_STORE_SETTINGS.neighborhood),
        city: String(d.city || DEFAULT_STORE_SETTINGS.city),
        minOrder: Number(d.minOrder ?? DEFAULT_STORE_SETTINGS.minOrder),
        deliveryFee: Number(d.deliveryFee ?? DEFAULT_STORE_SETTINGS.deliveryFee),
        deliveryTimeMin: String(d.deliveryTimeMin || DEFAULT_STORE_SETTINGS.deliveryTimeMin),
        whatsappNumber: String(d.whatsappNumber || DEFAULT_STORE_SETTINGS.whatsappNumber),
        orderCodePrefix: String(d.orderCodePrefix || DEFAULT_STORE_SETTINGS.orderCodePrefix),
        pickupEstimatedMinutes: Number(
          d.pickupEstimatedMinutes ?? DEFAULT_STORE_SETTINGS.pickupEstimatedMinutes
        ),
        deliveryEstimatedMinutes: Number(
          d.deliveryEstimatedMinutes ?? DEFAULT_STORE_SETTINGS.deliveryEstimatedMinutes
        ),
        aboutNavLabel: String(d.aboutNavLabel || DEFAULT_STORE_SETTINGS.aboutNavLabel),
        heroHeadline: String(d.heroHeadline || DEFAULT_STORE_SETTINGS.heroHeadline),
        searchPlaceholder: String(d.searchPlaceholder || DEFAULT_STORE_SETTINGS.searchPlaceholder),
        emptyBagDescription: String(
          d.emptyBagDescription || DEFAULT_STORE_SETTINGS.emptyBagDescription
        ),
        paymentMethodsLabel: String(
          d.paymentMethodsLabel || DEFAULT_STORE_SETTINGS.paymentMethodsLabel
        ),
        logoUrl: String(d.logoUrl || ''),
        bannerUrl: String(d.bannerUrl || ''),
        aboutHeadline: String(d.aboutHeadline || DEFAULT_STORE_SETTINGS.aboutHeadline),
        aboutDescription: String(d.aboutDescription || DEFAULT_STORE_SETTINGS.aboutDescription),
      };
      hasAnyDbData = true;
    }
  } catch (err) {
    console.warn('Falha ao carregar store_settings públicos, usando padrão local:', err);
  }

  try {
    const catsSnap = await getDocs(
      query(collection(db, 'categories'), where('active', '==', true), orderBy('sortOrder', 'asc'))
    );
    if (!catsSnap.empty) {
      categories = catsSnap.docs.map((snap) => {
        const d = snap.data();
        return {
          id: snap.id,
          key: String(d.key || snap.id),
          title: String(d.title || snap.id),
          isCombo: Boolean(d.isCombo),
          active: Boolean(d.active),
          sortOrder: Number(d.sortOrder ?? 0),
        };
      });
      hasAnyDbData = true;
    }
  } catch (err) {
    console.warn('Falha ao carregar categories públicas, usando padrão local:', err);
  }

  try {
    const feesSnap = await getDocs(
      query(
        collection(db, 'delivery_fees'),
        where('active', '==', true),
        orderBy('sortOrder', 'asc')
      )
    );
    if (!feesSnap.empty) {
      deliveryFees = feesSnap.docs.map((snap) => {
        const d = snap.data();
        return {
          id: snap.id,
          label: String(d.label || ''),
          fee: Number(d.fee ?? 0),
          fulfillment: d.fulfillment === 'pickup' ? 'pickup' : 'delivery',
          active: Boolean(d.active),
          sortOrder: Number(d.sortOrder ?? 0),
        };
      });
      hasAnyDbData = true;
    }
  } catch (err) {
    console.warn('Falha ao carregar delivery_fees públicos, usando padrão local:', err);
  }

  try {
    const itemsSnap = await getDocs(
      query(
        collection(db, 'menu_items'),
        where('published', '==', true),
        orderBy('sortOrder', 'asc')
      )
    );
    if (!itemsSnap.empty) {
      menuItems = itemsSnap.docs.map((snap) => hydrateMenuItem(snap.id, snap.data()));
      hasAnyDbData = true;
    }
  } catch (err) {
    console.warn('Falha ao carregar menu_items públicos, usando padrão local:', err);
  }

  return {
    settings,
    categories,
    deliveryFees,
    menuItems,
    isFromDatabase: hasAnyDbData,
  };
}

export interface AdminWorkspaceData {
  settings: StoreSettingsRecord;
  categories: StoreCategoryConfig[];
  deliveryFees: DeliveryFeeOption[];
  menuItems: MenuItem[];
  hasDatabaseSeed: boolean;
}

export async function fetchAdminWorkspaceData(): Promise<AdminWorkspaceData> {
  if (!db) throw new Error('Firestore não inicializado.');

  let settings = DEFAULT_STORE_SETTINGS;
  let hasSettings = false;
  try {
    const settingsSnap = await getDoc(doc(db, 'store_settings', 'main'));
    if (settingsSnap.exists()) {
      const d = settingsSnap.data();
      settings = {
        ...DEFAULT_STORE_SETTINGS,
        name: String(d.name || DEFAULT_STORE_SETTINGS.name),
        neighborhood: String(d.neighborhood || DEFAULT_STORE_SETTINGS.neighborhood),
        city: String(d.city || DEFAULT_STORE_SETTINGS.city),
        minOrder: Number(d.minOrder ?? DEFAULT_STORE_SETTINGS.minOrder),
        deliveryFee: Number(d.deliveryFee ?? DEFAULT_STORE_SETTINGS.deliveryFee),
        deliveryTimeMin: String(d.deliveryTimeMin || DEFAULT_STORE_SETTINGS.deliveryTimeMin),
        whatsappNumber: String(d.whatsappNumber || DEFAULT_STORE_SETTINGS.whatsappNumber),
        orderCodePrefix: String(d.orderCodePrefix || DEFAULT_STORE_SETTINGS.orderCodePrefix),
        pickupEstimatedMinutes: Number(
          d.pickupEstimatedMinutes ?? DEFAULT_STORE_SETTINGS.pickupEstimatedMinutes
        ),
        deliveryEstimatedMinutes: Number(
          d.deliveryEstimatedMinutes ?? DEFAULT_STORE_SETTINGS.deliveryEstimatedMinutes
        ),
        aboutNavLabel: String(d.aboutNavLabel || DEFAULT_STORE_SETTINGS.aboutNavLabel),
        heroHeadline: String(d.heroHeadline || DEFAULT_STORE_SETTINGS.heroHeadline),
        searchPlaceholder: String(d.searchPlaceholder || DEFAULT_STORE_SETTINGS.searchPlaceholder),
        emptyBagDescription: String(
          d.emptyBagDescription || DEFAULT_STORE_SETTINGS.emptyBagDescription
        ),
        paymentMethodsLabel: String(
          d.paymentMethodsLabel || DEFAULT_STORE_SETTINGS.paymentMethodsLabel
        ),
        logoUrl: String(d.logoUrl || ''),
        bannerUrl: String(d.bannerUrl || ''),
        aboutHeadline: String(d.aboutHeadline || DEFAULT_STORE_SETTINGS.aboutHeadline),
        aboutDescription: String(d.aboutDescription || DEFAULT_STORE_SETTINGS.aboutDescription),
      };
      hasSettings = true;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'store_settings/main');
  }

  let categories: StoreCategoryConfig[] = [];
  try {
    const catsSnap = await getDocs(query(collection(db, 'categories'), orderBy('sortOrder', 'asc')));
    categories = catsSnap.docs.map((snap) => {
      const d = snap.data();
      return {
        id: snap.id,
        key: String(d.key || snap.id),
        title: String(d.title || snap.id),
        isCombo: Boolean(d.isCombo),
        active: Boolean(d.active),
        sortOrder: Number(d.sortOrder ?? 0),
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'categories');
  }

  let deliveryFees: DeliveryFeeOption[] = [];
  try {
    const feesSnap = await getDocs(
      query(collection(db, 'delivery_fees'), orderBy('sortOrder', 'asc'))
    );
    deliveryFees = feesSnap.docs.map((snap) => {
      const d = snap.data();
      return {
        id: snap.id,
        label: String(d.label || ''),
        fee: Number(d.fee ?? 0),
        fulfillment: d.fulfillment === 'pickup' ? 'pickup' : 'delivery',
        active: Boolean(d.active),
        sortOrder: Number(d.sortOrder ?? 0),
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'delivery_fees');
  }

  let menuItems: MenuItem[] = [];
  try {
    const itemsSnap = await getDocs(
      query(collection(db, 'menu_items'), orderBy('sortOrder', 'asc'))
    );
    menuItems = itemsSnap.docs.map((snap) => hydrateMenuItem(snap.id, snap.data()));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'menu_items');
  }

  return {
    settings,
    categories,
    deliveryFees,
    menuItems,
    hasDatabaseSeed: hasSettings || categories.length > 0 || menuItems.length > 0,
  };
}

function sanitizeMenuItemPayload(item: MenuItem, isNew: boolean) {
  const rawImageUrl = (item.imageUrl || '').trim();
  const safeImageUrl =
    rawImageUrl.startsWith('https://') ||
    rawImageUrl.startsWith('http://') ||
    rawImageUrl.startsWith('data:image/') ||
    rawImageUrl.startsWith('/')
      ? rawImageUrl.slice(0, 350000)
      : '';

  const payload: Record<string, unknown> = {
    name: item.name.trim().slice(0, 100),
    category: item.category.trim().slice(0, 64),
    categoryLabel: item.categoryLabel.trim().slice(0, 60),
    description: item.description.trim().slice(0, 500),
    ingredientsSummary: (item.ingredientsSummary || '').trim().slice(0, 200),
    price: Number(item.price),
    originalPrice:
      typeof item.originalPrice === 'number' && item.originalPrice > 0
        ? Number(item.originalPrice)
        : 0,
    prepMinutes: (item.prepMinutes || '20-30 min').trim().slice(0, 30),
    rating: Math.min(5, Math.max(0, Number(item.rating ?? 4.9))),
    reviewCount: Math.max(0, Number(item.reviewCount ?? 0)),
    dietaryNote: (item.dietaryNote || '').trim().slice(0, 60),
    featured: Boolean(item.featured),
    isHero: Boolean(item.isHero),
    published: Boolean(item.published),
    imageKey: (item.imageKey || 'classic_ember').slice(0, 60),
    imageUrl: safeImageUrl,
    customizationGroupKeys: (item.customizationGroupKeys || []).slice(0, 5),
    sortOrder: Math.max(0, Math.min(10000, Number(item.sortOrder ?? 100))),
    updatedAt: serverTimestamp(),
  };

  if (isNew) {
    payload.createdAt = serverTimestamp();
  }
  return payload;
}

export async function seedInitialCatalogToFirestore(): Promise<void> {
  if (!db) throw new Error('Firestore não inicializado.');
  const firestore = db;

  const batch = writeBatch(firestore);

  batch.set(doc(firestore, 'store_settings', 'main'), {
    name: DEFAULT_STORE_SETTINGS.name.slice(0, 80),
    neighborhood: DEFAULT_STORE_SETTINGS.neighborhood.slice(0, 80),
    city: DEFAULT_STORE_SETTINGS.city.slice(0, 80),
    minOrder: Number(DEFAULT_STORE_SETTINGS.minOrder),
    deliveryFee: Number(DEFAULT_STORE_SETTINGS.deliveryFee),
    deliveryTimeMin: DEFAULT_STORE_SETTINGS.deliveryTimeMin.slice(0, 30),
    whatsappNumber: DEFAULT_STORE_SETTINGS.whatsappNumber.replace(/\D/g, '').slice(0, 25),
    orderCodePrefix: DEFAULT_STORE_SETTINGS.orderCodePrefix.slice(0, 6),
    pickupEstimatedMinutes: Number(DEFAULT_STORE_SETTINGS.pickupEstimatedMinutes),
    deliveryEstimatedMinutes: Number(DEFAULT_STORE_SETTINGS.deliveryEstimatedMinutes),
    aboutNavLabel: DEFAULT_STORE_SETTINGS.aboutNavLabel.slice(0, 40),
    heroHeadline: DEFAULT_STORE_SETTINGS.heroHeadline.slice(0, 160),
    searchPlaceholder: DEFAULT_STORE_SETTINGS.searchPlaceholder.slice(0, 140),
    emptyBagDescription: DEFAULT_STORE_SETTINGS.emptyBagDescription.slice(0, 300),
    paymentMethodsLabel: DEFAULT_STORE_SETTINGS.paymentMethodsLabel.slice(0, 200),
    logoUrl: '',
    bannerUrl: '',
    aboutHeadline: DEFAULT_STORE_SETTINGS.aboutHeadline.slice(0, 180),
    aboutDescription: DEFAULT_STORE_SETTINGS.aboutDescription.slice(0, 600),
    updatedAt: serverTimestamp(),
  });

  DEFAULT_CATEGORIES.forEach((cat) => {
    batch.set(doc(firestore, 'categories', cat.id), {
      key: cat.key,
      title: cat.title,
      isCombo: cat.isCombo,
      active: cat.active,
      sortOrder: cat.sortOrder,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  DEFAULT_DELIVERY_FEES.forEach((fee) => {
    batch.set(doc(firestore, 'delivery_fees', fee.id), {
      label: fee.label,
      fee: fee.fee,
      fulfillment: fee.fulfillment,
      active: fee.active,
      sortOrder: fee.sortOrder,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  MENU_ITEMS.forEach((item) => {
    batch.set(doc(firestore, 'menu_items', item.id), sanitizeMenuItemPayload(item, true));
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seed_initial_catalog');
  }
}

export async function saveStoreSettings(settings: StoreSettingsRecord): Promise<void> {
  if (!db) throw new Error('Firestore não inicializado.');
  const path = 'store_settings/main';
  const payload = {
    name: settings.name.trim().slice(0, 80),
    neighborhood: settings.neighborhood.trim().slice(0, 80),
    city: settings.city.trim().slice(0, 80),
    minOrder: Math.max(0, Math.min(10000, Number(settings.minOrder))),
    deliveryFee: Math.max(0, Math.min(500, Number(settings.deliveryFee))),
    deliveryTimeMin: settings.deliveryTimeMin.trim().slice(0, 30),
    whatsappNumber: settings.whatsappNumber.replace(/\D/g, '').slice(0, 25),
    orderCodePrefix: settings.orderCodePrefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'TL',
    pickupEstimatedMinutes: Math.max(1, Math.min(240, Number(settings.pickupEstimatedMinutes))),
    deliveryEstimatedMinutes: Math.max(1, Math.min(240, Number(settings.deliveryEstimatedMinutes))),
    aboutNavLabel: settings.aboutNavLabel.trim().slice(0, 40),
    heroHeadline: settings.heroHeadline.trim().slice(0, 160),
    searchPlaceholder: settings.searchPlaceholder.trim().slice(0, 140),
    emptyBagDescription: settings.emptyBagDescription.trim().slice(0, 300),
    paymentMethodsLabel: settings.paymentMethodsLabel.trim().slice(0, 200),
    logoUrl: settings.logoUrl.trim().slice(0, 350000),
    bannerUrl: settings.bannerUrl.trim().slice(0, 350000),
    aboutHeadline: settings.aboutHeadline.trim().slice(0, 180),
    aboutDescription: settings.aboutDescription.trim().slice(0, 600),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'store_settings', 'main'), payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function upsertCategory(
  category: StoreCategoryConfig,
  isNew: boolean
): Promise<void> {
  if (!db) throw new Error('Firestore não inicializado.');
  const path = `categories/${category.id}`;
  try {
    if (isNew) {
      await setDoc(doc(db, 'categories', category.id), {
        key: category.key.trim().slice(0, 64),
        title: category.title.trim().slice(0, 60),
        isCombo: Boolean(category.isCombo),
        active: Boolean(category.active),
        sortOrder: Math.max(0, Math.min(1000, Number(category.sortOrder))),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'categories', category.id), {
        key: category.key.trim().slice(0, 64),
        title: category.title.trim().slice(0, 60),
        isCombo: Boolean(category.isCombo),
        active: Boolean(category.active),
        sortOrder: Math.max(0, Math.min(1000, Number(category.sortOrder))),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function deleteCategoryRecord(categoryId: string): Promise<void> {
  if (!db) throw new Error('Firestore não inicializado.');
  const path = `categories/${categoryId}`;
  try {
    await deleteDoc(doc(db, 'categories', categoryId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function upsertDeliveryFee(
  feeOption: DeliveryFeeOption,
  isNew: boolean
): Promise<void> {
  if (!db) throw new Error('Firestore não inicializado.');
  const path = `delivery_fees/${feeOption.id}`;
  try {
    if (isNew) {
      await setDoc(doc(db, 'delivery_fees', feeOption.id), {
        label: feeOption.label.trim().slice(0, 100),
        fee: Math.max(0, Math.min(500, Number(feeOption.fee))),
        fulfillment: feeOption.fulfillment,
        active: Boolean(feeOption.active),
        sortOrder: Math.max(0, Math.min(1000, Number(feeOption.sortOrder))),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'delivery_fees', feeOption.id), {
        label: feeOption.label.trim().slice(0, 100),
        fee: Math.max(0, Math.min(500, Number(feeOption.fee))),
        fulfillment: feeOption.fulfillment,
        active: Boolean(feeOption.active),
        sortOrder: Math.max(0, Math.min(1000, Number(feeOption.sortOrder))),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function deleteDeliveryFeeRecord(feeId: string): Promise<void> {
  if (!db) throw new Error('Firestore não inicializado.');
  const path = `delivery_fees/${feeId}`;
  try {
    await deleteDoc(doc(db, 'delivery_fees', feeId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function upsertMenuItem(item: MenuItem, isNew: boolean): Promise<void> {
  if (!db) throw new Error('Firestore não inicializado.');
  const path = `menu_items/${item.id}`;
  const payload = sanitizeMenuItemPayload(item, isNew);
  try {
    if (isNew) {
      await setDoc(doc(db, 'menu_items', item.id), payload);
    } else {
      await updateDoc(doc(db, 'menu_items', item.id), payload);
    }
  } catch (err) {
    handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function deleteMenuItemRecord(itemId: string): Promise<void> {
  if (!db) throw new Error('Firestore não inicializado.');
  const path = `menu_items/${itemId}`;
  try {
    await deleteDoc(doc(db, 'menu_items', itemId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function ensureBootstrapAdminRecord(user: User): Promise<StaffUserRecord | null> {
  if (!db) return null;
  const path = `users/${user.uid}`;
  try {
    const existingSnap = await getDoc(doc(db, 'users', user.uid));
    if (existingSnap.exists()) {
      const d = existingSnap.data();
      return {
        uid: String(d.uid || user.uid),
        email: String(d.email || user.email || ''),
        displayName: String(d.displayName || user.displayName || 'Usuário'),
        role: d.role === 'admin' ? 'admin' : 'editor',
        canManageUsers: Boolean(d.canManageUsers),
        active: Boolean(d.active),
        createdBy: String(d.createdBy || user.uid),
      };
    }

    if (user.email === BOOTSTRAP_ADMIN_EMAIL && user.emailVerified) {
      const record: StaffUserRecord = {
        uid: user.uid,
        email: user.email,
        displayName: (user.displayName || 'Administrador Principal').slice(0, 80),
        role: 'admin',
        canManageUsers: true,
        active: true,
        createdBy: user.uid,
      };
      await setDoc(doc(db, 'users', user.uid), {
        ...record,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return record;
    }

    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function fetchAllStaffUsers(): Promise<StaffUserRecord[]> {
  if (!db) throw new Error('Firestore não inicializado.');
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs
      .map((docSnap) => {
        const d = docSnap.data();
        return {
          uid: String(d.uid || docSnap.id),
          email: String(d.email || ''),
          displayName: String(d.displayName || ''),
          role: (d.role === 'admin' ? 'admin' : 'editor') as StaffUserRole,
          canManageUsers: Boolean(d.canManageUsers),
          active: Boolean(d.active),
          createdBy: String(d.createdBy || ''),
        };
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'pt-BR'));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'users');
  }
}

export async function createStaffUserWithPassword(input: {
  email: string;
  password: string;
  displayName: string;
  role: StaffUserRole;
  canManageUsers: boolean;
  createdByUid: string;
}): Promise<StaffUserRecord> {
  if (!db) throw new Error('Firestore não inicializado.');

  const { uid, email } = await createSecondaryStaffAccount(input.email.trim(), input.password);
  const record: StaffUserRecord = {
    uid,
    email,
    displayName: input.displayName.trim().slice(0, 80),
    role: input.role,
    canManageUsers: Boolean(input.canManageUsers),
    active: true,
    createdBy: input.createdByUid,
  };

  try {
    await setDoc(doc(db, 'users', uid), {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return record;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
  }
}

export async function updateStaffUserPermissions(
  uid: string,
  updates: {
    displayName: string;
    role: StaffUserRole;
    canManageUsers: boolean;
    active: boolean;
  }
): Promise<void> {
  if (!db) throw new Error('Firestore não inicializado.');
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: updates.displayName.trim().slice(0, 80),
      role: updates.role,
      canManageUsers: Boolean(updates.canManageUsers),
      active: Boolean(updates.active),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteStaffUserRecord(uid: string): Promise<void> {
  if (!db) throw new Error('Firestore não inicializado.');
  const path = `users/${uid}`;
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
