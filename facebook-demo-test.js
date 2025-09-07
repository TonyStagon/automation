import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configuration
const HEADLESS = false; // Show browser for debugging
const SCREENSHOT_DIR = './demo-screenshots';
const FB_URL = 'https://www.facebook.com/login';

// Get credentials from environment variables
const FB_USERNAME = process.env.FB_USERNAME;
const FB_PASSWORD = process.env.FB_PASSWORD;

class EnhancedFacebookAutomation {
    constructor() {
        this.browser = null;
        this.page = null;
        this.logSteps = [];
        this.cookieDir = './cookies';
    }

    async initialize() {
        await fs.ensureDir(SCREENSHOT_DIR);
        await fs.ensureDir(this.cookieDir);

        // Enhanced stealth launch options
        this.browser = await puppeteer.launch({
            headless: HEADLESS,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-features=VizDisplayCompositor',
                '--window-size=1366,768',
                '--disable-web-security',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-default-apps',
                '--no-default-browser-check',
                '--disable-hang-monitor',
                '--disable-popup-blocking',
                '--disable-prompt-on-repost',
                '--disable-sync',
                '--metrics-recording-only',
                '--safebrowsing-disable-auto-update',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ],
            defaultViewport: null,
            ignoreDefaultArgs: ['--enable-automation']
        });

        this.page = await this.browser.newPage();

        // Advanced stealth techniques
        await this.page.evaluateOnNewDocument(() => {
            // Remove webdriver property
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
            });

