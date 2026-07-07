// js/institutional-api.js

export const InstitutionalAPI = {
    apiKey: '', // To be filled by user
    baseUrl: 'https://api.whale-alert.io/v1',
    transactions: [],
    status: 'mock', // 'live', 'mock', 'offline'

    // Main data fetcher
    async getInstitutionalTransactions(min_value = 500000) {
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

        // Ensure transactions are augmented with classification and AI interpretation
        this.transactions = txs.map(tx => {
            const classification = tx.classification || this.classifyTransaction(tx);
            return {
                ...tx,
                classification: classification,
                ai_interpretation: this.generateAIInterpretation(classification, tx)
            };
        });

        return { transactions: this.transactions };
    },

    classifyTransaction(tx) {
        const fromType = tx.from ? tx.from.owner_type : 'unknown';
        const toType = tx.to ? tx.to.owner_type : 'unknown';
        const fromOwner = (tx.from && tx.from.owner) ? tx.from.owner.toLowerCase() : '';
        const toOwner = (tx.to && tx.to.owner) ? tx.to.owner.toLowerCase() : '';
        const symbol = tx.symbol.toUpperCase();

        // 1. Stablecoin Mint/Burn
        if (['USDT', 'USDC', 'DAI', 'FDUSD'].includes(symbol)) {
            if (fromOwner.includes('treasury') || fromOwner.includes('mint')) return 'stablecoin-mint';
            if (toOwner.includes('treasury') || toOwner.includes('burn')) return 'stablecoin-burn';
        }

        // 2. ETF Flows
        if (fromOwner.includes('etf') || fromOwner.includes('blackrock') || fromOwner.includes('fidelity') || fromOwner.includes('grayscale')) {
            return 'etf-outflow';
        }
        if (toOwner.includes('etf') || toOwner.includes('blackrock') || toOwner.includes('fidelity') || toOwner.includes('grayscale')) {
            return 'etf-inflow';
        }

        // 3. Government / Treasury
        if (fromType === 'government' || fromOwner.includes('government') || fromOwner.includes('treasury')) return 'government-sell';
        if (toType === 'government' || toOwner.includes('government') || toOwner.includes('treasury')) return 'treasury-activity';

        // 4. Exchange Inflow/Outflow
        if (fromType === 'unknown' && toType === 'exchange') return 'exchange-inflow';
        if (fromType === 'exchange' && toType === 'unknown') return 'exchange-outflow';

        // 5. OTC / Institutional / Smart Money
        if (tx.amount_usd > 50000000) return 'otc-transfer';
        if (fromType === 'institution' || toType === 'institution') return 'institutional-transfer';

        // 6. Whale Accumulation/Distribution
        if (fromType === 'exchange' && tx.amount_usd > 10000000) return 'whale-accumulation';
        if (toType === 'exchange' && tx.amount_usd > 10000000) return 'whale-distribution';

        return 'smart-money-movement';
    },

    generateAIInterpretation(type, tx) {
        const val = (tx.amount_usd / 1e6).toFixed(1);
        switch(type) {
            case 'exchange-outflow':
                return `Large exchange outflow detected. Historically bullish as it reduces immediate sell side liquidity.`;
            case 'exchange-inflow':
                return `Significant inflow to exchange. Possible intent to sell. Increased volatility expected.`;
            case 'whale-accumulation':
                return `Whale wallet withdrawing from exchange. Strong indication of long-term holding.`;
            case 'etf-inflow':
                return `Institutional demand surge via ETF channels. Net positive for market structure.`;
            case 'stablecoin-mint':
                return `New ${tx.symbol} minted. Increases dry powder in the system. Often precedes market rallies.`;
            case 'government-sell':
                return `Government entity moving assets. High risk of market impact. Monitor closely.`;
            case 'institutional-transfer':
                return `Internal institutional rebalancing. Suggests high-level capital management activity.`;
            default:
                return `Significant ${val}M movement detected. Smart money is repositioning. Watch for trend continuation.`;
        }
    },

    calculateStats(transactions) {
        if (!transactions || transactions.length === 0) return this.getEmptyStats();

        const now = Math.floor(Date.now() / 1000);
        const todayTxs = transactions.filter(tx => (now - tx.timestamp) < 86400);

        const totalValue = todayTxs.reduce((sum, tx) => sum + (tx.amount_usd || 0), 0);
        const largestTx = transactions.reduce((prev, curr) => (prev.amount_usd > curr.amount_usd) ? prev : curr, { amount_usd: 0 });

        const inflows = todayTxs.filter(tx => tx.classification === 'exchange-inflow' || tx.classification === 'whale-distribution').reduce((sum, tx) => sum + tx.amount_usd, 0);
        const outflows = todayTxs.filter(tx => tx.classification === 'exchange-outflow' || tx.classification === 'whale-accumulation').reduce((sum, tx) => sum + tx.amount_usd, 0);

        // ETF Flows (Mocked for dashboard)
        const etfBtcInflow = (Math.random() * 400 + 100).toFixed(1);
        const etfEthInflow = (Math.random() * 50 + 10).toFixed(1);

        // Stablecoin Liquidity (Mocked)
        const stableLiquidity = {
            USDT: (Math.random() * 200 + 50).toFixed(1),
            USDC: (Math.random() * 100 + 20).toFixed(1),
            FDUSD: (Math.random() * 50 + 5).toFixed(1),
            DAI: (Math.random() * 20 + 2).toFixed(1)
        };

        return {
            txCountToday: todayTxs.length,
            totalValueMoved: totalValue,
            largestTx: largestTx,
            exchangeInflow: inflows,
            exchangeOutflow: outflows,
            avgTxSize: todayTxs.length > 0 ? totalValue / todayTxs.length : 0,
            marketSentiment: outflows > inflows ? 'Bullish' : 'Bearish',
            smartMoneyScore: Math.floor(Math.random() * 40) + 50,
            etfFlows: { btc: etfBtcInflow, eth: etfEthInflow },
            stableLiquidity: stableLiquidity,
            lastUpdated: new Date().toLocaleTimeString()
        };
    },

    getEmptyStats() {
        return {
            txCountToday: 0,
            totalValueMoved: 0,
            largestTx: null,
            exchangeInflow: 0,
            exchangeOutflow: 0,
            avgTxSize: 0,
            marketSentiment: 'Neutral',
            smartMoneyScore: 50,
            etfFlows: { btc: 0, eth: 0 },
            stableLiquidity: { USDT: 0, USDC: 0, FDUSD: 0, DAI: 0 },
            lastUpdated: '--'
        };
    },

    // Mock Data Engine
    getMockTransactions(min_value) {
        const chains = ['bitcoin', 'ethereum', 'solana', 'bnb', 'ripple', 'tron'];
        const owners = [
            { name: 'Binance', type: 'exchange' },
            { name: 'Coinbase', type: 'exchange' },
            { name: 'Kraken', type: 'exchange' },
            { name: 'BlackRock ETF', type: 'institution' },
            { name: 'Fidelity ETF', type: 'institution' },
            { name: 'MicroStrategy', type: 'institution' },
            { name: 'Tether Treasury', type: 'institution' },
            { name: 'US Government', type: 'government' },
            { name: 'German Government', type: 'government' },
            { name: 'Jump Crypto', type: 'institution' },
            { name: 'Unknown Wallet', type: 'unknown' }
        ];

        const assets = {
            bitcoin: { symbol: 'BTC', price: 64000 },
            ethereum: { symbol: 'ETH', price: 3400 },
            solana: { symbol: 'SOL', price: 140 },
            bnb: { symbol: 'BNB', price: 580 },
            ripple: { symbol: 'XRP', price: 0.60 },
            tron: { symbol: 'TRX', price: 0.12 },
            tether: { symbol: 'USDT', price: 1 }
        };

        const txs = [];
        const count = 50;
        const now = Date.now();

        for (let i = 0; i < count; i++) {
            const chain = chains[Math.floor(Math.random() * chains.length)];
            const asset = assets[chain];
            const from = owners[Math.floor(Math.random() * owners.length)];
            const to = owners[Math.floor(Math.random() * owners.length)];

            const amount_usd = min_value + (Math.random() * 100000000);
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
