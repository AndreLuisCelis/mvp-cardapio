/**
 * Dirty Dozen Security Rule Verification Matrix (Payload-First TDD).
 * Covers all 12 adversarial vectors documented in security_spec.md.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  actor: 'anonymous' | 'unverified_admin_spoof' | 'editor' | 'delegated_manager' | 'buyer';
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_PAYLOADS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Unauthenticated Menu Mutation',
    collectionPath: 'menu_items/x-tudo',
    operation: 'create',
    actor: 'anonymous',
    payload: { name: 'Free Burger', price: 0.01 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Email Spoofing Without Verification',
    collectionPath: 'store_settings/main',
    operation: 'update',
    actor: 'unverified_admin_spoof',
    payload: { name: 'Hacked Store' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Self-Privilege Escalation by Editor',
    collectionPath: 'users/editor-uid-1',
    operation: 'update',
    actor: 'editor',
    payload: { role: 'admin', canManageUsers: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Unauthorized User Creation by Editor',
    collectionPath: 'users/rogue-uid-2',
    operation: 'create',
    actor: 'editor',
    payload: {
      uid: 'rogue-uid-2',
      email: 'rogue@example.com',
      displayName: 'Rogue User',
      role: 'editor',
      canManageUsers: false,
      active: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'PII Directory Scraping by Non-Manager',
    collectionPath: 'users',
    operation: 'list',
    actor: 'editor',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Bootstrap Admin Sabotage by Delegated Manager',
    collectionPath: 'users/bootstrap-admin-uid',
    operation: 'update',
    actor: 'delegated_manager',
    payload: { active: false },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'XSS javascript: URL Injection in Logo',
    collectionPath: 'store_settings/main',
    operation: 'update',
    actor: 'editor',
    payload: { logoUrl: 'javascript:alert(1)' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Shadow Field Injection on Menu Item',
    collectionPath: 'menu_items/x-salada',
    operation: 'update',
    actor: 'editor',
    payload: { hiddenDiscount: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Oversized ID Poisoning',
    collectionPath: `categories/${'a'.repeat(160)}`,
    operation: 'create',
    actor: 'editor',
    payload: { key: 'invalid', title: 'Invalid', isCombo: false, active: true, sortOrder: 99 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'PII Leak Attempt in Order',
    collectionPath: 'orders/order-test-1',
    operation: 'create',
    actor: 'buyer',
    payload: {
      orderCode: 'TL-9999',
      fulfillment: 'delivery',
      pickupWindow: '30 min',
      subtotal: 40,
      deliveryFee: 3.99,
      tip: 0,
      total: 43.99,
      stage: 0,
      estimatedReady: '20h30',
      customerName: 'João Silva',
      whatsapp: '11999999999',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Order Collection Scraping',
    collectionPath: 'orders',
    operation: 'list',
    actor: 'anonymous',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Client Timestamp Forgery',
    collectionPath: 'categories/doces',
    operation: 'create',
    actor: 'editor',
    payload: {
      key: 'doces',
      title: 'Doces',
      isCombo: false,
      active: true,
      sortOrder: 10,
      createdAt: '1970-01-01T00:00:00Z',
      updatedAt: '1970-01-01T00:00:00Z',
    },
    expected: 'PERMISSION_DENIED',
  },
];
