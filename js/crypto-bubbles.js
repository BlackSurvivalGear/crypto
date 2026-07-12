// js/crypto-bubbles.js
import { UI } from './ui.js';
import { CoinIntelligence } from './coin-intelligence.js';

/**
 * High-performance lightweight Crypto Bubbles Module.
 * Redesigned as a stable, premium, deterministic circle-packed market heatmap.
 */
export const CryptoBubbles = {
    canvas: null,
    ctx: null,
    animationFrameId: null,
    bubbles: [],
    coinsData: [],
    lastUpdate: 0,
    currentTimeframe: '24h',
    currentSector: 'all',
    currentHighlight: 'none',
    searchQuery: '',
    draggedBubble: null,
    hoveredBubble: null,
    loadedImages: new Map(),

    // Sectors mapping
    sectors: {
        defi: ['UNI', 'AAVE', 'MKR', 'COMP', 'LDO', 'RPL', 'YFI', 'CRV', 'SUSHI', 'PENDLE', 'INJ', 'RUNE', 'CAKE', 'JUP', 'DYDX'],
        ai: ['RNDR', 'RENDER', 'FET', 'AGIX', 'OCEAN', 'WLD', 'AKT', 'GRT', 'THETA', 'NEAR', 'TAO', 'LPT'],
        gaming: ['AXS', 'IMX', 'GALA', 'SAND', 'MANA', 'ENJ', 'BEAM', 'RON', 'PRIME', 'PIXEL', 'YGG', 'APE'],
        layer1: ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'AVAX', 'BNB', 'ATOM', 'TON', 'SUI', 'APT', 'ALGO', 'NEAR', 'LTC', 'DOGE', 'TRX', 'BCH', 'ICP', 'ETC', 'VET', 'FIL', 'FTM', 'EGLD', 'HBAR', 'EOS', 'XTZ'],
        layer2: ['ARB', 'OP', 'MATIC', 'METIS', 'MANTA', 'STRK', 'MNT', 'IMX', 'CELO'],
        meme: ['DOGE', 'SHIB', 'PEPE', 'WIF', 'FLOKI', 'BONK', 'BOME', 'MEME', 'MYRO', 'TURBO', 'SLERF', 'COQ'],
        rwa: ['ONDO', 'MKR', 'POLYX', 'CFG', 'GFI', 'RIO', 'OM'],
        privacy: ['XMR', 'ZEC', 'DASH', 'ZEN', 'ROSE', 'SCRT'],
        infrastructure: ['LINK', 'GRT', 'FIL', 'AR', 'THETA', 'AKT', 'LPT', 'ANKR', 'JASMY', 'TIA', 'PYTH'],
        stablecoins: ['USDT', 'USDC', 'DAI', 'FDUSD', 'USDE', 'TUSD', 'USDP', 'PYUSD', 'BUSD']
    },

    init() {
        this.canvas = document.getElementById('cb-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');

        // Setup Resize
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Setup DOM event listeners
        this.setupListeners();

        // Start animation loop
        this.startLoop();
    },

    resizeCanvas() {
        if (!this.canvas) return;
        const parent = this.canvas.parentElement;

        const targetWidth = parent.clientWidth || 1000;
        const targetHeight = parent.clientHeight || 600;

        this.canvas.width = targetWidth;
        this.canvas.height = targetHeight;

        // Recompute the layout to center and fit perfectly in the new viewport dimensions
        if (this.bubbles.length > 0) {
            this.computePackedLayout();
        }
    },

    setupListeners() {
        // Timeframes
        const timeframeBtns = document.querySelectorAll('.cb-timeframe-btn');
        timeframeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                timeframeBtns.forEach(b => b.classList.remove('bg-emerald-600', 'text-white', 'shadow-sm'));
                btn.classList.add('bg-emerald-600', 'text-white', 'shadow-sm');

                const time = btn.dataset.time;
                this.currentTimeframe = time;
                this.updateBubbleVisuals(true); // Soft animate transition
            });
        });

        // Sector Selector
        const sectorSelect = document.getElementById('cb-sector-filter');
        if (sectorSelect) {
            sectorSelect.addEventListener('change', (e) => {
                this.currentSector = e.target.value;
                this.computePackedLayout();
            });
        }

        // Highlight/Sort Selector
        const highlightSelect = document.getElementById('cb-highlight-filter');
        if (highlightSelect) {
            highlightSelect.addEventListener('change', (e) => {
                this.currentHighlight = e.target.value;
                this.computePackedLayout();
            });
        }

        // Search Input
        const searchInput = document.getElementById('cb-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.computePackedLayout();
            });
        }

        // Canvas Interactions (Mouse / Touch)
        this.canvas.addEventListener('mousedown', (e) => this.handlePointerDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handlePointerMove(e));
        this.canvas.addEventListener('mouseup', () => this.handlePointerUp());
        this.canvas.addEventListener('mouseleave', () => {
            this.handlePointerUp();
            this.hoveredBubble = null;
            this.updateTooltip(null);
        });

        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                this.handlePointerDown(e.touches[0]);
            }
        }, { passive: true });

        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.handlePointerMove(e.touches[0]);
            }
        }, { passive: true });

        this.canvas.addEventListener('touchend', () => this.handlePointerUp());
    },

    handlePointerDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Find clicked bubble
        let clicked = null;
        for (const b of this.bubbles) {
            if (b.opacity < 0.2) continue; // Skip inactive/faded bubbles
            const dist = Math.hypot(b.x - x, b.y - y);
            if (dist < b.radius) {
                clicked = b;
                break;
            }
        }

        if (clicked) {
            this.draggedBubble = clicked;
            clicked.isDragging = true;
            clicked.dragX = x - clicked.x;
            clicked.dragY = y - clicked.y;

            // Double click detect or click detect on release
            clicked.lastClickTime = clicked.lastClickTime || 0;
            const now = Date.now();
            if (now - clicked.lastClickTime < 300) {
                // Navigate to Coin Intelligence page
                this.navigateToCoin(clicked.coin.id);
            }
            clicked.lastClickTime = now;
        }
    },

    handlePointerMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.draggedBubble) {
            this.draggedBubble.x = x - this.draggedBubble.dragX;
            this.draggedBubble.y = y - this.draggedBubble.dragY;
        } else {
            // Check hover state
            let foundHover = null;
            for (const b of this.bubbles) {
                if (b.opacity < 0.2) continue; // Skip inactive/faded bubbles
                const dist = Math.hypot(b.x - x, b.y - y);
                if (dist < b.radius) {
                    foundHover = b;
                    break;
                }
            }
            if (foundHover !== this.hoveredBubble) {
                this.hoveredBubble = foundHover;
                this.updateTooltip(foundHover, e.clientX, e.clientY);
            } else if (foundHover) {
                // Move tooltip along
                this.updateTooltip(foundHover, e.clientX, e.clientY);
            }
        }
    },

    handlePointerUp() {
        if (this.draggedBubble) {
            this.draggedBubble.isDragging = false;
            this.draggedBubble = null;
        }
    },

    navigateToCoin(coinId) {
        // Route to coin-intelligence page
        CoinIntelligence.loadCoin(coinId).then(() => {
            UI.switchView('coin-intelligence');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    },

    updateTooltip(bubble, clientX, clientY) {
        const tooltip = document.getElementById('cb-tooltip');
        if (!tooltip) return;

        if (!bubble) {
            tooltip.classList.add('hidden');
            return;
        }

        const coin = bubble.coin;
        const timeframeKey = this.getTimeframeKey();
        const changeVal = coin[timeframeKey] !== undefined ? coin[timeframeKey] : coin.change;
        const isPositive = changeVal >= 0;

        tooltip.innerHTML = `
            <div class="flex items-center gap-3 border-b border-white/5 pb-2 mb-2">
                ${coin.image ? `<img src="${coin.image}" class="w-8 h-8 rounded-full shadow-md">` : `<div class="w-8 h-8 bg-emerald-600/10 rounded-full flex items-center justify-center font-bold text-xs">${coin.symbol[0]}</div>`}
                <div>
                    <h4 class="text-sm font-black text-white">${coin.name} <span class="text-[10px] text-dark-muted font-normal uppercase">${coin.symbol}</span></h4>
                    <span class="text-[9px] text-amber-500 font-bold uppercase tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Rank #${coin.rank || 'N/A'}</span>
                </div>
            </div>
            <div class="space-y-1.5 text-xs">
                <div class="flex justify-between">
                    <span class="text-dark-muted">Price:</span>
                    <span class="text-white font-bold">$${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-dark-muted">Market Cap:</span>
                    <span class="text-white font-semibold">$${coin.cap ? coin.cap.toLocaleString() : 'N/A'}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-dark-muted">24h Volume:</span>
                    <span class="text-white font-semibold">$${coin.vol ? coin.vol.toLocaleString() : 'N/A'}</span>
                </div>
                <div class="flex justify-between border-t border-white/5 pt-1.5 mt-1.5">
                    <span class="text-dark-muted uppercase font-black text-[9px] tracking-wider">${this.currentTimeframe} Change:</span>
                    <span class="font-black ${isPositive ? 'text-emerald-500' : 'text-red-500'}">
                        ${isPositive ? '+' : ''}${changeVal.toFixed(2)}%
                    </span>
                </div>
            </div>
            <div class="text-[8px] font-bold text-dark-muted text-center mt-3 uppercase tracking-widest border-t border-white/5 pt-1.5 animate-pulse">
                Double click bubble to analyze
            </div>
        `;

        // Position tooltip perfectly
        tooltip.classList.remove('hidden');
        const tooltipRect = tooltip.getBoundingClientRect();
        let posX = clientX + 15;
        let posY = clientY + 15;

        // Boundary checks
        if (posX + tooltipRect.width > window.innerWidth) {
            posX = clientX - tooltipRect.width - 15;
        }
        if (posY + tooltipRect.height > window.innerHeight) {
            posY = clientY - tooltipRect.height - 15;
        }

        tooltip.style.left = `${posX}px`;
        tooltip.style.top = `${posY}px`;
    },

    getTimeframeKey() {
        switch (this.currentTimeframe) {
            case '1h': return 'price_change_percentage_1h_in_currency';
            case '7d': return 'price_change_percentage_7d_in_currency';
            case '30d': return 'price_change_percentage_30d_in_currency';
            case '1y': return 'price_change_percentage_1y_in_currency';
            default: return 'change'; // 24h change
        }
    },

    setCoins(coins) {
        this.coinsData = coins;

        // Filter loader overlay
        const loader = document.getElementById('cb-loading');
        if (loader && coins.length > 0) {
            loader.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => loader.remove(), 300);
        }

        // Cache coin image elements
        coins.forEach(coin => {
            if (coin.image && !this.loadedImages.has(coin.image)) {
                const img = new Image();
                img.src = coin.image;
                img.onload = () => {
                    this.loadedImages.set(coin.image, img);
                };
            }
        });

        // Initialize or Update current bubbles
        if (this.bubbles.length === 0) {
            this.initBubbles();
        } else {
            this.updateBubbleVisuals(false); // background update
        }
    },

    initBubbles() {
        if (this.coinsData.length === 0) return;

        this.bubbles = this.coinsData.map(coin => {
            const baseRad = this.calculateBaseRadius(coin);
            const changeVal = coin[this.getTimeframeKey()] !== undefined ? coin[this.getTimeframeKey()] : coin.change;
            const initialColor = this.getBubbleColor(changeVal);

            return {
                coin: coin,
                id: coin.id,
                x: this.canvas.width / 2 + (Math.random() - 0.5) * 40,
                y: this.canvas.height / 2 + (Math.random() - 0.5) * 40,
                radius: 10,
                baseRadius: baseRad,
                targetRadius: baseRad,
                currentVal: changeVal,
                targetVal: changeVal,
                color: { ...initialColor },
                opacity: 0.0,
                targetOpacity: 1.0,
                isDragging: false,
                lastClickTime: 0
            };
        });

        this.computePackedLayout();
    },

    calculateBaseRadius(coin) {
        // Combined weight of Market Cap and 24h Volume on a Logarithmic scale
        const mcap = coin.cap || 1000000;
        const vol = coin.vol || 500000;

        // Log weight metric
        const weight = Math.log10(mcap) * 0.7 + Math.log10(vol) * 0.3;

        // Map linearly to base radius range of 25px to 75px
        const minWeight = 4;
        const maxWeight = 13.5;

        let normalized = (weight - minWeight) / (maxWeight - minWeight);
        normalized = Math.max(0, Math.min(1, normalized)); // clamp

        return 25 + normalized * 50; // Base Radius range: 25px - 75px
    },

    // Retained for backward-compatibility if referenced elsewhere
    calculateTargetRadius(coin) {
        return this.calculateBaseRadius(coin);
    },

    computePackedLayout() {
        // Determine which bubbles match current filters and are active
        const activeBubbles = this.bubbles.filter(b => {
            const coin = b.coin;
            const isMatchSector = this.isCoinInSector(coin, this.currentSector);
            const isSearchMatch = this.searchQuery === '' ||
                                  coin.name.toLowerCase().includes(this.searchQuery) ||
                                  coin.symbol.toLowerCase().includes(this.searchQuery);
            const isHighlighted = this.isHighlighted(b);
            return isMatchSector && isSearchMatch && isHighlighted;
        });

        if (activeBubbles.length === 0) {
            // Fade out all bubbles if no matches found
            this.bubbles.forEach(b => {
                b.targetOpacity = 0.0;
            });
            return;
        }

        // Sort active bubbles by base radius descending (largest first)
        activeBubbles.sort((a, b) => b.baseRadius - a.baseRadius);

        // Deterministic Circle Packing around (0, 0)
        activeBubbles[0].targetX = 0;
        activeBubbles[0].targetY = 0;

        const numAngles = 24;
        const angles = [];
        for (let k = 0; k < numAngles; k++) {
            angles.push((k / numAngles) * 2 * Math.PI);
        }

        for (let i = 1; i < activeBubbles.length; i++) {
            const b = activeBubbles[i];
            let bestX = 0;
            let bestY = 0;
            let minCenterDist = Infinity;

            // Generate candidates tangent to each already placed bubble
            for (let j = 0; j < i; j++) {
                const placed = activeBubbles[j];
                const dist = placed.baseRadius + b.baseRadius + 2; // 2px separation gap

                for (const theta of angles) {
                    const candX = placed.targetX + dist * Math.cos(theta);
                    const candY = placed.targetY + dist * Math.sin(theta);

                    // Check for overlap with already placed bubbles
                    let overlap = false;
                    for (let k = 0; k < i; k++) {
                        const other = activeBubbles[k];
                        const actualDist = Math.hypot(candX - other.targetX, candY - other.targetY);
                        if (actualDist < other.baseRadius + b.baseRadius + 1.5) {
                            overlap = true;
                            break;
                        }
                    }

                    if (!overlap) {
                        const centerDist = Math.hypot(candX, candY);
                        if (centerDist < minCenterDist) {
                            minCenterDist = centerDist;
                            bestX = candX;
                            bestY = candY;
                        }
                    }
                }
            }

            b.targetX = bestX;
            b.targetY = bestY;
        }

        // Find packed bounding box to center and scale perfectly to the canvas viewport
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        activeBubbles.forEach(b => {
            minX = Math.min(minX, b.targetX - b.baseRadius);
            maxX = Math.max(maxX, b.targetX + b.baseRadius);
            minY = Math.min(minY, b.targetY - b.baseRadius);
            maxY = Math.max(maxY, b.targetY + b.baseRadius);
        });

        const packedWidth = maxX - minX;
        const packedHeight = maxY - minY;

        const padding = 50;
        const availableWidth = this.canvas.width - padding * 2;
        const availableHeight = this.canvas.height - padding * 2;

        let scale = 1;
        if (packedWidth > 0 && packedHeight > 0) {
            scale = Math.min(availableWidth / packedWidth, availableHeight / packedHeight);
        }
        // Clamp scale so bubbles don't grow too large when few coins are matched
        scale = Math.min(scale, 1.8);

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const packedCenterX = (minX + maxX) / 2;
        const packedCenterY = (minY + maxY) / 2;

        // Apply scale, center, and target opacity
        activeBubbles.forEach(b => {
            b.targetX = centerX + (b.targetX - packedCenterX) * scale;
            b.targetY = centerY + (b.targetY - packedCenterY) * scale;
            b.targetRadius = b.baseRadius * scale;
            b.targetOpacity = 1.0;
        });

        // Fade out inactive bubbles
        this.bubbles.forEach(b => {
            if (!activeBubbles.includes(b)) {
                b.targetOpacity = 0.0;
                b.targetRadius = b.baseRadius * 0.5; // Scale down slightly as they fade
            }
        });
    },

    updateBubbleVisuals(animate = false) {
        const timeframeKey = this.getTimeframeKey();

        // Check if coin dataset changed (new listings, removed listings)
        const existingIds = new Set(this.bubbles.map(b => b.id));
        const currentIds = new Set(this.coinsData.map(c => c.id));

        let mismatch = false;
        if (existingIds.size !== currentIds.size) {
            mismatch = true;
        } else {
            for (const id of currentIds) {
                if (!existingIds.has(id)) {
                    mismatch = true;
                    break;
                }
            }
        }

        if (mismatch) {
            // Reconcile and preserve identical bubbles to maintain position stability
            const reorderedBubbles = [];
            this.coinsData.forEach(coin => {
                const existing = this.bubbles.find(b => b.id === coin.id);
                if (existing) {
                    existing.coin = coin;
                    reorderedBubbles.push(existing);
                } else {
                    const baseRad = this.calculateBaseRadius(coin);
                    const changeVal = coin[timeframeKey] !== undefined ? coin[timeframeKey] : coin.change;
                    const initialColor = this.getBubbleColor(changeVal);
                    reorderedBubbles.push({
                        coin: coin,
                        id: coin.id,
                        x: this.canvas.width / 2,
                        y: this.canvas.height / 2,
                        radius: 10,
                        baseRadius: baseRad,
                        targetRadius: baseRad,
                        currentVal: changeVal,
                        targetVal: changeVal,
                        color: { ...initialColor },
                        opacity: 0.0,
                        targetOpacity: 1.0,
                        isDragging: false,
                        lastClickTime: 0
                    });
                }
            });
            this.bubbles = reorderedBubbles;
        }

        // Update target details
        this.bubbles.forEach(b => {
            const coin = this.coinsData.find(c => c.id === b.id) || b.coin;
            b.coin = coin;

            const changeVal = coin[timeframeKey] !== undefined ? coin[timeframeKey] : coin.change;
            b.targetVal = changeVal;

            const baseRad = this.calculateBaseRadius(coin);
            b.baseRadius = baseRad;

            if (!animate) {
                b.radius = b.targetRadius;
                b.currentVal = changeVal;
            }
        });

        this.computePackedLayout();
    },

    isCoinInSector(coin, sector) {
        if (sector === 'all') return true;
        const symbol = coin.symbol.toUpperCase();

        if (sector === 'top100') {
            return coin.rank <= 100;
        }
        if (sector === 'top200') {
            return coin.rank <= 200;
        }

        const list = this.sectors[sector];
        return list ? list.includes(symbol) : false;
    },

    isHighlighted(b) {
        if (this.currentHighlight === 'none') return true;

        const coin = b.coin;
        switch (this.currentHighlight) {
            case 'gainers':
                return b.targetVal > 1.5;
            case 'losers':
                return b.targetVal < -1.5;
            case 'volume':
                const avgVol = this.coinsData.reduce((s, c) => s + (c.vol || 0), 0) / this.coinsData.length;
                return (coin.vol || 0) > avgVol * 1.5;
            case 'trending':
                return ['SOL', 'RENDER', 'RNDR', 'PEPE', 'WIF', 'FET'].includes(coin.symbol.toUpperCase());
            case 'new':
                return coin.rank > 80;
            case 'mcap':
                return (coin.cap || 0) > 1e10;
            default:
                return true;
        }
    },

    updatePhysics() {
        // High-end premium easing transitions (exponential decay, 250-400ms settle duration)
        // This removes all erratic bounces, floatings, and jitterings.
        const easeFactor = 0.15;

        this.bubbles.forEach(b => {
            if (b.isDragging) return;

            // Interpolate position
            b.x += (b.targetX - b.x) * easeFactor;
            b.y += (b.targetY - b.y) * easeFactor;

            // Interpolate size
            b.radius += (b.targetRadius - b.radius) * easeFactor;

            // Interpolate percentage labels
            b.currentVal += (b.targetVal - b.currentVal) * easeFactor;

            // Interpolate opacity
            b.opacity += (b.targetOpacity - b.opacity) * easeFactor;

            // Fade colour transitions
            const targetColor = this.getBubbleColor(b.currentVal);
            b.color.r += (targetColor.r - b.color.r) * easeFactor;
            b.color.g += (targetColor.g - b.color.g) * easeFactor;
            b.color.b += (targetColor.b - b.color.b) * easeFactor;
        });
    },

    getBubbleColor(changeVal) {
        // Redesigned premium Bloomberg-style color grading system:
        // Bright Green = Positive (>= +2.0%)
        // Dark Green = Slight Positive (> 0.0% and < +2.0%)
        // Grey = Neutral (between -0.1% and +0.1%)
        // Dark Red = Slight Negative (< 0.0% and > -2.0%)
        // Red = Negative (<= -2.0%)

        if (Math.abs(changeVal) < 0.1) {
            // Neutral grey
            return { r: 55, g: 65, b: 81 };
        } else if (changeVal >= 2.0) {
            // Bright Green
            return { r: 16, g: 185, b: 129 };
        } else if (changeVal > 0) {
            // Dark Green / Slight Positive
            return { r: 6, g: 78, b: 59 };
        } else if (changeVal <= -2.0) {
            // Bright Red
            return { r: 239, g: 68, b: 68 };
        } else {
            // Dark Red / Slight Negative
            return { r: 76, g: 5, b: 25 };
        }
    },

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.bubbles.forEach(b => {
            if (b.opacity < 0.01) return; // Completely hidden

            const coin = b.coin;
            const isSearchMatch = this.searchQuery === '' ||
                                  coin.name.toLowerCase().includes(this.searchQuery) ||
                                  coin.symbol.toLowerCase().includes(this.searchQuery);

            // Determine RGB from b.color
            const r = Math.round(b.color.r);
            const g = Math.round(b.color.g);
            const blueVal = Math.round(b.color.b);

            this.ctx.save();
            this.ctx.globalAlpha = b.opacity;

            // 1. Draw glowing outer shadow/border
            this.ctx.shadowBlur = b.opacity > 0.5 ? (this.hoveredBubble === b ? 15 : 4) : 0;
            this.ctx.shadowColor = b.currentVal >= 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';

            // 2. Beautiful glassmorphism 3D effect radial gradient
            const grad = this.ctx.createRadialGradient(
                b.x - b.radius * 0.25, b.y - b.radius * 0.25, b.radius * 0.1,
                b.x, b.y, b.radius
            );

            // Highlight white glare point for 3D sphere illusion
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
            grad.addColorStop(0.3, `rgba(${r}, ${g}, ${blueVal}, 0.85)`);
            grad.addColorStop(1, `rgba(${Math.max(0, r - 20)}, ${Math.max(0, g - 20)}, ${Math.max(0, blueVal - 20)}, 0.95)`);

            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Reset shadows for overlay text/images to keep them high-contrast
            this.ctx.shadowBlur = 0;

            // 3. Highlight rings for hovered bubble or searched bubble
            if (this.hoveredBubble === b || (this.searchQuery !== '' && isSearchMatch)) {
                this.ctx.strokeStyle = '#f59e0b'; // Gold border highlight
                this.ctx.lineWidth = 2.5;
                this.ctx.stroke();
            } else {
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }

            // 4. Draw Coin Logo
            const imgEl = this.loadedImages.get(coin.image);
            const imageSize = b.radius * 0.42;
            let logoYOffset = -b.radius * 0.22;

            if (b.radius < 32) {
                // If bubble is too small, hide logo and adjust text positioning
                logoYOffset = 0;
            } else if (imgEl) {
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.arc(b.x, b.y + logoYOffset, imageSize / 2, 0, Math.PI * 2);
                this.ctx.clip();
                this.ctx.drawImage(
                    imgEl,
                    b.x - imageSize / 2,
                    b.y + logoYOffset - imageSize / 2,
                    imageSize,
                    imageSize
                );
                this.ctx.restore();
            }

            // 5. Draw Symbol Text
            const fontSizeSymbol = Math.max(9, Math.round(b.radius * 0.24));
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = `black ${fontSizeSymbol}px Inter, sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // If logo is drawn, push text down, otherwise center it
            const textYOffset = b.radius >= 32 ? (b.radius * 0.18) : -b.radius * 0.15;
            this.ctx.fillText(coin.symbol.toUpperCase(), b.x, b.y + textYOffset);

            // 6. Draw Percentage Text
            const fontSizePercent = Math.max(8, Math.round(b.radius * 0.18));
            this.ctx.fillStyle = b.opacity > 0.5 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)';
            this.ctx.font = `bold ${fontSizePercent}px Inter, sans-serif`;

            const pctYOffset = b.radius >= 32 ? (b.radius * 0.5) : b.radius * 0.22;
            const sign = b.currentVal >= 0 ? '+' : '';
            this.ctx.fillText(`${sign}${b.currentVal.toFixed(1)}%`, b.x, b.y + pctYOffset);

            this.ctx.restore();
        });
    },

    startLoop() {
        const loop = () => {
            this.updatePhysics();
            this.render();
            this.animationFrameId = requestAnimationFrame(loop);
        };
        this.animationFrameId = requestAnimationFrame(loop);
    },

    stopLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
};
