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
        return this.get('portfolio', [
            { id: 'bitcoin', amount: 0.15 },
            { id: 'ethereum', amount: 0.8 },
            { id: 'solana', amount: 5 }
        ]);
    },

    updatePortfolio(id, amount) {
        let portfolio = this.getPortfolio();
        const index = portfolio.findIndex(item => item.id === id);
        if (index > -1) {
            if (amount <= 0) {
                portfolio.splice(index, 1);
            } else {
                portfolio[index].amount = amount;
            }
        } else if (amount > 0) {
            portfolio.push({ id, amount });
        }
        this.set('portfolio', portfolio);
        return portfolio;
    },

    getWatchlist() {
        return this.get('watchlist', ['bitcoin', 'ethereum', 'solana']);
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
