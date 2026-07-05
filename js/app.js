// js/app.js
import { API } from './api.js';
import { Store } from './store.js';
import { UI } from './ui.js';

const COINS = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 64125.40, change: 2.45, cap: '1.26T', vol: '32.1B', icon: 'bitcoin', color: 'text-orange-500' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 3452.10, change: -1.20, cap: '415B', vol: '15.4B', icon: 'zap', color: 'text-blue-500' },
    { id: 'solana', name: 'Solana', symbol: 'SOL', price: 145.20, change: 8.32, cap: '64B', vol: '4.2B', icon: 'sun', color: 'text-emerald-500' },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA', price: 0.45, change: 0.15, cap: '16B', vol: '450M', icon: 'circle', color: 'text-blue-700' },
    { id: 'ripple', name: 'Ripple', symbol: 'XRP', price: 0.62, change: -2.10, cap: '34B', vol: '1.2B', icon: 'droplet', color: 'text-slate-400' },
    { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', price: 7.20, change: 1.50, cap: '10B', vol: '210M', icon: 'layout-grid', color: 'text-pink-500' }
];

const NEWS = [
    { title: 'SEC Approves Spot Ethereum ETF', source: 'CoinDesk', time: '2h ago', sentiment: 'bullish' },
    { title: 'Bitcoin Hashrate Reaches All-Time High', source: 'The Block', time: '5h ago', sentiment: 'neutral' },
    { title: 'New Regulation Proposed for Stablecoins', source: 'Reuters', time: '8h ago', sentiment: 'bearish' }
];

const PORTFOLIO = [
    { id: 'bitcoin', amount: 0.15, value: 9618.81 },
    { id: 'ethereum', amount: 0.8, value: 2761.68 },
    { id: 'solana', amount: 5, value: 726.00 }
];

let allCoins = [];
window.allCoins = allCoins;

document.addEventListener('DOMContentLoaded', async () => {
    lucide.createIcons();

    // Initial UI with mocks and stored data
    const watchlistIds = Store.getWatchlist();
    const portfolio = Store.getPortfolio();
    UI.isInWatchlist = (id) => Store.getWatchlist().includes(id);
    UI.renderMarketCards(COINS, watchlistIds);
    UI.renderAssetTable(COINS);
    UI.renderPortfolio(portfolio, COINS);
    UI.renderWatchlist(COINS, watchlistIds);
    UI.renderNews(NEWS);
    UI.initMainChart('BTC');

    setupInteractivity();

    // Load live data
    await loadDashboardData();

    // Set up refresh intervals
    setInterval(async () => {
        await loadDashboardData();
    }, 60 * 1000); // 60 seconds
});

async function updatePortfolioPerformance(portfolio, days = 30) {
    try {
        if (portfolio.length === 0) return;

        // Fetch historical data for each asset
        const historicalPromises = portfolio.map(item => API.fetchCoinChart(item.id, days));
        const historicalResults = await Promise.all(historicalPromises);

        // Aggregate daily values
        // Note: CoinGecko returns data in [timestamp, price] format
        const minPoints = Math.min(...historicalResults.map(res => res.prices.length));

        const aggregatedHistory = [];
        for (let i = 0; i < minPoints; i++) {
            let dailyTotal = 0;
            let timestamp = historicalResults[0].prices[i][0];

            portfolio.forEach((item, index) => {
                const priceAtTime = historicalResults[index].prices[i][1];
                dailyTotal += priceAtTime * item.amount;
            });

            aggregatedHistory.push({
                date: new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
                value: dailyTotal
            });
        }

        UI.renderPerformanceChart(aggregatedHistory);
    } catch (error) {
        console.error('Failed to update portfolio performance:', error);
    }
}

