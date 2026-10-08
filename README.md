# QuickInvoice

Free invoice generator (HTML/CSS/JS + Firebase). Hosted on GitHub Pages.

## Deploy checklist
1. Upload all files to the repo (GitHub Pages serves `index.html`, `privacy.html`, `terms.html`, `ads.txt`).
2. Firebase console → Authentication → Settings → Authorized domains: add `atty3333.github.io` (and any custom domain).
3. Firebase console → Google Cloud → API key: restrict it to your domains.
4. Install Firebase CLI, then from this folder:
   - `firebase functions:secrets:set GUMROAD_SELLER_ID`
   - `firebase deploy --only firestore:rules,functions` (Functions need the Blaze plan)
5. Gumroad → Settings → Advanced → Ping endpoint: paste the `gumroadPing` URL.
6. Replace `support@damessoft.com` in `index.html`, `privacy.html`, `terms.html` if needed.
7. AdSense: add a cookie consent message (AdSense → Privacy & messaging) for EU/UK visitors.
