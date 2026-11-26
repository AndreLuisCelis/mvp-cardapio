# Security Specification — Cardápio Digital + Painel Administrativo (RBAC & Zero-PII)

## 1. Data Invariants
1. **Zero Buyer PII in Firestore**: Buyer personal data (`nome`, `whatsapp`, `endereco`, `bairro`) stays exclusively on the client (`localStorage` / WhatsApp checkout). `/orders/{orderId}` strictly rejects unknown fields via `hasOnly`.
2. **Bootstrapped Super Admin & Delegated RBAC**:
   - `andreluiscelis@celisapp.com` (with `request.auth.token.email_verified == true`) is the immutable bootstrap Super Admin (`role: 'admin'`, `canManageUsers: true`).
   - Other staff users in `/users/{userId}` can read/write catalog collections (`/store_settings`, `/categories`, `/delivery_fees`, `/menu_items`) ONLY when `active == true` and `email_verified == true`.
   - Regular `editor` users (`canManageUsers == false`) CANNOT list, read other users, create, modify, or delete `/users/{userId}` documents, and CANNOT escalate their own `role` or `canManageUsers` flag.
   - Only `isBootstrapAdmin()` can grant `canManageUsers == true` or `role == 'admin'`, and no user can modify or delete the bootstrap admin record.
3. **Strict URL & Media Validation**: All `logoUrl`, `bannerUrl`, and `imageUrl` fields only allow `https://`, `http://`, local `/assets/...` paths, or bounded `data:image/(png|jpeg|jpg|webp);base64,...` strings (`<= 350000` chars) — blocking `javascript:` or arbitrary HTML/SVG payloads.
4. **Menu, Category & Fee Integrity**: All catalog writes require `isActiveStaff()`, strict `hasAll`/`hasOnly` field allowlists, bounded numeric/string ranges, bounded `customizationGroupKeys` (`<= 5`), and server timestamps (`request.time`).
5. **Order Ticket Access & Terminal Stage Lock**: `/orders/{orderId}` blocks `allow list` (`if false`). Stage updates only increment by `+1` and lock permanently once `stage == 3`, unless overridden by `isActiveStaff()`.
6. **Subcollection Master Gate**: `/orders/{orderId}/items/{itemId}` checks parent order existence via `exists(...)` on read and `existsAfter(...)` on create.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Menu Mutation**: Anonymous client writes `/menu_items/x-tudo` (`{ name: "Free", price: 0.01 }`) -> DENIED (`isActiveStaff()` fails).
2. **Email Spoofing Without Verification**: Auth token claims `email: "andreluiscelis@celisapp.com"` with `email_verified: false` -> DENIED (`email_verified == true` required).
3. **Self-Privilege Escalation by Editor**: Authenticated `editor` updates `/users/{ownUid}` with `{ role: "admin", canManageUsers: true }` -> DENIED (`canManageUsers()` & `isBootstrapAdmin()` guard fails).
4. **Unauthorized User Creation by Editor**: Authenticated `editor` (`canManageUsers: false`) attempts `create` on `/users/new-uid` -> DENIED (`canManageUsers()` fails).
5. **PII Directory Scraping by Non-Manager**: Authenticated `editor` runs `getDocs(collection(db, 'users'))` -> DENIED (`allow list` requires `isBootstrapAdmin()` or manager).
6. **Bootstrap Admin Sabotage**: Delegated manager attempts to update or delete `/users/{bootstrapAdminUid}` setting `active: false` -> DENIED (`existing().email != 'andreluiscelis@celisapp.com'`).
7. **XSS / `javascript:` URL Injection in Logo**: Editor writes `logoUrl: "javascript:alert(1)"` into `/store_settings/main` -> DENIED (`isSafeMediaUrl()` regex rejects it).
8. **Shadow Field Injection on Menu Item**: Staff writes `/menu_items/item-1` with extra ghost field `{ hiddenDiscount: true }` -> DENIED (`hasOnly` / `affectedKeys().hasOnly()` rejects unknown key).
9. **Oversized ID Poisoning**: Client writes `/categories/${'a'.repeat(200)}` -> DENIED (`isValidId` rejects ID > 128 chars).
10. **PII Leak Attempt in Order**: Buyer creates `/orders/order-1` containing `{ customerName: "João", whatsapp: "11999999999" }` -> DENIED (`isValidOrder` `hasOnly` rejects PII keys).
11. **Order Collection Scraping**: Anonymous or authenticated user runs `getDocs(collection(db, 'orders'))` -> DENIED (`allow list: if false`).
12. **Client Timestamp Forgery**: Staff creates `/categories/bebidas-extra` with `createdAt: new Date(0)` instead of `serverTimestamp()` -> DENIED (`incoming().createdAt == request.time`).
