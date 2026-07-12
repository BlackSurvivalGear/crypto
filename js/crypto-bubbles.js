// js/crypto-bubbles.js
import { UI } from './ui.js';
import { CoinIntelligence } from './coin-intelligence.js';

/**
 * High-performance lightweight Crypto Bubbles Module.
 * Designed for visual market overview with fluid physics, custom shading, and interactive controls.
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

    // Physics parameters for continuous fluid motion
    physics: {
        gravityY: -0.01,       // gentle upward buoyancy
        damping: 0.985,         // liquid drag friction
        bounce: -0.3,           // border bounce damping
        collisionForce: 0.1,    // repulsion speed between bubbles
        attractionToCenter: 0.005 // gentle pull towards center to avoid drifting apart
    },

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
        const prevWidth = this.canvas.width;
        const prevHeight = this.canvas.height;

        const targetWidth = parent.clientWidth || 1000;
        const targetHeight = parent.clientHeight || 600;

        this.canvas.width = targetWidth;
        this.canvas.height = targetHeight;

        // If bubbles were initialized in a 0x0 or fallback canvas, re-init them to distribute correctly
        if (this.bubbles.length > 0 && (prevWidth <= 100 || prevHeight <= 100) && targetWidth > 100 && targetHeight > 100) {
            this.initBubbles();
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
            });
        }

        // Highlight/Sort Selector
        const highlightSelect = document.getElementById('cb-highlight-filter');
        if (highlightSelect) {
            highlightSelect.addEventListener('change', (e) => {
                this.currentHighlight = e.target.value;
            });
        }

        // Search Input
        const searchInput = document.getElementById('cb-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
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
            this.draggedBubble.vx = 0;
            this.draggedBubble.vy = 0;
        } else {
            // Check hover state
            let foundHover = null;
            for (const b of this.bubbles) {
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
            const rad = this.calculateTargetRadius(coin);
            // Random position inside canvas with boundary margins
            const x = Math.random() * (this.canvas.width - rad * 2) + rad;
            const y = Math.random() * (this.canvas.height - rad * 2) + rad;

            return {
                coin: coin,
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                radius: rad,
                targetRadius: rad,
                currentVal: coin.change,
                targetVal: coin.change,
                opacity: 1.0,
                isDragging: false,
                lastClickTime: 0
            };
        });
    },

    calculateTargetRadius(coin) {
        // Combined weight of Market Cap and 24h Volume on a Logarithmic scale
        const mcap = coin.cap || 1000000;
        const vol = coin.vol || 500000;

        // Log weight metric
        const weight = Math.log10(mcap) * 0.7 + Math.log10(vol) * 0.3;

        // Map linearly to radius range of 25px to 75px
        // Average BTC cap is ~12-13 on log10, small cap is ~5-6
        const minWeight = 4;
        const maxWeight = 13.5;

        let normalized = (weight - minWeight) / (maxWeight - minWeight);
        normalized = Math.max(0, Math.min(1, normalized)); // clamp

        return 25 + normalized * 50; // Radius range: 25px - 75px
    },

    updateBubbleVisuals(animate = false) {
        const timeframeKey = this.getTimeframeKey();

        this.bubbles.forEach(b => {
            const coin = this.coinsData.find(c => c.id === b.coin.id) || b.coin;
            b.coin = coin;

            const changeVal = coin[timeframeKey] !== undefined ? coin[timeframeKey] : coin.change;
            b.targetVal = changeVal;

            const targetRad = this.calculateTargetRadius(coin);
            b.targetRadius = targetRad;

            if (!animate) {
                b.radius = targetRad;
                b.currentVal = changeVal;
            }
        });
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
                return b.currentVal > 1.5;
            case 'losers':
                return b.currentVal < -1.5;
            case 'volume':
                // Upper 20% by volume
                const avgVol = this.coinsData.reduce((s, c) => s + (c.vol || 0), 0) / this.coinsData.length;
                return (coin.vol || 0) > avgVol * 1.5;
            case 'trending':
                return ['SOL', 'RENDER', 'RNDR', 'PEPE', 'WIF', 'FET'].includes(coin.symbol.toUpperCase());
            case 'new':
                return coin.rank > 80; // simulate new listings
            case 'mcap':
                return (coin.cap || 0) > 1e10; // > $10B MCAP
            default:
                return true;
        }
    },

    updatePhysics() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // Double loops to handle bubble collisions (N is small ~100, N^2 is extremely light)
        for (let i = 0; i < this.bubbles.length; i++) {
            const b1 = this.bubbles[i];
            if (b1.isDragging) continue;

            // Buoyancy / target-directed flow: slight upward pull and attraction to center to clump together beautifully
            const buoyancy = -0.005 * b1.radius; // larger bubbles bounce up a bit more
            b1.vy += buoyancy;

            // Pull gently back to center workspace
            const dxCenter = centerX - b1.x;
            const dyCenter = centerY - b1.y;
            b1.vx += dxCenter * this.physics.attractionToCenter * 0.1;
            b1.vy += dyCenter * this.physics.attractionToCenter * 0.1;

            // Apply friction/drag damping
            b1.vx *= this.physics.damping;
            b1.vy *= this.physics.damping;

            // Move position
            b1.x += b1.vx;
            b1.y += b1.vy;

            // Soft transition on visual values (size & value)
            b1.radius += (b1.targetRadius - b1.radius) * 0.1;
            b1.currentVal += (b1.targetVal - b1.currentVal) * 0.1;

            // Boundary bounds
            if (b1.x - b1.radius < 0) {
                b1.x = b1.radius;
                b1.vx *= this.physics.bounce;
            } else if (b1.x + b1.radius > width) {
                b1.x = width - b1.radius;
                b1.vx *= this.physics.bounce;
            }

            if (b1.y - b1.radius < 0) {
                b1.y = b1.radius;
                b1.vy *= this.physics.bounce;
            } else if (b1.y + b1.radius > height) {
                b1.y = height - b1.radius;
                b1.vy *= this.physics.bounce;
            }

            // Check collisions with other bubbles
            for (let j = i + 1; j < this.bubbles.length; j++) {
                const b2 = this.bubbles[j];
                const dx = b2.x - b1.x;
                const dy = b2.y - b1.y;
                const dist = Math.hypot(dx, dy);
                const minDist = b1.radius + b2.radius + 2; // minor safety margin

                if (dist < minDist) {
                    // Calculate penetration depth
                    const overlap = minDist - dist;
                    const angle = Math.atan2(dy, dx);

                    // Repulsion forces
                    const force = overlap * this.physics.collisionForce;
                    const fx = Math.cos(angle) * force;
                    const fy = Math.sin(angle) * force;

                    // Push apart both bubbles smoothly
                    if (!b1.isDragging) {
                        b1.vx -= fx;
                        b1.vy -= fy;
                    }
                    if (!b2.isDragging) {
                        b2.vx += fx;
                        b2.vy += fy;
                    }

                    // Instantly correct positions to prevent overlapping and jittering
                    const correctX = Math.cos(angle) * overlap * 0.5;
                    const correctY = Math.sin(angle) * overlap * 0.5;

                    if (!b1.isDragging) {
                        b1.x -= correctX;
                        b1.y -= correctY;
                    }
                    if (!b2.isDragging) {
                        b2.x += correctX;
                        b2.y += correctY;
                    }
                }
            }
        }
    },

    getBubbleColor(changeVal) {
        // Soft gradient calculation mapping changeVal to specific RGB colors
        // Large gains: Bright Emerald Green
        // Small gains: Dark Green
        // Neutral: Dark Grey
        // Losses: Dark Red
        // Large losses: Bright Red

        let r = 21, g = 27, b = 38; // Default Dark Grey / Matte Secondary Card
        let intensity = 1;

        if (changeVal > 0) {
            // Gain: emerald scale
            intensity = Math.min(1, changeVal / 10); // reaches full bright emerald at +10%
            // Mix dark green (#0f311c) to bright emerald (#10b981)
            r = Math.round(15 + (16 - 15) * intensity);
            g = Math.round(49 + (185 - 49) * intensity);
            b = Math.round(28 + (129 - 28) * intensity);
        } else if (changeVal < 0) {
            // Loss: red scale
            intensity = Math.min(1, Math.abs(changeVal) / 10); // reaches full bright red at -10%
            // Mix dark red (#3a1315) to bright red (#ef4444)
            r = Math.round(58 + (239 - 58) * intensity);
            g = Math.round(19 + (68 - 19) * intensity);
            b = Math.round(21 + (68 - 21) * intensity);
        }

        return { r, g, b };
    },

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.bubbles.forEach(b => {
            const coin = b.coin;
            const isMatchSector = this.isCoinInSector(coin, this.currentSector);
            const isSearchMatch = this.searchQuery === '' ||
                                  coin.name.toLowerCase().includes(this.searchQuery) ||
                                  coin.symbol.toLowerCase().includes(this.searchQuery);
            const isHighlighted = this.isHighlighted(b);

            // Determine target opacity based on filters
            const targetOpacity = (isMatchSector && isSearchMatch && isHighlighted) ? 1.0 : 0.15;
            b.opacity += (targetOpacity - b.opacity) * 0.1; // Smooth opacity transition

            // Calculate gradient colors
            const { r, g, b: blueVal } = this.getBubbleColor(b.currentVal);

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
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
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
