/**
 * Gumroad "Ping" webhook -> unlocks Pro automatically.
 *
 * Setup:
 *   1. firebase functions:secrets:set GUMROAD_SELLER_ID   (from Gumroad > Settings > Advanced)
 *   2. firebase deploy --only functions,firestore:rules
 *   3. Paste the gumroadPing URL into Gumroad > Settings > Advanced > Ping endpoint
 *      and as the Resource subscription URL for "sale", "cancellation",
 *      "subscription_ended" and "refund".
 */
const functions = require('firebase-functions/v1');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();
const GUMROAD_SELLER_ID = defineSecret('GUMROAD_SELLER_ID');

const PRODUCTS = { eenhcp: 'monthly', piqhgr: 'lifetime' };

async function setPro(email, pro, extra) {
  const key = email.toLowerCase();
  let user = null;
  try { user = await admin.auth().getUserByEmail(key); } catch (_) { /* not signed up yet */ }
  const data = { pro_status: pro, pro_email: key, pro_updated: admin.firestore.FieldValue.serverTimestamp(), ...extra };
  if (user) await db.doc(`users/${user.uid}`).set(data, { merge: true });
  // Remember by email too, so buyers who sign up later still get Pro
  await db.doc(`pro_by_email/${key}`).set(data, { merge: true });
}

exports.gumroadPing = functions
  .runWith({ secrets: [GUMROAD_SELLER_ID] })
  .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') return res.status(405).send('Method not allowed');
    const b = req.body || {};
    if (!b.seller_id || b.seller_id !== GUMROAD_SELLER_ID.value()) return res.status(401).send('Unauthorized');

    const email = String(b.email || b.purchaser_email || '').trim();
    const plan = PRODUCTS[b.product_permalink] || PRODUCTS[String(b.short_product_id || '')];
    if (!email || !/^[^@\s]+@[^@\s]+$/.test(email)) return res.status(400).send('Missing email');

    const ended = b.refunded === 'true' || b.resource_name === 'refund'
      || b.resource_name === 'subscription_ended'
      || (b.resource_name === 'cancellation' && plan === 'monthly');

    try {
      await setPro(email, !ended, { pro_plan: plan || 'unknown', sale_id: b.sale_id || null });
      return res.status(200).send('ok');
    } catch (e) {
      console.error(e);
      return res.status(500).send('error');
    }
  });

// When someone signs up after buying, copy their Pro status onto the new account
exports.claimProOnSignup = functions.auth.user().onCreate(async (user) => {
  if (!user.email) return;
  const snap = await db.doc(`pro_by_email/${user.email.toLowerCase()}`).get();
  if (snap.exists) await db.doc(`users/${user.uid}`).set(snap.data(), { merge: true });
});
