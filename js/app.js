// js/app.js
import { API } from './api.js';
import { Store } from './store.js';
import { UI } from './ui.js';
import { InstitutionalAPI } from './institutional-api.js';
import { InstitutionalUI } from './institutional-ui.js';

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

let allCoins = [];
window.allCoins = allCoins;

/**
 * Institutional Terminal Orchestrator
 */
const InstitutionalTerminalOrchestrator = {
    currentMinThreshold: 1000000,
    currentChain: 'all',
    currentType: 'all',
    searchQuery: '',
    refreshInterval: null,

    async init() {
        // Setup event listeners
        this.setupListeners();
    },

    startRefreshing() {
        if (this.refreshInterval) return;
        this.refreshData(true); // Show loading only on first start
        this.refreshInterval = setInterval(() => this.refreshData(false), 30000);
    },

    stopRefreshing() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    },

    async refreshData(showLoading = false) {
        try {
            if (showLoading) InstitutionalUI.showLoadingState();
            const data = await InstitutionalAPI.getInstitutionalTransactions();

            // Classification and stats calculation
            const stats = InstitutionalAPI.calculateStats(data.transactions);

            // Filter data based on UI state
            const filtered = data.transactions.filter(tx => {
                const matchesThreshold = tx.amount_usd >= this.currentMinThreshold;
                const matchesChain = this.currentChain === 'all' || tx.blockchain.toLowerCase() === this.currentChain.toLowerCase();
                const matchesType = this.currentType === 'all' ||
                                   (tx.from.owner_type === this.currentType || tx.to.owner_type === this.currentType);
                const matchesSearch = !this.searchQuery ||
                    tx.hash.toLowerCase().includes(this.searchQuery) ||
                    tx.from.owner.toLowerCase().includes(this.searchQuery) ||
                    tx.to.owner.toLowerCase().includes(this.searchQuery);

                return matchesThreshold && matchesChain && matchesType && matchesSearch;
            });

            // Update UI
            InstitutionalUI.updateStatusBadge(InstitutionalAPI.status);
            InstitutionalUI.renderInstitutionalStats(stats);
            InstitutionalUI.renderLiveFeed(filtered);
            InstitutionalUI.renderCharts(data.transactions); // Use all transactions for distribution charts
            InstitutionalUI.renderAISummary(data.transactions, stats);

            // Trigger alerts for high value txs (> $10M) if new
            const highValueTxs = filtered.filter(tx => tx.amount_usd >= 10000000);
            if (highValueTxs.length > 0) {
                // Check if we already alerted for the top transaction in this session
                const topTx = highValueTxs[0];
                if (this.lastAlertedHash !== topTx.hash) {
                    UI.showNotification(`🚨 WHALE ALERT: $${(topTx.amount_usd/1e6).toFixed(1)}M ${topTx.symbol.toUpperCase()} moved!`, 'warning');
                    this.lastAlertedHash = topTx.hash;
                }
            }

        } catch (error) {
            console.error('Whale data refresh failed:', error);
        }
    },

    setupListeners() {
        // Nav switching
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                UI.switchView(view);
                if (view === 'institutional') {
                    this.startRefreshing();
                } else {
                    this.stopRefreshing();
                }
            });
        });

        // Terminal Search
        const terminalSearch = document.getElementById('terminal-search');
        if (terminalSearch) {
            terminalSearch.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.refreshData();
            });
        }

        // Institution Type Filter
        const typeFilter = document.getElementById('filter-type');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.currentType = e.target.value;
                this.refreshData();
            });
        }

        // Alerts Dropdown Toggle
        const alertsBtn = document.getElementById('alerts-btn');
        const alertsDropdown = document.getElementById('alerts-dropdown');
        if (alertsBtn && alertsDropdown) {
            alertsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                alertsDropdown.classList.toggle('hidden');
            });
            document.addEventListener('click', (e) => {
                if (!alertsDropdown.contains(e.target) && !alertsBtn.contains(e.target)) {
                    alertsDropdown.classList.add('hidden');
                }
            });
        }

        // Filter Dropdown Toggle
        const filterBtn = document.getElementById('feed-filter-btn');
        const filterDropdown = document.getElementById('feed-filter-dropdown');
        if (filterBtn && filterDropdown) {
            filterBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                filterDropdown.classList.toggle('hidden');
            });
            document.addEventListener('click', (e) => {
                if (!filterDropdown.contains(e.target) && !filterBtn.contains(e.target)) {
                    filterDropdown.classList.add('hidden');
                }
            });
        }

        // Chain Filter
        const chainFilter = document.getElementById('filter-chain');
        if (chainFilter) {
            chainFilter.addEventListener('change', (e) => {
                this.currentChain = e.target.value;
                this.refreshData();
            });
        }

        // Min Value Filter
        document.querySelectorAll('.filter-min-val').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-min-val').forEach(b => b.classList.remove('border-blue-500', 'text-blue-500'));
                btn.classList.add('border-blue-500', 'text-blue-500');
                this.currentMinThreshold = parseInt(btn.dataset.val);
                this.refreshData();
            });
        });

        // Mobile Portfolio Button
        const mobilePortfolioBtn = document.getElementById('mobile-manage-portfolio');
        if (mobilePortfolioBtn) {
            mobilePortfolioBtn.addEventListener('click', () => {
                const openPortfolioPanel = () => {
                    document.body.classList.add('panel-open');
                    const portfolio = Store.getPortfolio();
                    UI.renderPortfolioPanel(portfolio, allCoins);
                    updatePortfolioPerformance(portfolio);
                };
                openPortfolioPanel();
            });
        }


        // Feed item click (Detail Panel)
        const terminalFeed = document.getElementById('terminal-feed');
        if (terminalFeed) {
            terminalFeed.addEventListener('click', (e) => {
                const item = e.target.closest('.terminal-feed-item');
                if (item) {
                    const hash = item.dataset.hash;
                    const tx = InstitutionalAPI.transactions.find(t => t.hash === hash);
                    if (tx) InstitutionalUI.openDetailPanel(tx);
                }
            });
        }

        // Close panels
        const closePanelBtn = document.getElementById('close-terminal-panel');
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', () => InstitutionalUI.closeDetailPanel());
        }
        const panelOverlay = document.getElementById('terminal-panel-overlay');
        if (panelOverlay) {
            panelOverlay.addEventListener('click', () => InstitutionalUI.closeDetailPanel());
        }
    }
};

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

    // Init Institutional Terminal Orchestrator
    InstitutionalTerminalOrchestrator.init();

    // Start Intelligence Bar Lifecycle
    initIntelligenceBar();

    // Intelligence Bar Interactions
    const liqItem = document.getElementById('ib-liq-value')?.closest('.intelligence-bar-item');
    if (liqItem) {
        liqItem.addEventListener('click', () => UI.openLiquidationModal());
    }

    const closeLiqBtn = document.getElementById('close-liq-modal');
    if (closeLiqBtn) {
        closeLiqBtn.addEventListener('click', () => UI.closeLiquidationModal());
    }

    const liqModal = document.getElementById('liq-modal');
    if (liqModal) {
        liqModal.addEventListener('click', (e) => {
            if (e.target === liqModal) UI.closeLiquidationModal();
        });
    }

    // Initial View from Hash
    const initialView = window.location.hash.substring(1) || 'market';
    UI.switchView(initialView, false);
    if (initialView === 'institutional') {
        InstitutionalTerminalOrchestrator.startRefreshing();
    } else {
        InstitutionalTerminalOrchestrator.stopRefreshing();
    }

    // Handle back/forward navigation
    window.addEventListener('hashchange', () => {
        const view = window.location.hash.substring(1) || 'market';
        UI.switchView(view, false);
        if (view === 'institutional') {
            InstitutionalTerminalOrchestrator.startRefreshing();
        } else {
            InstitutionalTerminalOrchestrator.stopRefreshing();
        }
    });

    // Load live data
    await loadDashboardData();

    // Set up main dashboard refresh interval (60s)
    setInterval(async () => {
        await loadDashboardData();
    }, 60 * 1000);
});

