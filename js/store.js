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
    }
};
