/**
 * state.js
 * Handles Firebase integration and LocalStorage fallback.
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyDMV-GPTynOgNCFKBjSOdMhhBJBuwdDpK4",
    authDomain: "quickinvoice-32673.firebaseapp.com",
    projectId: "quickinvoice-32673",
    storageBucket: "quickinvoice-32673.firebasestorage.app",
    messagingSenderId: "515443408392",
    appId: "1:515443408392:web:b6e0ca8557b4275ba71bbd",
    measurementId: "G-8734V1VDLW"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged };

export const DOC_KEY = 'quickinvoice_v2';
export const HIST_KEY = 'quickinvoice_history_v2';

// Placeholder URLs for your upcoming subscription plans
export const SUB_MONTHLY_URL = 'https://buy.stripe.com/placeholder-monthly';
export const SUB_LIFETIME_URL = 'https://buy.stripe.com/placeholder-lifetime';

export const THEMES = [
    { id: 'theme-classic', label: 'Classic', color: '#4f7cff', pro: false },
    { id: 'theme-noir', label: 'Noir', color: '#111111', pro: false },
    { id: 'theme-emerald', label: 'Emerald', color: '#0d9668', pro: false },
    { id: 'theme-rose', label: 'Rose', color: '#e0507a', pro: false },
    { id: 'theme-gold', label: 'Gold', color: '#b8860b', pro: false },
    { id: 'theme-slate', label: 'Slate', color: '#475569', pro: false },
    { id: 'theme-wonder', label: 'Wonder', color: 'conic-gradient(from 90deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)', pro: true }
];

export class StorageService {
    static getLocal(key) {
        try { return JSON.parse(localStorage.getItem(key)); }
        catch (e) { return null; }
    }

    static setLocal(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); }
        catch (e) { console.error("Storage write failed", e); }
    }

    // Returns boolean indicating if user has Pro privileges
    static async isProUser() {
        if (!auth.currentUser) return false;
        try {
            const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
            return userDoc.exists() ? userDoc.data().pro_status === true : false;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    static async getHistory() {
        if (auth.currentUser) {
            try {
                const snap = await getDocs(collection(db, `users/${auth.currentUser.uid}/invoices`));
                const docs = [];
                snap.forEach(d => docs.push(d.data()));
                return docs.sort((a, b) => new Date(b.date) - new Date(a.date));
            } catch (e) {
                console.error("Firestore read error", e);
                return [];
            }
        }
        return this.getLocal(HIST_KEY) || [];
    }

    static async saveHistory(docData) {
        if (!docData.invNum) docData.invNum = `INV-${Date.now()}`;
        
        if (auth.currentUser) {
            await setDoc(doc(db, `users/${auth.currentUser.uid}/invoices`, docData.invNum), docData);
        } else {
            const hist = this.getLocal(HIST_KEY) || [];
            const idx = hist.findIndex(h => h.invNum === docData.invNum);
            if (idx > -1) hist[idx] = docData; 
            else hist.unshift(docData);
            this.setLocal(HIST_KEY, hist.slice(0, 20));
        }
    }

    static async deleteHistoryItem(invNum) {
        if (auth.currentUser) {
            await deleteDoc(doc(db, `users/${auth.currentUser.uid}/invoices`, invNum));
        } else {
            const hist = this.getLocal(HIST_KEY) || [];
            const filtered = hist.filter(h => h.invNum !== invNum);
            this.setLocal(HIST_KEY, filtered);
        }
    }

    static getDocument() { return this.getLocal(DOC_KEY); }
    static saveDocument(docData) { this.setLocal(DOC_KEY, docData); }
    
    static getDarkMode() { return this.getLocal('quickinvoice_dark') === true; }
    static setDarkMode(isDark) { this.setLocal('quickinvoice_dark', isDark); }
}