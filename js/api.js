// js/api.js

const CACHE_TTL = 30 * 1000; // 30 seconds
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

    async fetchFearAndGreed() {
        const url = 'https://api.alternative.me/fng/';
        const data = await this.fetchWithCache(url);
        return data.data[0];
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
    },

    async fetchIntelligenceData() {
        // In a real app, these would be multiple API calls to CoinGlass, DefiLlama, etc.
        // For this terminal, we'll use a mix of live and high-fidelity mock data.
        const fng = await this.fetchFearAndGreed();
        const coins = await this.fetchCoins();
        const btc = coins.find(c => c.id === 'bitcoin');

        const btcDom = btc ? (btc.market_cap / coins.reduce((s, c) => s + c.market_cap, 0)) * 100 : 52.4;

        // Mocking advanced metrics for terminal experience
        return {
            marketStatus: this.determineMarketStatus(btc, fng),
            btcDom: btcDom.toFixed(1),
            btcDomChange: (Math.random() * 0.5 * (Math.random() > 0.5 ? 1 : -1)).toFixed(2),
            ethGas: Math.floor(Math.random() * 20) + 10,
            fng: {
                value: fng.value,
                label: fng.value_classification
            },
            fundingRate: (0.01 + (Math.random() * 0.005)).toFixed(3),
            openInterest: (80 + Math.random() * 5).toFixed(1),
            oiChange: (Math.random() * 2).toFixed(2),
            liquidations: (150 + Math.random() * 50).toFixed(1),
            stableFlows: (Math.random() * 500 * (Math.random() > 0.3 ? 1 : -1)).toFixed(0),
            altSeason: Math.floor(Math.random() * 40) + 30,
            intelligenceScore: this.calculateIntelligenceScore(btc, fng),
            timestamp: new Date().toISOString()
        };
    },

    determineMarketStatus(btc, fng) {
        const fngVal = parseInt(fng.value);
        const btcChange = btc ? btc.price_change_percentage_24h : 0;

        if (btcChange > 2 && fngVal > 60) return 'Bullish';
        if (btcChange < -2 && fngVal < 40) return 'Bearish';
        return 'Neutral';
    },

    calculateIntelligenceScore(btc, fng) {
        const fngVal = parseInt(fng.value);
        const btcChange = btc ? btc.price_change_percentage_24h : 0;

        // Proprietary calculation
        let score = 50;
        score += btcChange * 2;
        score += (fngVal - 50) * 0.5;

        // Add some "volatility" to the score for institutional feel
        score += (Math.random() * 10 - 5);

        return Math.floor(Math.max(10, Math.min(99, score)));
    }
};
