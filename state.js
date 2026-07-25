/**
 * state.js
 * Handles LocalStorage persistence and constants.
 */

export const DOC_KEY = 'quickinvoice_v2';
export const HIST_KEY = 'quickinvoice_history_v2';
export const PRO_URL = 'https://YOUR-STORE.gumroad.com/l/quickinvoice-pro';

export const THEMES = [
    { id: 'theme-classic', label: 'Classic', color: '#4f7cff', pro: false },
    { id: 'theme-noir', label: 'Noir', color: '#111111', pro: false },
    { id: 'theme-emerald', label: 'Emerald', color: '#0d9668', pro: false },
    { id: 'theme-rose', label: 'Rose', color: '#e0507a', pro: true },
    { id: 'theme-gold', label: 'Gold', color: '#b8860b', pro: true },
    { id: 'theme-slate', label: 'Slate', color: '#475569', pro: true }
];

export class StorageService {
    static get(key) {
        try { return JSON.parse(localStorage.getItem(key)); }
        catch (e) { return null; }
    }

    static set(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); }
        catch (e) { console.error("Storage write failed", e); }
    }

    static getHistory() {
        return this.get(HIST_KEY) || [];
    }

    static saveHistory(doc) {
        const hist = this.getHistory();
        const idx = hist.findIndex(h => h.invNum === doc.invNum);
        if (idx > -1) hist[idx] = doc; 
        else hist.unshift(doc);
        this.set(HIST_KEY, hist.slice(0, 20)); // Limit to 20
        return hist;
    }

    static deleteHistoryItem(index) {
        const hist = this.getHistory();
        hist.splice(index, 1);
        this.set(HIST_KEY, hist);
        return hist;
    }

    static getDocument() {
        return this.get(DOC_KEY);
    }

    static saveDocument(doc) {
        this.set(DOC_KEY, doc);
    }
    
    static getDarkMode() {
        return this.get('quickinvoice_dark') === true;
    }
    
    static setDarkMode(isDark) {
        this.set('quickinvoice_dark', isDark);
    }
}
