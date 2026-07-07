// js/institutional-ui.js
import { UI } from './ui.js';

export const InstitutionalUI = {
    charts: {},

    updateStatusBadge(status) {
        const badge = document.getElementById('terminal-live-status');
        if (!badge) return;

        let html = '';
        switch(status) {
            case 'live':
                badge.className = 'flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-bold border border-emerald-500/20';
                html = '<div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> LIVE FEED ACTIVE';
                break;
            case 'mock':
                badge.className = 'flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-500 rounded-full text-xs font-bold border border-blue-500/20';
                html = '<div class="w-2 h-2 rounded-full bg-blue-500"></div> MOCK DATA ACTIVE';
                break;
            case 'offline':
                badge.className = 'flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-full text-xs font-bold border border-red-500/20';
                html = '<div class="w-2 h-2 rounded-full bg-red-500"></div> API OFFLINE (MOCK)';
                break;
        }
        badge.innerHTML = html;
    },

    renderInstitutionalStats(stats) {
        const statsGrid = document.getElementById('institutional-stats-grid');
        if (!statsGrid) return;

        const cards = [
            { label: 'Total Inst. Volume (24H)', value: `$${UI.formatNumber(stats.totalValueMoved)}`, color: 'text-white', icon: 'activity' },
            { label: 'Exchange Net Flow', value: `$${UI.formatNumber(Math.abs(stats.exchangeOutflow - stats.exchangeInflow))}`, color: stats.exchangeOutflow > stats.exchangeInflow ? 'text-green-500' : 'text-red-500', sub: stats.exchangeOutflow > stats.exchangeInflow ? 'Net Outflow (Bullish)' : 'Net Inflow (Bearish)', icon: 'arrow-left-right' },
            { label: 'Largest Institutional Tx', value: `$${UI.formatNumber(stats.largestTx ? stats.largestTx.amount_usd : 0)}`, color: 'text-amber-500', sub: stats.largestTx ? `${stats.largestTx.symbol} (${stats.largestTx.blockchain})` : '', icon: 'zap' },
            { label: 'Smart Money Score', value: `${stats.smartMoneyScore}/100`, color: 'text-blue-500', sub: 'Institutional Conviction', icon: 'gauge' }
        ];

        statsGrid.innerHTML = cards.map(card => `
            <div class="bg-dark-card border border-dark-border p-5 rounded-2xl shadow-lg group hover:border-blue-500/30 transition-all">
                <div class="flex items-start justify-between mb-3">
                    <span class="text-[10px] font-black text-dark-muted uppercase tracking-wider">${card.label}</span>
                    <i data-lucide="${card.icon}" class="w-4 h-4 text-dark-muted group-hover:text-blue-500 transition-colors"></i>
                </div>
                <div class="text-2xl font-black ${card.color}">${card.value}</div>
                ${card.sub ? `<div class="text-[10px] font-bold text-dark-muted mt-1 uppercase tracking-tight">${card.sub}</div>` : ''}
            </div>
        `).join('');

        // Also render ETF Flows
        this.renderETFFlows(stats.etfFlows);
        // And Stablecoin Liquidity
        this.renderStablecoinLiquidity(stats.stableLiquidity);
        // And Sentiment
        this.renderSentiment(stats);

        lucide.createIcons();
    },

    renderETFFlows(flows) {
        const container = document.getElementById('etf-flows-container');
        if (!container) return;

        const items = [
            { name: 'Bitcoin Spot ETFs', value: flows.btc, unit: 'M', icon: 'bitcoin', color: 'text-orange-500' },
            { name: 'Ethereum Spot ETFs', value: flows.eth, unit: 'M', icon: 'zap', color: 'text-blue-500' }
        ];

        container.innerHTML = items.map(item => `
            <div class="bg-white/5 rounded-xl p-4 flex items-center justify-between border border-white/5">
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-dark-bg rounded-lg">
                        <i data-lucide="${item.icon}" class="w-4 h-4 ${item.color}"></i>
                    </div>
                    <span class="text-xs font-bold">${item.name}</span>
                </div>
                <div class="text-right">
                    <div class="text-sm font-black text-green-500">+$${item.value}${item.unit}</div>
                    <div class="text-[8px] font-bold text-dark-muted uppercase tracking-widest">Net Daily Inflow</div>
                </div>
            </div>
        `).join('');
    },

    renderStablecoinLiquidity(stable) {
        const statsGrid = document.getElementById('institutional-stats-grid');
        if (!statsGrid) return;

        const card = {
            label: 'Stablecoin Liquidity Net',
            value: `+$${UI.formatNumber(Object.values(stable).reduce((a, b) => parseFloat(a) + parseFloat(b), 0))}M`,
            color: 'text-emerald-500',
            sub: `USDT: +$${stable.USDT}M | USDC: +$${stable.USDC}M`,
            icon: 'coins'
        };

        const div = document.createElement('div');
        div.className = 'bg-dark-card border border-dark-border p-5 rounded-2xl shadow-lg group hover:border-blue-500/30 transition-all';
        div.innerHTML = `
            <div class="flex items-start justify-between mb-3">
                <span class="text-[10px] font-black text-dark-muted uppercase tracking-wider">${card.label}</span>
                <i data-lucide="${card.icon}" class="w-4 h-4 text-dark-muted group-hover:text-blue-500 transition-colors"></i>
            </div>
            <div class="text-2xl font-black ${card.color}">${card.value}</div>
            <div class="text-[10px] font-bold text-dark-muted mt-1 uppercase tracking-tight">${card.sub}</div>
        `;
        statsGrid.appendChild(div);
    },

    renderSentiment(stats) {
        const statsGrid = document.getElementById('institutional-stats-grid');
        if (!statsGrid) return;

        const sentiment = stats.marketSentiment;
        const color = sentiment === 'Bullish' ? 'text-emerald-500' : 'text-red-500';

        const div = document.createElement('div');
        div.className = 'bg-dark-card border border-dark-border p-5 rounded-2xl shadow-lg group hover:border-blue-500/30 transition-all';
        div.innerHTML = `
            <div class="flex items-start justify-between mb-3">
                <span class="text-[10px] font-black text-dark-muted uppercase tracking-wider">Inst. Sentiment</span>
                <i data-lucide="trending-up" class="w-4 h-4 text-dark-muted group-hover:text-blue-500 transition-colors"></i>
            </div>
            <div class="text-2xl font-black ${color}">${sentiment.toUpperCase()}</div>
            <div class="text-[10px] font-bold text-dark-muted mt-1 uppercase tracking-tight">AI Generated Bias</div>
        `;
        statsGrid.appendChild(div);
    },

    showLoadingState() {
        const feed = document.getElementById('terminal-feed');
        if (!feed) return;

        feed.innerHTML = Array(5).fill(0).map(() => `
            <div class="bg-dark-card border border-dark-border p-4 rounded-xl flex flex-col gap-4">
                <div class="flex items-center justify-between">
                    <div class="h-3 w-24 skeleton rounded"></div>
                    <div class="h-3 w-16 skeleton rounded"></div>
                </div>
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl skeleton flex-shrink-0"></div>
                    <div class="space-y-2 flex-1">
                        <div class="h-5 w-32 skeleton rounded"></div>
                        <div class="h-3 w-48 skeleton rounded"></div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    renderLiveFeed(transactions) {
        const feed = document.getElementById('terminal-feed');
        if (!feed) return;

        if (transactions.length === 0) {
            feed.innerHTML = `
                <div class="py-12 text-center bg-dark-card rounded-xl border border-dashed border-dark-border">
                    <p class="text-dark-muted">No institutional intelligence events detected</p>
                </div>
            `;
            return;
        }

        feed.innerHTML = transactions.map(tx => {
            const time = new Date(tx.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const typeLabel = tx.classification.replace(/-/g, ' ').toUpperCase();
            const colorClass = this.getTxColorClass(tx.classification);
            const icon = this.getTxIcon(tx.classification);

            return `
                <div class="terminal-feed-item bg-dark-card border border-dark-border p-5 rounded-2xl flex flex-col gap-4 cursor-pointer hover:border-blue-500/40 transition-all group relative overflow-hidden" data-hash="${tx.hash}">
                    <div class="absolute top-0 left-0 w-1 h-full ${colorClass.replace('text-', 'bg-')}"></div>

                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="text-[9px] font-black px-2 py-0.5 rounded bg-white/5 ${colorClass} uppercase tracking-widest">${typeLabel}</span>
                            <span class="text-[10px] text-dark-muted font-bold">${tx.blockchain.toUpperCase()} NETWORK</span>
                        </div>
                        <span class="text-[10px] text-dark-muted font-bold">${time}</span>
                    </div>

                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-dark-bg border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <i data-lucide="${icon}" class="w-6 h-6 ${colorClass}"></i>
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="text-xl font-black text-white">$${(tx.amount_usd / 1e6).toFixed(2)}M</div>
                            <div class="text-[10px] font-bold text-dark-muted uppercase truncate">
                                ${tx.from.owner} <i data-lucide="arrow-right" class="inline w-2 h-2 mx-1"></i> ${tx.to.owner}
                            </div>
                        </div>
                    </div>

                    <div class="bg-white/5 rounded-xl p-3 border border-white/5">
                        <div class="flex items-center gap-2 mb-1">
                            <i data-lucide="sparkles" class="w-3 h-3 text-blue-500"></i>
                            <span class="text-[9px] font-black text-blue-500 uppercase tracking-widest">AI Interpretation</span>
                        </div>
                        <p class="text-[11px] text-dark-muted leading-relaxed italic">"${tx.ai_interpretation}"</p>
                    </div>

                    <div class="flex items-center justify-between mt-1">
                        <div class="flex items-center gap-3">
                             <div class="flex items-center gap-1">
                                <span class="text-[10px] font-bold text-dark-muted">Confidence:</span>
                                <span class="text-[10px] font-black text-emerald-500 uppercase">High</span>
                             </div>
                        </div>
                        <div class="flex items-center gap-1 text-[10px] font-black text-blue-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            Analysing Details <i data-lucide="chevron-right" class="w-3 h-3"></i>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        lucide.createIcons();
    },

    getTxIcon(type) {
        switch(type) {
            case 'exchange-inflow': return 'upload-cloud';
            case 'exchange-outflow': return 'download-cloud';
            case 'whale-accumulation': return 'package-plus';
            case 'whale-distribution': return 'package-minus';
            case 'etf-inflow': return 'landmark';
            case 'etf-outflow': return 'landmark';
            case 'stablecoin-mint': return 'coins';
            case 'stablecoin-burn': return 'fire-extinguisher';
            case 'government-sell': return 'shield-alert';
            case 'institutional-transfer': return 'building-2';
            case 'otc-transfer': return 'handshake';
            default: return 'zap';
        }
    },

    getTxColorClass(type) {
        if (type.includes('inflow') || type.includes('accumulation') || type.includes('mint')) return 'text-green-500';
        if (type.includes('outflow') || type.includes('distribution') || type.includes('burn') || type.includes('sell')) return 'text-red-500';
        if (type.includes('institutional') || type.includes('otc')) return 'text-purple-500';
        if (type.includes('government')) return 'text-amber-500';
        return 'text-blue-500';
    },

    renderCharts(transactions) {
        this.renderChainDistribution(transactions);
        this.renderExchangeFlowsTrend(transactions);
        this.renderHourlyVolume(transactions);
        this.renderTerminalHeatmap(transactions);
        this.renderExchangeReserveTrend();
        this.renderStablecoinSupplyGrowth();
    },

    renderChainDistribution(transactions) {
        const ctx = document.getElementById('terminal-chain-chart');
        if (!ctx) return;

        const chainData = {};
        transactions.forEach(tx => {
            chainData[tx.blockchain] = (chainData[tx.blockchain] || 0) + tx.amount_usd;
        });

        const labels = Object.keys(chainData).map(k => k.toUpperCase());
        const values = Object.values(chainData);

        if (this.charts.chain) {
            this.charts.chain.data.labels = labels;
            this.charts.chain.data.datasets[0].data = values;
            this.charts.chain.update();
        } else {
            this.charts.chain = new Chart(ctx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#a855f7', '#6366f1'],
                        borderWidth: 0,
                        hoverOffset: 10
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#9CA3AF', usePointStyle: true, font: { size: 9, weight: 'bold' }, padding: 10 }
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => ` $${UI.formatNumber(context.parsed)}`
                            }
                        }
                    },
                    cutout: '75%'
                }
            });
        }
    },

    renderExchangeFlowsTrend(transactions) {
        const ctx = document.getElementById('terminal-flow-chart');
        if (!ctx) return;

        // Group by hour for a trend
        const inflow = transactions.filter(tx => tx.classification.includes('inflow') || tx.classification.includes('accumulation') || tx.classification.includes('mint')).reduce((sum, tx) => sum + tx.amount_usd, 0);
        const outflow = transactions.filter(tx => tx.classification.includes('outflow') || tx.classification.includes('distribution') || tx.classification.includes('sell')).reduce((sum, tx) => sum + tx.amount_usd, 0);

        if (this.charts.flow) {
            this.charts.flow.data.datasets[0].data = [inflow, outflow];
            this.charts.flow.update();
        } else {
            this.charts.flow = new Chart(ctx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['NET INFLOW', 'NET OUTFLOW'],
                    datasets: [{
                        data: [inflow, outflow],
                        backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(239, 68, 68, 0.8)'],
                        borderColor: ['#10b981', '#ef4444'],
                        borderWidth: 1,
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            grid: { color: 'rgba(255,255,255,0.06)' },
                            ticks: {
                                color: '#9CA3AF',
                                font: { size: 9 },
                                callback: value => '$' + UI.formatNumber(value)
                            }
                        },
                        x: { grid: { display: false }, ticks: { color: '#9CA3AF', font: { size: 9, weight: 'bold' } } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }
    },

    renderHourlyVolume(transactions) {
        const ctx = document.getElementById('hourly-volume-chart');
        if (!ctx) return;

        // Mock hourly volume for last 24h
        const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        const volumes = Array.from({ length: 24 }, () => Math.random() * 500 + 100);

        if (this.charts.volume) {
            this.charts.volume.data.datasets[0].data = volumes;
            this.charts.volume.update();
        } else {
            this.charts.volume = new Chart(ctx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: hours,
                    datasets: [{
                        label: 'Inst. Volume',
                        data: volumes,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#9CA3AF', font: { size: 9 }, callback: v => '$' + UI.formatNumber(v*1e6) } },
                        x: { grid: { display: false }, ticks: { color: '#9CA3AF', font: { size: 9 }, autoSkip: true, maxTicksLimit: 6 } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }
    },

    renderTerminalHeatmap(transactions) {
        const container = document.getElementById('terminal-heatmap');
        if (!container) return;

        // Simple heatmap: 24 bars representing activity in each hour
        const activity = Array.from({ length: 24 }, () => Math.floor(Math.random() * 100));

        container.innerHTML = activity.map((val, i) => {
            const height = Math.max(10, val);
            const opacity = val / 100;
            return `<div class="flex-1 bg-blue-500 rounded-t-sm transition-all hover:bg-blue-400"
                         style="height: ${height}%; opacity: ${0.2 + opacity * 0.8}"
                         title="Hour ${i}: ${val} movements"></div>`;
        }).join('');
    },

    renderExchangeReserveTrend() {
        const ctx = document.getElementById('reserve-trend-chart');
        if (!ctx) return;

        const data = Array.from({ length: 30 }, () => 2.1 + Math.random() * 0.2); // 2.1M - 2.3M BTC
        const labels = Array.from({ length: 30 }, (_, i) => i);

        if (this.charts.reserve) {
            this.charts.reserve.data.datasets[0].data = data;
            this.charts.reserve.update();
        } else {
            this.charts.reserve = new Chart(ctx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Exch. BTC Reserve',
                        data: data,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            grid: { color: 'rgba(255,255,255,0.06)' },
                            ticks: { color: '#9CA3AF', font: { size: 9 }, callback: v => v.toFixed(1) + 'M' }
                        },
                        x: { display: false }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }
    },

    renderStablecoinSupplyGrowth() {
        const ctx = document.getElementById('stable-supply-chart');
        if (!ctx) return;

        const data = Array.from({ length: 30 }, (_, i) => 140 + i * 0.5 + Math.random());
        const labels = Array.from({ length: 30 }, (_, i) => i);

        if (this.charts.stableSupply) {
            this.charts.stableSupply.data.datasets[0].data = data;
            this.charts.stableSupply.update();
        } else {
            this.charts.stableSupply = new Chart(ctx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Total Stable Supply',
                        data: data,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            grid: { color: 'rgba(255,255,255,0.06)' },
                            ticks: { color: '#9CA3AF', font: { size: 9 }, callback: v => '$' + v.toFixed(0) + 'B' }
                        },
                        x: { display: false }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }
    },

    renderAISummary(transactions, stats) {
        const container = document.getElementById('terminal-ai-summary');
        const timeEl = document.getElementById('ai-summary-time');
        const terminalTimeEl = document.getElementById('terminal-last-update');
        if (!container) return;

        const nowTime = new Date().toLocaleTimeString();
        if (timeEl) timeEl.innerText = nowTime;
        if (terminalTimeEl) terminalTimeEl.innerText = nowTime + ' UTC';

        const sentiment = stats.marketSentiment;
        const sentimentColor = sentiment === 'Bullish' ? 'text-emerald-500' : 'text-red-500';

        container.innerHTML = `
            <p class="mb-4">Institutional markets are currently showing a <span class="font-black ${sentimentColor}">${sentiment.toUpperCase()}</span> bias. In the last 24 hours, we've processed <span class="text-white font-bold">${stats.txCountToday}</span> significant capital movements totaling <span class="text-white font-bold">$${UI.formatNumber(stats.totalValueMoved)}</span>.</p>

            <div class="space-y-3">
                <div class="flex gap-3">
                    <div class="w-1 h-auto bg-blue-500 rounded-full"></div>
                    <div>
                        <span class="block text-[10px] font-black text-blue-500 uppercase">Capital Flow Analysis</span>
                        <p class="text-xs">Accumulation from major exchanges to private institutional custody is <span class="text-emerald-500 font-bold">outpacing</span> exchange deposits by <span class="text-white">$${UI.formatNumber(Math.abs(stats.exchangeOutflow - stats.exchangeInflow))}</span>.</p>
                    </div>
                </div>

                <div class="flex gap-3">
                    <div class="w-1 h-auto bg-orange-500 rounded-full"></div>
                    <div>
                        <span class="block text-[10px] font-black text-orange-500 uppercase">ETF Activity</span>
                        <p class="text-xs">Spot Bitcoin ETFs continue to absorb supply with <span class="text-emerald-500 font-bold">+$${stats.etfFlows.btc}M</span> in net daily inflows, reinforcing the $60k support level.</p>
                    </div>
                </div>

                <div class="flex gap-3">
                    <div class="w-1 h-auto bg-purple-500 rounded-full"></div>
                    <div>
                        <span class="block text-[10px] font-black text-purple-500 uppercase">Liquidity Profile</span>
                        <p class="text-xs">Stablecoin minting remains <span class="text-emerald-500 font-bold">positive</span> with significant USDT issuance from the Tether Treasury, indicating ready-to-deploy capital.</p>
                    </div>
                </div>
            </div>

            <p class="mt-4 text-[11px] italic opacity-80 border-l-2 border-white/10 pl-3">"The overall institutional sentiment remains Bullish as supply continues to move off-exchange into long-term custody solutions."</p>
        `;
    },

    openDetailPanel(tx) {
        const panel = document.getElementById('terminal-panel-content');
        const txIdEl = document.getElementById('terminal-panel-tx-id');
        if (!panel || !txIdEl) return;

        txIdEl.innerText = `TX: ${tx.hash.substring(0, 14)}...`;

        panel.innerHTML = `
            <!-- Transaction Overview -->
            <div class="space-y-6">
                <div class="bg-blue-600/5 border border-blue-500/20 rounded-2xl p-6 text-center">
                    <div class="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">Transaction Value</div>
                    <div class="text-4xl font-black text-white">$${tx.amount_usd.toLocaleString()}</div>
                    <div class="text-sm font-bold text-dark-muted mt-1">${tx.amount.toLocaleString()} ${tx.symbol}</div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-white/5 rounded-xl p-4 border border-white/5">
                        <span class="block text-[9px] font-black text-dark-muted uppercase mb-1">Blockchain</span>
                        <span class="text-sm font-bold flex items-center gap-2">
                            <div class="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            ${tx.blockchain.toUpperCase()}
                        </span>
                    </div>
                    <div class="bg-white/5 rounded-xl p-4 border border-white/5">
                        <span class="block text-[9px] font-black text-dark-muted uppercase mb-1">Classification</span>
                        <span class="text-sm font-bold text-blue-400 uppercase tracking-tight">${tx.classification.replace(/-/g, ' ')}</span>
                    </div>
                </div>
            </div>

            <!-- Wallet Profiles (Sender & Receiver) -->
            <div class="space-y-6">
                <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Counterparty Intelligence</h3>

                <!-- Sender -->
                <div class="bg-dark-card border border-dark-border rounded-2xl p-6 relative overflow-hidden group">
                    <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i data-lucide="arrow-up-right" class="w-10 h-10 text-red-500"></i>
                    </div>
                    <div class="flex items-center gap-4 mb-6">
                        <div class="w-12 h-12 rounded-full bg-dark-bg border border-white/10 flex items-center justify-center">
                            <i data-lucide="user" class="w-6 h-6 text-dark-muted"></i>
                        </div>
                        <div>
                            <div class="text-[9px] font-black text-dark-muted uppercase mb-1">Sender Profile</div>
                            <div class="text-lg font-black text-white">${tx.from.owner}</div>
                        </div>
                    </div>
                    <div class="space-y-4">
                        <div class="flex justify-between items-center py-2 border-b border-white/5">
                            <span class="text-xs font-bold text-dark-muted">Institution Type</span>
                            <span class="text-xs font-black uppercase text-white">${tx.from.owner_type}</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-white/5">
                            <span class="text-xs font-bold text-dark-muted">Risk Score</span>
                            <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-black">LOW (0.08)</span>
                        </div>
                        <div>
                            <span class="block text-[9px] font-black text-dark-muted uppercase mb-1">Known Address</span>
                            <span class="text-[10px] font-bold text-blue-500 break-all">${tx.from.address}</span>
                        </div>
                    </div>
                </div>

                <!-- Receiver -->
                <div class="bg-dark-card border border-dark-border rounded-2xl p-6 relative overflow-hidden group">
                    <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i data-lucide="arrow-down-left" class="w-10 h-10 text-emerald-500"></i>
                    </div>
                    <div class="flex items-center gap-4 mb-6">
                        <div class="w-12 h-12 rounded-full bg-dark-bg border border-white/10 flex items-center justify-center">
                            <i data-lucide="user" class="w-6 h-6 text-dark-muted"></i>
                        </div>
                        <div>
                            <div class="text-[9px] font-black text-dark-muted uppercase mb-1">Receiver Profile</div>
                            <div class="text-lg font-black text-white">${tx.to.owner}</div>
                        </div>
                    </div>
                    <div class="space-y-4">
                        <div class="flex justify-between items-center py-2 border-b border-white/5">
                            <span class="text-xs font-bold text-dark-muted">Institution Type</span>
                            <span class="text-xs font-black uppercase text-white">${tx.to.owner_type}</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-white/5">
                            <span class="text-xs font-bold text-dark-muted">Risk Score</span>
                            <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-black">LOW (0.12)</span>
                        </div>
                        <div>
                            <span class="block text-[9px] font-black text-dark-muted uppercase mb-1">Known Address</span>
                            <span class="text-[10px] font-bold text-blue-500 break-all">${tx.to.address}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="pt-6">
                <a href="${tx.hash_url}${tx.hash}" target="_blank" class="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20">
                    <i data-lucide="external-link" class="w-4 h-4"></i>
                    Explore On-Chain Record
                </a>
            </div>
        `;

        document.body.classList.add('terminal-panel-active');
        lucide.createIcons();
    },

    closeDetailPanel() {
        document.body.classList.remove('terminal-panel-active');
    }
};
