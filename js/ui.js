// js/ui.js
export const UI = {
    currentCoinId: 'bitcoin',

    renderMarketCards(allCoins, watchlistIds) {
        const container = document.getElementById('market-cards');
        if (!container) return;

        const watchlistCoins = watchlistIds.map(id => allCoins.find(c => c.id === id)).filter(Boolean);
        const cards = [];

        for (let i = 0; i < 4; i++) {
            const coin = watchlistCoins[i];
            if (coin) {
                cards.push(`
                    <div class="bg-white dark:bg-dark-card rounded-xl border ${this.currentCoinId === coin.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 dark:border-dark-border'} p-5 hover:shadow-lg transition-all cursor-pointer fade-in market-card" data-id="${coin.id}" data-symbol="${coin.symbol}">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center gap-3">
                                <div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                                    ${coin.image ? `<img src="${coin.image}" class="w-6 h-6 rounded-full">` : `<i data-lucide="${coin.icon || 'circle'}" class="w-6 h-6 ${coin.color || 'text-blue-500'}"></i>`}
                                </div>
                                <div>
                                    <h4 class="font-bold text-sm">${coin.name} <span class="text-[10px] text-slate-400 font-normal">#${coin.rank || 'N/A'}</span></h4>
                                    <span class="text-xs text-slate-500 dark:text-dark-muted">${coin.symbol}</span>
                                </div>
                            </div>
                            <span class="text-xs font-bold ${coin.change >= 0 ? 'text-green-500' : 'text-red-500'} bg-${coin.change >= 0 ? 'green' : 'red'}-50 dark:bg-${coin.change >= 0 ? 'green' : 'red'}-900/20 px-2 py-1 rounded">
                                ${coin.change >= 0 ? '+' : ''}${typeof coin.change === 'number' ? coin.change.toFixed(2) : coin.change}%
                            </span>
                        </div>
                        <div class="text-xl font-bold mb-2">$${coin.price.toLocaleString()}</div>
                        <div class="h-12 w-full">
                            <canvas id="sparkline-${coin.id}"></canvas>
                        </div>
                    </div>
                `);
            } else {
                cards.push(`
                    <div class="bg-slate-50/50 dark:bg-dark-card/50 rounded-xl border border-dashed border-slate-300 dark:border-dark-border p-5 flex flex-col items-center justify-center text-center opacity-60">
                        <div class="w-10 h-10 rounded-full border-2 border-dashed border-slate-300 dark:border-dark-border flex items-center justify-center mb-3">
                            <i data-lucide="plus" class="w-5 h-5 text-slate-400"></i>
                        </div>
                        <p class="text-xs font-medium text-slate-500 dark:text-dark-muted uppercase tracking-wider">Add a coin to your Watchlist</p>
                    </div>
                `);
            }
        }

        container.innerHTML = cards.join('');
        lucide.createIcons();
        watchlistCoins.slice(0, 4).forEach(coin => {
            if (coin.sparkline) {
                this.renderSparklineData(`sparkline-${coin.id}`, coin.sparkline, coin.change >= 0);
            } else {
                this.renderSparkline(`sparkline-${coin.id}`, coin.change >= 0);
            }
        });
    },

    renderAssetTable(coins) {
        const table = document.getElementById('asset-table');
        if (!table) return;

        // Desktop Table Header
        let html = `
            <thead class="hidden md:table-header-group">
                <tr class="text-xs text-slate-500 dark:text-dark-muted border-b border-slate-200 dark:border-dark-border uppercase tracking-wider">
                    <th class="px-6 py-4 font-semibold text-left">#</th>
                    <th class="px-6 py-4 font-semibold">Asset</th>
                    <th class="px-6 py-4 font-semibold text-right">Price</th>
                    <th class="px-6 py-4 font-semibold text-right">24h Change</th>
                    <th class="px-6 py-4 font-semibold text-right">Market Cap</th>
                    <th class="px-6 py-4 font-semibold text-right">Volume (24h)</th>
                    <th class="px-6 py-4 font-semibold text-right">Last 7 Days</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-dark-border grid grid-cols-1 sm:grid-cols-2 md:table-row-group gap-4 p-4 md:p-0">
        `;

        // Rows / Cards
        html += coins.map(coin => `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group cursor-pointer flex flex-col md:table-row bg-white dark:bg-dark-card md:bg-transparent rounded-xl border border-slate-200 dark:border-dark-border md:border-none p-4 md:p-0 shadow-sm md:shadow-none" data-id="${coin.id}" data-symbol="${coin.symbol}">
                <td class="px-6 py-4 md:py-4 border-none text-left md:text-left text-xs font-semibold text-slate-400">
                    <span class="md:hidden">Rank: </span>#${coin.rank || 'N/A'}
                </td>
                <td class="px-6 py-4 md:py-4 border-none">
                    <div class="flex items-center gap-3">
                        ${coin.image ? `<img src="${coin.image}" class="w-8 h-8 rounded-full" alt="${coin.name}">` : `<div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><i data-lucide="${coin.icon || 'circle'}" class="w-4 h-4 ${coin.color || 'text-blue-500'}"></i></div>`}
                        <div>
                            <div class="font-semibold text-sm">${coin.name}</div>
                            <div class="text-xs text-slate-500 dark:text-dark-muted uppercase">${coin.symbol}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-2 md:py-4 text-left md:text-right font-medium text-sm border-none">
                    <span class="md:hidden text-xs text-slate-400 mr-2">Price:</span>
                    $${coin.price.toLocaleString()}
                </td>
                <td class="px-6 py-2 md:py-4 text-left md:text-right border-none">
                    <span class="md:hidden text-xs text-slate-400 mr-2">Change:</span>
                    <span class="text-sm font-semibold ${coin.change >= 0 ? 'text-green-500' : 'text-red-500'}">
                        ${coin.change >= 0 ? '+' : ''}${typeof coin.change === 'number' ? coin.change.toFixed(2) : coin.change}%
                    </span>
                </td>
                <td class="px-6 py-2 md:py-4 text-left md:text-right text-sm text-slate-600 dark:text-dark-muted border-none">
                    <span class="md:hidden text-xs text-slate-400 mr-2">MCap:</span>
                    $${typeof coin.cap === 'number' ? this.formatNumber(coin.cap) : coin.cap}
                </td>
                <td class="px-6 py-2 md:py-4 text-left md:text-right text-sm text-slate-600 dark:text-dark-muted border-none">
                    <span class="md:hidden text-xs text-slate-400 mr-2">Volume:</span>
                    $${typeof coin.vol === 'number' ? this.formatNumber(coin.vol) : coin.vol}
                </td>
                <td class="px-6 py-4 border-none">
                    <div class="flex items-center justify-end gap-4">
                        <div class="h-10 w-24">
                            <canvas id="table-spark-${coin.id}"></canvas>
                        </div>
                        <button class="watchlist-toggle p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" data-id="${coin.id}">
                            <i data-lucide="star" class="w-4 h-4 ${this.isInWatchlist(coin.id) ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        html += '</tbody>';
        table.innerHTML = html;
        lucide.createIcons();
        coins.forEach(coin => {
            if (coin.sparkline) {
                this.renderSparklineData(`table-spark-${coin.id}`, coin.sparkline, coin.change >= 0);
            } else {
                this.renderSparkline(`table-spark-${coin.id}`, coin.change >= 0);
            }
        });
    },

    formatNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        return num.toLocaleString();
    },

    renderSparklineData(canvasId, data, isPositive) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map((_, i) => i),
                datasets: [{
                    data: data,
                    borderColor: isPositive ? '#22c55e' : '#ef4444',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });
    },

    renderPortfolio(portfolioItems, allCoins) {
        const container = document.getElementById('portfolio-items');
        const totalValueEl = document.getElementById('portfolio-value');
        const changeEl = document.getElementById('portfolio-change');

        if (!container || !totalValueEl || !changeEl) return;

        let totalValue = 0;
        let totalChange24h = 0;

        const html = portfolioItems.map(item => {
            const coin = allCoins.find(c => c.id === item.id);
            if (!coin) return '';

            const itemValue = coin.price * item.amount;
            totalValue += itemValue;

            const priceChange = (coin.price_change_24h || 0) * item.amount;
            totalChange24h += priceChange;

            return `
                <div class="flex items-center justify-between group">
                    <div class="flex items-center gap-3">
                        ${coin.image ? `<img src="${coin.image}" class="w-6 h-6 rounded-full" alt="${coin.name}">` : `<i data-lucide="${coin.icon || 'circle'}" class="w-4 h-4 ${coin.color || 'text-blue-500'}"></i>`}
                        <div>
                            <div class="text-sm font-bold">${coin.symbol.toUpperCase()}</div>
                            <div class="text-xs text-slate-500 dark:text-dark-muted">${item.amount} ${coin.symbol.toUpperCase()}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-sm font-bold">$${itemValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div class="text-[10px] ${coin.change >= 0 ? 'text-green-500' : 'text-red-500'}">
                            ${coin.change >= 0 ? '+' : ''}${typeof coin.change === 'number' ? coin.change.toFixed(2) : coin.change}%
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html || '<p class="text-xs text-slate-500 dark:text-dark-muted">No assets in portfolio.</p>';
        totalValueEl.innerText = `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const totalChangePct = totalValue > 0 ? (totalChange24h / (totalValue - totalChange24h)) * 100 : 0;
        changeEl.innerText = `${totalChange24h >= 0 ? '+$' : '-$'}${Math.abs(totalChange24h).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${totalChangePct.toFixed(2)}%)`;
        changeEl.className = `text-sm font-medium ${totalChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`;

        this.renderAllocationBar(portfolioItems, allCoins, totalValue);
        lucide.createIcons();
    },

    renderAllocationBar(portfolioItems, allCoins, totalValue) {
        const bar = document.querySelector('#portfolio .flex.h-2');
        if (!bar) return;

        if (totalValue === 0) {
            bar.innerHTML = '<div class="bg-slate-200 dark:bg-slate-700 w-full"></div>';
            return;
        }

        const colors = ['bg-orange-500', 'bg-blue-500', 'bg-emerald-500', 'bg-pink-500', 'bg-amber-500', 'bg-indigo-500'];

        const sortedItems = [...portfolioItems]
            .map(item => {
                const coin = allCoins.find(c => c.id === item.id);
                return { ...item, value: (coin ? coin.price : 0) * item.amount };
            })
            .sort((a, b) => b.value - a.value);

        bar.innerHTML = sortedItems.map((item, i) => {
            const pct = (item.value / totalValue) * 100;
            if (pct < 1) return '';
            return `<div class="${colors[i % colors.length]}" style="width: ${pct}%" title="${item.id}: ${pct.toFixed(1)}%"></div>`;
        }).join('');
    },

    renderWatchlist(allCoins, watchlistIds) {
        const container = document.getElementById('watchlist-items');
        if (!container) return;

        const watchlistCoins = watchlistIds.map(id => allCoins.find(c => c.id === id)).filter(Boolean);

        if (watchlistCoins.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                        <i data-lucide="star" class="w-6 h-6 text-slate-400"></i>
                    </div>
                    <p class="text-sm font-medium text-slate-500 dark:text-dark-muted">Your watchlist is empty</p>
                    <p class="text-xs text-slate-400 dark:text-dark-muted mt-1">Search for a coin to add it</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        container.innerHTML = watchlistCoins.map(coin => `
            <div class="flex items-center justify-between group p-3 -mx-3 rounded-xl transition-all cursor-pointer ${this.currentCoinId === coin.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}" data-id="${coin.id}" data-symbol="${coin.symbol}">
                <div class="flex items-center gap-3">
                    <div class="relative">
                        ${coin.image ? `<img src="${coin.image}" class="w-6 h-6 rounded-full">` : `<i data-lucide="circle" class="w-6 h-6 text-slate-300"></i>`}
                    </div>
                    <div>
                        <div class="text-sm font-bold flex items-center gap-2">
                            ${coin.name}
                            <span class="text-[10px] text-slate-400 font-normal uppercase">${coin.symbol}</span>
                        </div>
                        <div class="text-xs text-slate-500 dark:text-dark-muted">$${coin.price.toLocaleString()}</div>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <div class="text-right">
                        <span class="text-xs font-semibold ${coin.change >= 0 ? 'text-green-500' : 'text-red-500'}">
                            ${coin.change >= 0 ? '+' : ''}${typeof coin.change === 'number' ? coin.change.toFixed(2) : coin.change}%
                        </span>
                    </div>
                    <button class="remove-watchlist-item p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all" data-id="${coin.id}">
                        <i data-lucide="x" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    },

    renderWatchlistSearchResults(results) {
        const container = document.getElementById('watchlist-search-results');
        if (!container) return;

        if (results.length === 0) {
            container.classList.add('hidden');
            return;
        }

        container.innerHTML = results.map(coin => `
            <div class="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-dark-border last:border-none add-to-watchlist-btn" data-id="${coin.id}">
                ${coin.image ? `<img src="${coin.image}" class="w-6 h-6 rounded-full">` : `<div class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><i data-lucide="circle" class="w-3 h-3 text-slate-400"></i></div>`}
                <div>
                    <div class="text-sm font-bold">${coin.name}</div>
                    <div class="text-[10px] text-slate-400 uppercase">${coin.symbol}</div>
                </div>
                <div class="ml-auto">
                    <i data-lucide="plus" class="w-4 h-4 text-blue-500"></i>
                </div>
            </div>
        `).join('');
        container.classList.remove('hidden');
        lucide.createIcons();
    },

    renderFearAndGreed(data) {
        const container = document.getElementById('fear-greed-content');
        if (!container) return;

        const value = parseInt(data.value);
        const classification = data.value_classification;
        const timestamp = parseInt(data.timestamp);
        const lastUpdated = new Date(timestamp * 1000).toLocaleString();

        const colors = {
            'Extreme Fear': 'text-red-500',
            'Fear': 'text-orange-500',
            'Neutral': 'text-yellow-500',
            'Greed': 'text-green-400',
            'Extreme Greed': 'text-green-600'
        };

        const bgColors = {
            'Extreme Fear': 'bg-red-500',
            'Fear': 'bg-orange-500',
            'Neutral': 'bg-yellow-500',
            'Greed': 'bg-green-400',
            'Extreme Greed': 'bg-green-600'
        };

        const colorClass = colors[classification] || 'text-blue-500';
        const bgColorClass = bgColors[classification] || 'bg-blue-500';

        container.innerHTML = `
            <div class="relative w-40 h-40 flex items-center justify-center mb-4">
                <svg class="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="70" stroke="currentColor" stroke-width="12" fill="transparent" class="text-slate-100 dark:text-slate-800" />
                    <circle cx="80" cy="80" r="70" stroke="currentColor" stroke-width="12" fill="transparent" stroke-dasharray="440" stroke-dashoffset="${440 - (440 * value / 100)}" class="${colorClass} transition-all duration-1000" stroke-linecap="round" />
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-4xl font-black">${value}</span>
                </div>
            </div>
            <div class="text-center">
                <div class="inline-block px-4 py-1.5 rounded-full ${bgColorClass} text-white text-sm font-bold mb-2 shadow-lg shadow-${bgColorClass.split('-')[1]}-500/30">
                    ${classification.toUpperCase()}
                </div>
                <div class="text-[10px] text-slate-400 dark:text-dark-muted flex items-center gap-1 justify-center">
                    <i data-lucide="clock" class="w-3 h-3"></i>
                    Updated: ${lastUpdated}
                </div>
            </div>
        `;
        lucide.createIcons();
    },

    isInWatchlist(id) {
        if (typeof Store !== 'undefined' && Store.getWatchlist) {
            return Store.getWatchlist().includes(id);
        }
        return false;
    },

    renderNews(news) {
        const container = document.getElementById('news-items');
        if (!container) return;
        container.innerHTML = news.map(item => `
            <a href="${item.link}" target="_blank" class="flex gap-3 group cursor-pointer">
                ${item.thumbnail ? `<img src="${item.thumbnail}" class="w-16 h-16 rounded-lg object-cover flex-shrink-0" alt="">` : ''}
                <div class="flex-1">
                    <div class="text-[10px] text-slate-500 dark:text-dark-muted mb-1 flex items-center justify-between">
                        <span>${item.source} • ${item.time}</span>
                        <span class="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${item.sentiment === 'bullish' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : item.sentiment === 'bearish' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}">
                            ${item.sentiment}
                        </span>
                    </div>
                    <h4 class="text-xs font-medium group-hover:text-blue-500 transition-colors line-clamp-2">${item.title}</h4>
                </div>
            </a>
        `).join('');
    },

    renderSparkline(canvasId, isPositive) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const data = Array.from({ length: 10 }, () => Math.random() * 100);
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map((_, i) => i),
                datasets: [{
                    data: data,
                    borderColor: isPositive ? '#22c55e' : '#ef4444',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });
    },

    initMainChart(coinSymbol = 'BTC', interval = 'D') {
        const container = document.querySelector('.chart-container');
        if (!container) return;

        container.innerHTML = '<div id="tv-chart-widget" class="h-full w-full"></div>';

        const symbol = this.getTradingViewSymbol(coinSymbol);

        if (typeof TradingView !== 'undefined') {
            new TradingView.widget({
                "autosize": true,
                "symbol": symbol,
                "interval": interval,
                "timezone": "Etc/UTC",
                "theme": document.documentElement.classList.contains('dark') ? "dark" : "light",
                "style": "1",
                "locale": "en",
                "toolbar_bg": "#f1f3f6",
                "enable_publishing": false,
                "hide_top_toolbar": true,
                "save_image": false,
                "container_id": "tv-chart-widget"
            });
        }
        this.currentSymbol = coinSymbol;
        this.currentInterval = interval;
    },

    getTradingViewSymbol(coinSymbol) {
        const mapping = {
            'BTC': 'BINANCE:BTCUSDT',
            'ETH': 'BINANCE:ETHUSDT',
            'SOL': 'BINANCE:SOLUSDT',
            'ADA': 'BINANCE:ADAUSDT',
            'XRP': 'BINANCE:XRPUSDT',
            'DOT': 'BINANCE:DOTUSDT'
        };
        return mapping[coinSymbol.toUpperCase()] || `BINANCE:${coinSymbol.toUpperCase()}USDT`;
    },

    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        if (!container) return;

        const id = 'notif-' + Date.now();
        const colors = {
            info: 'bg-blue-600',
            success: 'bg-green-600',
            error: 'bg-red-600',
            warning: 'bg-amber-600'
        };

        const notification = document.createElement('div');
        notification.id = id;
        notification.className = `${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 transform translate-y-4 opacity-0 transition-all duration-300 pointer-events-auto`;
        notification.innerHTML = `
            <i data-lucide="${type === 'error' ? 'alert-circle' : 'info'}" class="w-5 h-5"></i>
            <span class="text-sm font-medium">${message}</span>
        `;

        container.appendChild(notification);
        lucide.createIcons();

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-y-4', 'opacity-0');
        }, 10);

        // Auto remove
        setTimeout(() => {
            notification.classList.add('opacity-0');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
};

window.showNotification = UI.showNotification.bind(UI);