async function loadDashboardData() {
    try {
        const searchInput = document.getElementById('asset-search');
        const currentSearch = searchInput ? searchInput.value.toLowerCase() : '';

        const liveCoins = await API.fetchCoins();
        allCoins = liveCoins.map(c => ({
            id: c.id,
            name: c.name,
            symbol: c.symbol.toUpperCase(),
            price: c.current_price,
            change: c.price_change_percentage_24h,
            cap: c.market_cap,
            vol: c.total_volume,
            image: c.image,
            sparkline: c.sparkline_in_7d.price,
            price_change_24h: c.price_change_24h,
            rank: c.market_cap_rank
        }));
        window.allCoins = allCoins;

        const news = await API.fetchNews();
        const portfolio = Store.getPortfolio();
        const watchlistIds = Store.getWatchlist();
        const fng = await API.fetchFearAndGreed();

        UI.renderMarketCards(allCoins, watchlistIds);
        UI.renderAssetTable(allCoins);

        // Re-apply search filter if active
        if (currentSearch) {
            const rows = document.querySelectorAll('#asset-table tbody tr');
            rows.forEach(row => {
                const name = row.querySelector('.font-semibold').innerText.toLowerCase();
                const symbol = row.querySelector('.uppercase').innerText.toLowerCase();
                if (name.includes(currentSearch) || symbol.includes(currentSearch)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }

        UI.renderWatchlist(allCoins, watchlistIds);
        UI.renderNews(news);
        UI.renderPortfolio(portfolio, allCoins);
        UI.renderFearAndGreed(fng);

        if (document.body.classList.contains('panel-open')) {
            UI.renderPortfolioPanel(portfolio, allCoins);
            await updatePortfolioPerformance(portfolio);
        }

        updateGlobalStats(allCoins);
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

function updateGlobalStats(coins) {
    const totalMCap = coins.reduce((sum, c) => sum + (c.cap || 0), 0);
    const totalVol = coins.reduce((sum, c) => sum + (c.vol || 0), 0);

    const mcapEl = document.querySelector('#global-stats .flex:nth-child(3) span:nth-child(2)');
    if (mcapEl) mcapEl.innerText = `$${UI.formatNumber(totalMCap)}`;

    const volEl = document.querySelector('#global-stats .flex:nth-child(4) span:nth-child(2)');
    if (volEl) volEl.innerText = `$${UI.formatNumber(totalVol)}`;
}

// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        Store.setTheme(isDark ? 'dark' : 'light');
    });
}

function setupInteractivity() {
    // Asset Search
    const searchInput = document.getElementById('asset-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#asset-table tbody tr');
            rows.forEach(row => {
                const name = row.querySelector('.font-semibold').innerText.toLowerCase();
                const symbol = row.querySelector('.uppercase').innerText.toLowerCase();
                if (name.includes(query) || symbol.includes(query)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    // Watchlist Search
    const watchlistSearch = document.getElementById('watchlist-search');
    const watchlistSearchResults = document.getElementById('watchlist-search-results');
    if (watchlistSearch) {
        watchlistSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length < 1) {
                watchlistSearchResults.classList.add('hidden');
                return;
            }
            const results = allCoins.filter(c =>
                c.name.toLowerCase().includes(query) ||
                c.symbol.toLowerCase().includes(query)
            ).slice(0, 5);
            UI.renderWatchlistSearchResults(results);
        });

        // Close search results on click outside
        document.addEventListener('click', (e) => {
            if (!watchlistSearch.contains(e.target) && !watchlistSearchResults.contains(e.target)) {
                watchlistSearchResults.classList.add('hidden');
            }
        });
    }

    // Add to Watchlist
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.add-to-watchlist-btn');
        if (btn) {
            const id = btn.dataset.id;
            const watchlist = Store.addToWatchlist(id);
            UI.renderWatchlist(allCoins, watchlist);
            UI.renderMarketCards(allCoins, watchlist);
            UI.renderAssetTable(allCoins);
            watchlistSearchResults.classList.add('hidden');
            watchlistSearch.value = '';
            UI.showNotification('Added to watchlist', 'success');
        }
    });

    // Remove from Watchlist
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.remove-watchlist-item');
        if (btn) {
            e.stopPropagation();
            const id = btn.dataset.id;
            const watchlist = Store.removeFromWatchlist(id);
            const coins = allCoins.length > 0 ? allCoins : COINS;
            UI.renderWatchlist(coins, watchlist);
            UI.renderMarketCards(coins, watchlist);
            UI.renderAssetTable(coins);
            UI.showNotification('Removed from watchlist', 'info');
        }
    });

    // Manage Portfolio Buttons (Open Panel)
    const portfolioCard = document.getElementById('portfolio');
    const managePortfolioBtn = document.getElementById('manage-portfolio-btn');
    const portfolioPanel = document.getElementById('portfolio-panel');
    const portfolioOverlay = document.getElementById('portfolio-panel-overlay');

    const openPortfolioPanel = () => {
        document.body.classList.add('panel-open');
        const portfolio = Store.getPortfolio();
        UI.renderPortfolioPanel(portfolio, allCoins);
        updatePortfolioPerformance(portfolio);
    };

    const closePortfolioPanel = () => {
        document.body.classList.remove('panel-open');
    };

    if (portfolioCard) portfolioCard.addEventListener('click', openPortfolioPanel);
    if (managePortfolioBtn) managePortfolioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openPortfolioPanel();
    });

    // Handle backdrop clicks to close
    if (portfolioOverlay) {
        portfolioOverlay.addEventListener('click', closePortfolioPanel);
    }

    // Portfolio Timeframe Buttons
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.portfolio-timeframe-btn');
        if (btn) {
            const timeframe = btn.dataset.time;
            const buttons = document.querySelectorAll('.portfolio-timeframe-btn');
            buttons.forEach(b => b.classList.remove('bg-white', 'dark:bg-dark-bg', 'shadow-sm'));
            btn.classList.add('bg-white', 'dark:bg-dark-bg', 'shadow-sm');

            const dayMap = { '24H': 1, '7D': 7, '30D': 30, '90D': 90, '1Y': 365, 'ALL': 'max' };
            await updatePortfolioPerformance(Store.getPortfolio(), dayMap[timeframe] || 30);
        }
    });

    const closePanelBtn = document.getElementById('close-panel-btn');
    if (closePanelBtn) closePanelBtn.addEventListener('click', closePortfolioPanel);
    if (portfolioOverlay) portfolioOverlay.addEventListener('click', closePortfolioPanel);

    // ESC to close panel
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('panel-open')) {
            closePortfolioPanel();
        }
    });

    // Remove from Portfolio (Sidecard - Deprecated, but keeping for compatibility)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.remove-portfolio-item');
        if (btn) {
            e.stopPropagation();
            const id = btn.dataset.id;
            const portfolio = Store.removeFromPortfolio(id);
            const coins = allCoins.length > 0 ? allCoins : COINS;
            UI.renderPortfolio(portfolio, coins);
            UI.showNotification('Asset removed from portfolio', 'info');
        }
    });

    // Portfolio Panel: Add Asset Button
    const addAssetPanelBtn = document.getElementById('add-asset-panel-btn');
    const emptyStateAddBtn = document.getElementById('empty-state-add-btn');
    const modal = document.getElementById('portfolio-modal');

    const openAddModal = () => {
        document.getElementById('modal-title').innerText = 'Add Asset';
        document.getElementById('edit-asset-id').value = '';
        document.getElementById('portfolio-form').reset();
        document.getElementById('selected-asset-preview').classList.add('hidden');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    };

    if (addAssetPanelBtn) addAssetPanelBtn.addEventListener('click', openAddModal);
    if (emptyStateAddBtn) emptyStateAddBtn.addEventListener('click', openAddModal);

    // Portfolio Modal: Asset Search
    const modalAssetSearch = document.getElementById('modal-asset-search');
    const modalSearchResults = document.getElementById('modal-search-results');
    if (modalAssetSearch) {
        modalAssetSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length < 1) {
                modalSearchResults.classList.add('hidden');
                return;
            }
            const results = allCoins.filter(c =>
                c.name.toLowerCase().includes(query) ||
                c.symbol.toLowerCase().includes(query)
            ).slice(0, 8);
            UI.renderPortfolioSearchResults(results);
        });
    }

    // Portfolio Modal: Select Asset from results
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.select-portfolio-asset-btn');
        if (btn) {
            const id = btn.dataset.id;
            const coin = allCoins.find(c => c.id === id);
            if (coin) {
                document.getElementById('edit-asset-id').value = id;
                document.getElementById('modal-asset-search').value = coin.name;
                UI.updateAssetPreview(coin);
                modalSearchResults.classList.add('hidden');
            }
        }
    });

    // Portfolio Panel: Edit/Delete Asset
    document.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-asset-btn');
        const deleteBtn = e.target.closest('.delete-asset-btn');

        if (editBtn) {
            const id = editBtn.dataset.id;
            const portfolio = Store.getPortfolio();
            const asset = portfolio.find(item => item.id === id);
            const coin = allCoins.find(c => c.id === id);

            if (asset && coin) {
                document.getElementById('modal-title').innerText = 'Edit Asset';
                document.getElementById('edit-asset-id').value = id;
                document.getElementById('modal-asset-search').value = coin.name;
                document.getElementById('portfolio-quantity').value = asset.amount;
                document.getElementById('portfolio-buy-price').value = asset.buyPrice;
                document.getElementById('portfolio-date').value = asset.date;
                document.getElementById('portfolio-notes').value = asset.notes;

                UI.updateAssetPreview(coin);
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        }

        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            if (confirm('Are you sure you want to remove this asset?')) {
                const portfolio = Store.removeFromPortfolio(id);
                UI.renderPortfolio(portfolio, allCoins);
                UI.renderPortfolioPanel(portfolio, allCoins);
                UI.showNotification('Asset removed from portfolio', 'info');
            }
        }
    });

    // Holdings Table: Sorting
    document.addEventListener('click', (e) => {
        const th = e.target.closest('.holdings-table th[data-sort]');
        if (th) {
            const sortKey = th.dataset.sort;

            // Toggle sort order
            if (window.holdingsSortKey === sortKey) {
                window.holdingsSortOrder = (window.holdingsSortOrder === 'asc') ? 'desc' : 'asc';
            } else {
                window.holdingsSortKey = sortKey;
                window.holdingsSortOrder = 'desc';
            }

            const portfolio = Store.getPortfolio();
            UI.renderHoldingsTable(portfolio, allCoins, portfolio.reduce((sum, item) => {
                const c = allCoins.find(coin => coin.id === item.id);
                return sum + (c ? c.price * item.amount : 0);
            }, 0));
        }
    });

    // Holdings Search
    const holdingsSearch = document.getElementById('holdings-search');
    if (holdingsSearch) {
        holdingsSearch.addEventListener('input', () => {
            const portfolio = Store.getPortfolio();
            const totalValue = portfolio.reduce((sum, item) => {
                const c = allCoins.find(coin => coin.id === item.id);
                return sum + (c ? c.price * item.amount : 0);
            }, 0);
            UI.renderHoldingsTable(portfolio, allCoins, totalValue);
        });
    }

    // Timeframe Buttons
    const buttons = document.querySelectorAll('.timeframe-btn');
    const intervalMap = {
        '1h': '60',
        '24h': 'D',
        '7d': 'W',
        '30d': 'W',
        '1y': 'M'
    };
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('bg-white', 'dark:bg-dark-card', 'shadow-sm'));
            btn.classList.add('bg-white', 'dark:bg-dark-card', 'shadow-sm');

            const timeframe = btn.dataset.time;
            const interval = intervalMap[timeframe] || 'D';
            UI.initMainChart(UI.currentSymbol || 'BTC', interval);
        });
    });

    // Sorting Logic via Event Delegation
    const assetTable = document.getElementById('asset-table');
    if (assetTable) {
        assetTable.addEventListener('click', (e) => {
            const th = e.target.closest('th');
            if (th) {
                const index = Array.from(th.parentNode.children).indexOf(th);
                if (index < 5) {
                    sortTable(index);
                }
            }
        });

    }

    // Watchlist Toggles in Table
    document.addEventListener('click', (e) => {
        const toggle = e.target.closest('.watchlist-toggle');
        if (toggle) {
            e.stopPropagation();
            const id = toggle.dataset.id;
            const watchlist = Store.toggleWatchlist(id);
            const coins = allCoins.length > 0 ? allCoins : COINS;
            UI.renderAssetTable(coins);
            UI.renderWatchlist(coins, watchlist);
            UI.renderMarketCards(coins, watchlist);
        }
    });

    // Asset Selection for Chart
    document.addEventListener('click', (e) => {
        const target = e.target.closest('tr[data-id], #watchlist [data-id], .market-card');
        if (target && !e.target.closest('.watchlist-toggle') && !e.target.closest('.remove-watchlist-item')) {
            const id = target.dataset.id;
            const coins = allCoins.length > 0 ? allCoins : COINS;
            const coin = coins.find(c => c.id === id);
            if (coin) {
                UI.currentCoinId = id;
                UI.initMainChart(coin.symbol, UI.currentInterval || 'D');
                updateChartHeader(coin);

                // Only update visual highlights, not the whole component unless necessary
                const watchlist = Store.getWatchlist();
                UI.renderWatchlist(coins, watchlist);
                UI.renderMarketCards(coins, watchlist);
            }
        }
    });

    // Portfolio Modal Controls
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    const portfolioForm = document.getElementById('portfolio-form');

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        });
    }
    if (cancelModalBtn) {
        cancelModalBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        });
    }

    if (portfolioForm) {
        portfolioForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-asset-id').value;
            const amount = parseFloat(document.getElementById('portfolio-quantity').value);
            const buyPrice = parseFloat(document.getElementById('portfolio-buy-price').value);
            const date = document.getElementById('portfolio-date').value;
            const notes = document.getElementById('portfolio-notes').value;

            if (id && !isNaN(amount) && !isNaN(buyPrice)) {
                const portfolio = Store.updatePortfolio({
                    id, amount, buyPrice, date, notes
                });
                UI.renderPortfolio(portfolio, allCoins);
                UI.renderPortfolioPanel(portfolio, allCoins);
                updatePortfolioPerformance(portfolio);
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                portfolioForm.reset();
                UI.showNotification('Portfolio updated successfully', 'success');
            } else {
                UI.showNotification('Please fill in all required fields', 'error');
            }
        });
    }
}

