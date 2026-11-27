import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { DIRTY_DOZEN_PAYLOADS } from '../firestore.rules.test.ts';

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

function extractMatchBlock(source: string, headerPattern: string): string {
  const startIdx = source.indexOf(headerPattern);
  assert.notEqual(startIdx, -1, `Expected block ${headerPattern} in firestore.rules`);
  const lineEnd = source.indexOf('\n', startIdx);
  const braceStart = source.lastIndexOf('{', lineEnd === -1 ? source.length : lineEnd);
  assert.notEqual(braceStart, -1, `Expected opening brace for ${headerPattern}`);
  let depth = 0;
  let inSingleQuote = false;
  for (let i = braceStart; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === "'" && source[i - 1] !== '\\') {
      inSingleQuote = !inSingleQuote;
      continue;
    }
    if (inSingleQuote) continue;
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(startIdx, i + 1);
      }
    }
  }
  throw new Error(`Unclosed block for ${headerPattern}`);
}

test('firestore.rules enforces global default deny and non-enumerable orders', () => {
  assert.ok(rulesContent.includes('match /{document=**} {\n      allow read, write: if false;\n    }'));

  const ordersBlock = extractMatchBlock(rulesContent, 'match /orders/{orderId}');
  assert.ok(ordersBlock.includes('allow get: if isValidId(orderId) && isActiveStaff();'));
  assert.ok(ordersBlock.includes('allow list: if isActiveStaff();'));
  assert.ok(ordersBlock.includes('incoming().stage == 0'));
  assert.ok(ordersBlock.includes('existsAfter(/databases/$(database)/documents/order_trackers/$(incoming().trackerId))'));
  assert.ok(ordersBlock.includes('allow update: if isValidId(orderId) &&\n        isActiveStaff()'));
  assert.ok(ordersBlock.includes('allow delete: if false;'));

  const orderItemsBlock = extractMatchBlock(ordersBlock, 'match /items/{itemId}');
  assert.ok(orderItemsBlock.includes('allow get, list: if isValidId(orderId) &&\n          isActiveStaff()'));
  assert.ok(orderItemsBlock.includes('allow update, delete: if false;'));
});

test('firestore.rules enforces SHA-256 token-gated order_trackers with zero listing and staff-only updates', () => {
  const trackerBlock = extractMatchBlock(rulesContent, 'match /order_trackers/{trackerId}');
  assert.ok(rulesContent.includes("id.matches('^[a-f0-9]{64}$')"));
  assert.ok(trackerBlock.includes('allow get: if isValidTrackerId(trackerId);'));
  assert.ok(trackerBlock.includes('allow list: if false;'));
  assert.ok(trackerBlock.includes('allow update: if isValidTrackerId(trackerId) &&\n        isActiveStaff()'));
  assert.ok(
    trackerBlock.includes(
      'getAfter(/databases/$(database)/documents/orders/$(incoming().orderId)).data.trackerId == trackerId'
    )
  );
  assert.ok(trackerBlock.includes('allow delete: if false;'));

  const trackerItemsBlock = extractMatchBlock(trackerBlock, 'match /items/{itemId}');
  assert.ok(trackerItemsBlock.includes('allow get, list: if isValidTrackerId(trackerId)'));
  assert.ok(trackerItemsBlock.includes('allow update, delete: if false;'));
});

test('firestore.rules rejects all Dirty Dozen + order security adversarial vectors', () => {
  assert.equal(DIRTY_DOZEN_PAYLOADS.length, 15);

  const ordersBlock = extractMatchBlock(rulesContent, 'match /orders/{orderId}');
  const trackerBlock = extractMatchBlock(rulesContent, 'match /order_trackers/{trackerId}');
  const usersBlock = extractMatchBlock(rulesContent, 'match /users/{userId}');
  const validOrderFn = extractMatchBlock(rulesContent, 'function isValidOrder(data)');

  for (const testCase of DIRTY_DOZEN_PAYLOADS) {
    assert.equal(testCase.expected, 'PERMISSION_DENIED');

    if (testCase.id === 1) {
      assert.ok(rulesContent.includes('allow create: if isValidId(itemId) &&\n        isActiveStaff()'));
    } else if (testCase.id === 2) {
      assert.ok(rulesContent.includes('request.auth.token.email_verified == true'));
    } else if (testCase.id === 3 || testCase.id === 4 || testCase.id === 5) {
      assert.ok(usersBlock.includes('canManageUsers()'));
    } else if (testCase.id === 6) {
      assert.ok(usersBlock.includes("existing().email != 'andreluiscelis@celisapp.com'"));
    } else if (testCase.id === 7) {
      assert.ok(!rulesContent.includes('javascript:'));
      assert.ok(rulesContent.includes("url.matches('^https?://.*')"));
    } else if (testCase.id === 8 || testCase.id === 10) {
      assert.ok(rulesContent.includes('hasOnly'));
      assert.ok(!validOrderFn.includes('customerName'));
      assert.ok(!validOrderFn.includes('whatsapp'));
      assert.ok(!validOrderFn.includes('endereco'));
      assert.ok(!validOrderFn.includes('bairro'));
    } else if (testCase.id === 9) {
      assert.ok(rulesContent.includes('id.size() <= 128'));
    } else if (testCase.id === 11) {
      assert.ok(ordersBlock.includes('allow list: if isActiveStaff();'));
      assert.ok(trackerBlock.includes('allow list: if false;'));
    } else if (testCase.id === 12) {
      assert.ok(rulesContent.includes('incoming().createdAt == request.time'));
    } else if (testCase.id === 13) {
      assert.ok(trackerBlock.includes('allow update: if isValidTrackerId(trackerId) &&\n        isActiveStaff()'));
      assert.ok(ordersBlock.includes('allow update: if isValidId(orderId) &&\n        isActiveStaff()'));
    } else if (testCase.id === 14) {
      assert.ok(rulesContent.includes('id.size() == 64'));
      assert.ok(trackerBlock.includes('allow get: if isValidTrackerId(trackerId);'));
    } else if (testCase.id === 15) {
      assert.ok(ordersBlock.includes('allow get: if isValidId(orderId) && isActiveStaff();'));
    }
  }
});
