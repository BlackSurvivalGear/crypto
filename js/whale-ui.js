// js/whale-ui.js
import { UI } from './ui.js';

export const WhaleUI = {
    charts: {},

    updateStatusBadge(status) {
        const badge = document.getElementById('whale-live-status');
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

    renderSummaryCards(stats) {
        const summaryGrid = document.getElementById('whale-summary-cards');
        if (!summaryGrid) return;

        const cards = [
            { label: 'Transactions Today', value: stats.txCountToday, color: 'text-blue-500' },
            { label: 'Total Value Moved', value: `$${UI.formatNumber(stats.totalValueMoved)}`, color: 'text-white' },
            { label: 'Largest Transaction', value: `$${UI.formatNumber(stats.largestTxValue)}`, color: 'text-amber-500' },
            { label: 'Exchange Inflow', value: `$${UI.formatNumber(stats.exchangeInflow)}`, color: 'text-red-500' },
            { label: 'Exchange Outflow', value: `$${UI.formatNumber(stats.exchangeOutflow)}`, color: 'text-green-500' },
            { label: 'Avg. Tx Size', value: `$${UI.formatNumber(stats.avgTxSize)}`, color: 'text-blue-400' },
            { label: 'Market Sentiment', value: stats.marketSentiment, color: stats.marketSentiment === 'Bullish' ? 'text-green-500' : (stats.marketSentiment === 'Bearish' ? 'text-red-500' : 'text-amber-400') },
            { label: 'Last Updated', value: stats.lastUpdated, color: 'text-slate-500' }
        ];

        summaryGrid.innerHTML = cards.map(card => `
            <div class="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border p-4 rounded-xl shadow-sm">
                <div class="text-[10px] font-bold text-slate-500 dark:text-dark-muted uppercase tracking-wider mb-1">${card.label}</div>
                <div class="text-lg font-black ${card.color}">${card.value}</div>
            </div>
        `).join('');
    },

    showLoadingState() {
        const feed = document.getElementById('whale-feed');
        if (!feed) return;

        feed.innerHTML = Array(5).fill(0).map(() => `
            <div class="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-center gap-4 flex-1">
                    <div class="w-10 h-10 rounded-xl skeleton flex-shrink-0"></div>
                    <div class="space-y-2 flex-1">
                        <div class="h-3 w-20 skeleton rounded"></div>
                        <div class="h-4 w-32 skeleton rounded"></div>
                    </div>
                </div>
                <div class="flex items-center gap-4 md:gap-8 flex-1">
                    <div class="flex-1 space-y-2">
                        <div class="h-2 w-10 skeleton rounded"></div>
                        <div class="h-3 w-24 skeleton rounded"></div>
                    </div>
                    <div class="w-4 h-4 skeleton rounded-full"></div>
                    <div class="flex-1 space-y-2">
                        <div class="h-2 w-10 skeleton rounded"></div>
                        <div class="h-3 w-24 skeleton rounded"></div>
                    </div>
                </div>
                <div class="w-20 h-6 skeleton rounded-lg"></div>
            </div>
        `).join('');
    },

    renderLiveFeed(transactions) {
        const feed = document.getElementById('whale-feed');
        if (!feed) return;

        if (transactions.length === 0) {
            feed.innerHTML = `
                <div class="py-12 text-center bg-white dark:bg-dark-card rounded-xl border border-dashed border-slate-300 dark:border-dark-border">
                    <p class="text-slate-500 dark:text-dark-muted">No transactions matching your filters</p>
                </div>
            `;
            return;
        }

        feed.innerHTML = transactions.map(tx => {
            const time = new Date(tx.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const typeLabel = tx.classification.replace('-', ' ').toUpperCase();

            return `
                <div class="whale-feed-item bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:border-blue-500/50 transition-all tx-${tx.classification}" data-hash="${tx.hash}">
                    <div class="flex items-center gap-4 flex-1">
                        <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                            <i data-lucide="${this.getTxIcon(tx.classification)}" class="w-5 h-5 ${this.getTxColorClass(tx.classification)}"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-xs font-black uppercase tracking-wider ${this.getTxColorClass(tx.classification)}">${typeLabel}</span>
                                <span class="text-[10px] text-slate-400 font-medium">${time}</span>
                            </div>
                            <div class="text-sm font-bold">${tx.amount.toLocaleString(undefined, {maximumFractionDigits: 2})} ${tx.symbol}</div>
                            <div class="text-[10px] text-slate-500 dark:text-dark-muted font-bold">$${tx.amount_usd.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                        </div>
                    </div>

                    <div class="flex items-center gap-4 md:gap-8 flex-1">
                        <div class="flex-1 min-w-0">
                            <div class="text-[10px] font-bold text-slate-400 uppercase mb-1">From</div>
                            <div class="text-xs font-bold truncate flex items-center gap-1">
                                ${tx.from.owner} <i data-lucide="external-link" class="w-2.5 h-2.5 text-slate-400"></i>
                            </div>
                        </div>
                        <i data-lucide="arrow-right" class="w-4 h-4 text-slate-300"></i>
                        <div class="flex-1 min-w-0">
                            <div class="text-[10px] font-bold text-slate-400 uppercase mb-1">To</div>
                            <div class="text-xs font-bold truncate flex items-center gap-1">
                                ${tx.to.owner} <i data-lucide="external-link" class="w-2.5 h-2.5 text-slate-400"></i>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center gap-4 justify-between md:justify-end">
                        <div class="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            ${tx.blockchain}
                        </div>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300"></i>
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
            case 'large-transfer': return 'zap';
            case 'institutional': return 'shield';
            case 'government': return 'landmark';
            default: return 'refresh-cw';
        }
    },

    getTxColorClass(type) {
        switch(type) {
            case 'exchange-inflow': return 'text-red-500';
            case 'exchange-outflow': return 'text-green-500';
            case 'large-transfer': return 'text-orange-500';
            case 'institutional': return 'text-purple-500';
            case 'government': return 'text-amber-500';
            default: return 'text-blue-500';
        }
    },

    renderCharts(transactions) {
        this.renderChainDistribution(transactions);
        this.renderExchangeFlows(transactions);
    },

    renderChainDistribution(transactions) {
        const ctx = document.getElementById('whale-chain-chart');
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
                            labels: { color: '#9CA3AF', usePointStyle: true, font: { size: 10, weight: 'bold' }, padding: 15 }
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => ` $${UI.formatNumber(context.parsed)}`
                            }
                        }
                    },
                    cutout: '70%'
                }
            });
        }
    },

    renderExchangeFlows(transactions) {
        const ctx = document.getElementById('whale-flow-chart');
        if (!ctx) return;

        const inflow = transactions.filter(tx => tx.classification === 'exchange-inflow').reduce((sum, tx) => sum + tx.amount_usd, 0);
        const outflow = transactions.filter(tx => tx.classification === 'exchange-outflow').reduce((sum, tx) => sum + tx.amount_usd, 0);

        if (this.charts.flow) {
            this.charts.flow.data.datasets[0].data = [inflow, outflow];
            this.charts.flow.update();
        } else {
            this.charts.flow = new Chart(ctx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['INFLOW', 'OUTFLOW'],
                    datasets: [{
                        data: [inflow, outflow],
                        backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(16, 185, 129, 0.8)'],
                        borderColor: ['#ef4444', '#10b981'],
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
                                callback: value => '$' + UI.formatNumber(value)
                            }
                        },
                        x: { grid: { display: false }, ticks: { color: '#9CA3AF', font: { weight: 'bold' } } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }
    },

    renderAISummary(transactions) {
        const container = document.getElementById('whale-ai-summary');
        if (!container) return;

        const inflowCount = transactions.filter(tx => tx.classification === 'exchange-inflow').length;
        const outflowCount = transactions.filter(tx => tx.classification === 'exchange-outflow').length;
        const instCount = transactions.filter(tx => tx.classification === 'institutional').length;
        const govCount = transactions.filter(tx => tx.classification === 'government').length;

        let insights = [];
        if (inflowCount > outflowCount) {
            insights.push({
                type: 'negative',
                title: 'Potential Sell Pressure',
                text: 'Large volume of assets being moved to exchanges, indicating possible upcoming sell activity.'
            });
        } else {
            insights.push({
                type: 'positive',
                title: 'Accumulation Detected',
                text: 'Whales are moving assets off exchanges to private wallets, suggesting a bullish accumulation phase.'
            });
        }

        if (instCount > 0) {
            insights.push({
                type: 'neutral',
                title: 'Institutional Activity Detected',
                text: `${instCount} transactions from known institutional wallets identified in the last hour.`
            });
        }

        if (govCount > 0) {
            insights.push({
                type: 'warning',
                title: 'Government Wallet Movement',
                text: 'Unusual activity detected from wallets labeled as government entities. Monitor for potential market impact.'
            });
        }

        container.innerHTML = insights.map(insight => `
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-dark-bg border-l-4 ${this.getInsightColor(insight.type)} mb-3 last:mb-0">
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-1.5 h-1.5 rounded-full ${this.getInsightDotColor(insight.type)}"></div>
                    <span class="text-xs font-bold ${this.getInsightTextColor(insight.type)}">${insight.title}</span>
                </div>
                <p class="text-[10px] text-slate-500 dark:text-dark-muted leading-relaxed">${insight.text}</p>
            </div>
        `).join('');
    },

    getInsightColor(type) {
        switch(type) {
            case 'positive': return 'border-emerald-500';
            case 'negative': return 'border-red-500';
            case 'warning': return 'border-amber-500';
            default: return 'border-blue-500';
        }
    },

    getInsightDotColor(type) {
        switch(type) {
            case 'positive': return 'bg-emerald-500';
            case 'negative': return 'bg-red-500';
            case 'warning': return 'bg-amber-500';
            default: return 'bg-blue-500';
        }
    },

    getInsightTextColor(type) {
        switch(type) {
            case 'positive': return 'text-emerald-500';
            case 'negative': return 'text-red-500';
            case 'warning': return 'text-amber-500';
            default: return 'text-blue-500';
        }
    },

    openDetailPanel(tx) {
        const panel = document.getElementById('whale-panel-content');
        const txIdEl = document.getElementById('whale-panel-tx-id');
        if (!panel || !txIdEl) return;

        txIdEl.innerText = tx.hash;

        panel.innerHTML = `
            <div class="bg-slate-50 dark:bg-dark-bg p-6 rounded-2xl border border-slate-200 dark:border-dark-border mb-8 shadow-inner">
                <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center">
                            <i data-lucide="link" class="w-6 h-6 text-blue-500"></i>
                        </div>
                        <div>
                            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Network</div>
                            <div class="text-lg font-black">${tx.blockchain.toUpperCase()}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</div>
                        <div class="text-emerald-500 font-bold flex items-center gap-1.5 justify-end">
                            <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Confirmed
                        </div>
                    </div>
                </div>

                <div class="space-y-4 pt-6 border-t border-slate-200 dark:border-dark-border/30">
                    <div class="text-center">
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Transaction Value</div>
                        <div class="text-4xl font-black mb-1">$${tx.amount_usd.toLocaleString()}</div>
                        <div class="text-slate-500 dark:text-dark-muted font-bold">${tx.amount.toLocaleString(undefined, {maximumFractionDigits: 4})} ${tx.symbol}</div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div class="bg-slate-50 dark:bg-dark-bg p-4 rounded-xl border border-slate-200 dark:border-dark-border">
                    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Sender Intelligence</div>
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                            <i data-lucide="user" class="w-4 h-4 text-slate-500"></i>
                        </div>
                        <div class="text-sm font-bold truncate">${tx.from.owner}</div>
                    </div>
                    <div class="space-y-2">
                        <div class="flex justify-between text-[10px]">
                            <span class="text-slate-400">Type:</span>
                            <span class="font-bold uppercase ${this.getTxColorClass(tx.from.owner_type + '-type')}">${tx.from.owner_type}</span>
                        </div>
                        <div class="text-[10px] text-slate-400 truncate opacity-60">${tx.from.address}</div>
                    </div>
                </div>
                <div class="bg-slate-50 dark:bg-dark-bg p-4 rounded-xl border border-slate-200 dark:border-dark-border">
                    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Receiver Intelligence</div>
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                            <i data-lucide="user" class="w-4 h-4 text-slate-500"></i>
                        </div>
                        <div class="text-sm font-bold truncate">${tx.to.owner}</div>
                    </div>
                    <div class="space-y-2">
                        <div class="flex justify-between text-[10px]">
                            <span class="text-slate-400">Type:</span>
                            <span class="font-bold uppercase ${this.getTxColorClass(tx.to.owner_type + '-type')}">${tx.to.owner_type}</span>
                        </div>
                        <div class="text-[10px] text-slate-400 truncate opacity-60">${tx.to.address}</div>
                    </div>
                </div>
            </div>

            <div class="space-y-4">
                <h3 class="text-xs font-black uppercase tracking-widest text-blue-500">Intelligence Profile</h3>
                <div class="bg-slate-50 dark:bg-dark-bg rounded-xl border border-slate-200 dark:border-dark-border divide-y divide-slate-200 dark:divide-dark-border/50 overflow-hidden">
                    <div class="p-4 flex justify-between items-center">
                        <span class="text-xs font-bold text-slate-500">Risk Assessment</span>
                        <span class="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">LOW RISK</span>
                    </div>
                    <div class="p-4 flex justify-between items-center">
                        <span class="text-xs font-bold text-slate-500">Wallet Owner Verified</span>
                        <span class="text-xs font-bold">${tx.from.owner_type !== 'unknown' || tx.to.owner_type !== 'unknown' ? 'YES' : 'NO'}</span>
                    </div>
                    <div class="p-4 flex justify-between items-center">
                        <span class="text-xs font-bold text-slate-500">Blockchain Explorer</span>
                        <a href="${tx.hash_url}${tx.hash}" target="_blank" class="text-xs font-bold text-blue-500 flex items-center gap-1 hover:underline">
                            View Transaction <i data-lucide="external-link" class="w-3 h-3"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;

        document.body.classList.add('whale-panel-active');
        lucide.createIcons();
    },

    closeDetailPanel() {
        document.body.classList.remove('whale-panel-active');
    }
};