function updateChartHeader(coin) {
    document.getElementById('chart-asset-name').innerText = coin.name;
    document.getElementById('chart-asset-price').innerText = `$${coin.price.toLocaleString()}`;
    const changeEl = document.getElementById('chart-asset-change');
    const change = typeof coin.change === 'number' ? coin.change : parseFloat(coin.change);
    changeEl.innerText = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    changeEl.className = `text-sm font-semibold ${change >= 0 ? 'text-green-500' : 'text-red-500'}`;

    if (coin.image) {
        document.getElementById('chart-asset-icon').innerHTML = `<img src="${coin.image}" class="w-6 h-6 rounded-full">`;
    } else {
        document.getElementById('chart-asset-icon').innerHTML = `<i data-lucide="${coin.icon || 'bitcoin'}" class="w-6 h-6 text-orange-500"></i>`;
        lucide.createIcons();
    }
}

let sortOrder = 1;
function sortTable(columnIndex) {
    const tbody = document.querySelector('#asset-table tbody');
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('tr'));

    sortOrder *= -1;

    rows.sort((a, b) => {
        let aVal = a.children[columnIndex].innerText.replace(/[\$,%]/g, '');
        let bVal = b.children[columnIndex].innerText.replace(/[\$,%]/g, '');

        if (!isNaN(parseFloat(aVal))) {
            return (parseFloat(aVal) - parseFloat(bVal)) * sortOrder;
        }
        return aVal.localeCompare(bVal) * sortOrder;
    });

    rows.forEach(row => tbody.appendChild(row));
}
