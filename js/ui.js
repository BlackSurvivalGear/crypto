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
                    <th class="px-6 py-4 font-semibold text-left cursor-pointer hover:text-blue-500">#</th>
                    <th class="px-6 py-4 font-semibold cursor-pointer hover:text-blue-500">Asset</th>
                    <th class="px-6 py-4 font-semibold text-right cursor-pointer hover:text-blue-500">Price</th>
                    <th class="px-6 py-4 font-semibold text-right cursor-pointer hover:text-blue-500">24h Change</th>
                    <th class="px-6 py-4 font-semibold text-right cursor-pointer hover:text-blue-500">Market Cap</th>
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
        const totalValueEl = document.getElementById('portfolio-value');
        const changeEl = document.getElementById('portfolio-change');
        const totalProfitEl = document.getElementById('portfolio-total-profit');
        const assetCountEl = document.getElementById('portfolio-asset-count');
        const lastUpdatedEl = document.getElementById('portfolio-last-updated');

        if (!totalValueEl || !changeEl) return;

        let totalValue = 0;
        let totalCost = 0;
        let totalChange24h = 0;

        portfolioItems.forEach(item => {
            const coin = allCoins.find(c => c.id === item.id);
            if (!coin) return;

            const itemValue = coin.price * item.amount;
            const itemCost = item.buyPrice * item.amount;

            totalValue += itemValue;
            totalCost += itemCost;
            totalChange24h += (coin.price_change_24h || 0) * item.amount;
        });

        const totalProfit = totalValue - totalCost;
        const totalChangePct = totalValue > 0 ? (totalChange24h / (totalValue - totalChange24h)) * 100 : 0;

        totalValueEl.innerText = `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        changeEl.innerText = `${totalChange24h >= 0 ? '+$' : '-$'}${Math.abs(totalChange24h).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${totalChangePct.toFixed(2)}%)`;
        changeEl.className = `text-sm font-bold ${totalChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`;

        if (totalProfitEl) {
            totalProfitEl.innerText = `${totalProfit >= 0 ? '+$' : '-$'}${Math.abs(totalProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            totalProfitEl.className = `text-sm font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`;
        }

        if (assetCountEl) assetCountEl.innerText = portfolioItems.length;
        if (lastUpdatedEl) lastUpdatedEl.innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        this.renderAllocationBar(portfolioItems, allCoins, totalValue);
        lucide.createIcons();
    },

    renderAllocationBar(portfolioItems, allCoins, totalValue) {
        const bar = document.getElementById('portfolio-allocation-bar');
        const label = document.getElementById('portfolio-allocation-label');
        if (!bar) return;

        if (totalValue === 0) {
            bar.innerHTML = '<div class="bg-slate-200 dark:bg-slate-700 w-full"></div>';
            if (label) label.innerText = 'Empty';
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
            if (pct < 0.5) return '';
            return `<div class="${colors[i % colors.length]}" style="width: ${pct}%" title="${item.id}: ${pct.toFixed(1)}%"></div>`;
        }).join('');

        if (label) {
            if (sortedItems.length === 1) label.innerText = 'Concentrated';
            else if (sortedItems.length <= 3) label.innerText = 'Balanced';
            else label.innerText = 'Diversified';
        }
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
                    <button class="remove-watchlist-item p-1.5 rounded-lg lg:opacity-0 lg:group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all" data-id="${coin.id}">
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

    renderPortfolioSearchResults(results) {
        const container = document.getElementById('modal-search-results');
        if (!container) return;

        if (results.length === 0) {
            container.classList.add('hidden');
            return;
        }

        container.innerHTML = results.map(coin => `
            <div class="flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-dark-border last:border-none select-portfolio-asset-btn" data-id="${coin.id}" data-name="${coin.name}" data-symbol="${coin.symbol}" data-image="${coin.image}">
                <img src="${coin.image}" class="w-8 h-8 rounded-full">
                <div>
                    <div class="text-sm font-bold">${coin.name}</div>
                    <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">${coin.symbol}</div>
                </div>
                <div class="ml-auto text-xs font-bold text-slate-400">
                    $${coin.price.toLocaleString()}
                </div>
            </div>
        `).join('');
        container.classList.remove('hidden');
    },

    updateAssetPreview(coin) {
        const preview = document.getElementById('selected-asset-preview');
        if (!preview) return;

        if (!coin) {
            preview.classList.add('hidden');
            return;
        }

        preview.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <img src="${coin.image}" class="w-8 h-8 rounded-full">
                    <div>
                        <div class="text-sm font-bold">${coin.name}</div>
                        <div class="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest">${coin.symbol}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-xs text-slate-500 dark:text-dark-muted font-bold uppercase tracking-widest mb-0.5">Current Price</div>
                    <div class="text-sm font-black">$${coin.price.toLocaleString()}</div>
                </div>
            </div>
        `;
        preview.classList.remove('hidden');
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

    renderPortfolioCharts(portfolioItems, allCoins, totalValue) {
        const allocationCanvas = document.getElementById('allocation-chart');
        const plCanvas = document.getElementById('pl-chart');

        if (!allocationCanvas || !plCanvas) return;

        const data = portfolioItems.map(item => {
            const coin = allCoins.find(c => c.id === item.id);
            if (!coin) return null;
            const currentValue = item.amount * coin.price;
            const profit = currentValue - (item.amount * item.buyPrice);
            const profitPct = (item.amount * item.buyPrice) > 0 ? (profit / (item.amount * item.buyPrice)) * 100 : 0;
            return { symbol: coin.symbol, value: currentValue, profit, profitPct, name: coin.name, image: coin.image };
        }).filter(Boolean).sort((a, b) => b.value - a.value);

        if (this.allocationChartInstance) {
            this.allocationChartInstance.data.labels = data.map(d => d.symbol);
            this.allocationChartInstance.data.datasets[0].data = data.map(d => d.value);
            this.allocationChartInstance.options.plugins.tooltip.callbacks.label = (context) => {
                const d = data[context.dataIndex];
                const pct = (d.value / totalValue) * 100;
                return [
                    ` Value: $${d.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                    ` Allocation: ${pct.toFixed(1)}%`,
                    ` P/L: ${d.profit >= 0 ? '+' : ''}$${d.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                ];
            };
            this.allocationChartInstance.update();
        } else {
            const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#6366f1', '#8b5cf6', '#06b6d4', '#f43f5e'];
            this.allocationChartInstance = new Chart(allocationCanvas.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: data.map(d => d.symbol),
                    datasets: [{
                        data: data.map(d => d.value),
                        backgroundColor: colors,
                        borderWidth: 0,
                        hoverOffset: 15
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: { size: 11, weight: '600' },
                                color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b'
                            }
                        },
                        tooltip: {
                            backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
                            titleColor: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#1e293b',
                            bodyColor: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b',
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderWidth: 1,
                            padding: 12,
                            boxPadding: 6,
                            callbacks: {
                                label: (context) => {
                                    const d = data[context.dataIndex];
                                    const pct = (d.value / totalValue) * 100;
                                    return [
                                        ` Value: $${d.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                                        ` Allocation: ${pct.toFixed(1)}%`,
                                        ` P/L: ${d.profit >= 0 ? '+' : ''}$${d.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                    ];
                                }
                            }
                        }
                    }
                }
            });
        }

        const plSortedData = [...data].sort((a, b) => b.profit - a.profit);
        if (this.plChartInstance) {
            this.plChartInstance.data.labels = plSortedData.map(d => d.symbol);
            this.plChartInstance.data.datasets[0].data = plSortedData.map(d => d.profit);
            this.plChartInstance.data.datasets[0].backgroundColor = plSortedData.map(d => d.profit >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)');
            this.plChartInstance.data.datasets[0].borderColor = plSortedData.map(d => d.profit >= 0 ? '#10b981' : '#ef4444');
            this.plChartInstance.update();
        } else {
            this.plChartInstance = new Chart(plCanvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: plSortedData.map(d => d.symbol),
                    datasets: [{
                        data: plSortedData.map(d => d.profit),
                        backgroundColor: plSortedData.map(d => d.profit >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
                        borderColor: plSortedData.map(d => d.profit >= 0 ? '#10b981' : '#ef4444'),
                        borderWidth: 1,
                        borderRadius: 4,
                        barThickness: 20
                    }]
                },
                options: {
                    indexAxis: 'y',
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const d = plSortedData[context.dataIndex];
                                    return ` ${d.profit >= 0 ? '+' : ''}$${d.profit.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${d.profitPct.toFixed(2)}%)`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                            ticks: {
                                color: '#94a3b8',
                                font: { size: 10 },
                                callback: (val) => '$' + UI.formatNumber(val)
                            }
                        },
                        y: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8', font: { size: 11, weight: '600' } }
                        }
                    }
                }
            });
        }
    },

    renderPerformanceChart(historyData) {
        const canvas = document.getElementById('portfolio-performance-chart');
        if (!canvas) return;

        const isDark = document.documentElement.classList.contains('dark');

        if (this.performanceChartInstance) {
            this.performanceChartInstance.data.labels = historyData.map(d => d.date);
            this.performanceChartInstance.data.datasets[0].data = historyData.map(d => d.value);
            this.performanceChartInstance.update();
            return;
        }

        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

        this.performanceChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: historyData.map(d => d.date),
                datasets: [{
                    label: 'Portfolio Value',
                    data: historyData.map(d => d.value),
                    borderColor: '#3b82f6',
                    borderWidth: 3,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#3b82f6',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2,
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        padding: 12,
                        backgroundColor: isDark ? '#1e293b' : '#fff',
                        titleColor: isDark ? '#f8fafc' : '#1e293b',
                        bodyColor: isDark ? '#94a3b8' : '#64748b',
                        borderColor: 'rgba(59, 130, 246, 0.3)',
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                let label = ` Value: $${context.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                                const firstVal = historyData[0].value;
                                const change = ((context.parsed.y - firstVal) / firstVal) * 100;
                                return [label, ` Total Return: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%` ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#94a3b8',
                            font: { size: 10 },
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                        ticks: {
                            color: '#94a3b8',
                            font: { size: 10 },
                            callback: (val) => '$' + UI.formatNumber(val)
                        }
                    }
                }
            }
        });
    },

    renderTopPerformers(best, worst) {
        const winnerCard = document.getElementById('top-winner-card');
        const loserCard = document.getElementById('biggest-loser-card');

        if (winnerCard) {
            winnerCard.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-emerald-500/20 rounded-xl">
                        <img src="${best.image}" class="w-8 h-8 rounded-full">
                    </div>
                    <div>
                        <div class="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Top Winner</div>
                        <div class="font-bold text-sm">${best.name}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-sm font-black text-emerald-500">+${best.performance.toFixed(2)}%</div>
                    <div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ROI</div>
                </div>
            `;
        }

        if (loserCard) {
            loserCard.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-red-500/20 rounded-xl">
                        <img src="${worst.image}" class="w-8 h-8 rounded-full">
                    </div>
                    <div>
                        <div class="text-[10px] font-bold text-red-500 uppercase tracking-widest">Biggest Loser</div>
                        <div class="font-bold text-sm">${worst.name}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-sm font-black text-red-500">${worst.performance.toFixed(2)}%</div>
                    <div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ROI</div>
                </div>
            `;
        }
    },

    renderRiskMeter(portfolioItems, allCoins, totalValue) {
        const canvas = document.getElementById('risk-gauge');
        const valueEl = document.getElementById('risk-value');
        const labelEl = document.getElementById('risk-label');
        const descEl = document.getElementById('risk-desc');
        if (!canvas || !valueEl) return;

        // Risk calculation factors
        let score = 50; // Base score

        // 1. Concentration risk (Largest holding %)
        const sorted = portfolioItems.map(item => {
            const coin = allCoins.find(c => c.id === item.id);
            return (coin ? coin.price : 0) * item.amount;
        }).sort((a, b) => b - a);

        const largestPct = totalValue > 0 ? (sorted[0] / totalValue) * 100 : 0;
        if (largestPct > 50) score += 20;
        else if (largestPct > 30) score += 10;
        else if (largestPct < 15) score -= 10;

        // 2. Diversification
        if (portfolioItems.length > 8) score -= 15;
        else if (portfolioItems.length < 3) score += 10;

        // 3. Stablecoin exposure (reduction in risk)
        const stablecoins = ['tether', 'usd-coin', 'dai', 'binance-usd'];
        const stableValue = portfolioItems.reduce((sum, item) => {
            if (stablecoins.includes(item.id)) {
                const coin = allCoins.find(c => c.id === item.id);
                return sum + (coin ? coin.price : 0) * item.amount;
            }
            return sum;
        }, 0);
        const stablePct = totalValue > 0 ? (stableValue / totalValue) * 100 : 0;
        score -= (stablePct / 2);

        // Clamp score 0-100
        score = Math.max(10, Math.min(95, score));

        let rating = 'Medium Risk';
        let color = '#f59e0b';
        let desc = 'Your portfolio has a balanced mix of assets. Diversification looks healthy, but maintain caution with market volatility.';

        if (score < 35) {
            rating = 'Low Risk';
            color = '#10b981';
            desc = 'Conservative allocation with good diversification or high stablecoin exposure. Well-positioned for market downturns.';
        } else if (score > 70) {
            rating = 'High Risk';
            color = '#ef4444';
            desc = 'Highly concentrated or volatile assets. Small market movements could significantly impact your total portfolio value.';
        }

        valueEl.innerText = Math.round(score);
        valueEl.style.color = color;
        labelEl.innerText = rating;
        labelEl.style.color = color;
        descEl.innerText = desc;

        if (this.riskChartInstance) {
            this.riskChartInstance.data.datasets[0].data = [score, 100 - score];
            this.riskChartInstance.data.datasets[0].backgroundColor[0] = color;
            this.riskChartInstance.update();
        } else {
            this.riskChartInstance = new Chart(canvas.getContext('2d'), {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: [score, 100 - score],
                        backgroundColor: [color, document.documentElement.classList.contains('dark') ? '#1e293b' : '#f1f3f6'],
                        borderWidth: 0,
                        circumference: 270,
                        rotation: 225,
                        borderRadius: 10
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    cutout: '85%',
                    plugins: { legend: { display: false }, tooltip: { enabled: false } }
                }
            });
        }
    },

    renderSectorAllocation(portfolioItems, allCoins, totalValue) {
        const canvas = document.getElementById('sector-chart');
        if (!canvas) return;

        // Sector mapping logic (can be expanded)
        const sectorMap = {
            'bitcoin': 'Layer 1',
            'ethereum': 'Layer 1',
            'solana': 'Layer 1',
            'cardano': 'Layer 1',
            'polkadot': 'Layer 1',
            'ripple': 'Payment',
            'dogecoin': 'Meme',
            'shiba-inu': 'Meme',
            'pepe': 'Meme',
            'uniswap': 'DeFi',
            'aave': 'DeFi',
            'chainlink': 'Oracle',
            'render-token': 'AI',
            'fetch-ai': 'AI',
            'tether': 'Stablecoin',
            'usd-coin': 'Stablecoin'
        };

        const sectors = {};
        portfolioItems.forEach(item => {
            const coin = allCoins.find(c => c.id === item.id);
            if (!coin) return;
            const sector = sectorMap[coin.id] || 'Other';
            const value = coin.price * item.amount;
            if (!sectors[sector]) sectors[sector] = { value: 0, count: 0 };
            sectors[sector].value += value;
            sectors[sector].count += 1;
        });

        const data = Object.entries(sectors)
            .map(([name, info]) => ({ name, value: info.value, count: info.count, pct: (info.value / totalValue) * 100 }))
            .sort((a, b) => b.value - a.value);

        if (this.sectorChartInstance) {
            this.sectorChartInstance.data.labels = data.map(d => d.name);
            this.sectorChartInstance.data.datasets[0].data = data.map(d => d.value);
            this.sectorChartInstance.update();
            return;
        }

        this.sectorChartInstance = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: data.map(d => d.name),
                datasets: [{
                    data: data.map(d => d.value),
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#94a3b8'],
                    borderWidth: 0
                }]
            },
            options: {
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: { size: 10, weight: '600' },
                            color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const d = data[context.dataIndex];
                                return ` $${d.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${d.pct.toFixed(1)}%) • ${d.count} Assets`;
                            }
                        }
                    }
                }
            }
        });
    },

    renderHoldingsTable(portfolioItems, allCoins, totalValue) {
        const table = document.getElementById('holdings-table');
        if (!table) return;

        let data = portfolioItems.map(item => {
            const coin = allCoins.find(c => c.id === item.id);
            if (!coin) return null;

            const currentPrice = coin.price;
            const quantity = item.amount;
            const costBasis = item.buyPrice;
            const totalCost = quantity * costBasis;
            const currentValue = quantity * currentPrice;
            const profit = currentValue - totalCost;
            const profitPct = totalCost > 0 ? (profit / totalCost) * 100 : 0;
            const allocation = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;

            return {
                ...item,
                coin,
                currentPrice,
                totalCost,
                currentValue,
                profit,
                profitPct,
                allocation
            };
        }).filter(Boolean);

        const searchInput = document.getElementById('holdings-search');
        const query = searchInput ? searchInput.value.toLowerCase() : '';
        let filteredData = data.filter(item =>
            item.coin.name.toLowerCase().includes(query) ||
            item.coin.symbol.toLowerCase().includes(query)
        );

        // Persistent Sorting
        if (window.holdingsSortKey) {
            filteredData.sort((a, b) => {
                let valA, valB;
                switch(window.holdingsSortKey) {
                    case 'name': valA = a.coin.name; valB = b.coin.name; break;
                    case 'price': valA = a.currentPrice; valB = b.currentPrice; break;
                    case 'holdings': valA = a.amount; valB = b.amount; break;
                    case 'cost': valA = a.totalCost; valB = b.totalCost; break;
                    case 'value': valA = a.currentValue; valB = b.currentValue; break;
                    case 'profit': valA = a.profit; valB = b.profit; break;
                    case 'allocation': valA = a.allocation; valB = b.allocation; break;
                    default: valA = 0; valB = 0;
                }
                if (window.holdingsSortOrder === 'asc') return valA > valB ? 1 : -1;
                return valA < valB ? 1 : -1;
            });
        }

        const sortIcon = (key) => {
            if (window.holdingsSortKey !== key) return '<i data-lucide="chevrons-up-down" class="w-3 h-3 inline-block ml-1 opacity-20"></i>';
            return window.holdingsSortOrder === 'asc'
                ? '<i data-lucide="chevron-up" class="w-3 h-3 inline-block ml-1 text-blue-500"></i>'
                : '<i data-lucide="chevron-down" class="w-3 h-3 inline-block ml-1 text-blue-500"></i>';
        };

        table.innerHTML = `
            <thead>
                <tr>
                    <th class="cursor-pointer group" data-sort="name">
                        Asset ${sortIcon('name')}
                    </th>
                    <th class="text-right cursor-pointer group" data-sort="price">
                        Price ${sortIcon('price')}
                    </th>
                    <th class="text-right cursor-pointer group" data-sort="holdings">
                        Holdings ${sortIcon('holdings')}
                    </th>
                    <th class="text-right cursor-pointer group" data-sort="cost">
                        Cost Basis ${sortIcon('cost')}
                    </th>
                    <th class="text-right cursor-pointer group" data-sort="value">
                        Value ${sortIcon('value')}
                    </th>
                    <th class="text-right cursor-pointer group" data-sort="profit">
                        Profit/Loss ${sortIcon('profit')}
                    </th>
                    <th class="text-right cursor-pointer group" data-sort="allocation">
                        Allocation ${sortIcon('allocation')}
                    </th>
                    <th class="text-right">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-dark-border/50">
                ${filteredData.map(item => `
                    <tr class="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td>
                            <div class="flex items-center gap-3">
                                <img src="${item.coin.image}" class="w-8 h-8 rounded-full">
                                <div>
                                    <div class="font-bold text-slate-900 dark:text-white">${item.coin.name}</div>
                                    <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">${item.coin.symbol}</div>
                                </div>
                            </div>
                        </td>
                        <td class="text-right">
                            <div class="font-bold">$${item.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            <div class="text-[10px] font-bold ${item.coin.change >= 0 ? 'text-green-500' : 'text-red-500'}">
                                ${item.coin.change >= 0 ? '+' : ''}${item.coin.change.toFixed(2)}%
                            </div>
                        </td>
                        <td class="text-right">
                            <div class="font-bold">${item.amount.toLocaleString()} ${item.coin.symbol}</div>
                            <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quantity</div>
                        </td>
                        <td class="text-right">
                            <div class="font-bold">$${item.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">$${item.buyPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} avg</div>
                        </td>
                        <td class="text-right">
                            <div class="font-bold">$${item.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Value</div>
                        </td>
                        <td class="text-right">
                            <div class="font-bold ${item.profit >= 0 ? 'text-green-500' : 'text-red-500'}">
                                ${item.profit >= 0 ? '+' : '-'}$${Math.abs(item.profit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <div class="text-[10px] font-bold ${item.profitPct >= 0 ? 'text-green-500' : 'text-red-500'}">
                                ${item.profitPct >= 0 ? '+' : ''}${item.profitPct.toFixed(2)}%
                            </div>
                        </td>
                        <td class="text-right">
                            <div class="font-bold">${item.allocation.toFixed(2)}%</div>
                            <div class="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full ml-auto mt-1 overflow-hidden">
                                <div class="h-full bg-blue-500" style="width: ${item.allocation}%"></div>
                            </div>
                        </td>
                        <td class="text-right">
                            <div class="flex items-center justify-end gap-2">
                                <button class="edit-asset-btn p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500 transition-all" data-id="${item.id}">
                                    <i data-lucide="edit-3" class="w-4 h-4"></i>
                                </button>
                                <button class="delete-asset-btn p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-all" data-id="${item.id}">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        lucide.createIcons();
    },

    animateValue(id, start, end, duration, prefix = '', suffix = '', decimals = 2) {
        const obj = document.getElementById(id);
        if (!obj) return;

        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = progress * (end - start) + start;
            obj.innerHTML = prefix + value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    },

    renderPortfolioPanel(portfolioItems, allCoins) {
        const statsGrid = document.getElementById('panel-stats-grid');
        const holdingsCount = document.getElementById('holdings-count');
        const emptyState = document.getElementById('holdings-empty-state');
        const holdingsTable = document.getElementById('holdings-table');

        if (!statsGrid) return;

        let totalValue = 0;
        let totalCost = 0;
        let totalChange24h = 0;
        let bestAsset = { id: '', name: '', performance: -Infinity, image: '' };
        let worstAsset = { id: '', name: '', performance: Infinity, image: '' };

        portfolioItems.forEach(item => {
            const coin = allCoins.find(c => c.id === item.id);
            if (!coin) return;

            const itemValue = coin.price * item.amount;
            const itemCost = item.buyPrice * item.amount;
            const itemProfit = itemValue - itemCost;
            const itemPerformance = itemCost > 0 ? (itemProfit / itemCost) * 100 : 0;

            totalValue += itemValue;
            totalCost += itemCost;
            totalChange24h += (coin.price_change_24h || 0) * item.amount;

            if (itemPerformance > bestAsset.performance) {
                bestAsset = { id: coin.id, name: coin.name, performance: itemPerformance, image: coin.image };
            }
            if (itemPerformance < worstAsset.performance) {
                worstAsset = { id: coin.id, name: coin.name, performance: itemPerformance, image: coin.image };
            }
        });

        const unrealizedPL = totalValue - totalCost;
        const unrealizedPLPct = totalCost > 0 ? (unrealizedPL / totalCost) * 100 : 0;
        const roi = unrealizedPLPct;

        const stats = [
            { id: 'stat-total-value', label: 'Total Value', value: totalValue, prefix: '$', color: '' },
            { id: 'stat-cost-basis', label: 'Total Cost Basis', value: totalCost, prefix: '$', color: 'text-slate-400' },
            { id: 'stat-unrealized-pl', label: 'Unrealized P/L', value: unrealizedPL, prefix: unrealizedPL >= 0 ? '+$' : '-$', color: unrealizedPL >= 0 ? 'text-green-500' : 'text-red-500', absolute: true },
            { id: 'stat-roi', label: 'ROI %', value: roi, suffix: '%', color: roi >= 0 ? 'text-green-500' : 'text-red-500' },
            { id: 'stat-today-pl', label: 'Today\'s P/L', value: totalChange24h, prefix: totalChange24h >= 0 ? '+$' : '-$', color: totalChange24h >= 0 ? 'text-green-500' : 'text-red-500', absolute: true },
            { id: 'stat-holdings', label: 'Holdings', value: portfolioItems.length, suffix: ' Assets', color: 'text-blue-500', decimals: 0 }
        ];

        statsGrid.innerHTML = stats.map(stat => `
            <div class="bg-white/50 dark:bg-dark-card/50 backdrop-blur-md rounded-[20px] p-6 border border-white/10 dark:border-dark-border shadow-sm hover:scale-[1.02] transition-transform">
                <p class="text-[10px] font-bold text-slate-500 dark:text-dark-muted uppercase tracking-[0.15em] mb-2">${stat.label}</p>
                <div class="flex items-baseline gap-1">
                    <span id="${stat.id}" class="text-xl font-black ${stat.color}">--</span>
                </div>
            </div>
        `).join('');

        // Animate the stats
        stats.forEach(stat => {
            const val = stat.absolute ? Math.abs(stat.value) : stat.value;
            this.animateValue(stat.id, 0, val, 1000, stat.prefix || '', stat.suffix || '', stat.decimals !== undefined ? stat.decimals : 2);
        });

        if (holdingsCount) holdingsCount.innerText = `${portfolioItems.length} Assets`;

        if (portfolioItems.length === 0) {
            emptyState.classList.remove('hidden');
            holdingsTable.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            holdingsTable.classList.remove('hidden');
            this.renderHoldingsTable(portfolioItems, allCoins, totalValue);
            this.renderPortfolioCharts(portfolioItems, allCoins, totalValue);
            this.renderSectorAllocation(portfolioItems, allCoins, totalValue);
            this.renderTopPerformers(bestAsset, worstAsset);
            this.renderRiskMeter(portfolioItems, allCoins, totalValue);
        }

        lucide.createIcons();
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
