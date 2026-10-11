# QuickInvoice

A browser-based invoice editor with a live printable preview. The static frontend runs in local-only mode by default and can use Firebase Authentication and Cloud Firestore for account-based invoice history when configured.

## Features

- Edit business and client details, invoice number and status, issue/due dates, currency, line items, tax, discount, payment link, and notes.
- Preview totals as you edit; add a logo, choose invoice themes, and switch the editor to dark mode.
- Save and reopen invoice history, stored in browser local storage when signed out or in the signed-in user’s Firestore collection when authenticated.
- Print or save the invoice as PDF using the browser’s print dialog.
- Optional email/password sign-up, sign-in, and password reset; the Firebase Functions code includes a Gumroad webhook for granting or revoking Pro status.

## Run the frontend

The frontend is plain HTML, CSS, and JavaScript ES modules; no frontend package installation or build step is required. From the repository root:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`. Firebase modules load from Google’s CDN, so the browser needs internet access. Signed-out editing and local history work in the browser; authentication and cloud history require the Firebase project configured in `state.js` and its Authentication/Firestore services to be available. Local saved history is limited to the latest 20 invoices.

## Firebase Functions

The optional server-side code is in `functions/` and targets Node.js 20. With the Firebase CLI installed and the project selected, install the function dependencies and configure the Gumroad secret before deploying:

```bash
cd functions
npm install
cd ..
firebase functions:secrets:set GUMROAD_SELLER_ID
firebase deploy --only firestore:rules,functions
```

Configure the Gumroad Ping endpoint and the relevant sale, cancellation, subscription-ended, and refund notifications to call the deployed `gumroadPing` function. The repository includes Firestore rules in `firestore.rules`; review them and your Firebase project configuration before deployment.

## Project files

- `index.html`, `styles.css` — editor and invoice preview
- `app.js` — UI, calculations, print flow, and authentication controls
- `state.js` — Firebase client setup and local/cloud storage service
- `functions/` — Gumroad webhook and signup-time Pro claim
- `firestore.rules` — per-user invoice and profile access rules