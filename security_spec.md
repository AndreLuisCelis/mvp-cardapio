# Security Specification — Artisanal Ember Firestore (Zero-PII Architecture)

## 1. Data Invariants
1. **Zero Buyer PII in Firestore**: Buyer personal data (`nome`, `whatsapp`, `endereco`, `bairro`) is stored and read **exclusively in browser `localStorage`**. No PII fields are permitted in `/orders/{orderId}` or `/menu_items/{itemId}` (`hasOnly` rejects them).
2. **Menu Catalog Schema**: Every `/menu_items/{itemId}` document strictly validates field types, string sizes, enum allowlists, bounded `customizationGroupKeys` (`<= 5`), and server timestamps (`request.time`).
3. **Order Ticket Access**: `/orders/{orderId}` blocks `allow list` (`if false`) to prevent scraping. Individual order tracking uses unguessable high-entropy `orderId`s stored locally in the buyer's `localStorage`.
4. **Terminal Stage Lock**: Once an order reaches `stage == 3` ("Pronto"), no further updates are permitted. Updates can only advance `stage` by `+1` and only mutate `['stage', 'updatedAt']`.
5. **Subcollection Master Gate**: `/orders/{orderId}/items/{itemId}` validates parent existence via `exists(/databases/$(database)/documents/orders/$(orderId))` on read and `existsAfter(...)` on batch create.

## 2. Adversarial Payloads Blocked
1. **PII Leak Attempt in Order**: Creating an order with `customerName`, `customerPhone`, or `endereco` -> DENIED (`hasOnly` rejects unknown fields).
2. **Order Collection Scraping**: `getDocs(collection(db, 'orders'))` -> DENIED (`allow list: if false`).
3. **Shadow Field Injection**: Adding `isFree: true` to `/menu_items/{id}` or `/orders/{id}` -> DENIED.
4. **Oversized ID Poisoning**: Document ID > 128 chars or containing invalid symbols -> DENIED (`isValidId`).
5. **Stage Skipping**: Jumping order `stage` from `0` to `3` in one write -> DENIED.
6. **Client Timestamp Forgery**: Setting `createdAt` or `updatedAt` to a client timestamp instead of `request.time` -> DENIED.
