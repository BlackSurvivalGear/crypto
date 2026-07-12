// js/store.js

export const Store = {
    get(key, defaultValue) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('LocalStorage error:', e);
        }
    },

    getPortfolio() {
        let portfolio = this.get('portfolio', [
            { id: 'bitcoin', amount: 0.15, buyPrice: 45000, date: '2023-10-15', notes: 'Initial investment' },
            { id: 'ethereum', amount: 0.8, buyPrice: 2200, date: '2023-11-20', notes: 'DCA' },
            { id: 'solana', amount: 5, buyPrice: 65, date: '2024-01-05', notes: 'Bullish on ecosystem' }
        ]);

        // Migration: Ensure all items have necessary fields
        return portfolio.map(item => ({
            id: item.id,
            amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount || 0),
            buyPrice: typeof item.buyPrice === 'number' ? item.buyPrice : parseFloat(item.buyPrice || 0),
            date: item.date || '',
            notes: item.notes || ''
        }));
    },

    updatePortfolio(assetData) {
        let portfolio = this.getPortfolio();
        const index = portfolio.findIndex(item => item.id === assetData.id);

        const newItem = {
            id: assetData.id,
            amount: parseFloat(assetData.amount),
            buyPrice: parseFloat(assetData.buyPrice),
            date: assetData.date || '',
            notes: assetData.notes || ''
        };

        if (index > -1) {
            portfolio[index] = newItem;
        } else {
            portfolio.push(newItem);
        }

        this.set('portfolio', portfolio);
        return portfolio;
    },

    removeFromPortfolio(id) {
        let portfolio = this.getPortfolio();
        portfolio = portfolio.filter(item => item.id !== id);
        this.set('portfolio', portfolio);
        return portfolio;
    },

    getWatchlist() {
        return this.get('watchlist', ['bitcoin', 'ethereum', 'solana', 'ripple']);
    },

    addToWatchlist(id) {
        let watchlist = this.getWatchlist();
        if (!watchlist.includes(id)) {
            watchlist.push(id);
            this.set('watchlist', watchlist);
        }
        return watchlist;
    },

    removeFromWatchlist(id) {
        let watchlist = this.getWatchlist();
        const index = watchlist.indexOf(id);
        if (index > -1) {
            watchlist.splice(index, 1);
            this.set('watchlist', watchlist);
        }
        return watchlist;
    },

    toggleWatchlist(id) {
        let watchlist = this.getWatchlist();
        const index = watchlist.indexOf(id);
        if (index > -1) {
            watchlist.splice(index, 1);
        } else {
            watchlist.push(id);
        }
        this.set('watchlist', watchlist);
        return watchlist;
    },

    getTheme() {
        return this.get('theme', 'dark');
    },

    setTheme(theme) {
        this.set('theme', theme);
    },

    // Cryptography Helpers using Web Crypto API
    async getKey(password) {
        const enc = new TextEncoder();
        const salt = enc.encode("BlackStackSalt2024!");
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveBits", "deriveKey"]
        );
        return window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );
    },

    async encryptText(text) {
        try {
            if (!text) return "";
            if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
                // Fallback basic base64 obfuscation for testing/restricted environments
                return "obf:" + btoa(unescape(encodeURIComponent(text)));
            }
            const password = "BlackStack_Secure_Vault_Key_2024!";
            const key = await this.getKey(password);
            const enc = new TextEncoder();
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const ciphertext = await window.crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv },
                key,
                enc.encode(text)
            );

            const encryptedArray = new Uint8Array(ciphertext);
            const combined = new Uint8Array(iv.length + encryptedArray.length);
            combined.set(iv);
            combined.set(encryptedArray, iv.length);

            return "enc:" + btoa(String.fromCharCode.apply(null, combined));
        } catch (e) {
            console.error("Encryption failed:", e);
            return "obf:" + btoa(unescape(encodeURIComponent(text)));
        }
    },

    async decryptText(encryptedText) {
        try {
            if (!encryptedText) return "";
            if (encryptedText.startsWith("obf:")) {
                return decodeURIComponent(escape(atob(encryptedText.substring(4))));
            }
            if (!encryptedText.startsWith("enc:")) {
                return encryptedText; // raw unencrypted
            }
            if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
                throw new Error("Web Crypto not supported in this environment.");
            }
            const password = "BlackStack_Secure_Vault_Key_2024!";
            const key = await this.getKey(password);

            const combined = new Uint8Array(
                atob(encryptedText.substring(4))
                    .split("")
                    .map(c => c.charCodeAt(0))
            );

            const iv = combined.slice(0, 12);
            const ciphertext = combined.slice(12);

            const decrypted = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                key,
                ciphertext
            );

            const dec = new TextDecoder();
            return dec.decode(decrypted);
        } catch (e) {
            console.error("Decryption failed:", e);
            // try decoding as raw base64 if it might be obf or plain text
            try {
                return decodeURIComponent(escape(atob(encryptedText)));
            } catch (err) {
                return "";
            }
        }
    },

    // AI Configuration Helpers
    getAIKeys() {
        return this.get('ai_keys', {});
    },

    async saveAIKey(provider, key) {
        const keys = this.getAIKeys();
        const encrypted = await this.encryptText(key);
        keys[provider] = encrypted;
        this.set('ai_keys', keys);
        return keys;
    },

    deleteAIKey(provider) {
        const keys = this.getAIKeys();
        if (keys[provider]) {
            delete keys[provider];
            this.set('ai_keys', keys);
        }
        return keys;
    },

    async getDecryptedAIKey(provider) {
        const keys = this.getAIKeys();
        const encrypted = keys[provider];
        if (!encrypted) return "";
        return await this.decryptText(encrypted);
    },

    getDefaultAIProvider() {
        return this.get('default_ai_provider', 'openai');
    },

    setDefaultAIProvider(provider) {
        this.set('default_ai_provider', provider);
    }
};
