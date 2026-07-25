/**
 * app.js
 * Primary UI controller and DOM manipulation logic.
 */
import { THEMES, PRO_URL, StorageService } from './state.js';

const $ = id => document.getElementById(id);
let currentTheme = 'theme-classic';
let logoData = '';

// ---------- Formatters & Security ----------
const escapeAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const num = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const money = (v, c) => c + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const fmtDate = (v) => {
    if (!v) return '—';
    const d = new Date(v + 'T00:00:00');
    return isNaN(d) ? '—' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

// ---------- UI Utilities ----------
let toastTimer;
function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ---------- Theme Management ----------
function buildThemePicker() {
    const wrap = $('themePicker');
    wrap.innerHTML = '';
    THEMES.forEach(t => {
        const chip = document.createElement('div');
        chip.className = 'theme-chip' + (t.pro ? ' locked' : '') + (t.id === currentTheme ? ' active' : '');
        chip.style.background = t.color;
        chip.textContent = t.pro ? '' : t.label;
        chip.title = t.pro ? t.label + ' (Pro)' : t.label;
        chip.onclick = () => {
            if (t.pro) {
                window.open(PRO_URL, '_blank');
                toast('⭐ Premium theme — unlock with Pro!');
                return;
            }
            currentTheme = t.id;
            $('invoice').className = `invoice ${currentTheme}`;
            buildThemePicker();
            render();
        };
        wrap.appendChild(chip);
    });
}

// ---------- DOM Interactions ----------
function addItemRow(desc = '', qty = 1, rate = '') {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
      <input class="i-desc" placeholder="Service description" value="${escapeAttr(desc)}">
      <input class="i-qty" type="number" min="0" step="any" value="${escapeAttr(qty)}">
      <input class="i-rate" type="number" min="0" step="any" placeholder="0.00" value="${escapeAttr(rate)}">
      <button class="btn btn-remove" title="Remove">✕</button>`;
      
    row.querySelector('.btn-remove').onclick = () => {
        row.remove();
        render();
    };
    row.querySelectorAll('input').forEach(i => i.addEventListener('input', render));
    $('items').appendChild(row);
    render();
}

function render() {
    const cur = $('currency').value;
    $('pInvNum').textContent = $('invNum').value || 'INV-001';
    $('pDate').textContent = fmtDate($('date').value);
    $('pDue').textContent = fmtDate($('due').value);
    $('pFrom').textContent = $('from').value || '—';
    $('pTo').textContent = $('to').value || '—';

    // Logo state
    const logo = $('pLogo');
    logo.style.display = logoData ? 'block' : 'none';
    if (logoData) logo.src = logoData;
    $('logoClear').style.display = logoData ? 'inline' : 'none';

    // Status stamp
    const st = $('status').value;
    const stamp = $('pStamp');
    stamp.className = 'stamp ' + st;
    stamp.style.display = st ? 'block' : 'none';
    stamp.textContent = st.toUpperCase();

    // Calculate Items
    let subtotal = 0;
    let rowsHtml = '';
    document.querySelectorAll('#items .item-row').forEach(row => {
        const desc = row.querySelector('.i-desc').value;
        const qty = num(row.querySelector('.i-qty').value);
        const rate = num(row.querySelector('.i-rate').value);
        const amount = qty * rate;
        subtotal += amount;
        
        if (desc || amount) {
            rowsHtml += `<tr><td>${escapeHtml(desc) || '—'}</td><td>${qty}</td>
                         <td>${money(rate, cur)}</td><td>${money(amount, cur)}</td></tr>`;
        }
    });
    $('pItems').innerHTML = rowsHtml || '<tr><td colspan="4" style="color:#bbb;">No items yet</td></tr>';

    // Totals
    const discPct = num($('discount').value);
    const discAmt = subtotal * (discPct / 100);
    const taxPct = num($('tax').value);
    const taxAmt = (subtotal - discAmt) * (taxPct / 100);
    
    $('pSub').textContent = money(subtotal, cur);
    
    $('pDiscRow').style.display = discPct > 0 ? 'flex' : 'none';
    $('pDisc').textContent = `−${money(discAmt, cur)} (${discPct}%)`;
    
    $('pTaxRow').style.display = taxPct > 0 ? 'flex' : 'none';
    $('pTax').textContent = `${money(taxAmt, cur)} (${taxPct}%)`;
    
    $('pTotal').textContent = money(subtotal - discAmt + taxAmt, cur);

    // Payment Link
    const link = $('payLink').value.trim();
    const payBtn = $('pPayBtn');
    if (/^https?:\/\/\S+$/i.test(link)) {
        payBtn.href = link;
        payBtn.style.display = 'inline-block';
    } else {
        payBtn.style.display = 'none';
    }

    // Notes
    const notes = $('notes').value.trim();
    const pNotes = $('pNotes');
    pNotes.style.display = notes ? 'block' : 'none';
    pNotes.textContent = notes;

    // Sync state
    StorageService.saveDocument(collectState());
}

function collectState() {
    return {
        from: $('from').value, to: $('to').value, invNum: $('invNum').value,
        currency: $('currency').value, date: $('date').value, due: $('due').value,
        tax: $('tax').value, discount: $('discount').value, notes: $('notes').value,
        status: $('status').value, payLink: $('payLink').value,
        theme: currentTheme, logo: logoData,
        items: Array.from(document.querySelectorAll('#items .item-row')).map(r => ({
            d: r.querySelector('.i-desc').value,
            q: r.querySelector('.i-qty').value,
            r: r.querySelector('.i-rate').value
        }))
    };
}

function loadState(data) {
    const fields = ['from', 'to', 'invNum', 'currency', 'date', 'due', 'tax', 'discount', 'notes', 'status', 'payLink'];
    fields.forEach(k => {
        if (data[k] !== undefined) $(k).value = data[k];
    });
    
    currentTheme = THEMES.some(t => t.id === data.theme && !t.pro) ? data.theme : 'theme-classic';
    logoData = data.logo || '';
    
    $('items').innerHTML = '';
    const items = data.items && data.items.length ? data.items : [{ d: '', q: 1, r: '' }];
    items.forEach(it => addItemRow(it.d, it.q, it.r));
    
    $('invoice').className = `invoice ${currentTheme}`;
    buildThemePicker();
}

function renderHistory() {
    const hist = StorageService.getHistory();
    const wrap = $('history');
    
    if (!hist.length) {
        wrap.innerHTML = '<span style="font-size:.82rem;color:var(--muted);">Nothing saved yet.</span>';
        return;
    }
    
    wrap.innerHTML = '';
    hist.forEach((h, i) => {
        const div = document.createElement('div');
        div.className = 'hist-item';
        
        const label = document.createElement('span');
        const clientPreview = (h.to || '').split('\n')[0].slice(0, 18) || 'No client';
        label.textContent = `${h.invNum || '—'} · ${clientPreview}`;
        
        const btns = document.createElement('span');
        
        const loadB = document.createElement('button');
        loadB.className = 'btn-mini';
        loadB.textContent = 'Open';
        loadB.onclick = () => { loadState(h); render(); toast('Invoice loaded ✓'); };
        
        const delB = document.createElement('button');
        delB.className = 'btn-mini';
        delB.style.color = '#c0392b';
        delB.textContent = '✕';
        delB.onclick = () => { 
            StorageService.deleteHistoryItem(i); 
            renderHistory(); 
        };
        
        btns.append(loadB, delB);
        div.append(label, btns);
        wrap.appendChild(div);
    });
}

// ---------- Event Listeners Binding ----------
function bindEvents() {
    // Inputs tracking
    const inputs = ['from', 'to', 'invNum', 'currency', 'date', 'due', 'tax', 'discount', 'notes', 'status', 'payLink'];
    inputs.forEach(k => $(k).addEventListener('input', render));

    // Logo Upload
    $('logoInput').addEventListener('change', e => {
        const f = e.target.files[0];
        if (!f) return;
        if (f.size > 500 * 1024) {
            toast('Logo too large — keep it under 500 KB');
            e.target.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = ev => {
            logoData = ev.target.result;
            render();
            toast('Logo added ✓');
        };
        reader.readAsDataURL(f);
    });

    $('logoClear').addEventListener('click', () => {
        logoData = '';
        $('logoInput').value = '';
        render();
    });

    // Action Buttons
    $('btnNewInvoice').addEventListener('click', () => {
        const m = ($('invNum').value || 'INV-000').match(/^(.*?)(\d+)$/);
        $('invNum').value = m ? m[1] + String(parseInt(m[2], 10) + 1).padStart(m[2].length, '0') : 'INV-001';
        ['to', 'notes', 'status', 'due'].forEach(id => $(id).value = '');
        $('date').value = new Date().toISOString().slice(0, 10);
        $('items').innerHTML = '';
        addItemRow();
        toast('New invoice started — business details kept ✓');
        render();
    });

    $('btnSaveHistory').addEventListener('click', () => {
        StorageService.saveHistory(collectState());
        renderHistory();
        toast('Saved to history ✓');
    });

    $('btnAddItem').addEventListener('click', () => addItemRow());
    $('btnPrint').addEventListener('click', () => window.print());

    // Dark Mode
    $('darkToggle').addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark');
        StorageService.setDarkMode(isDark);
    });
}

// ---------- Initialization ----------
function init() {
    bindEvents();
    
    if (StorageService.getDarkMode()) {
        document.body.classList.add('dark');
    }

    const savedDoc = StorageService.getDocument();
    if (savedDoc) {
        loadState(savedDoc);
    } else {
        $('date').value = new Date().toISOString().slice(0, 10);
        addItemRow();
        buildThemePicker();
    }
    
    renderHistory();
    render();
}

// Boot application
init();
