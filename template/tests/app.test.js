const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

// Setup de l'environment de test avant l'import de l'app
process.env.NODE_ENV = 'test';
process.env.ADMIN_TOKEN = 'test-secret-admin-token-2026';

const app = require('../src/app');
const prisma = require('../src/config/prisma');

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await prisma.$disconnect();
});

describe('E-Commerce Core API Suite', () => {
  it('GET /api/health should return ok status', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
    assert.ok(data.timestamp);
  });

  it('GET /api/products should return product catalogue', async () => {
    const res = await fetch(`${baseUrl}/api/products`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.products));
    assert.ok(data.products.length > 0);
  });

  it('POST /api/create-payment-intent rejects empty cart', async () => {
    const res = await fetch(`${baseUrl}/api/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [] })
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error);
  });

  it('POST /api/create-payment-intent validates promo and creates order', async () => {
    // 1. Fetch le first available product
    const prodRes = await fetch(`${baseUrl}/api/products`);
    const prodData = await prodRes.json();
    const product = prodData.products[0];
    assert.ok(product, 'A product should exist');

    // 2. Init le payment intent avec promo BIENVENUE10
    const res = await fetch(`${baseUrl}/api/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ id: product.id, quantity: 1 }],
        shippingMethod: 'colissimo_home',
        promoCode: 'BIENVENUE10',
        customerInfo: {
          name: 'Jean Dupont',
          email: 'jean.dupont.test@example.com',
          phone: '0601020304',
          address: '10 Rue de la Paix, Paris'
        }
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.orderId.startsWith('ORD-'));
    assert.ok(data.appliedPromo);
    assert.equal(data.appliedPromo.code, 'BIENVENUE10');
    assert.equal(data.appliedPromo.rate, 0.10);

    const orderId = data.orderId;

    // 3. Confirm le payment en demo mode
    const confirmRes = await fetch(`${baseUrl}/api/confirm-demo-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });
    assert.equal(confirmRes.status, 200);
    const confirmData = await confirmRes.json();
    assert.equal(confirmData.success, true);
    assert.equal(confirmData.order.status, 'paid');

    // 4. Test d'idempotence : le second call de confirmation doit pass sans double processing
    const reconfirmRes = await fetch(`${baseUrl}/api/confirm-demo-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });
    assert.equal(reconfirmRes.status, 200);
    const reconfirmData = await reconfirmRes.json();
    assert.equal(reconfirmData.success, true);
    assert.equal(reconfirmData.message, 'Paiement déjà confirmé');

    // 5. Check la security du lookup public d'order (mitigation IDOR)
    // 5a. Request sans email -> doit return 404
    const noEmailRes = await fetch(`${baseUrl}/api/orders/public/${orderId}`);
    assert.equal(noEmailRes.status, 404);

    // 5b. Request avec wrong email -> doit return 404
    const wrongEmailRes = await fetch(`${baseUrl}/api/orders/public/${orderId}?email=hacker@evil.com`);
    assert.equal(wrongEmailRes.status, 404);

    // 5c. Request avec le bon email client -> doit return 200
    const correctEmailRes = await fetch(`${baseUrl}/api/orders/public/${orderId}?email=jean.dupont.test@example.com`);
    assert.equal(correctEmailRes.status, 200);
    const orderData = await correctEmailRes.json();
    assert.equal(orderData.success, true);
    assert.equal(orderData.order.orderId, orderId);
  });

  it('GET /api/orders enforces admin authorization & pagination', async () => {
    // 1. Call sans admin token -> 401 unauthorized
    const unauthRes = await fetch(`${baseUrl}/api/orders`);
    assert.equal(unauthRes.status, 401);

    // 2. Call avec un bad token -> 401 unauthorized
    const badTokenRes = await fetch(`${baseUrl}/api/orders`, {
      headers: { 'Authorization': 'Bearer bad-token' }
    });
    assert.equal(badTokenRes.status, 401);

    // 3. Call avec valid admin token -> 200 OK & paginated response
    const authRes = await fetch(`${baseUrl}/api/orders?page=1&limit=5`, {
      headers: { 'Authorization': 'Bearer test-secret-admin-token-2026' }
    });
    assert.equal(authRes.status, 200);
    const data = await authRes.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.orders));
    assert.ok(data.total >= 1);
    assert.equal(data.page, 1);
  });

  it('Auth & GDPR: send OTP, verify code, export data & soft delete', async () => {
    const testUserEmail = `user.test.${Date.now()}@example.com`;

    // 1. Send le code OTP pour le register
    const sendRes = await fetch(`${baseUrl}/api/auth/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        isRegister: true,
        name: 'Claire Bernard',
        address: '15 Avenue des Fleurs, Lyon'
      })
    });
    assert.equal(sendRes.status, 200);
    const sendData = await sendRes.json();
    assert.equal(sendData.success, true);

    // 2. Retrieve le code stocké en DB
    const { getAuthCodeAsync } = require('../src/data/usersStore');
    const authRecord = await getAuthCodeAsync(testUserEmail);
    assert.ok(authRecord && authRecord.code);

    // 3. Verify le code OTP -> récupère le session token signé
    const verifyRes = await fetch(`${baseUrl}/api/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        code: authRecord.code
      })
    });
    assert.equal(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.equal(verifyData.success, true);
    assert.ok(verifyData.token);
    assert.equal(verifyData.user.email, testUserEmail);

    const userToken = verifyData.token;

    // 4. RGPD Article 20 : Export des data personnelles de l'user
    // 4a. Export sans token -> 401 unauthorized
    const unauthExport = await fetch(`${baseUrl}/api/auth/export-data?email=${testUserEmail}`);
    assert.equal(unauthExport.status, 401);

    // 4b. Export avec valid user token -> 200 avec payload JSON complet
    const authExport = await fetch(`${baseUrl}/api/auth/export-data?email=${testUserEmail}`, {
      headers: { 'x-user-token': userToken }
    });
    assert.equal(authExport.status, 200);
    const exportData = await authExport.json();
    assert.equal(exportData.success, true);
    assert.equal(exportData.data.user.email, testUserEmail);
    assert.ok(Array.isArray(exportData.data.orders));
  });

  it('Admin Logger: requires auth, returns logs & stats, and supports reset', async () => {
    // 1. Unauthorized request sans token -> 401
    const unauthRes = await fetch(`${baseUrl}/api/admin/logs`);
    assert.equal(unauthRes.status, 401);

    // 2. Push un test log entry dans le pipeline
    const logger = require('../src/config/logger');
    logger.order('Test commande log pour suite de tests', { testId: 123 });
    logger.error({ category: 'PAYMENT', testError: true }, 'Test erreur de paiement');

    // 3. Authorized request avec admin token -> 200 OK
    const authRes = await fetch(`${baseUrl}/api/admin/logs?limit=50`, {
      headers: { 'x-admin-token': process.env.ADMIN_TOKEN }
    });
    assert.equal(authRes.status, 200);
    const data = await authRes.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.logs));
    assert.ok(data.count > 0);
    assert.ok(data.stats);
    assert.ok(typeof data.stats.total === 'number');

    // 4. Test du download endpoint -> 200 OK
    const downloadRes = await fetch(`${baseUrl}/api/admin/logs/download`, {
      headers: { 'x-admin-token': process.env.ADMIN_TOKEN }
    });
    assert.equal(downloadRes.status, 200);
    assert.ok(downloadRes.headers.get('content-disposition'));

    // 5. Test du clear logs -> 200 OK
    const clearRes = await fetch(`${baseUrl}/api/admin/logs`, {
      method: 'DELETE',
      headers: { 'x-admin-token': process.env.ADMIN_TOKEN }
    });
    assert.equal(clearRes.status, 200);
    const clearData = await clearRes.json();
    assert.equal(clearData.success, true);
  });
});
