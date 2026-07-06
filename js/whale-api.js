// js/whale-api.js

export const WhaleAPI = {
    apiKey: '', // To be filled by user
    baseUrl: 'https://api.whale-alert.io/v1',
    transactions: [],
    status: 'mock', // 'live', 'mock', 'offline'

    // Main data fetcher
    async getWhaleTransactions(min_value = 500000) {
        let txs = [];
        if (!this.apiKey) {
            txs = this.getMockTransactions(min_value);
            this.status = 'mock';
        } else {
            try {
                const response = await fetch(`${this.baseUrl}/transactions?api_key=${this.apiKey}&min_value=${min_value}`);
                if (!response.ok) {
                    throw new Error(`API returned ${response.status}: ${response.statusText}`);
                }
                const data = await response.json();
                txs = data.transactions || [];
                this.status = 'live';
            } catch (error) {
                console.error('Whale Alert API Error:', error);
                txs = this.getMockTransactions(min_value);
                this.status = 'offline';
            }
        }

        // Ensure transactions are augmented with classification
        this.transactions = txs.map(tx => ({
            ...tx,
            classification: tx.classification || this.classifyTransaction(tx)
        }));

        return { transactions: this.transactions };
    },

    classifyTransaction(tx) {
        const fromType = tx.from ? tx.from.owner_type : 'unknown';
        const toType = tx.to ? tx.to.owner_type : 'unknown';

        if (fromType === 'unknown' && toType === 'exchange') return 'exchange-inflow';
        if (fromType === 'exchange' && toType === 'unknown') return 'exchange-outflow';
        if (tx.amount_usd > 10000000) return 'large-transfer';
        if (fromType === 'institution' || toType === 'institution') return 'institutional';
        if (fromType === 'government' || toType === 'government') return 'government';
        return 'wallet-to-wallet';
    },

    calculateStats(transactions) {
        if (!transactions || transactions.length === 0) return this.getEmptyStats();

        const now = Math.floor(Date.now() / 1000);
        const todayTxs = transactions.filter(tx => (now - tx.timestamp) < 86400);

        const totalValue = todayTxs.reduce((sum, tx) => sum + (tx.amount_usd || 0), 0);
        const largestTx = transactions.reduce((prev, curr) => (prev.amount_usd > curr.amount_usd) ? prev : curr, { amount_usd: 0 });

        const inflows = todayTxs.filter(tx => tx.classification === 'exchange-inflow').reduce((sum, tx) => sum + tx.amount_usd, 0);
        const outflows = todayTxs.filter(tx => tx.classification === 'exchange-outflow').reduce((sum, tx) => sum + tx.amount_usd, 0);

        return {
            txCountToday: todayTxs.length,
            totalValueMoved: totalValue,
            largestTxValue: largestTx.amount_usd,
            exchangeInflow: inflows,
            exchangeOutflow: outflows,
            avgTxSize: todayTxs.length > 0 ? totalValue / todayTxs.length : 0,
            marketSentiment: inflows > outflows ? 'Bearish' : 'Bullish',
            lastUpdated: new Date().toLocaleTimeString()
        };
    },

    getEmptyStats() {
        return {
            txCountToday: 0,
            totalValueMoved: 0,
            largestTxValue: 0,
            exchangeInflow: 0,
            exchangeOutflow: 0,
            avgTxSize: 0,
            marketSentiment: 'Neutral',
            lastUpdated: '--'
        };
    },

    // Mock Data Engine for demonstration and fallback
    getMockTransactions(min_value) {
        const chains = ['bitcoin', 'ethereum', 'solana', 'bnb', 'ripple', 'tron'];
        const owners = [
            { name: 'Binance', type: 'exchange', country: 'Global' },
            { name: 'Coinbase', type: 'exchange', country: 'USA' },
            { name: 'Kraken', type: 'exchange', country: 'USA' },
            { name: 'Bybit', type: 'exchange', country: 'Global' },
            { name: 'OKX', type: 'exchange', country: 'Global' },
            { name: 'BlackRock', type: 'institution', country: 'USA' },
            { name: 'Grayscale', type: 'institution', country: 'USA' },
            { name: 'MicroStrategy', type: 'institution', country: 'USA' },
            { name: 'Tether Treasury', type: 'institution', country: 'Global' },
            { name: 'US Government', type: 'government', country: 'USA' },
            { name: 'Unknown Wallet', type: 'unknown', country: 'Unknown' }
        ];

        const assets = {
            bitcoin: { symbol: 'BTC', price: 64000 },
            ethereum: { symbol: 'ETH', price: 3400 },
            solana: { symbol: 'SOL', price: 140 },
            bnb: { symbol: 'BNB', price: 580 },
            ripple: { symbol: 'XRP', price: 0.60 },
            tron: { symbol: 'TRX', price: 0.12 }
        };

        const txs = [];
        const count = 50;
        const now = Date.now();

        for (let i = 0; i < count; i++) {
            const chain = chains[Math.floor(Math.random() * chains.length)];
            const asset = assets[chain];
            const from = owners[Math.floor(Math.random() * owners.length)];
            const to = owners[Math.floor(Math.random() * owners.length)];

            // Random amount to meet threshold
            const amount_usd = min_value + (Math.random() * 50000000);
            const amount = amount_usd / asset.price;

            txs.push({
                blockchain: chain,
                symbol: asset.symbol,
                id: Math.random().toString(36).substring(7),
                hash: '0x' + Math.random().toString(16).substring(2, 42),
                transaction_type: 'transfer',
                hash_url: `https://blockchair.com/${chain}/transaction/`,
                from: {
                    address: '0x' + Math.random().toString(16).substring(2, 42),
                    owner: from.name,
                    owner_type: from.type
                },
                to: {
                    address: '0x' + Math.random().toString(16).substring(2, 42),
                    owner: to.name,
                    owner_type: to.type
                },
                timestamp: Math.floor((now - (i * 300000)) / 1000),
                amount: amount,
                amount_usd: amount_usd
            });
        }

        return txs.sort((a, b) => b.timestamp - a.timestamp);
    }
};
