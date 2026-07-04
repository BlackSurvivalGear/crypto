// js/api.js

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

export const API = {
    async fetchWithCache(url) {
        const now = Date.now();
        if (cache.has(url)) {
            const { data, timestamp } = cache.get(url);
            if (now - timestamp < CACHE_TTL) {
                return data;
            }
        }

        try {
            const response = await fetch(url);
            if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please try again later.');
            }
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            cache.set(url, { data, timestamp: now });
            return data;
        } catch (error) {
            console.error('API Fetch Error:', error);
            if (window.showNotification) {
                window.showNotification(error.message, 'error');
            }
            throw error;
        }
    },

    async fetchCoins() {
        const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&sparkline=true&price_change_percentage=24h';
        return this.fetchWithCache(url);
    },

    async fetchCoinChart(coinId, days = 7) {
        const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
        return this.fetchWithCache(url);
    },

    async fetchNews() {
        const rssUrl = encodeURIComponent('https://cointelegraph.com/rss');
        const url = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;
        const data = await this.fetchWithCache(url);

        return data.items.map(item => ({
            title: item.title,
            source: 'CoinTelegraph',
            time: this.formatTime(item.pubDate),
            link: item.link,
            thumbnail: item.thumbnail || '',
            sentiment: this.analyzeSentiment(item.title)
        }));
    },

    formatTime(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000 / 60); // minutes
        if (diff < 60) return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        return `${Math.floor(diff / 1440)}d ago`;
    },

    analyzeSentiment(text) {
        const bullishWords = ['surge', 'jump', 'rise', 'up', 'bull', 'gain', 'approval', 'approve', 'new high', 'ath'];
        const bearishWords = ['drop', 'fall', 'down', 'bear', 'loss', 'rejection', 'reject', 'low', 'dip', 'crash'];

        const lowerText = text.toLowerCase();
        let score = 0;
        bullishWords.forEach(word => { if (lowerText.includes(word)) score++; });
        bearishWords.forEach(word => { if (lowerText.includes(word)) score--; });

        if (score > 0) return 'bullish';
        if (score < 0) return 'bearish';
        return 'neutral';
    }
};
