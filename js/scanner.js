// js/scanner.js
import { Store } from './store.js';

export const CoinScanner = {
    coins: [],
    whaleTransactions: [],
    alerts: [],
    alertsLog: [],
    countdown: 15,
    tickerInterval: null,
    currentTab: 'dashboard',
    currentFilter: 'all',
    searchQuery: '',

    // Init the scanner
    init() {
        this.generateSimulatedDatabase();
        this.generateWhaleTransactions(20);
        this.loadAlerts();
        this.setupEventListeners();
        this.startTicker();
        this.updateUI();
        this.initCopilot();
        this.renderSettingsTab();
    },

    // Generates simulated database for 100+ coins (representing Arkham meets Bloomberg style intelligence)
    generateSimulatedDatabase() {
        const sectors = ['AI', 'DeFi', 'RWA', 'Gaming', 'Layer 2', 'DePIN', 'Meme', 'Infrastructure', 'Privacy', 'Stablecoins'];
        const presetCoins = [
            { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 64125.40, cap: 1260000000000, vol: 32100000000, change: 2.45, sector: 'Layer 1', riskRating: 'Low' },
            { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 3452.10, cap: 415000000000, vol: 15400000000, change: -1.20, sector: 'Layer 1', riskRating: 'Low' },
            { id: 'solana', name: 'Solana', symbol: 'SOL', price: 145.20, cap: 64000000000, vol: 4200000000, change: 8.32, sector: 'Layer 1', riskRating: 'Medium' },
            { id: 'chainlink', name: 'Chainlink', symbol: 'LINK', price: 14.80, cap: 8800000000, vol: 450000000, change: 4.15, sector: 'Infrastructure', riskRating: 'Low' },
            { id: 'render-token', name: 'Render', symbol: 'RNDR', price: 8.25, cap: 3200000000, vol: 280000000, change: 12.45, sector: 'AI', riskRating: 'Medium' },
            { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', price: 0.125, cap: 18000000000, vol: 1200000000, change: -3.50, sector: 'Meme', riskRating: 'High' },
            { id: 'pepe', name: 'Pepe', symbol: 'PEPE', price: 0.000012, cap: 5000000000, vol: 800000000, change: 18.20, sector: 'Meme', riskRating: 'Extreme' },
            { id: 'uniswap', name: 'Uniswap', symbol: 'UNI', price: 7.45, cap: 4500000000, vol: 220000000, change: 0.85, sector: 'DeFi', riskRating: 'Low' },
            { id: 'aave', name: 'Aave', symbol: 'AAVE', price: 92.30, cap: 1400000000, vol: 110000000, change: -2.15, sector: 'DeFi', riskRating: 'Low' },
            { id: 'ondo', name: 'Ondo Finance', symbol: 'ONDO', price: 0.95, cap: 1300000000, vol: 150000000, change: 11.20, sector: 'RWA', riskRating: 'Medium' },
            { id: 'gala', name: 'Gala', symbol: 'GALA', price: 0.032, cap: 1100000000, vol: 90000000, change: 5.40, sector: 'Gaming', riskRating: 'High' },
            { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB', price: 0.82, cap: 2400000000, vol: 180000000, change: -4.30, sector: 'Layer 2', riskRating: 'Medium' },
            { id: 'optimism', name: 'Optimism', symbol: 'OP', price: 1.85, cap: 2100000000, vol: 140000000, change: -3.10, sector: 'Layer 2', riskRating: 'Medium' },
            { id: 'filecoin', name: 'Filecoin', symbol: 'FIL', price: 4.25, cap: 2300000000, vol: 120000000, change: 1.15, sector: 'DePIN', riskRating: 'Medium' },
            { id: 'helium', name: 'Helium', symbol: 'HNT', price: 5.12, cap: 850000000, vol: 35000000, change: 14.80, sector: 'DePIN', riskRating: 'Medium' },
            { id: 'tether', name: 'Tether', symbol: 'USDT', price: 1.00, cap: 112000000000, vol: 48000000000, change: 0.01, sector: 'Stablecoins', riskRating: 'Low' },
            { id: 'usd-coin', name: 'USD Coin', symbol: 'USDC', price: 1.00, cap: 32000000000, vol: 6200000000, change: -0.01, sector: 'Stablecoins', riskRating: 'Low' }
        ];

        this.coins = presetCoins.map(coin => this.enrichCoinMetrics(coin));

        // Generate another 85 generic coins to complete the "100+ assets scanned" database
        const syllables = ['bit', 'eth', 'sol', 'lun', 'dex', 'pro', 'neo', 'ana', 'kav', 'zec', 'alg', 'bnd', 'dot', 'ark', 'cro', 'ftm', 'wav'];
        for (let i = 1; i <= 85; i++) {
            const sym = (syllables[i % syllables.length] + syllables[(i + 5) % syllables.length]).toUpperCase().substring(0, 4);
            const id = 'asset-' + sym.toLowerCase();
            const name = sym.charAt(0) + sym.slice(1).toLowerCase() + ' Token';
            const sector = sectors[i % sectors.length];
            const price = Math.random() > 0.5 ? Math.random() * 5 : Math.random() * 150 + 5;
            const cap = Math.floor(Math.random() * 500000000) + 10000000;
            const vol = Math.floor(cap * (Math.random() * 0.15 + 0.01));
            const change = parseFloat(((Math.random() - 0.48) * 15).toFixed(2));
            const riskRating = Math.random() > 0.8 ? 'Extreme' : (Math.random() > 0.6 ? 'High' : (Math.random() > 0.3 ? 'Medium' : 'Low'));

            const genericCoin = { id, name, symbol: sym, price, cap, vol, change, sector, riskRating };
            this.coins.push(this.enrichCoinMetrics(genericCoin));
        }
    },

    // Add deep technical and fundamental analytics parameters to each asset
    enrichCoinMetrics(coin) {
        const volumeMcapRatio = coin.vol / coin.cap;
        const isBullish = coin.change >= 0;

        return {
            ...coin,
            volumeMcapRatio,
            liquidityScore: Math.floor(Math.random() * 30) + (coin.id === 'bitcoin' || coin.id === 'ethereum' ? 68 : 45), // 45-98
            orderBookDepth: Math.floor(Math.random() * 10000000) + (coin.id === 'bitcoin' ? 15000000 : 500000), // USD bid/ask within 2%
            fundingRate: parseFloat(((Math.random() * 0.05) * (isBullish ? 1 : -0.5)).toFixed(4)),
            openInterest: Math.floor(coin.cap * 0.02 * (Math.random() * 0.5 + 0.8)), // 2% of Mcap average
            stablecoinFlows: Math.floor((Math.random() - 0.35) * 50000000), // Net inflows in USD
            socialSentiment: Math.floor(Math.random() * 40) + (isBullish ? 55 : 30), // % Bullish
            githubCommits: Math.floor(Math.random() * 300) + (coin.id === 'bitcoin' || coin.id === 'ethereum' ? 400 : 20),
            developerActivity: Math.random() > 0.7 ? 'Increasing' : (Math.random() > 0.3 ? 'Stable' : 'Declining'),
            exchangeInflow: Math.floor(Math.random() * 20000000),
            exchangeOutflow: Math.floor(Math.random() * 25000000),
            // Technical signals
            rsi: Math.floor(Math.random() * 40) + (isBullish ? 45 : 20), // 20-85
            macdSignal: isBullish ? 'Bullish Cross' : 'Bearish Cross',
            adxStrength: Math.floor(Math.random() * 40) + 10,
            emaAlignment: isBullish ? 'Bullish Stack' : 'Bearish Alignment',
            vwapSignal: isBullish ? 'Price Above' : 'Price Below',
            // Breakout parameters
            breakoutProbability: Math.floor(Math.random() * 60) + (isBullish ? 35 : 10), // %
            resistanceLevel: coin.price * 1.08,
            supportLevel: coin.price * 0.92,
            entryZone: `${(coin.price * 0.99).toFixed(3)} - ${(coin.price * 1.01).toFixed(3)}`,
            targetZones: [`${(coin.price * 1.10).toFixed(3)}`, `${(coin.price * 1.25).toFixed(3)}`],
            invalidationLevel: coin.price * 0.95
        };
    },

    // Generates simulated whale transactions
    generateWhaleTransactions(count) {
        this.whaleTransactions = [];
        const directions = ['Withdrawal', 'Deposit', 'Institutional Transfer', 'OTC Transfer'];
        const exchanges = ['Binance', 'OKX', 'Coinbase Custody', 'Kraken', 'Bybit'];

        for (let i = 0; i < count; i++) {
            const coin = this.coins[Math.floor(Math.random() * this.coins.length)];
            const direction = directions[Math.floor(Math.random() * directions.length)];
            const amount = Math.floor(Math.random() * 50000) + 100;
            const usdValue = amount * coin.price;
            const source = direction === 'Withdrawal' ? exchanges[Math.floor(Math.random() * exchanges.length)] : 'Unknown Wallet';
            const destination = direction === 'Deposit' ? exchanges[Math.floor(Math.random() * exchanges.length)] : 'Unknown Wallet';

            this.whaleTransactions.push({
                hash: '0x' + Math.random().toString(16).substring(2, 10) + '...' + Math.random().toString(16).substring(2, 6),
                coinId: coin.id,
                coinName: coin.name,
                symbol: coin.symbol,
                direction,
                amount,
                usdValue,
                source,
                destination,
                time: Math.floor(Math.random() * 59) + 1 + 'm ago',
                confidence: Math.floor(Math.random() * 25) + 75 // 75-99%
            });
        }
        // Sort by value desc
        this.whaleTransactions.sort((a, b) => b.usdValue - a.usdValue);
    },

    // Lifecycle manager for continuous updates
    startTicker() {
        if (this.tickerInterval) clearInterval(this.tickerInterval);

        const countdownEl = document.getElementById('sc-refresh-countdown');
        this.countdown = 15;

        this.tickerInterval = setInterval(() => {
            this.countdown--;
            if (this.countdown <= 0) {
                this.countdown = 15;
                this.updateSimulatedMarket();
            }
            if (countdownEl) {
                countdownEl.innerText = `${this.countdown}s`;
            }
        }, 1000);
    },

    // Update simulated prices and run checks
    updateSimulatedMarket() {
        this.coins.forEach(coin => {
            // Random price fluctuations between -2% and +2%
            const changePct = (Math.random() - 0.49) * 0.04; // Slightly positive bias
            coin.price = Math.max(0.000001, coin.price * (1 + changePct));
            coin.change += parseFloat((changePct * 100).toFixed(2));
            coin.vol = Math.max(10000, coin.vol * (1 + (Math.random() - 0.45) * 0.05));
            coin.volumeMcapRatio = coin.vol / coin.cap;

            // Fluctuating metric updates
            coin.rsi = Math.max(10, Math.min(90, coin.rsi + Math.floor((Math.random() - 0.5) * 6)));
            coin.breakoutProbability = Math.max(5, Math.min(98, coin.breakoutProbability + Math.floor((Math.random() - 0.48) * 4)));
            coin.stablecoinFlows += Math.floor((Math.random() - 0.45) * 2000000);

            // Trigger alert checks
            this.checkAlertRules(coin);
        });

        // Add a new whale transaction occasionally
        if (Math.random() > 0.4) {
            const coin = this.coins[Math.floor(Math.random() * this.coins.length)];
            const direction = Math.random() > 0.5 ? 'Withdrawal' : 'Deposit';
            const amount = Math.floor(Math.random() * 25000) + 50;
            const usdValue = amount * coin.price;

            const newTx = {
                hash: '0x' + Math.random().toString(16).substring(2, 10) + '...' + Math.random().toString(16).substring(2, 6),
                coinId: coin.id,
                coinName: coin.name,
                symbol: coin.symbol,
                direction,
                amount,
                usdValue,
                source: direction === 'Withdrawal' ? 'Exchange' : 'Unknown Wallet',
                destination: direction === 'Deposit' ? 'Exchange' : 'Unknown Wallet',
                time: 'Just now',
                confidence: Math.floor(Math.random() * 20) + 80
            };
            this.whaleTransactions.unshift(newTx);
            if (this.whaleTransactions.length > 50) this.whaleTransactions.pop();

            // Trigger potential alert check for whale buy
            if (usdValue >= 1000000) {
                this.checkAlertWhale(coin, usdValue);
            }
        }

        this.updateUI();
    },

    loadAlerts() {
        this.alerts = Store.get('sc_alerts', [
            { id: 1, coinId: 'bitcoin', metric: 'ai-score', threshold: 90, active: true },
            { id: 2, coinId: 'ethereum', metric: 'whale-buy', threshold: 5000000, active: true },
            { id: 3, coinId: 'solana', metric: 'volume-increase', threshold: 300, active: true },
            { id: 4, coinId: 'render-token', metric: 'breakout', threshold: 80, active: true }
        ]);
        this.alertsLog = Store.get('sc_alerts_log', [
            { time: '20m ago', coin: 'Solana', message: '🚨 ALERT: SOL AI Score hit 92/100 (Strong Buy Regime)', type: 'success' },
            { time: '45m ago', coin: 'Bitcoin', message: '🐋 WHALE: $12.4M BTC withdrawn from Coinbase Custody', type: 'warning' },
            { time: '1h ago', coin: 'Render', message: '📈 VOLUME: RNDR Volume surged 342% preceding price jump', type: 'info' }
        ]);
    },

    initCopilot() {
        const chat = document.getElementById('sc-copilot-chat');
        if (!chat) return;

        chat.innerHTML = '';
        this.appendChatMessage('system', 'Initializing secure cryptographic sandbox...', true);
        this.appendChatMessage('ai', 'Welcome to BlackStack Intelligence Copilot. I am your institutional terminal assistant, continuously processing pricing vectors, order books, whale movements, developer commits, and sector narratives across 100+ assets.\n\nHow can I assist your market analysis today? You can choose one of the suggested instructions below or ask me any custom query.', true);
    },

    appendChatMessage(sender, text, isAi = false) {
        const chat = document.getElementById('sc-copilot-chat');
        if (!chat) return;

        const msg = document.createElement('div');
        msg.className = `flex flex-col ${isAi ? 'items-start' : 'items-end'} fade-in mb-3`;

        const senderLabel = sender === 'system' ? 'SYSTEM' : (isAi ? 'BLACKSTACK AI' : 'USER');
        const bgClass = sender === 'system' ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400 font-mono' : (isAi ? 'bg-white/5 border border-white/5 text-slate-200' : 'bg-amber-500/10 border border-amber-500/20 text-white');

        msg.innerHTML = `
            <span class="text-[8px] font-black tracking-widest text-dark-muted mb-1 uppercase">${senderLabel}</span>
            <div class="px-4 py-3 rounded-2xl max-w-xl text-xs font-semibold leading-relaxed whitespace-pre-line ${bgClass}">
                ${text}
            </div>
        `;
        chat.appendChild(msg);
        chat.scrollTop = chat.scrollHeight;
    },

    async handleCopilotSubmit(queryText = '') {
        const input = document.getElementById('sc-copilot-input');
        const query = queryText || (input ? input.value.trim() : '');
        if (!query) return;

        if (input && !queryText) input.value = '';

        // Append user query
        this.appendChatMessage('user', query, false);

        // Show thinking indicator
        const thinkingId = 'think-' + Date.now();
        const chat = document.getElementById('sc-copilot-chat');
        if (chat) {
            const thinkingMsg = document.createElement('div');
            thinkingMsg.id = thinkingId;
            thinkingMsg.className = 'flex flex-col items-start fade-in mb-3';
            thinkingMsg.innerHTML = `
                <span class="text-[8px] font-black tracking-widest text-dark-muted mb-1">BLACKSTACK AI</span>
                <div class="px-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-dark-muted font-bold flex items-center gap-2">
                    <div class="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></div>
                    Thinking and fetching on-chain parameters...
                </div>
            `;
            chat.appendChild(thinkingMsg);
            chat.scrollTop = chat.scrollHeight;
        }

        // Check if we have an API Key configured
        const activeProvider = Store.getDefaultAIProvider();
        const keys = Store.getAIKeys();
        const hasKey = keys[activeProvider];

        let aiResponse = '';
        if (hasKey) {
            try {
                aiResponse = await this.fetchExternalAIResponse(activeProvider, query);
            } catch (err) {
                console.error('External AI fetch failed, falling back to heuristic engine:', err);
                aiResponse = this.generateHeuristicResponse(query);
            }
        } else {
            // Simulated network latency
            await new Promise(resolve => setTimeout(resolve, 800));
            aiResponse = this.generateHeuristicResponse(query);
        }

        // Remove thinking message
        const thinkingEl = document.getElementById(thinkingId);
        if (thinkingEl) thinkingEl.remove();

        // Stream or append AI response
        this.appendChatMessage('ai', aiResponse, true);
    },

    // High-Fidelity Rule-based Heuristic Generator Fallback
    generateHeuristicResponse(query) {
        const lower = query.toLowerCase();

        // Preset scored database sorting helpers
        const scored = this.coins.map(c => ({ ...c, ai: this.calculateAIScores(c) }));

        if (lower.includes('accumulated') || lower.includes('accumulation')) {
            const accCoins = [...scored].sort((a, b) => b.ai.whale - a.ai.whale).slice(0, 3);
            return `Based on real-time on-chain capital flows and institutional wallet tracking, these are the top accumulated assets:

1. **${accCoins[0].name} (${accCoins[0].symbol})** - AI Accumulation Score: **${accCoins[0].ai.whale}/100**. This asset exhibits significant cold custody withdrawals and a positive net stablecoin flow of +$${(accCoins[0].stablecoinFlows / 1e6).toFixed(1)}M.
2. **${accCoins[1].name} (${accCoins[1].symbol})** - AI Accumulation Score: **${accCoins[1].ai.whale}/100**. Heavy smart money cluster buys detected in the $500k - $2M range during local consolidations.
3. **${accCoins[2].name} (${accCoins[2].symbol})** - AI Accumulation Score: **${accCoins[2].ai.whale}/100**. Stable addresses showing a continuous holding lockup growth with minimal exchange deposits.

*Indicators cited: Whale Accumulation Index, Net Stablecoin Inflow, Exchange Reserve Withdrawal Velocity.*`;
        }

        if (lower.includes('outperforming') || lower.includes('sectors') || lower.includes('rotation')) {
            return `My narrative analyzer indicates high-conviction sector rotation trends:

- **AI & Spatial Computing** leads the workspace momentum with an average sector sentiment rating of **88/100**. We are tracking heavy capital inflows from Layer 1 profits rotating directly into **RENDER** and AI-adjacent assets.
- **RWA (Real World Assets)** is showing a robust trend acceleration with speed metrics at **84/100** driven by increased institutional treasury mints and DeFi collateralization integrations.
- Money is currently leaving high-multiplier **Meme** sectors and rotating into defensive **Layer 1** protocols to hedge macroeconomic interest rate CPI announcements.

*Current Money Flow Direction: Meme → Layer 1 → AI → DePIN.*`;
        }

        if (lower.includes('institutional') || lower.includes('institution')) {
            const instCoins = [...scored].sort((a, b) => b.ai.institutional - a.ai.institutional).slice(0, 3);
            return `Institutional interest index is peaking around deep liquidity corridors:

1. **${instCoins[0].name} (${instCoins[0].symbol})** - Institutional Score: **${instCoins[0].ai.institutional}/100**. Highly robust order book depth ($${(instCoins[0].orderBookDepth / 1e6).toFixed(1)}M within 2%) and direct backing across SEC-compliant spot ETF desks.
2. **${instCoins[1].name} (${instCoins[1].symbol})** - Institutional Score: **${instCoins[1].ai.institutional}/100**. Extreme liquidity score and premium funding rate patterns indicative of secular custody accumulation.
3. **${instCoins[2].name} (${instCoins[2].symbol})** - Institutional Score: **${instCoins[2].ai.institutional}/100**. Strategic corporate partnerships and open-source infrastructure commitments represent massive capital alignment.`;
        }

        if (lower.includes('hidden') || lower.includes('gems') || lower.includes('opportunity')) {
            // Sort by Opportunity score (represented by high overallRating and low market cap)
            const gems = [...scored].filter(c => c.cap < 5000000000).sort((a, b) => b.ai.overallRating - a.ai.overallRating).slice(0, 3);
            return `Early opportunity scanning complete. These high-potential "hidden gems" exhibit low cap volatility compression:

1. **${gems[0].name} (${gems[0].symbol})** - Overall AI Rating: **${gems[0].ai.overallRating}/100** (Score rating: ${gems[0].ai.ratingLabel}). Currently experiencing low-volume price consolidation inside an accumulation channel. Developer activity has increased with **${gems[0].githubCommits} commits** this month.
2. **${gems[1].name} (${gems[1].symbol})** - Overall AI Rating: **${gems[1].ai.overallRating}/100**. On-chain wallets count increased by **+${(Math.random()*4+1).toFixed(2)}%** while retail social mentions remain low—indicative of a high-probability hidden accumulation phase.
3. **${gems[2].name} (${gems[2].symbol})** - Overall AI Rating: **${gems[2].ai.overallRating}/100**. Strong technical structure showing a breakout probability of **${gems[2].breakoutProbability}%** and stable support zones.`;
        }

        if (lower.includes('breakout')) {
            const brkCoins = [...scored].sort((a, b) => b.breakoutProbability - a.breakoutProbability).slice(0, 3);
            return `Breakout scanner detects immediate volatility expansion probability:

1. **${brkCoins[0].name} (${brkCoins[0].symbol})** - Breakout Probability: **${brkCoins[0].breakoutProbability}%**. Volatility compression metrics have reached extreme limits. Resistance breakout target zone is set at **$${brkCoins[0].targetZones[0]}** with invalidation levels strictly at $${brkCoins[0].invalidationLevel.toFixed(2)}.
2. **${brkCoins[1].name} (${brkCoins[1].symbol})** - Breakout Probability: **${brkCoins[1].breakoutProbability}%**. Supported by EMA alignment stacking. RSI is currently at **${brkCoins[1].rsi}**, providing a healthy runway before overbought thresholds are breached.
3. **${brkCoins[2].name} (${brkCoins[2].symbol})** - Breakout Probability: **${brkCoins[2].breakoutProbability}%**. Order books bid walls are stacking up, suggesting a high-probability trigger.`;
        }

        if (lower.includes('developer') || lower.includes('github') || lower.includes('commits')) {
            const devCoins = [...scored].sort((a, b) => b.githubCommits - a.githubCommits).slice(0, 3);
            return `My developer intelligence scanner is tracking active repository commits:

1. **${devCoins[0].name} (${devCoins[0].symbol})** - **${devCoins[0].githubCommits} commits** in the last 30 days. Developer activity is classified as **${devCoins[0].developerActivity}**, showing rapid code updates in protocol privacy layers.
2. **${devCoins[1].name} (${devCoins[1].symbol})** - **${devCoins[1].githubCommits} commits** in the last 30 days. Active pull requests suggest a major core upgrade rollout is imminent.
3. **${devCoins[2].name} (${devCoins[2].symbol})** - **${devCoins[2].githubCommits} commits** in the last 30 days, representing solid technological momentum.`;
        }

        // Generic catch-all asset lookup
        const found = this.coins.find(c => lower.includes(c.id) || lower.includes(c.symbol.toLowerCase()));
        if (found) {
            const sc = this.calculateAIScores(found);
            return `I have conducted a multi-factor intelligence sweep on **${found.name} (${found.symbol})**:

- **Current Market Price**: $${found.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
- **Overall AI Rating**: **${sc.overallRating}/100** (${sc.ratingLabel})
- **Technical Signals**: RSI is at **${found.rsi}** (${found.rsi > 70 ? 'Overbought' : (found.rsi < 30 ? 'Oversold' : 'Neutral')}). MACD indicates **${found.macdSignal}** with EMA alignment in a **${found.emaAlignment}**.
- **Whale Accumulation**: Scored at **${sc.whale}/100** with net flows at +$${(found.stablecoinFlows / 1e6).toFixed(1)}M.
- **Risk Assessment**: Configured as **${found.riskRating} Risk** with a custom risk rating score of **${sc.risk}/100**.

*Why this rating?* ${found.change >= 0 ? 'Consistent accumulation volume supports trend continuation. Liquidity profiles are healthy and stable.' : 'Market is undergoing profit-taking consolidation. Watch support levels closely before capital redeployment.'}`;
        }

        return `I have processed your query: "${query}".

As your BlackStack assistant, I can provide deep on-chain parameters. Try instructing me to:
- *"Find coins being accumulated"*
- *"Which AI coins have institutional buying"*
- *"Show hidden gems"*
- *"What coins have breakout probability above 80%"*
- *"Show deep stats on BTC"* (or any other coin symbol)`;
    },

    // Secure multi-provider AI endpoints integration
    async fetchExternalAIResponse(provider, query) {
        const apiKey = await Store.getDecryptedAIKey(provider);
        if (!apiKey) throw new Error('API Key missing for selected provider');

        // Compile real-time database snapshot for prompt injection
        const picks = this.coins.map(c => ({
            name: c.name,
            symbol: c.symbol,
            price: c.price,
            change: c.change,
            rsi: c.rsi,
            breakout: c.breakoutProbability,
            sector: c.sector
        })).slice(0, 10);

        const systemPrompt = `You are BlackStack AI Copilot, a premium institutional trading assistant.
Here is the real-time market scanner state of the top 10 assets:
${JSON.stringify(picks, null, 2)}

Provide a highly analytical, institutional, clear, and actionable response. Always quote specific technical indicator numbers from the scanner context where relevant. Format using bold titles and structured numbered list steps. Do not use generic fluffy comments.`;

        let url = '';
        let headers = { 'Content-Type': 'application/json' };
        let body = {};

        if (provider === 'openai') {
            url = 'https://api.openai.com/v1/chat/completions';
            headers['Authorization'] = `Bearer ${apiKey}`;
            body = {
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: query }
                ],
                temperature: 0.7
            };
        } else if (provider === 'anthropic') {
            url = 'https://api.anthropic.com/v1/messages';
            headers['x-api-key'] = apiKey;
            headers['anthropic-version'] = '2023-06-01';
            body = {
                model: 'claude-3-5-haiku-20241022',
                max_tokens: 1024,
                messages: [
                    { role: 'user', content: `${systemPrompt}\n\nUser Question: ${query}` }
                ]
            };
        } else if (provider === 'gemini') {
            url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            body = {
                contents: [
                    { parts: [{ text: `${systemPrompt}\n\nUser Question: ${query}` }] }
                ]
            };
        } else if (provider === 'openrouter') {
            url = 'https://openrouter.ai/api/v1/chat/completions';
            headers['Authorization'] = `Bearer ${apiKey}`;
            headers['HTTP-Referer'] = 'https://blackstack.intelligence/';
            headers['X-Title'] = 'BlackStack Intelligence';
            body = {
                model: 'openrouter/auto',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: query }
                ]
            };
        } else if (provider === 'deepseek') {
            url = 'https://api.deepseek.com/v1/chat/completions';
            headers['Authorization'] = `Bearer ${apiKey}`;
            body = {
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: query }
                ]
            };
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || `API error! status: ${response.status}`);
            }

            const data = await response.json();

            // Format response mappings
            if (provider === 'openai' || provider === 'openrouter' || provider === 'deepseek') {
                return data.choices[0].message.content;
            } else if (provider === 'anthropic') {
                return data.content[0].text;
            } else if (provider === 'gemini') {
                return data.candidates[0].content.parts[0].text;
            }
            return 'Response received, but format could not be parsed.';
        } catch (e) {
            console.error('External LLM Request failed:', e);
            throw e;
        }
    },

    // Connection testing checker
    async testAIConnection(provider, apiKey) {
        if (!apiKey) return false;

        let url = '';
        let headers = { 'Content-Type': 'application/json' };
        let body = {};

        if (provider === 'openai') {
            url = 'https://api.openai.com/v1/chat/completions';
            headers['Authorization'] = `Bearer ${apiKey}`;
            body = {
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: 'respond only with ok' }],
                max_tokens: 5
            };
        } else if (provider === 'anthropic') {
            url = 'https://api.anthropic.com/v1/messages';
            headers['x-api-key'] = apiKey;
            headers['anthropic-version'] = '2023-06-01';
            body = {
                model: 'claude-3-5-haiku-20241022',
                max_tokens: 5,
                messages: [{ role: 'user', content: 'respond ok' }]
            };
        } else if (provider === 'gemini') {
            url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            body = {
                contents: [{ parts: [{ text: 'respond ok' }] }]
            };
        } else if (provider === 'openrouter') {
            url = 'https://openrouter.ai/api/v1/chat/completions';
            headers['Authorization'] = `Bearer ${apiKey}`;
            body = {
                model: 'openrouter/auto',
                messages: [{ role: 'user', content: 'respond ok' }],
                max_tokens: 5
            };
        } else if (provider === 'deepseek') {
            url = 'https://api.deepseek.com/v1/chat/completions';
            headers['Authorization'] = `Bearer ${apiKey}`;
            body = {
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: 'respond ok' }],
                max_tokens: 5
            };
        }

        try {
            // For testing connection, let's timeout after 5 seconds to keep UX fast
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
                signal: controller.signal
            });
            clearTimeout(id);

            return response.ok;
        } catch (e) {
            console.error('Connection test failed:', e);
            return false;
        }
    },

    // Save and Delete key event routines
    async handleSaveKey() {
        const provider = document.getElementById('sc-settings-provider').value;
        const key = document.getElementById('sc-settings-key').value.trim();

        if (!key) {
            if (window.showNotification) window.showNotification('Please enter a valid key', 'error');
            return;
        }

        await Store.saveAIKey(provider, key);
        document.getElementById('sc-settings-key').value = '';
        this.renderSettingsTab();
        this.updateStatsBar();

        if (window.showNotification) window.showNotification(`${provider.toUpperCase()} API Key successfully encrypted and stored`, 'success');
    },

    handleDeleteKey() {
        const provider = document.getElementById('sc-settings-provider').value;
        Store.deleteAIKey(provider);
        this.renderSettingsTab();
        this.updateStatsBar();

        if (window.showNotification) window.showNotification(`${provider.toUpperCase()} API Key deleted successfully`, 'info');
    },

    toggleKeyVisibility() {
        const input = document.getElementById('sc-settings-key');
        const icon = document.querySelector('#sc-toggle-key-visibility i');
        if (input) {
            if (input.type === 'password') {
                input.type = 'text';
                if (icon) icon.setAttribute('data-lucide', 'eye-off');
            } else {
                input.type = 'password';
                if (icon) icon.setAttribute('data-lucide', 'eye');
            }
            lucide.createIcons();
        }
    },

    // Settings tab UI validation values
    async renderSettingsTab() {
        const provider = document.getElementById('sc-settings-provider')?.value || 'openai';
        const keys = Store.getAIKeys();
        const hasKey = !!keys[provider];

        const statusText = document.getElementById('sc-connection-status');
        const scProviderStatus = document.getElementById('copilot-provider-status');

        if (statusText) {
            if (hasKey) {
                statusText.innerText = 'Key Encrypted At-Rest (Pending verification)';
                statusText.className = 'text-sm font-black text-amber-500';
            } else {
                statusText.innerText = 'No API Key Configured';
                statusText.className = 'text-sm font-black text-dark-muted';
            }
        }

        if (scProviderStatus) {
            if (hasKey) {
                scProviderStatus.innerText = 'API Direct Vector Connection Available';
                scProviderStatus.className = 'text-[10px] font-black text-amber-500';
            } else {
                scProviderStatus.innerText = 'Using Simulated Local Engine';
                scProviderStatus.className = 'text-[10px] font-black text-blue-400';
            }
        }
    },

    setupEventListeners() {
        // Sub-tabs navigation
        document.querySelectorAll('.scanner-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.scannerTab || btn.getAttribute('data-scanner-tab');
                this.switchTab(tab);
            });
        });

        // Search in scanner dashboard
        const searchInput = document.getElementById('sc-dashboard-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.renderPicksTable();
            });
        }

        // Quick filters click
        document.querySelectorAll('.sc-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.sc-filter-btn').forEach(b => b.classList.remove('active', 'text-white'));
                document.querySelectorAll('.sc-filter-btn').forEach(b => b.classList.add('text-slate-400'));

                btn.classList.add('active', 'text-white');
                btn.classList.remove('text-slate-400');

                this.currentFilter = btn.dataset.filter || btn.getAttribute('data-filter');
                this.renderPicksTable();
            });
        });

        // Whale Threshold drop selector
        const whaleSel = document.getElementById('sc-whale-threshold');
        if (whaleSel) {
            whaleSel.addEventListener('change', () => {
                this.renderWhaleTransactionFeed();
            });
        }

        // Alert rule creation submit
        const alertForm = document.getElementById('sc-create-alert-form');
        if (alertForm) {
            alertForm.addEventListener('submit', (e) => this.handleAlertCreation(e));
        }

        // Clear alerts log button
        const clearAlertsBtn = document.getElementById('sc-clear-alerts');
        if (clearAlertsBtn) {
            clearAlertsBtn.addEventListener('click', () => {
                this.alertsLog = [];
                Store.set('sc_alerts_log', []);
                this.renderAlertsLog();
                if (window.showNotification) window.showNotification('Alert logs cleared', 'info');
            });
        }

        // Copilot suggestions click
        document.querySelectorAll('.copilot-suggest-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const query = btn.innerText.replace(/"/g, '').trim();
                this.handleCopilotSubmit(query);
            });
        });

        // Copilot input enter key & send button
        const copilotSend = document.getElementById('sc-copilot-send');
        const copilotInput = document.getElementById('sc-copilot-input');
        if (copilotSend) {
            copilotSend.addEventListener('click', () => this.handleCopilotSubmit());
        }
        if (copilotInput) {
            copilotInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.handleCopilotSubmit();
            });
        }

        // Settings Provider Change
        const settingsProv = document.getElementById('sc-settings-provider');
        if (settingsProv) {
            settingsProv.addEventListener('change', () => this.renderSettingsTab());
        }

        // Settings Key Toggle visibility
        const settingsVis = document.getElementById('sc-toggle-key-visibility');
        if (settingsVis) {
            settingsVis.addEventListener('click', () => this.toggleKeyVisibility());
        }

        // Settings Save & Delete Key Buttons
        const saveKeyBtn = document.getElementById('sc-save-key-btn');
        if (saveKeyBtn) {
            saveKeyBtn.addEventListener('click', () => this.handleSaveKey());
        }
        const delKeyBtn = document.getElementById('sc-delete-key-btn');
        if (delKeyBtn) {
            delKeyBtn.addEventListener('click', () => this.handleDeleteKey());
        }

        // Settings Test Connection Button
        const testConnBtn = document.getElementById('sc-test-conn-btn');
        if (testConnBtn) {
            testConnBtn.addEventListener('click', async () => {
                const provider = document.getElementById('sc-settings-provider').value;
                const statusText = document.getElementById('sc-connection-status');

                const keys = Store.getAIKeys();
                const encryptedKey = keys[provider];
                if (!encryptedKey) {
                    if (window.showNotification) window.showNotification('Please configure and save an API key first', 'error');
                    return;
                }

                if (statusText) {
                    statusText.innerText = 'Testing connection...';
                    statusText.className = 'text-sm font-black text-amber-500 animate-pulse';
                }

                const decryptedKey = await Store.getDecryptedAIKey(provider);
                const isSuccess = await this.testAIConnection(provider, decryptedKey);

                if (statusText) {
                    if (isSuccess) {
                        statusText.innerText = `✓ Connected successfully to ${provider.toUpperCase()}`;
                        statusText.className = 'text-sm font-black text-emerald-500';
                        if (window.showNotification) window.showNotification('✓ Connection test passed!', 'success');
                    } else {
                        statusText.innerText = `Connection Error: Unauthorized / Invalid Key for ${provider.toUpperCase()}`;
                        statusText.className = 'text-sm font-black text-red-500';
                        if (window.showNotification) window.showNotification('Connection test failed. Check your API key.', 'error');
                    }
                }
            });
        }
    },

    switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.scanner-tab-btn').forEach(btn => {
            const btnTab = btn.dataset.scannerTab || btn.getAttribute('data-scanner-tab');
            if (btnTab === tab) {
                btn.classList.add('border-amber-500', 'text-white');
                btn.classList.remove('border-transparent', 'text-slate-400');
            } else {
                btn.classList.remove('border-amber-500', 'text-white');
                btn.classList.add('border-transparent', 'text-slate-400');
            }
        });

        document.querySelectorAll('.scanner-tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        const activeContent = document.getElementById(`sc-tab-${tab}`);
        if (activeContent) {
            activeContent.classList.remove('hidden');
        }
    },

    // AI Multi-Factor Scoring Engine
    calculateAIScores(coin) {
        const isBullish = coin.change >= 0;

        const bullish = Math.max(10, Math.min(99, Math.floor((isBullish ? 65 : 25) + (coin.rsi - 50) * 0.4 + (coin.breakoutProbability - 50) * 0.3 + (coin.id === 'pepe' || coin.id === 'solana' ? 12 : 0) + (coin.symbol.charCodeAt(0) % 8))));
        const bearish = Math.max(10, Math.min(99, Math.floor((isBullish ? 25 : 65) - (coin.rsi - 50) * 0.4 + (coin.symbol.charCodeAt(1) % 8))));
        const momentum = Math.max(10, Math.min(99, Math.floor(coin.rsi * 0.8 + coin.adxStrength * 0.4 + (coin.symbol.charCodeAt(2) % 6))));
        const institutional = Math.max(10, Math.min(99, Math.floor(coin.liquidityScore * 0.5 + (coin.id === 'bitcoin' || coin.id === 'ethereum' ? 45 : 30) + (coin.symbol.charCodeAt(0) % 8))));
        const whale = Math.max(10, Math.min(99, Math.floor(coin.socialSentiment * 0.5 + (isBullish ? 35 : 15) + (coin.symbol.charCodeAt(1) % 8))));
        const volume = Math.max(10, Math.min(99, Math.floor(coin.volumeMcapRatio * 400 + 40 + (coin.symbol.charCodeAt(2) % 10))));
        const risk = Math.max(5, Math.min(99, Math.floor(coin.riskRating === 'Extreme' ? 88 : (coin.riskRating === 'High' ? 68 : (coin.riskRating === 'Medium' ? 38 : 12)) + (coin.symbol.charCodeAt(0) % 5))));
        const narrative = Math.max(10, Math.min(99, Math.floor(coin.socialSentiment * 0.6 + coin.githubCommits * 0.05 + (coin.symbol.charCodeAt(1) % 10))));

        let overallRating = Math.max(10, Math.min(99, Math.round((bullish * 0.25 + momentum * 0.2 + institutional * 0.2 + whale * 0.15 + volume * 0.1 + (100 - risk) * 0.1))));

        let ratingLabel = 'Hold';
        if (overallRating >= 85) ratingLabel = 'Strong Buy';
        else if (overallRating >= 70) ratingLabel = 'Buy';
        else if (overallRating <= 35) ratingLabel = 'Strong Sell';
        else if (overallRating <= 50) ratingLabel = 'Sell';

        return { bullish, bearish, momentum, institutional, whale, volume, risk, narrative, overallRating, ratingLabel };
    },

    updateUI() {
        this.renderPicksTable();
        this.renderDashboardWidgets();
        this.renderWhaleTransactionFeed();
        this.renderExchangeFlowTracker();
        this.renderSectorRotation();
        this.updateStatsBar();
        this.renderActiveAlertRules();
        this.renderAlertsLog();
        this.populateCoinsSelector();
    },

    // 1. High-Conviction Picks Table
    renderPicksTable() {
        const table = document.getElementById('sc-picks-table');
        if (!table) return;

        // Generate scores for all coins and sort by overallRating desc
        const scoredCoins = this.coins.map(coin => ({
            ...coin,
            ai: this.calculateAIScores(coin)
        })).sort((a, b) => b.ai.overallRating - a.ai.overallRating);

        // Apply filters
        const filtered = scoredCoins.filter(coin => {
            const matchesSearch = coin.name.toLowerCase().includes(this.searchQuery) || coin.symbol.toLowerCase().includes(this.searchQuery);
            if (!matchesSearch) return false;

            if (this.currentFilter === 'bullish') return coin.ai.overallRating >= 85;
            if (this.currentFilter === 'breakout') return coin.breakoutProbability >= 75;
            if (this.currentFilter === 'whale') return coin.ai.whale >= 75 && coin.change > 0;
            if (this.currentFilter === 'highrisk') return coin.ai.risk >= 70;
            return true;
        });

        let html = `
            <thead>
                <tr class="text-[10px] text-dark-muted font-black uppercase tracking-widest border-b border-white/5">
                    <th class="py-3 px-4">Asset</th>
                    <th class="py-3 px-4 text-right">Price</th>
                    <th class="py-3 px-4 text-right">24H Change</th>
                    <th class="py-3 px-4 text-center">Bullish</th>
                    <th class="py-3 px-4 text-center">Bearish</th>
                    <th class="py-3 px-4 text-center">Momentum</th>
                    <th class="py-3 px-4 text-center">Whale</th>
                    <th class="py-3 px-4 text-center">Risk</th>
                    <th class="py-3 px-4 text-center">Overall Rating</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
        `;

        if (filtered.length === 0) {
            html += `
                <tr>
                    <td colspan="9" class="py-8 text-center text-xs text-dark-muted font-bold">No assets found matching current criteria.</td>
                </tr>
            `;
        } else {
            html += filtered.slice(0, 10).map(coin => {
                const color = coin.ai.overallRating >= 85 ? 'text-emerald-500' : (coin.ai.overallRating >= 70 ? 'text-green-400' : (coin.ai.overallRating <= 35 ? 'text-red-500' : 'text-slate-300'));
                return `
                    <tr class="hover:bg-white/5 transition-colors cursor-pointer ci-research-trigger-btn" data-id="${coin.id}">
                        <td class="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                            <span class="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center font-black text-xs text-amber-500">${coin.symbol[0]}</span>
                            <div>
                                <div class="text-xs font-black">${coin.name}</div>
                                <div class="text-[9px] text-dark-muted uppercase font-bold">${coin.symbol} • ${coin.sector}</div>
                            </div>
                        </td>
                        <td class="py-3.5 px-4 text-right font-bold text-white">$${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                        <td class="py-3.5 px-4 text-right font-black ${coin.change >= 0 ? 'text-emerald-500' : 'text-red-500'}">${coin.change >= 0 ? '+' : ''}${coin.change.toFixed(2)}%</td>
                        <td class="py-3.5 px-4 text-center font-black text-white">${coin.ai.bullish}</td>
                        <td class="py-3.5 px-4 text-center font-black text-white">${coin.ai.bearish}</td>
                        <td class="py-3.5 px-4 text-center font-black text-white">${coin.ai.momentum}</td>
                        <td class="py-3.5 px-4 text-center font-black text-white">${coin.ai.whale}</td>
                        <td class="py-3.5 px-4 text-center font-black ${coin.ai.risk >= 70 ? 'text-red-500' : 'text-emerald-500'}">${coin.ai.risk}</td>
                        <td class="py-3.5 px-4 text-center font-black">
                            <div class="inline-block px-2.5 py-1 rounded bg-white/5 border border-white/5">
                                <span class="${color}">${coin.ai.overallRating}</span>
                                <span class="text-[8px] text-dark-muted block uppercase tracking-widest font-black">${coin.ai.ratingLabel}</span>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        html += '</tbody>';
        table.innerHTML = html;
    },

    // 2. Dashboard Widgets Grid
    renderDashboardWidgets() {
        const breakoutsContainer = document.getElementById('widget-breakouts');
        const accumulationContainer = document.getElementById('widget-accumulation');
        const narrativesContainer = document.getElementById('widget-narratives');
        const riskContainer = document.getElementById('widget-risk');

        // Prepare data
        const scored = this.coins.map(coin => ({ ...coin, ai: this.calculateAIScores(coin) }));

        // Breakouts (Sorted by breakoutProbability desc)
        if (breakoutsContainer) {
            const breakouts = [...scored].sort((a, b) => b.breakoutProbability - a.breakoutProbability).slice(0, 4);
            breakoutsContainer.innerHTML = breakouts.map(b => `
                <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-amber-500/10 transition-all">
                    <div>
                        <div class="text-xs font-black text-white">${b.name} <span class="text-[9px] text-dark-muted uppercase font-bold">${b.symbol}</span></div>
                        <div class="text-[9px] text-dark-muted mt-0.5">Target: <span class="text-emerald-500 font-bold">$${b.targetZones[0]}</span> • Inval: $${b.invalidationLevel.toFixed(2)}</div>
                    </div>
                    <div class="text-right">
                        <span class="text-xs font-black text-amber-500">${b.breakoutProbability}%</span>
                        <span class="text-[8px] text-dark-muted block uppercase tracking-widest font-black">Prob.</span>
                    </div>
                </div>
            `).join('');
        }

        // Accumulation (Whale buying & smart money)
        if (accumulationContainer) {
            const acc = [...scored].sort((a, b) => b.ai.whale - a.ai.whale).slice(0, 4);
            accumulationContainer.innerHTML = acc.map(a => `
                <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-amber-500/10 transition-all">
                    <div>
                        <div class="text-xs font-black text-white">${a.name} <span class="text-[9px] text-dark-muted uppercase font-bold">${a.symbol}</span></div>
                        <div class="text-[9px] text-dark-muted mt-0.5">Whale Confidence: <span class="text-emerald-400 font-bold">High</span> • Flow: +$${(a.stablecoinFlows / 1e6).toFixed(1)}M</div>
                    </div>
                    <div class="text-right">
                        <span class="text-xs font-black text-emerald-500">${a.ai.whale}</span>
                        <span class="text-[8px] text-dark-muted block uppercase tracking-widest font-black">Accum Score</span>
                    </div>
                </div>
            `).join('');
        }

        // Narratives
        if (narrativesContainer) {
            const sectors = ['AI', 'DeFi', 'RWA', 'Gaming', 'Layer 2', 'DePIN', 'Meme', 'Infrastructure', 'Privacy', 'Stablecoins'];
            const narrativeData = sectors.map(sec => {
                const secCoins = scored.filter(c => c.sector === sec);
                const avgPerformance = secCoins.reduce((sum, c) => sum + c.change, 0) / (secCoins.length || 1);
                const avgSc = secCoins.reduce((sum, c) => sum + c.ai.overallRating, 0) / (secCoins.length || 1);
                const capitalInflow = secCoins.reduce((sum, c) => sum + Math.abs(c.stablecoinFlows), 0);
                return {
                    name: sec,
                    perf: avgPerformance,
                    score: Math.round(avgSc),
                    inflow: capitalInflow
                };
            }).sort((a, b) => b.perf - a.perf).slice(0, 4);

            narrativesContainer.innerHTML = narrativeData.map(n => `
                <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-amber-500/10 transition-all">
                    <div>
                        <div class="text-xs font-black text-white">${n.name} <span class="text-[9px] text-emerald-500 font-bold">▲ ${n.perf.toFixed(1)}%</span></div>
                        <div class="text-[9px] text-dark-muted mt-0.5">Capital Inflow: <span class="text-white font-bold">$${(n.inflow / 1e6).toFixed(1)}M</span></div>
                    </div>
                    <div class="text-right">
                        <span class="text-xs font-black text-white">${n.score}/100</span>
                        <span class="text-[8px] text-dark-muted block uppercase tracking-widest font-black">Sentiment</span>
                    </div>
                </div>
            `).join('');
        }

        // High Risk Warning Flags
        if (riskContainer) {
            const highRisk = [...scored].sort((a, b) => b.ai.risk - a.ai.risk).slice(0, 4);
            riskContainer.innerHTML = highRisk.map(r => {
                const color = r.ai.risk >= 80 ? 'text-red-500' : 'text-orange-500';
                return `
                    <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-red-500/10 transition-all">
                        <div>
                            <div class="text-xs font-black text-white">${r.name} <span class="text-[9px] text-red-500 font-bold">${r.riskRating}</span></div>
                            <div class="text-[9px] text-dark-muted mt-0.5">Contract Risks: <span class="text-red-400 font-bold">High Leverage</span></div>
                        </div>
                        <div class="text-right">
                            <span class="text-xs font-black ${color}">${r.ai.risk}</span>
                            <span class="text-[8px] text-dark-muted block uppercase tracking-widest font-black">Risk Score</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    },

    // 3. Whale Transactions List
    renderWhaleTransactionFeed() {
        const container = document.getElementById('sc-whale-list');
        const thresholdEl = document.getElementById('sc-whale-threshold');
        if (!container) return;

        const threshold = thresholdEl ? parseInt(thresholdEl.value) : 1000000;
        const filtered = this.whaleTransactions.filter(tx => tx.usdValue >= threshold);

        if (filtered.length === 0) {
            container.innerHTML = `<div class="p-4 text-center text-xs text-dark-muted font-bold">No whale transactions above $${(threshold/1e6).toFixed(1)}M detected.</div>`;
            return;
        }

        container.innerHTML = filtered.map(tx => {
            const dirColor = tx.direction === 'Withdrawal' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : (tx.direction === 'Deposit' ? 'text-red-500 bg-red-500/10 border-red-500/20' : 'text-blue-500 bg-blue-500/10 border-blue-500/20');
            return `
                <div class="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-amber-500/10 transition-all flex items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <span class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black text-xs text-amber-500">${tx.symbol[0]}</span>
                        <div>
                            <div class="text-xs font-black text-white">${tx.amount.toLocaleString()} ${tx.symbol} <span class="text-[9px] px-1.5 py-0.5 rounded border ${dirColor} font-black uppercase text-[8px] ml-1.5">${tx.direction}</span></div>
                            <div class="text-[9px] text-dark-muted mt-0.5">${tx.source} <i data-lucide="arrow-right" class="w-2.5 h-2.5 inline-block mx-1"></i> ${tx.destination}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-xs font-black text-white">$${(tx.usdValue / 1e6).toFixed(2)}M</div>
                        <span class="text-[8px] text-dark-muted font-bold">${tx.time}</span>
                    </div>
                </div>
            `;
        }).join('');
        lucide.createIcons();
    },

    // 4. Exchange Flow Tracker
    renderExchangeFlowTracker() {
        const container = document.getElementById('sc-exchange-flows');
        if (!container) return;

        const targets = this.coins.filter(c => ['bitcoin', 'ethereum', 'solana', 'chainlink'].includes(c.id));
        container.innerHTML = targets.map(coin => {
            const netFlow = coin.exchangeInflow - coin.exchangeOutflow;
            const flowColor = netFlow >= 0 ? 'text-red-500' : 'text-emerald-500'; // Inflow is bearish, Outflow is bullish
            const label = netFlow >= 0 ? 'Inflow (Bearish)' : 'Outflow (Bullish)';
            return `
                <div class="space-y-1.5 pb-2 border-b border-white/5 last:border-none last:pb-0">
                    <div class="flex items-center justify-between text-xs">
                        <span class="font-bold text-white">${coin.name} (${coin.symbol})</span>
                        <span class="font-black ${flowColor}">${netFlow >= 0 ? '+' : ''}$${(netFlow / 1e6).toFixed(1)}M</span>
                    </div>
                    <div class="flex justify-between text-[9px] text-dark-muted">
                        <span>Inflow: $${(coin.exchangeInflow/1e6).toFixed(1)}M</span>
                        <span class="font-black uppercase">${label}</span>
                        <span>Outflow: $${(coin.exchangeOutflow/1e6).toFixed(1)}M</span>
                    </div>
                    <div class="w-full h-1 bg-white/5 rounded-full overflow-hidden flex">
                        <div class="h-full bg-red-500" style="width: ${(coin.exchangeInflow / (coin.exchangeInflow + coin.exchangeOutflow) * 100).toFixed(0)}%"></div>
                        <div class="h-full bg-emerald-500" style="width: ${(coin.exchangeOutflow / (coin.exchangeInflow + coin.exchangeOutflow) * 100).toFixed(0)}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    },

    // 5. Capital Sector Rotation
    renderSectorRotation() {
        const container = document.getElementById('sc-rotations');
        if (!container) return;

        // Custom simulated capital rotation data
        const rotations = [
            { from: 'Layer 1', to: 'AI', flow: '$142M', speed: 'Aggressive', momentum: 'Extreme' },
            { from: 'Meme', to: 'RWA', flow: '$89M', speed: 'Moderate', momentum: 'Rising' },
            { from: 'Gaming', to: 'DePIN', flow: '$45M', speed: 'Gradual', momentum: 'Stable' }
        ];

        container.innerHTML = rotations.map(r => `
            <div class="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                    <div class="flex items-center gap-2 text-xs font-black">
                        <span class="text-red-400 font-bold">${r.from}</span>
                        <i data-lucide="arrow-right-left" class="w-3 h-3 text-dark-muted"></i>
                        <span class="text-emerald-400 font-bold">${r.to}</span>
                    </div>
                    <div class="text-[9px] text-dark-muted mt-1">Rotation Speed: <span class="text-white font-bold">${r.speed}</span></div>
                </div>
                <div class="text-right">
                    <span class="text-xs font-black text-amber-500">${r.flow}</span>
                    <span class="text-[8px] text-dark-muted block uppercase tracking-widest font-black">${r.momentum} Flow</span>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    },

    // Update the ticker counts and badges
    updateStatsBar() {
        const scPicksCount = document.getElementById('sc-high-conviction-count');
        const activeAlertsCount = document.getElementById('sc-active-alerts-count');
        const providerBadge = document.getElementById('sc-provider-badge');
        const providerSub = document.getElementById('sc-provider-sub');

        const activeProviders = Store.getDefaultAIProvider();
        const apiKeys = Store.getAIKeys();
        const hasKey = apiKeys[activeProviders];

        if (providerBadge && providerSub) {
            if (hasKey) {
                const nameMap = { openai: 'OpenAI GPT', anthropic: 'Anthropic Claude', gemini: 'Google Gemini', openrouter: 'OpenRouter', deepseek: 'DeepSeek' };
                providerBadge.innerText = nameMap[activeProviders] || 'Connected AI';
                providerBadge.className = 'text-xl font-black text-emerald-500';
                providerSub.innerText = '✓ Direct API Active';
                providerSub.className = 'text-[8px] text-emerald-500 font-bold';
            } else {
                providerBadge.innerText = 'Local AI';
                providerBadge.className = 'text-xl font-black text-blue-400';
                providerSub.innerText = 'Heuristic fallback';
                providerSub.className = 'text-[8px] text-dark-muted';
            }
        }

        if (scPicksCount) {
            const picks = this.coins.filter(c => this.calculateAIScores(c).overallRating >= 75).length;
            scPicksCount.innerText = `${picks} Assets`;
        }

        if (activeAlertsCount) {
            activeAlertsCount.innerText = `${this.alerts.filter(a => a.active).length} Triggers`;
        }
    },

    checkAlertRules(coin) {
        const coinScores = this.calculateAIScores(coin);
        this.alerts.forEach(rule => {
            if (!rule.active) return;
            if (rule.coinId !== coin.id) return;

            let triggered = false;
            let logMsg = '';

            if (rule.metric === 'ai-score' && coinScores.overallRating >= rule.threshold) {
                triggered = true;
                logMsg = `🚨 ALERT: ${coin.name} AI Score is ${coinScores.overallRating}/100, exceeding your trigger threshold of ${rule.threshold}!`;
            } else if (rule.metric === 'volume-increase' && coin.volumeMcapRatio * 2000 >= rule.threshold) {
                triggered = true;
                logMsg = `📈 VOLUME: ${coin.name} Volume Ratio surged to ${(coin.volumeMcapRatio*1000).toFixed(1)}%, exceeding your trigger of ${rule.threshold}%!`;
            } else if (rule.metric === 'breakout' && coin.breakoutProbability >= rule.threshold) {
                triggered = true;
                logMsg = `⚡ BREAKOUT: ${coin.name} Breakout Probability hit ${coin.breakoutProbability}%, exceeding trigger threshold of ${rule.threshold}%!`;
            } else if (rule.metric === 'funding-rate' && coin.fundingRate < 0) {
                triggered = true;
                logMsg = `📉 FUNDING: ${coin.name} Perpetual Funding Rate became negative (${coin.fundingRate}%), indicating bearish short squeeze potential!`;
            } else if (rule.metric === 'narrative-growth' && coinScores.narrative >= rule.threshold) {
                triggered = true;
                logMsg = `✨ NARRATIVE: ${coin.name} Narrative Engagement hit ${coinScores.narrative}/100, exceeding trigger of ${rule.threshold}!`;
            }

            if (triggered) {
                // Prevent duplicate logs in same refresh cycle
                const alreadyLogged = this.alertsLog.some(l => l.message === logMsg && l.time === 'Just now');
                if (!alreadyLogged) {
                    this.triggerAlert(coin.name, logMsg, 'success');
                }
            }
        });
    },

    checkAlertWhale(coin, usdValue) {
        this.alerts.forEach(rule => {
            if (!rule.active) return;
            if (rule.coinId !== coin.id) return;

            if (rule.metric === 'whale-buy' && usdValue >= rule.threshold) {
                const logMsg = `🐋 WHALE: Large on-chain transaction detected for ${coin.name} with value $${(usdValue / 1e6).toFixed(2)}M (Trigger: > $${(rule.threshold / 1e6).toFixed(1)}M)!`;
                this.triggerAlert(coin.name, logMsg, 'warning');
            }
        });
    },

    triggerAlert(coinName, message, type) {
        const newLog = {
            time: 'Just now',
            coin: coinName,
            message: message,
            type: type
        };

        this.alertsLog.unshift(newLog);
        if (this.alertsLog.length > 50) this.alertsLog.pop();

        // Save logs
        Store.set('sc_alerts_log', this.alertsLog);

        // Show standard in-app notifications
        if (window.showNotification) {
            window.showNotification(message, type === 'warning' ? 'warning' : 'success');
        }

        // Trigger native HTML5 Browser Notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('BlackStack Market Intelligent Alert', {
                body: message,
                icon: 'BLACKSTACK LOGO.png'
            });
        }

        this.renderAlertsLog();
        this.updateStatsBar();
    },

    // Save alert rules to localStorage
    saveAlerts() {
        Store.set('sc_alerts', this.alerts);
        this.renderActiveAlertRules();
        this.updateStatsBar();
    },

    // HTML Rendering: Alert Rules and Logs
    renderActiveAlertRules() {
        const container = document.getElementById('sc-active-triggers');
        if (!container) return;

        if (this.alerts.length === 0) {
            container.innerHTML = `<div class="col-span-2 py-6 text-center text-xs text-dark-muted font-bold">No active alert rules configured. Use the form to create one.</div>`;
            return;
        }

        container.innerHTML = this.alerts.map(rule => {
            const coin = this.coins.find(c => c.id === rule.coinId) || { name: rule.coinId, symbol: rule.coinId.toUpperCase() };
            const activeClass = rule.active ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-white/5 border-white/5 text-dark-muted';
            const statusLabel = rule.active ? 'Active' : 'Paused';
            const metricLabels = {
                'ai-score': 'AI Score >',
                'whale-buy': 'Whale Buy >',
                'volume-increase': 'Vol. Spike >',
                'exchange-outflow': 'Outflow >',
                'funding-rate': 'Funding Negative',
                'narrative-growth': 'Narrative score >',
                'breakout': 'Breakout Prob. >',
                'institutional': 'Inst. Buy'
            };

            const valueStr = rule.threshold >= 1000000 ? `$${(rule.threshold/1e6).toFixed(1)}M` : rule.threshold;

            return `
                <div class="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between hover:border-amber-500/10 transition-all">
                    <div>
                        <div class="text-xs font-black text-white">${coin.name} <span class="text-[9px] text-dark-muted uppercase font-bold">${coin.symbol}</span></div>
                        <div class="text-[9px] text-dark-muted mt-1 font-bold">${metricLabels[rule.metric] || rule.metric} <span class="text-amber-500 font-black">${valueStr}</span></div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="sc-toggle-rule-btn px-2.5 py-1 rounded text-[8px] font-black border uppercase tracking-wider ${activeClass}" data-id="${rule.id}">
                            ${statusLabel}
                        </button>
                        <button class="sc-delete-rule-btn p-1.5 hover:bg-red-500/15 text-dark-muted hover:text-red-500 rounded transition-all" data-id="${rule.id}">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        lucide.createIcons();

        // Bind clicks to active rules
        container.querySelectorAll('.sc-toggle-rule-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id || btn.getAttribute('data-id'));
                const rule = this.alerts.find(r => r.id === id);
                if (rule) {
                    rule.active = !rule.active;
                    this.saveAlerts();
                }
            });
        });

        container.querySelectorAll('.sc-delete-rule-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id || btn.getAttribute('data-id'));
                this.alerts = this.alerts.filter(r => r.id !== id);
                this.saveAlerts();
                if (window.showNotification) window.showNotification('Alert trigger rule deleted', 'info');
            });
        });
    },

    renderAlertsLog() {
        const container = document.getElementById('sc-alerts-log');
        if (!container) return;

        if (this.alertsLog.length === 0) {
            container.innerHTML = `<div class="p-4 text-center text-xs text-dark-muted font-bold">Alert logs are empty. New triggers will appear here in real-time.</div>`;
            return;
        }

        container.innerHTML = this.alertsLog.map(log => {
            const dotColor = log.type === 'warning' ? 'bg-amber-500 shadow-amber-500/50' : (log.type === 'error' ? 'bg-red-500 shadow-red-500/50' : 'bg-emerald-500 shadow-emerald-500/50');
            return `
                <div class="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-amber-500/10 transition-all flex items-start gap-4">
                    <div class="mt-1.5 w-1.5 h-1.5 rounded-full ${dotColor} shadow-md flex-shrink-0"></div>
                    <div class="flex-1">
                        <p class="text-xs text-slate-300 font-semibold leading-relaxed">${log.message}</p>
                        <div class="flex items-center gap-3 text-[9px] text-dark-muted font-bold uppercase mt-1">
                            <span>${log.coin}</span>
                            <span>•</span>
                            <span>${log.time}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Populate alert creator options
    populateCoinsSelector() {
        const selector = document.getElementById('sc-alert-coin');
        if (!selector) return;

        // Preset options of main coins
        const items = this.coins.slice(0, 15);
        selector.innerHTML = items.map(c => `
            <option value="${c.id}">${c.name} (${c.symbol})</option>
        `).join('');
    },

    // Alert Creation form submission
    handleAlertCreation(e) {
        e.preventDefault();
        const coinId = document.getElementById('sc-alert-coin').value;
        const metric = document.getElementById('sc-alert-metric').value;
        const threshold = parseFloat(document.getElementById('sc-alert-val').value);

        if (!coinId || !metric || isNaN(threshold)) {
            if (window.showNotification) window.showNotification('Please fill in alert rule value parameters correctly', 'error');
            return;
        }

        const newRule = {
            id: Date.now(),
            coinId,
            metric,
            threshold,
            active: true
        };

        this.alerts.push(newRule);
        this.saveAlerts();
        document.getElementById('sc-create-alert-form').reset();

        if (window.showNotification) window.showNotification('Intelligent AI Alert successfully activated', 'success');

        // Request browser notifications permission if not set
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
};