            // Mock navigator properties
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });

            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });

            // Remove automation indicators
            delete navigator.__proto__.webdriver;

            // Mock chrome object
            window.chrome = {
                runtime: {},
                app: {
                    isInstalled: false
                }
            };

            // Override permissions
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                Promise.resolve({ state: Permissions.prototype.state = 'denied' }) :
                originalQuery(parameters)
            );

            // Mock webGL
            const getParameter = WebGLRenderingContext.getParameter;
            WebGLRenderingContext.prototype.getParameter = function(parameter) {
                if (parameter === 37445) {
                    return 'Intel Inc.';
                }
                if (parameter === 37446) {
                    return 'Intel Iris OpenGL Engine';
                }
                return getParameter(parameter);
            };
        });

        // Set realistic headers
        await this.page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0'
        });

        // Set user agent
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Set viewport
        await this.page.setViewport({ width: 1366, height: 768 });

        console.log('🎯 Enhanced stealth browser initialized');
    }

    async logStep(name, success, error = null) {
            const step = { name, success, error, timestamp: new Date() };
            this.logSteps.push(step);

            const statusIcon = success ? '✅' : '❌';
            console.log(`${statusIcon} ${name}: ${success ? 'SUCCESS' : `FAILED - ${error}`}`);

        if (this.page && success) {
            try {
                const screenshotName = `${name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
                await this.page.screenshot({ path: path.join(SCREENSHOT_DIR, screenshotName) });
            } catch (err) {
                console.log('Screenshot failed:', err.message);
            }
        }
        
        return step;
    }

    async humanDelay(min = 1000, max = 3000) {
        const delay = Math.random() * (max - min) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    async typeHumanLike(element, text) {
        await element.focus();
        await this.humanDelay(500, 1000);
        
        // Clear existing content first
        await element.click({ clickCount: 3 });
        await this.page.keyboard.press('Delete');
        
        // Type with realistic human-like patterns
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            // Random typing speed with occasional pauses
            const typingDelay = Math.random() * 150 + 50;
            
            // Occasional longer pause (thinking)
            if (Math.random() < 0.1) {
                await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
            }
            
            await this.page.keyboard.type(char);
            await new Promise(resolve => setTimeout(resolve, typingDelay));
        }
    }

    async simulateMouseMovement() {
        // Random mouse movements to appear human
        const movements = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < movements; i++) {
            const x = Math.floor(Math.random() * 800) + 100;
            const y = Math.floor(Math.random() * 600) + 100;
            
            await this.page.mouse.move(x, y);
            await this.humanDelay(200, 800);
        }
    }

    async scrollRandomly() {
        // Random scrolling to appear natural
        const scrollDistance = Math.floor(Math.random() * 300) + 100;
        await this.page.evaluate((distance) => {
            window.scrollBy(0, distance);
        }, scrollDistance);
        await this.humanDelay(1000, 2000);
    }

    async saveCookies() {
        const cookies = await this.page.cookies();
        await fs.writeJSON(path.join(this.cookieDir, 'facebook_cookies.json'), cookies);
        console.log('🍪 Cookies saved');
    }

    async loadCookies() {
        const cookiePath = path.join(this.cookieDir, 'facebook_cookies.json');
        if (await fs.pathExists(cookiePath)) {
            const cookies = await fs.readJSON(cookiePath);
            await this.page.setCookie(...cookies);
            console.log('🍪 Cookies loaded');
            return true;
        }
        return false;
    }

    async waitForElement(selectors, timeout = 10000, retries = 3) {
        const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
        
        let attempt = 1;
        let lastError = null;
        
        while (attempt <= retries) {
            console.log(`🗂️ Wait attempt ${attempt}/${retries} for selectors: ${selectorArray.join(', ')}`);
            
            for (const selector of selectorArray) {
                try {
                    await this.page.waitForSelector(selector, {
                        timeout: Math.max(timeout / selectorArray.length, 2000),
                        waitFor: 'visible' // Ensure element is visible
                    });
                    
                    const element = await this.page.$(selector);
                    
                    if (!element) {
                        console.log(`❓ Found selector ${selector} but element is null`);
                        continue;
                    }
                    
                    // Enhanced interactability check with comprehensive validation
                    const isInteractable = await this.page.evaluate((el) => {
                        if (!el) return false;
                        
                        const rect = el.getBoundingClientRect();
                        if (rect.width <= 0 || rect.height <= 0) return false;
                        
                        const style = window.getComputedStyle(el);
                        if (style.display === 'none' ||
                            style.visibility === 'hidden' ||
                            parseInt(style.opacity) === 0 ||
                            el.offsetParent === null) {
                            return false;
                        }
                        
                        // Additional checks: enabled and not busy
                        const isDisabled = el.getAttribute('disabled') === '' ||
                                         el.getAttribute('aria-disabled') === 'true';
                        const isBusy = el.getAttribute('aria-busy') === 'true';
                        
                        return !isDisabled && !isBusy;
                    }, element);
                    
                    if (isInteractable) {
                        console.log(`✅ Found valid, interactable element: ${selector}`);
                        return element;
                    } else {
                        console.log(`ℹ️  Found selector ${selector} but element is not interactable`);
                    }
                    
                } catch (e) {
                    lastError = e;
                    console.log(`❌ Timing out or skipping for : ` + selector + ` Readably: I did receive error that is this in a shorter string version. `);
                    // Don't log full error to avoid clutter
                }
            }
            
            if (attempt < retries) {
                console.log(`⏳ Retrying in 1 second... (attempt ${attempt}/${retries})`);
                await this.humanDelay(1000, 1500);
            }
            attempt++;
        }
        
        throw new Error(`❌ All selectors failed after ${retries} retries: ${selectorArray.join(', ')}. Last error: ${lastError?.message || 'No detailed error'}`);
    }

    async login() {
        try {
            // Load cookies first
            const hasCookies = await this.loadCookies();
            
            await this.page.goto('https://www.facebook.com', { 
                waitUntil: 'networkidle2', 
                timeout: 30000 
            });

            await this.humanDelay(3000, 5000);
            await this.simulateMouseMovement();

            // Check if already logged in
            console.log('🔍 Checking login status...');
            
            const loggedInSelectors = [
                '[data-testid="user-menu"]',
                '[aria-label*="Your profile"]',
                '[data-pagelet="LeftRail"]',
                'div[role="navigation"][aria-label="Facebook"]'
            ];
            
            try {
                await this.waitForElement(loggedInSelectors, 3000);
                console.log('🎯 Already logged in!');
                await this.logStep('Already logged in', true);
                return true;
            } catch (e) {
                console.log('🔒 Need to login...');
            }

            // Go to login page
            await this.page.goto(FB_URL, { 
                waitUntil: 'networkidle2', 
                timeout: 30000 
            });

            await this.logStep('Navigate to Facebook Login', true);
            await this.humanDelay(2000, 4000);

            // Find and fill email
            const emailSelectors = [
                '#email',
                'input[name="email"]',
                'input[type="email"]',
                'input[data-testid="royal_email"]'
            ];

            const emailInput = await this.waitForElement(emailSelectors);
            await this.typeHumanLike(emailInput, FB_USERNAME);
            await this.logStep('Enter email', true);

            // Find and fill password
            const passwordSelectors = [
                '#pass',
                'input[name="pass"]',
                'input[type="password"]',
                'input[data-testid="royal_pass"]'
            ];

            const passwordInput = await this.waitForElement(passwordSelectors);
            await this.typeHumanLike(passwordInput, FB_PASSWORD);
            await this.logStep('Enter password', true);

            await this.humanDelay(1000, 2000);

            // Find and click login button
            const loginButtonSelectors = [
                'button[name="login"]',
                'input[name="login"]',
                'button[type="submit"]',
                'button[data-testid="royal_login_button"]'
            ];

            const loginButton = await this.waitForElement(loginButtonSelectors);
            await loginButton.click();
            await this.logStep('Click login button', true);

            // Wait for login to complete
            try {
                await this.waitForElement(loggedInSelectors, 15000);
                await this.logStep('Login successful', true);
                
                await this.saveCookies();
                return true;
                
            } catch (e) {
                // Check for 2FA or other issues
                const currentUrl = this.page.url();
                if (currentUrl.includes('checkpoint') || currentUrl.includes('two-factor')) {
                    throw new Error('2FA or security check required - please complete manually');
                }
                throw new Error('Login failed - may require manual intervention');
            }

        } catch (error) {
            await this.logStep('Login failed', false, error.message);
            return false;
        }
    }

    async findPostButton() {
        console.log('🎯 Advanced POST button detection starting...');
        
        // Take screenshot for debugging
        await this.page.screenshot({
            path: `${SCREENSHOT_DIR}/before_post_button_search_${Date.now()}.png`
        });

        // Enhanced post button detection with multiple strategies - Updated 2025
        const postButtonStrategies = [
            {
                name: 'Modern Facebook UI Selectors - Jan 2025',
                selectors: [
                    // Primary post button selectors (highest priority)
                    '[aria-label="Post"][role="button"]:not([aria-disabled="true"]):not([disabled])',
                    'div[data-testid="react-composer-post-button"]',
                    'button[data-testid="react-composer-post-button"]',
                    'div[aria-label="Publish"][role="button"]:not([disabled])',
                    'div[aria-label="Share"][role="button"]:not([disabled])',
                    
                    // Specific attribute patterns (reliable in current FB UI)
                    'div[role="button"][data-pagelet*="Composer"]:not([aria-hidden="true"])',
                    'div[data-testid*="post-button"]:not([disabled])',
                    'button[data-testid*="post-button"]:not([disabled])',
                    'div[aria-label*="post" i][role="button"]:not([disabled])', // Case insensitive
                    'div[data-visualcompletion*="button"]:not([disabled])', // Facebook's visual completion markers
                    
                    // International variants
                    'div[aria-label="Publicar"][role="button"]', // Spanish
                    'div[aria-label="Confirmer"][role="button"]', // French
                    'div[aria-label="Teilen"][role="button"]', // German
                    'div[aria-label="Publica"][role="button"]', // Italian
                    
                    // Button-specific variants
                    'button[type="submit"][aria-label*="Post"]:not([disabled])',
                    'button[data-testid*="submit"]:not([disabled])' // Generic submit button
                ]
            },
            {
                name: 'Pattern-based Detection with Filters - Jan 2025',
                selectors: [
                    // Smart filtered button detection
                    'div.x1pi30zi[role="button"]:not([disabled])', // Current Facebook primary button class
                    'div.x1i0eh1i6[role="button"]:not([disabled])', // Alternative button pattern
                    'div.x6s0dn4[role="button"]:not([disabled])', // Modern FB button
                    'div.x1swvt13[role="button"]:not([disabled])', // Updated pattern
                    
                    // Filtered dynamic classes (with visibility checks)
                    'div[class*="x1n2onr6"][role="button"]:not([aria-hidden="true"])',
                    'div[class*="x1i10hfl"][role="button"]:visible', // Pseudo-selector for jQuery-like behavior
                    'div[class*="xsgj6o6"][role="button"]:not([style*="display: none"])',
                    'div[class*="x1lq5wgf"][role="button"]:not([hidden])',
                    'div[class*="x78zum5"][role="button"]:empty', // Sometimes empty divs have button role
                    
                    // Enhanced detection with content
                    'div[role="button"]:has(> span:has-text("Post")):not([disabled])',
                    'div[role="button"]:has(> div:has-text("Post")):not([disabled])',
                    'button:has(> span:has-text("Post")):not([disabled])',
                    'button:has(> div:has-text("Post")):not([disabled])'
                ]
            }
        ];

        // Strategy 1: Try standard selectors
        for (const strategy of postButtonStrategies) {
            if (strategy.selectors.length === 0) continue; // Skip text-based for now
            
            console.log(`🔍 Trying ${strategy.name}...`);
            
            for (const selector of strategy.selectors) {
                try {
                    const elements = await this.page.$$(selector);
                    
                    for (const element of elements) {
                        const isValidPostButton = await this.page.evaluate(el => {
                            const rect = el.getBoundingClientRect();
                            const style = window.getComputedStyle(el);
                            const text = el.textContent?.toLowerCase() || '';
                            const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
                            
                            // Check visibility
                            const isVisible = rect.width > 0 && rect.height > 0 && 
                                            style.display !== 'none' && 
                                            style.visibility !== 'hidden' &&
                                            style.opacity > 0;
                            
                            // Check if it looks like a post button
                            const hasPostKeywords = /post|publish|share|submit/.test(text + ' ' + ariaLabel);
                            
                            // Check if it's positioned like a post button (usually at bottom right of composer)
                            const isInPostPosition = rect.bottom < window.innerHeight && rect.right < window.innerWidth;
                            
                            // Check if it has button-like styling
                            const hasButtonStyling = style.cursor === 'pointer' || 
                                                   style.backgroundColor !== 'transparent' ||
                                                   el.tagName === 'BUTTON';
                            
                            return isVisible && hasPostKeywords && isInPostPosition && hasButtonStyling;
                        }, element);
                        
                        if (isValidPostButton) {
                            console.log(`✅ Found valid post button with selector: ${selector}`);
                            return element;
                        }
                    }
                } catch (e) {
                    console.log(`❌ Selector ${selector} failed:`, e.message.slice(0, 50));
                    // Enhanced debug info for button detection
                    if (e.message.includes('query') || e.message.includes('invalid') || e.message.includes('offset')) {
                        console.log(`Selector likely evaluates to null for: ${selector}`);
                    }
                }
            }
        }

        // Strategy 2: Text-based detection with improved logic
        console.log('🔍 Trying text-based detection...');
        const textBasedButton = await this.page.evaluateHandle(() => {
            // Find all clickable elements
            const clickableElements = Array.from(document.querySelectorAll('button, div[role="button"], input[type="submit"]'));
            
            // Filter for post buttons
            const postButtons = clickableElements.filter(el => {
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                const text = el.textContent?.toLowerCase().trim() || '';
                const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
                const dataTestId = el.getAttribute('data-testid')?.toLowerCase() || '';
                
                // Enhanced visibility checks - must be fully visible and accessible
                if (!this.isElementInteractable(el)) {
                    return false;
                }
                
                // Enhanced keyword detection for multiple languages
                const fullContext = [text, ariaLabel, dataTestId].join(' ').toLowerCase();
                const hasKeywords = this.detectPostKeywords(fullContext);
                
                if (!hasKeywords) return false;
                
                // Enhanced button detection with more human-like pattern matching
                const looksLikeActiveButton = this.resemblesActiveButton(el, style, rect);
                
                return looksLikeActiveButton;
            });
            
            // Sort by preference (exact matches first, then by position)
            postButtons.sort((a, b) => {
                const aText = a.textContent?.toLowerCase().trim() || '';
                const bText = b.textContent?.toLowerCase().trim() || '';
                
                const aExact = /^(post|publish|share)$/i.test(aText);
                const bExact = /^(post|publish|share)$/i.test(bText);
                
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;
                
                // If both or neither are exact, prefer one that's more to the bottom-right
                const aRect = a.getBoundingClientRect();
                const bRect = b.getBoundingClientRect();
                
                return (bRect.bottom + bRect.right) - (aRect.bottom + aRect.right);
            });
            
            return postButtons[0] || null;
        });

        if (textBasedButton && textBasedButton.asElement) {
            const element = textBasedButton.asElement();
            if (element) {
                console.log('✅ Found post button via text-based detection');
                return element;
            }
        }

        // Strategy 3: DOM tree analysis for composer area
        console.log('🔍 Trying DOM tree analysis...');
        const composerButton = await this.page.evaluateHandle(() => {
            // Look for contenteditable elements (the text input)
            const textInputs = Array.from(document.querySelectorAll('[contenteditable="true"]'));
            
            for (const input of textInputs) {
                // Find the closest form or container
                let container = input.closest('form') || 
                              input.closest('div[role="dialog"]') ||
                              input.closest('div[data-testid*="composer"]') ||
                              input.parentElement;
                
                // Look for buttons in this container
                if (container) {
                    const buttons = Array.from(container.querySelectorAll('button, div[role="button"], input[type="submit"]'));
                    
                    for (const button of buttons) {
                        const rect = button.getBoundingClientRect();
                        const text = button.textContent?.toLowerCase() || '';
                        const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
                        
                        if (rect.width > 0 && rect.height > 0 &&
                            /post|publish|share/.test(text + ' ' + ariaLabel)) {
                            return button;
                        }
                    }
                }
            }
            return null;
        });

        if (composerButton && composerButton.asElement) {
            const element = composerButton.asElement();
            if (element) {
                console.log('✅ Found post button via DOM tree analysis');
                return element;
            }
        }

        // Strategy 4: XPath fallback
        console.log('🔍 Trying XPath selectors...');
        const xpathSelectors = [
            "//div[@role='button' and contains(translate(text(), 'POST', 'post'), 'post')]",
            "//button[contains(translate(text(), 'POST', 'post'), 'post')]",
            "//div[@role='button' and @aria-label[contains(translate(., 'POST', 'post'), 'post')]]",
            "//button[@aria-label[contains(translate(., 'POST', 'post'), 'post')]]"
        ];

        for (const xpath of xpathSelectors) {
            try {
                const elements = await this.page.$x(xpath);
                if (elements.length > 0) {
                    const element = elements[0];
                    const isVisible = await this.page.evaluate(el => {
                        const rect = el.getBoundingClientRect();
                        const style = window.getComputedStyle(el);
                        return rect.width > 0 && rect.height > 0 && 
                               style.display !== 'none' && 
                               style.visibility !== 'hidden';
                    }, element);
                    
                    if (isVisible) {
                        console.log(`✅ Found post button via XPath: ${xpath}`);
                        return element;
                    }
                }
            } catch (e) {
                console.log(`❌ XPath ${xpath} failed`);
            }
        }

        // Strategy 5: Enhanced DOM Context Analysis
        console.log('🔍 Trying enhanced DOM context analysis...');
        const domContextButton = await this.page.evaluateHandle(() => {
            // Find the post content editor
            const postEditor = document.querySelector('[contenteditable="true"]');
            if (!postEditor) return null;

            // Traverse up DOM tree to find composer container
            let container = postEditor.closest('form') ||
                           postEditor.closest('[data-testid*="composer"]') ||
                           postEditor.parentElement;

            while (container && container !== document.body) {
                const hasButtons = container.querySelectorAll('button, div[role="button"]').length > 0;
                if (hasButtons && getComputedStyle(container).display !== 'none') break;
                container = container.parentElement;
            }

            if (!container) return null;

            // Find buttons and analyze them
            const buttons = Array.from(container.querySelectorAll('button, div[role="button"]'));
            
            const scoredButtons = buttons.map(button => {
                const rect = button.getBoundingClientRect();
                const style = getComputedStyle(button);
                const text = button.textContent?.toLowerCase() || '';
                const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
                
                let score = 0;

                if (rect.width < 10 || rect.height < 10 || style.display === 'none') {
                    return { button, score: 0 };
                }

                // Higher scores for better matches
                if (/^post$/i.test(text.trim())) score += 100;
                else if (/^(publish|share)$/i.test(text.trim())) score += 80;
                else if (/post/i.test(text) || /post/i.test(ariaLabel)) score += 60;
                else if (/publish|share/i.test(text) || /publish|share/i.test(ariaLabel)) score += 50;

                // Style analysis - prefer styled, typical buttons
                if (button.tagName === 'BUTTON') score += 20;
                if (style.cursor === 'pointer') score += 15;
                if (style.backgroundColor && style.backgroundColor !== 'transparent') score += 10;

                // Size constraints for typical buttons
                if (rect.width >= 40 && rect.width <= 150 && rect.height >= 30 && rect.height <= 50) {
                    score += 20;
                }

                // Position relative to editor
                const editorRect = postEditor.getBoundingClientRect();
                const distanceFromEditor = Math.abs(rect.top - editorRect.bottom) + Math.abs(rect.left - editorRect.left);
                
                // Closer buttons get higher score (200px max)
                const positionScore = Math.max(0, 25 - Math.floor(distanceFromEditor / 8));
                score += positionScore;

                return { button, score };
            });

            scoredButtons.sort((a, b) => b.score - a.score);
            return scoredButtons.length > 0 && scoredButtons[0].score > 60 ? scoredButtons[0].button : null;
        });

        if (domContextButton && domContextButton.asElement) {
            const element = domContextButton.asElement();
            if (element) {
                console.log('✅ Found post button via DOM context analysis');
                return element;
            }
        }

        // Strategy 6: Last resort - find the most likely button
        console.log('🔍 Going into last resort mode: finding most likely button...');
        const lastResortButton = await this.page.evaluateHandle(() => {
            const allButtons = Array.from(document.querySelectorAll('button, div[role="button"], input[type="submit"]'));
            
            // Score each button based on likelihood of being a post button
            const scoredButtons = allButtons.map(button => {
                const rect = button.getBoundingClientRect();
                const style = window.getComputedStyle(button);
                const text = button.textContent?.toLowerCase() || '';
                const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
                
                let score = 0;
                
                // Must be visible
                if (rect.width < 10 || rect.height < 10 || 
                    style.display === 'none' || 
                    style.visibility === 'hidden' ||
                    parseFloat(style.opacity) < 0.1) {
                    return { button, score: 0 };
                }
                
                // Text content scoring
                if (/^post$/i.test(text.trim())) score += 100;
                else if (/^(publish|share)$/i.test(text.trim())) score += 80;
                else if (/post/i.test(text)) score += 50;
                else if (/publish|share/i.test(text)) score += 40;
                
                // Aria label scoring
                if (/post/i.test(ariaLabel)) score += 60;
                else if (/publish|share/i.test(ariaLabel)) score += 50;
                
                // Position scoring (prefer bottom-right)
                const windowHeight = window.innerHeight;
                const windowWidth = window.innerWidth;
                if (rect.bottom > windowHeight * 0.5) score += 20;
                if (rect.right > windowWidth * 0.5) score += 20;
                
                // Style scoring
                if (button.tagName === 'BUTTON') score += 30;
                if (style.cursor === 'pointer') score += 20;
                if (style.backgroundColor && style.backgroundColor !== 'transparent') score += 15;
                
                // Size scoring (reasonable button size)
                if (rect.width >= 50 && rect.width <= 200 && rect.height >= 30 && rect.height <= 60) {
                    score += 25;
                }
                
                return { button, score };
            });
            
            // Sort by score and return the highest scoring button
            scoredButtons.sort((a, b) => b.score - a.score);
            
            return scoredButtons.length > 0 && scoredButtons[0].score > 50 ? scoredButtons[0].button : null;
        });

        if (lastResortButton && lastResortButton.asElement) {
            const element = lastResortButton.asElement();
            if (element) {
                console.log('✅ Found post button via scoring algorithm');
                return element;
            }
        }

        console.log('❌ No post button found through any enhanced method');
        
        // Comprehensive debugging and error reporting
        console.log('🐛 DEBUG: Capturing DOM state for post button debugging...');
        await this.page.screenshot({
            path: path.join(SCREENSHOT_DIR, `post_button_fallback_analysis_${Date.now()}.png`),
            fullPage: true
        });

        // Enhanced error information gathering
        await this.page.evaluate(() => {
            console.log('📊 POST BUTTON ANALYSIS REPORT -------------------------------------');
            
            // Find post composer elements
            const composerDivs = Array.from(document.querySelectorAll('div')).filter(div => {
                const rect = div.getBoundingClientRect();
                return rect.width > 200 && rect.height > 100 && getComputedStyle(div).display !== 'none';
            });

            composerDivs.sort((a, b) => {
                return (b.getBoundingClientRect().width * b.getBoundingClientRect().height) -
                       (a.getBoundingClientRect().width * a.getBoundingClientRect().height);
            });

            if (composerDivs.length > 0) {
                const topComposer = composerDivs[0];
                
                // Log information about the composer
                console.log('Top composer container found:');
                console.log('  Classes:', Array.from(topComposer.classList).join(' '));
                console.log('  Size:', `${Math.round(topComposer.getBoundingClientRect().width)}x${Math.round(topComposer.getBoundingClientRect().height)}`);
                console.log('  Data attributes:', Object.keys(topComposer.dataset).filter(k => topComposer.dataset[k] !== ''));
                
                // Log buttons in the composer
                const buttons = topComposer.querySelectorAll('button, div[role="button"], div[data-testid]');
                console.log('  Found', buttons.length, 'candidate buttons:');
                
                Array.from(buttons).forEach((button, i) => {
                    if (i < 5) { // Only show first 5 to avoid log spam
                        const rect = button.getBoundingClientRect();
                        console.log(`    ${i + 1}. ${button.tagName}: "${button.textContent?.substring(0, 20)}" | size: ${Math.round(rect.width)}x${Math.round(rect.height)}`);
                    }
                });
            }

            console.log('📑 COMMON CANDIDATE ELEMENTS ---------------------------------------');
            
            // Check common locations for post buttons
            const commonAreas = [
                'div[data-testid*="feeds"]',
                'div[data-testid*="addpost"]',
                'div[data-pagelet*="FeedComposer"]',
                'div[role="dialog"]',
                'form'
            ];

            commonAreas.forEach(area => {
                const elements = document.querySelectorAll(area);
                if (elements.length > 0) {
                    console.log(`📍 ${area}: found ${elements.length} element(s)`);
                    elements.forEach((el, idx) => {
                        if (idx < 2) { // Only show first two
                            console.log(`  Element ${idx + 1}: Classes "${Array.from(el.classList).join(' ')}"`);
                        }
                    });
                }
            });

            console.log('-------------------------------------------------------------------');
        });

        return null;
    }

   
// Enhanced posy clicking with additional visual and interaction detection
async clickPosy(predictedButton) {
    console.log('🎯 Enhanced Posy Click starting...');
    
    await this.page.screenshot({
        path: `${SCREENSHOT_DIR}/before_posy_click_${Date.now()}.png`
    });

    // Multiple click techniques in a row for maximum success rate
    const clickMethods = [
        {
            name: 'Enhanced visible area click',
            action: async () => {
                const rect = await predictedButton.boundingBox();
                const clickX = rect.x + rect.width * 0.5;
                const clickY = rect.y + rect.height * 0.7; // Click slightly lower in visible area
                await this.page.mouse.click(clickX, clickY);
                await this.humanDelay(300, 600);
            }
        },
        {
            name: 'Lower edge click for overflow buttons',
            action: async () => {
                const rect = await predictedButton.boundingBox();
                const clickX = rect.x + rect.width * 0.5;
                const clickY = rect.y + rect.height * 0.9; // Avoid hitting top edge issues
                await this.page.mouse.click(clickX, clickY);
                await this.humanDelay(300, 600);
            }
        },
        {
            name: 'Double-click for stubborn buttons',
            action: async () => {
                const rect = await predictedButton.boundingBox();
                const clickX = rect.x + rect.width * 0.5;
                const clickY = rect.y + rect.height * 0.5;
                await this.page.mouse.click(clickX, clickY, { clickCount: 2 });
                await this.humanDelay(500, 800);
            }
        },
        {
            name: 'Right-edge click (trigger zone)',
            action: async () => {
                const rect = await predictedButton.boundingBox();
                const clickX = rect.x + rect.width * 0.8; // Right side often works better
                const clickY = rect.y + rect.height * 0.5;
                await this.page.mouse.click(clickX, clickY);
                await this.humanDelay(300, 600);
            }
        }
    ];

    for (const method of clickMethods) {
        console.log(`🔧 Trying posy method: ${method.name}`);
        try {
            await method.action();
            
            // Quick verification check
            await this.humanDelay(1000, 1500);
            const success = await this.checkPostSuccess();
            
            if (success) {
                console.log(`✅ Posy method "${method.name}" successful!`);
                return true;
            }
        } catch (e) {
            console.log(`⚠️ Posy method "${method.name}" failed:`, e.message);
        }
    }

    console.log('❌ All posy click methods failed');
    return false;
}

// Enhanced version of post button click with posy capabilities
async enhancedPostButtonClick(postButton) {
    console.log('🎯 Starting robust post button clicking...');
    
    // Take screenshot before click attempts
    await this.page.screenshot({
        path: `${SCREENSHOT_DIR}/before_robust_click_${Date.now()}.png`
    });

    // First, let's ensure we have the right button by double-checking its properties
    const buttonInfo = await this.page.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return {
            text: el.textContent?.trim(),
            ariaLabel: el.getAttribute('aria-label'),
            tagName: el.tagName,
            classes: Array.from(el.classList),
            rect: { width: rect.width, height: rect.height, x: rect.x, y: rect.y },
            isVisible: rect.width > 0 && rect.height > 0,
            isEnabled: !el.hasAttribute('disabled') && el.getAttribute('aria-disabled') !== 'true'
        };
    }, postButton);
    
    console.log('🔍 Button details:', buttonInfo);
    
    if (!buttonInfo.isVisible || !buttonInfo.isEnabled) {
        console.log('❌ Button is not visible or enabled');
        return false;
    }

    // Method 1: Force scroll and wait approach
    console.log('🔄 Method 1: Scroll into view and standard click');
    try {
        await postButton.scrollIntoViewIfNeeded();
        await this.humanDelay(1000, 1500);
        
        // Clear any potential overlays by clicking elsewhere first
        await this.page.mouse.click(100, 100);
        await this.humanDelay(500, 800);
        
        await postButton.hover();
        await this.humanDelay(300, 500);
        await postButton.click();
        
        // Wait longer for Facebook to process
        await this.humanDelay(3000, 4000);
        
        const success1 = await this.checkPostSuccess();
        if (success1) {
            console.log('✅ Method 1 successful');
            return true;
        }
    } catch (error) {
        console.log('❌ Method 1 failed:', error.message);
    }

    // Method 2: JavaScript click with event simulation
    console.log('🔄 Method 2: JavaScript click with full event chain');
    try {
        await this.page.evaluate(el => {
            // Simulate a complete mouse interaction
            const rect = el.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            // Create and dispatch events in correct order
            const events = [
                new MouseEvent('mousedown', { 
                    bubbles: true, 
                    cancelable: true, 
                    clientX: x, 
                    clientY: y,
                    button: 0
                }),
                new MouseEvent('mouseup', { 
                    bubbles: true, 
                    cancelable: true, 
                    clientX: x, 
                    clientY: y,
                    button: 0
                }),
                new MouseEvent('click', { 
                    bubbles: true, 
                    cancelable: true, 
                    clientX: x, 
                    clientY: y,
                    button: 0
                })
            ];
            
            events.forEach(event => {
                el.dispatchEvent(event);
            });
            
            // Also try direct click
            if (typeof el.click === 'function') {
                el.click();
            }
        }, postButton);
        
        await this.humanDelay(4000, 5000);
        
        const success2 = await this.checkPostSuccess();
        if (success2) {
            console.log('✅ Method 2 successful');
            return true;
        }
    } catch (error) {
        console.log('❌ Method 2 failed:', error.message);
    }

    // Method 3: Focus and keyboard activation
    console.log('🔄 Method 3: Focus and keyboard activation');
    try {
        await postButton.focus();
        await this.humanDelay(500, 800);
        
        // Try both Enter and Space
        await this.page.keyboard.press('Enter');
        await this.humanDelay(1000, 1500);
        
        let success3 = await this.checkPostSuccess();
        if (!success3) {
            await postButton.focus();
            await this.page.keyboard.press('Space');
            await this.humanDelay(2000, 3000);
            success3 = await this.checkPostSuccess();
        }
        
        if (success3) {
            console.log('✅ Method 3 successful');
            return true;
        }
    } catch (error) {
        console.log('❌ Method 3 failed:', error.message);
    }

    // Method 4: Form submission approach
    console.log('🔄 Method 4: Form submission approach');
    try {
        const formSubmitted = await this.page.evaluate(el => {
            // Find the closest form
            let form = el.closest('form');
            let container = el;
            
            // If no form found, look for form in nearby containers
            while (!form && container && container !== document.body) {
                container = container.parentElement;
                form = container.querySelector('form') || container.closest('form');
            }
            
            if (form) {
                // Try to submit the form
                if (typeof form.submit === 'function') {
                    form.submit();
                    return true;
                }
                
                // Try to trigger submit event
                const submitEvent = new Event('submit', {
                    bubbles: true,
                    cancelable: true
                });
                form.dispatchEvent(submitEvent);
                return true;
            }
            
            return false;
        }, postButton);
        
        if (formSubmitted) {
            await this.humanDelay(4000, 5000);
            const success4 = await this.checkPostSuccess();
            if (success4) {
                console.log('✅ Method 4 successful');
                return true;
            }
        }
    } catch (error) {
        console.log('❌ Method 4 failed:', error.message);
    }

    // Method 5: Alternative button finder and click
    console.log('🔄 Method 5: Alternative button detection and click');
    try {
        const alternativeButton = await this.page.evaluate(() => {
            // Look for any clickable element with post-related text near our current button
            const allClickable = document.querySelectorAll('button, div[role="button"], input[type="submit"]');
            
            for (const element of allClickable) {
                const text = element.textContent?.toLowerCase() || '';
                const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
                const rect = element.getBoundingClientRect();
                
                if (rect.width > 30 && rect.height > 20 && 
                    (text.includes('post') || text.includes('share') || text.includes('publish') ||
                     ariaLabel.includes('post') || ariaLabel.includes('share') || ariaLabel.includes('publish'))) {
                    
                    // Make sure it's not disabled
                    const style = getComputedStyle(element);
                    if (style.display !== 'none' && 
                        style.visibility !== 'hidden' && 
                        !element.hasAttribute('disabled') &&
                        element.getAttribute('aria-disabled') !== 'true') {
                        return element;
                    }
                }
            }
            return null;
        });
        
        if (alternativeButton) {
            console.log('🔍 Found alternative button, trying click...');
            await alternativeButton.click();
            await this.humanDelay(4000, 5000);
            
            const success5 = await this.checkPostSuccess();
            if (success5) {
                console.log('✅ Method 5 successful');
                return true;
            }
        }
    } catch (error) {
        console.log('❌ Method 5 failed:', error.message);
    }

    // Method 6: Last resort - keyboard shortcuts
    console.log('🔄 Method 6: Global keyboard shortcuts');
    try {
        // Find any contenteditable area and try keyboard shortcuts
        const textArea = await this.page.$('[contenteditable="true"]');
        if (textArea) {
            await textArea.focus();
            await this.humanDelay(500, 800);
            
            // Try Ctrl+Enter
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('Enter');
            await this.page.keyboard.up('Control');
            
            await this.humanDelay(3000, 4000);
            
            let success6 = await this.checkPostSuccess();
            
            // If Ctrl+Enter didn't work, try Cmd+Enter (Mac)
            if (!success6) {
                await textArea.focus();
                await this.page.keyboard.down('Meta');
                await this.page.keyboard.press('Enter');
                await this.page.keyboard.up('Meta');
                
                await this.humanDelay(3000, 4000);
                success6 = await this.checkPostSuccess();
            }
            
            if (success6) {
                console.log('✅ Method 6 successful');
                return true;
            }
        }
    } catch (error) {
        console.log('❌ Method 6 failed:', error.message);
    }

    console.log('❌ All methods failed');
    return false;
}

async checkPostSuccess() {
    return await this.page.evaluate(() => {
        // More comprehensive success indicators
        const indicators = {
            // Check if composer is closed/gone
            composerGone: document.querySelectorAll('[contenteditable="true"][data-lexical-editor="true"]').length === 0,
            
            // Check if we're redirected away from composer
            urlChanged: !window.location.href.includes('composer') && !window.location.href.includes('create'),
            
            // Check for success notifications
            hasSuccessMessage: !!document.querySelector('[data-testid*="success"], [role="alert"], .notificationMessage'),
            
            // Check if post button is disabled/gone
            postButtonGone: !document.querySelector('div[aria-label="Post"][role="button"]:not([aria-disabled="true"])'),
            
            // Check for loading/posting indicators
            hasLoadingIndicator: !!document.querySelector('[role="progressbar"], [data-testid="loading"]'),
            
            // Check if we can see a "Your post" or similar message
            hasPostConfirmation: !!document.querySelector('[data-testid*="post"], .post, [aria-label*="posted"]'),
            
            // Check if page title changed (sometimes indicates successful post)
            titleChanged: document.title.toLowerCase().includes('facebook') && !document.title.toLowerCase().includes('composer')
        };
        
        console.log('Success indicators check:', indicators);
        
        // Consider successful if at least 2 strong indicators are true
        const strongIndicators = [
            indicators.composerGone,
            indicators.urlChanged,
            indicators.hasSuccessMessage,
            indicators.postButtonGone
        ];


        const positiveIndicators = strongIndicators.filter(Boolean).length;
        
        return positiveIndicators >= 2 || 
               indicators.hasSuccessMessage || 
               (indicators.composerGone && indicators.urlChanged);
    });
}
      

    async createPost() {
        try {
            console.log('🏠 Navigating to Facebook home...');
            await this.page.goto('https://www.facebook.com', { 
                waitUntil: 'networkidle2', 
                timeout: 30000 
            });
            
            await this.humanDelay(3000, 5000);
            await this.simulateMouseMovement();
            await this.scrollRandomly();

            // Enhanced post creation selectors - updated for 2024 Facebook UI
            const postCreationSelectors = [
                // Modern Facebook UI
                'div[role="button"][aria-label*="Create a post"]',
                'div[role="button"]:has-text("What\'s on your mind")',
                '[data-pagelet="FeedComposer"] div[role="button"]',
                'div[contenteditable="true"][data-lexical-editor="true"]',
                
                // Fallback selectors
                'div[data-testid="status-attachment-mentions-input"]',
                'div[role="textbox"][contenteditable="true"]',
                '[placeholder*="mind"]',
                
                // Text-based XPath as fallback
                "//div[@role='button' and contains(text(), 'What')]",
                "//div[@role='button' and contains(text(), 'mind')]"
            ];

            let composerOpened = false;
            let textInput = null;

            // Try to find post creation area
            for (const selector of postCreationSelectors) {
                try {
                    console.log(`🔍 Trying selector: ${selector}`);
                    
                    let element;
                    if (selector.startsWith('//')) {
                        const elements = await this.page.$x(selector);
                        element = elements[0];
                    } else if (selector.includes(':has-text(')) {
                        // Handle text-based selectors
                        const textContent = selector.match(/:has-text\("(.+)"\)/)[1];
                        element = await this.page.evaluateHandle((text) => {
                            const elements = document.querySelectorAll('div[role="button"]');
                            for (const el of elements) {
                                if (el.textContent && el.textContent.includes(text)) {
                                    return el;
                                }
                            }
                            return null;
                        }, textContent);
                        
                        if (!element || !element.asElement()) continue;
                        element = element.asElement();
                    } else {
                        element = await this.page.$(selector);
                    }
                    
                    if (!element) continue;

                    // Check if it's a text input or a button to click
                    const isTextInput = await this.page.evaluate((el) => {
                        return el.contentEditable === 'true' || el.tagName === 'TEXTAREA';
                    }, element);

                    if (isTextInput) {
                        textInput = element;
                        composerOpened = true;
                        console.log('✅ Found direct text input');
                        break;
                    } else {
                        // Click to open composer
                        console.log('🖱️ Clicking to open composer...');
                        await this.simulateMouseMovement();
                        await element.click();
                        await this.humanDelay(3000, 5000);
                        
                        // Look for text input after clicking
                        const textInputSelectors = [
                            'div[contenteditable="true"][data-lexical-editor="true"]',
                            'div[contenteditable="true"][role="textbox"]',
                            'div[data-testid="status-attachment-mentions-input"]',
                            'div[contenteditable="true"]'
                        ];
                        
                        try {
                            textInput = await this.waitForElement(textInputSelectors, 5000);
                            composerOpened = true;
                            console.log('✅ Composer opened, found text input');
                            break;
                        } catch (e) {
                            console.log('❌ Could not find text input after clicking');
                            continue;
                        }
                    }
                } catch (e) {
                    console.log(`❌ Selector failed: ${selector}`);
                    continue;
                }
            }

            if (!textInput) {
                await this.page.screenshot({ 
                    path: path.join(SCREENSHOT_DIR, 'no_composer_found.png'),
                    fullPage: true 
                });
                throw new Error('Could not find or open post composer');
            }

            await this.logStep('Open post composer', true);

            // Type the post content
            console.log('✏️ Typing post content...');
            // Get caption from command line argument, default to test caption
            const postMessage = process.argv.length > 2 ? process.argv[2] :
                               'Default caption: Hello world! 🌍 This is an automated test post created with enhanced stealth techniques. #automation #test';
            
            await this.simulateMouseMovement();
            await textInput.click();
            await this.humanDelay(500, 1000);
            
            // Enhanced typing with better clearing
            await this.page.evaluate((el) => {
                el.innerHTML = '';
                el.textContent = '';
                if (el.focus) el.focus();
            }, textInput);
            
            await this.typeHumanLike(textInput, postMessage);
            await this.logStep('Type post content', true);

            await this.humanDelay(2000, 4000);

            // Enhanced POST button detection and clicking
            console.log('🔍 Starting comprehensive POST button search...');
            
            const postButton = await this.findPostButton();

            if (!postButton) {
                // Emergency keyboard shortcuts
                console.log('🚨 No post button found, trying emergency keyboard shortcuts...');
                
                const emergencyShortcuts = [
                    {
                        name: 'Ctrl+Enter',
                        action: async () => {
                            await textInput.focus();
                            await this.page.keyboard.down('Control');
                            await this.page.keyboard.press('Enter');
                            await this.page.keyboard.up('Control');
                        }
                    },
                    {
                        name: 'Command+Enter (Mac)',
                        action: async () => {
                            await textInput.focus();
                            await this.page.keyboard.down('Meta');
                            await this.page.keyboard.press('Enter');
                            await this.page.keyboard.up('Meta');
                        }
                    },
                    {
                        name: 'Tab to button and Enter',
                        action: async () => {
                            await textInput.focus();
                            // Tab through elements to find the post button
                            for (let i = 0; i < 10; i++) {
                                await this.page.keyboard.press('Tab');
                                await this.humanDelay(300, 500);
                                
                                // Check if current focused element is a post button
                                const isPostButton = await this.page.evaluate(() => {
                                    const focused = document.activeElement;
                                    if (!focused) return false;
                                    
                                    const text = focused.textContent?.toLowerCase() || '';
                                    const ariaLabel = focused.getAttribute('aria-label')?.toLowerCase() || '';
                                    
                                    return /post|publish|share/.test(text + ' ' + ariaLabel);
                                });
                                
                                if (isPostButton) {
                                    await this.page.keyboard.press('Enter');
                                    console.log('✅ Found post button via Tab navigation');
                                    break;
                                }
                            }
                        }
                    }
                ];
                
                let shortcutWorked = false;
                for (const shortcut of emergencyShortcuts) {
                    try {
                        console.log(`⚡ Trying emergency shortcut: ${shortcut.name}`);
                        await shortcut.action();
                        await this.humanDelay(3000, 5000);
                        
                        // Check if it worked
                        const success = await this.page.evaluate(() => {
                            return !document.querySelector('[contenteditable="true"][data-lexical-editor="true"]') ||
                                   !window.location.href.includes('composer') ||
                                   !!document.querySelector('[data-testid*="success"]');
                        });
                        
                        if (success) {
                            await this.logStep(`Emergency ${shortcut.name} successful`, true);
                            shortcutWorked = true;
                            break;
                        }
                    } catch (e) {
                        console.log(`❌ Emergency ${shortcut.name} failed:`, e.message);
                    }
                }
                
                if (!shortcutWorked) {
                    await this.page.screenshot({ 
                        path: path.join(SCREENSHOT_DIR, 'all_methods_failed.png'),
                        fullPage: true 
                    });
                    throw new Error('COMPLETE FAILURE: No method could find or click the post button');
                }
            } else {
                // Use POSY enhanced clicking method first
                console.log('🎯 Post button found, attempting POSY enhanced clicking...');
                
                let clickSuccess = await this.clickPosy(postButton);
                
                // If posy click failed, fall back to enhanced post button click
                if (!clickSuccess) {
                    console.log('🔄 POSY click failed, falling back to enhanced post button click...');
                    clickSuccess = await this.enhancedPostButtonClick(postButton);
                }
                
                if (!clickSuccess) {
                    console.log('⚠️ Enhanced clicking failed, trying final emergency measures...');
                    
                    // Final emergency: try to submit via form submission
                    try {
                        await this.page.evaluate((button) => {
                            // Find the closest form
                            const form = button.closest('form');
                            if (form && form.submit) {
                                form.submit();
                                return;
                            }
                            
                            // Try to trigger form submission event
                            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                            if (form) {
                                form.dispatchEvent(submitEvent);
                            }
                        }, postButton);
                        
                        await this.logStep('Emergency form submission', true);
                    } catch (e) {
                        await this.logStep('All post methods failed', false, 'Could not click post button');
                        throw new Error('FINAL FAILURE: All post button clicking methods failed');
                    }
                }
            }

            // Enhanced success verification
            console.log('🔍 Verifying post success...');
            await this.humanDelay(5000, 8000);
            
            // Multiple success verification methods
            let verificationAttempts = 0;
            let isSuccess = false;
            
            while (verificationAttempts < 3 && !isSuccess) {
                isSuccess = await this.page.evaluate(() => {
                    const indicators = {
                        // Composer closed
                        composerClosed: !document.querySelector('[contenteditable="true"][data-lexical-editor="true"]'),
                        // URL changed away from composer
                        urlChanged: !window.location.href.includes('composer') && !window.location.href.includes('create'),
                        // Success message visible
                        successMessage: !!document.querySelector('[data-testid*="success"], [role="alert"]'),
                        // Post button disappeared
                        buttonGone: !document.querySelector('div[aria-label="Post"][role="button"]:not([aria-disabled="true"])'),
                        // Loading completed
                        noLoading: !document.querySelector('[role="progressbar"]')
                    };
                    
                    console.log('Success indicators:', indicators);
                    
                    // Consider it successful if at least 2 indicators are true
                    const trueCount = Object.values(indicators).filter(val => val === true).length;
                    return trueCount >= 2;
                });
                
                if (!isSuccess) {
                    console.log(`⏳ Verification attempt ${verificationAttempts + 1} failed, waiting longer...`);
                    await this.humanDelay(3000, 5000);
                    verificationAttempts++;
                } else {
                    break;
                }
            }
            
            if (isSuccess) {
                await this.logStep('Post published successfully', true);
                
                // Take success screenshot
                await this.page.screenshot({ 
                    path: path.join(SCREENSHOT_DIR, 'post_success.png'),
                    fullPage: true 
                });
                
                return true;
            } else {
                console.log('⚠️ Post status unclear, taking screenshot for manual verification...');
                await this.page.screenshot({ 
                    path: path.join(SCREENSHOT_DIR, 'post_status_unclear.png'),
                    fullPage: true 
                });
                
                // Final check - sometimes Facebook is just slow
                await this.humanDelay(10000, 12000);
                
                const finalCheck = await this.page.evaluate(() => {
                    return !document.querySelector('[contenteditable="true"][data-lexical-editor="true"]') ||
                           !window.location.href.includes('composer');
                });
                
                if (finalCheck) {
                    await this.logStep('Post likely successful (final check)', true);
                    return true;
                } else {
                    throw new Error('Post publication could not be confirmed after multiple attempts');
                }
            }

        } catch (error) {
            await this.logStep('Create post failed', false, error.message);
            
            // Comprehensive error screenshots
            await this.page.screenshot({ 
                path: path.join(SCREENSHOT_DIR, 'post_error_final.png'),
                fullPage: true 
            });
            
            return false;
        }
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 Browser closed');
        }
    }

    async run() {
        console.log('\n🚀 Starting Enhanced Stealth Facebook Automation');
        console.log('🎯 Advanced detection evasion and human-like behavior');
        console.log('🔧 Username:', FB_USERNAME);
        console.log('🔐 Password:', FB_PASSWORD ? '***' : 'NOT SET');

        if (!FB_USERNAME || !FB_PASSWORD) {
            console.error('❌ Missing credentials! Please set FB_USERNAME and FB_PASSWORD environment variables.');
            return;
        }

        try {
            await this.initialize();
            
            // Login phase
            console.log('\n🔐 Authentication Phase:');
            const loginResult = await this.login();
            
            if (!loginResult) {
                console.error('❌ Authentication failed - cannot continue');
                return;
            }

            console.log('✅ Authentication completed successfully');
            await this.humanDelay(3000, 5000);

            // Post creation phase
            console.log('\n📝 Post Creation Phase:');
            const postResult = await this.createPost();
            
            if (postResult) {
                console.log('\n🎉 SUCCESS! Enhanced Facebook automation completed');
            } else {
                console.log('\n⚠️ Post creation failed');
            }

            // Keep browser open for demo
            console.log('⏳ Keeping browser open for 20 seconds...');
            await this.humanDelay(20000, 22000);

        } catch (error) {
            console.error('❌ Automation error:', error.message);
        } finally {
            await this.cleanup();
        }

        // Execution summary
        console.log('\n📊 EXECUTION SUMMARY:');
        console.log('═'.repeat(60));
        this.logSteps.forEach(step => {
            const status = step.success ? 'SUCCESS' : 'FAILED';
            const emoji = step.success ? '✅' : '❌';
            console.log(`${emoji} ${step.name.padEnd(35)} ${status}`);
            if (!step.success && step.error) {
                console.log(`   └─ ${step.error}`);
            }
        });
        console.log('═'.repeat(60));
        
        const successfulSteps = this.logSteps.filter(step => step.success).length;
        console.log(`📈 Completion rate: ${successfulSteps}/${this.logSteps.length} steps (${Math.round(successfulSteps/this.logSteps.length*100)}%)`);
    }
}

// Run the enhanced automation
(async () => {
    console.log('🤖 Enhanced Stealth Facebook Automation v4.0');
    console.log('🎯 Advanced bot detection evasion with improved post button detection');
    
    const automation = new EnhancedFacebookAutomation();
    await automation.run();
})();