/**
 * Intelligence Bar Lifecycle Management
 */
function initIntelligenceBar() {
    let countdown = 30;
    const countdownEl = document.getElementById('ib-refresh-countdown');

    const updateIntelligence = async () => {
        try {
            const data = await API.fetchIntelligenceData();
            UI.renderIntelligenceBar(data);
            countdown = 30; // Reset countdown
        } catch (error) {
            console.error('Failed to update intelligence bar:', error);
        }
    };

    // Initial load
    updateIntelligence();

    // Refresh data every 30 seconds
    setInterval(updateIntelligence, 30 * 1000);

    // Live countdown timer every 1 second
    setInterval(() => {
        countdown--;
        if (countdown < 0) countdown = 29;
        if (countdownEl) {
            countdownEl.innerText = `Refreshes in ${countdown}s`;
        }
    }, 1000);
}

async function updatePortfolioPerformance(portfolio, days = 30) {
    try {
        if (portfolio.length === 0) return;

        // Fetch historical data for each asset
        const historicalPromises = portfolio.map(item => API.fetchCoinChart(item.id, days));
        const historicalResults = await Promise.all(historicalPromises);

        // Aggregate daily values
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

    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}


// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
const themeToggleTerminal = document.getElementById('theme-toggle-terminal');

const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    Store.setTheme(isDark ? 'dark' : 'light');

    // Re-render charts if they exist to update colors
    if (window.allCoins && Store.getWatchlist()) {
        UI.renderMarketCards(window.allCoins, Store.getWatchlist());
    }
    if (InstitutionalUI.charts.chain) InstitutionalUI.renderCharts(InstitutionalAPI.transactions);
};

if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
if (themeToggleTerminal) themeToggleTerminal.addEventListener('click', toggleTheme);

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
