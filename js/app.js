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

    // Initial UI with mocks
    const watchlistIds = Store.getWatchlist();
    UI.isInWatchlist = (id) => Store.getWatchlist().includes(id);
    UI.renderMarketCards(COINS, watchlistIds);
    UI.renderAssetTable(COINS);
    UI.renderPortfolio(PORTFOLIO, COINS);
    UI.renderWatchlist(COINS, watchlistIds);
    UI.renderNews(NEWS);
    UI.initMainChart('BTC');

    setupInteractivity();

    // Load live data
    await loadDashboardData();

    // Set up refresh intervals
    setInterval(async () => {
        const fng = await API.fetchFearAndGreed();
        UI.renderFearAndGreed(fng);
    }, 5 * 60 * 1000); // 5 minutes
});

async function loadDashboardData() {
    try {
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
        UI.renderWatchlist(allCoins, watchlistIds);
        UI.renderNews(news);
        UI.renderPortfolio(portfolio, allCoins);
        UI.renderFearAndGreed(fng);

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
            UI.renderWatchlist(allCoins, watchlist);
            UI.renderMarketCards(allCoins, watchlist);
            UI.renderAssetTable(allCoins);
            UI.showNotification('Removed from watchlist', 'info');
        }
    });

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

    // Sorting Logic
    const tableHeaders = document.querySelectorAll('#asset-table th');
    tableHeaders.forEach((th, index) => {
        if (index < 5) {
            th.classList.add('cursor-pointer', 'hover:text-blue-500');
            th.addEventListener('click', () => sortTable(index));
        }
    });

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
    const addAssetBtn = document.getElementById('add-asset-btn');
    const modal = document.getElementById('portfolio-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const coinSelect = document.getElementById('portfolio-coin-select');
    const portfolioForm = document.getElementById('portfolio-form');

    if (addAssetBtn && modal) {
        addAssetBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            const coins = allCoins.length > 0 ? allCoins : COINS;
            coinSelect.innerHTML = coins.map(coin =>
                `<option value="${coin.id}">${coin.name} (${coin.symbol.toUpperCase()})</option>`
            ).join('');
        });
    }

    if (closeModalBtn && modal) {
        closeModalBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        });
    }

    if (portfolioForm) {
        portfolioForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = coinSelect.value;
            const amount = parseFloat(document.getElementById('portfolio-quantity').value);
            if (id && !isNaN(amount)) {
                const portfolio = Store.updatePortfolio(id, amount);
                UI.renderPortfolio(portfolio, allCoins.length > 0 ? allCoins : COINS);
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                portfolioForm.reset();
                UI.showNotification('Portfolio updated successfully', 'success');
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
