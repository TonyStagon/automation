import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configuration - Use environment variable, default to false for debugging
const HEADLESS = process.env.HEADLESS === 'true' || process.env.headless === 'true';
const SCREENSHOT_DIR = HEADLESS ? './debug-screenshots-twitter' : './demo-screenshots-twitter';
const TWITTER_URL = 'https://x.com/i/flow/login';
console.log(`🤖 Headless mode: ${HEADLESS ? 'ENABLED' : 'DISABLED (Visible browser)'}`);

// Get credentials from environment variables
const TWITTER_USERNAME = process.env.TWIT_USERNAME || process.env.TWITTER_USERNAME;
const TWITTER_PASSWORD = process.env.TWIT_PASSWORD || process.env.TWITTER_PASSWORD;

class EnhancedTwitterAutomation {
    constructor() {
        this.browser = null;
        this.page = null;
        this.logSteps = [];
        this.cookieDir = './cookies-twitter';
        this.headless = HEADLESS;
    }

    async initialize() {
        await fs.ensureDir(SCREENSHOT_DIR);
        await fs.ensureDir(this.cookieDir);

        // Enhanced stealth launch options with headless optimization - matching Facebook
        this.browser = await puppeteer.launch({
            headless: process.env.HEADLESS === 'true' ? 'new' : false,
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

        // Advanced stealth techniques - matching Facebook implementation
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

        // Set realistic headers - matching Facebook
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
        await fs.writeJSON(path.join(this.cookieDir, 'twitter_cookies.json'), cookies);
        console.log('🍪 Cookies saved');
    }

    async loadCookies() {
        const cookiePath = path.join(this.cookieDir, 'twitter_cookies.json');
        if (await fs.pathExists(cookiePath)) {
            const cookies = await fs.readJSON(cookiePath);
            await this.page.setCookie(...cookies);
            console.log('🍪 Cookies loaded');
            return true;
        }
        return false;
    }

    async waitForElement(selectors, timeout = 90000, retries = 5) { // Increased timeout from 30000 to 90000ms, retries from 3 to 5
        const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
        
        let attempt = 1;
        let lastError = null;
        
        while (attempt <= retries) {
            console.log(`🗂️ Wait attempt ${attempt}/${retries} for selectors: ${selectorArray.join(', ')}`);
            
            for (const selector of selectorArray) {
                try {
                    await this.page.waitForSelector(selector, {
                        timeout: Math.max(timeout / selectorArray.length, 5000), // Increased minimum per-selector timeout from 2000ms to 5000ms
                        visible: true
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
                        console.log(`ℹ️ Found selector ${selector} but element is not interactable - trying next selector`);
                        // Scroll element into view before continuing
                        await this.page.evaluate(el => {
                            if (el && el.scrollIntoView) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }, element);
                        await this.humanDelay(500, 1000);
                    }
                    
                } catch (e) {
                    lastError = e;
                    console.log(`❌ Timing out or skipping for: ${selector}`);
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
        // Add safety wrapper to prevent crash and maintain browser open
        try {
            console.log('🛠️ Starting login with enhanced safety wrapper...');
            
            // Check credentials before even initializing anything
            if (!TWITTER_USERNAME || !TWITTER_PASSWORD) {
                throw new Error('Twitter credentials not set in environment variables');
            }

            // Load cookies first with timeout safety
            let hasCookies = false;
            try {
                hasCookies = await this.loadCookies();
            } catch (cookieError) {
                console.log('⚠️ Cookie loading failed, proceeding without cookies:', cookieError.message);
            }
            
            // Safely navigate to homepage with comprehensive error handling
            try {
                await this.page.goto('https://x.com', {
                    waitUntil: 'networkidle2',
                    timeout: 120000 // 2 minutes max for homepage loading
                });
            } catch (navError) {
                console.log('⚠️ Initial navigation to Twitter failed, trying dedicated login URL instead...');
                // Fallback to login URL directly
                await this.page.goto(TWITTER_URL, {
                    waitUntil: 'networkidle2',
                    timeout: 120000
                });
            }

            await this.humanDelay(3000, 5000);
            await this.simulateMouseMovement();

            // Check if already logged in
            console.log('🔍 Checking login status...');
            
            const loggedInSelectors = [
                '[data-testid="AppTabBar_Home_Link"]',
                '[aria-label="Home timeline"]',
                '[data-testid="SideNav_NewTweet_Button"]',
                'nav[role="navigation"]',
                '[data-testid="primaryColumn"]'
            ];

                    // Also check for LOGGED OUT indicators
        const loggedOutSelectors = [
            'a[href="/login"]',
            'a[href*="login"]',
            'button[data-testid*="login"]',
            'input[autocomplete="username"]',
            'input[name="text"]',
            'div[data-testid*="login"]'
        ];

            
               try {
            // Wait more time for logged-in indicators
            await this.page.waitForSelector(loggedInSelectors[0], { timeout: 10000 });
            
            // Double-check by looking for logged-out indicators
            const loggedOutElements = await this.page.$$(loggedOutSelectors[0]);
            if (loggedOutElements.length === 0) {
                console.log('🎯 Already logged in!');
                await this.logStep('Already logged in', true);
                return true;
            } else {
                console.log('🔒 Found both logged-in and logged-out indicators - proceeding with login');
            }

             } catch (e) {
            console.log('🔒 Need to login...');
        }


            // Go to login page
           // Go to login page directly
        console.log('🔐 Navigating to dedicated login page...');
        await this.page.goto(TWITTER_URL, {
            waitUntil: 'networkidle2',
            timeout: 120000 // Increased from 50000 to 120000ms (2 minutes)
        });

            await this.logStep('Navigate to Twitter Login', true);
        await this.humanDelay(2000, 4000);



        const currentUrl = await this.page.url();
console.log(`🌐 Current URL: ${currentUrl}`);

// Take a screenshot for debugging
await this.page.screenshot({ 
    path: path.join(SCREENSHOT_DIR, 'initial_page.png') 
});  

if (currentUrl.includes('login') || currentUrl.includes('signin')) {
    console.log('🔐 Detected login page - proceeding with login');
    // Continue with login process
} else if (currentUrl.includes('home') || currentUrl.includes('feed')) {
    console.log('🏠 Detected home/feed page - likely logged in');
    // Verify with additional checks
} else {
    console.log('❓ Unknown page state - proceeding with login to be safe');
    await this.page.goto(TWITTER_URL);
}

            // Find and fill username with enhanced error handling
            const usernameSelectors = [
                'input[autocomplete="username"][type="text"], input[autocomplete="username"]',
                'input[name="text"][type="text"], input[name="text"]',
                'input[data-testid*="text"][type="text" i]',
                'input[placeholder*="User" i][type="text"], input[placeholder*="Email" i][type="text"], input[placeholder*="Phone" i][type="text"], input[placeholder*="Username" i][type="text"]',
                'input[type="text"][autocomplete*="user"]',
                '[data-testid="ocfEnterTextTextInput"] input[type="text"]'
            ];

            console.log('🔍 Finding username input with selectors:', usernameSelectors);
            
            let usernameInput;
            try {
                usernameInput = await this.waitForElement(usernameSelectors, 30000, 3); // 30 second timeout, 3 retries
                await this.typeHumanLike(usernameInput, TWITTER_USERNAME);
                await this.logStep('Enter username/email', true);
                await this.humanDelay(2000, 3000); // Wait after typing username
            } catch (usernameError) {
                console.error('❌ Failed to find or interact with username input:', usernameError.message);
                await this.logStep('Enter username/email', false, usernameError.message);
                
                // Take screenshot for debugging
                await this.page.screenshot({
                    path: path.join(SCREENSHOT_DIR, 'username_input_error.png'),
                    fullPage: true
                });
                
                throw usernameError;
            }

            // Find and click Next button - updated selectors
            const nextButtonSelectors = [
                'button[type="submit"]:not([disabled]):not([aria-disabled="true"])',
                'div[role="button"][tabindex="0"]:not([disabled]):not([aria-disabled="true"])',
                '[data-testid*="Login"][role="button"]:not([disabled]):not([aria-disabled="true"])',
                '[data-testid*="Next"][role="button"]:not([disabled]):not([aria-disabled="true"])',
                '[data-testid="LoginForm_Login_Button"]:not([disabled])',
                'button[data-testid="LoginForm_Login_Button"]:not([disabled])',
                '[aria-label*="Next" i][role="button"]:not([disabled])',
                'div[data-testid="ocfSignupEnterUsernameNextBtn"], div[data-testid="ocfEnterTextNextButton"]'
            ];

            console.log('🔍 Attempting to click Next button...');
            await this.page.screenshot({
                path: path.join(SCREENSHOT_DIR, 'before_next_button_click.png'),
                fullPage: true
            });
            
            // First find the next button before using it
            console.log('🔍 Looking for Next button...');
            const nextButton = await this.page.waitForSelector(nextButtonSelectors[0], {
                timeout: 10000,
                visible: true
            });
            
            if (nextButton) {
                // Check if element is really visible and interactable
                const isActuallyVisible = await this.page.evaluate((el) => {
                    if (!el) return false;
                    const rect = el.getBoundingClientRect();
                    const style = window.getComputedStyle(el);
                    return rect.width > 0 && rect.height > 0 &&
                           style.display !== 'none' &&
                           style.visibility !== 'hidden' &&
                           parseFloat(style.opacity) > 0.1;
                }, nextButton);
                
                if (!isActuallyVisible) {
                    console.log('⚠️ Next button may not be visible/ready - scrolling into view');
                    await this.page.evaluate(el => {
                        if (el && el.scrollIntoView) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, nextButton);
                    await this.humanDelay(1500, 2500);
                }
                
                // Enhanced next button click with multiple strategies
                let nextClicked = false;
                let clickError = null;
                
                // Strategy 1: Regular click
                try {
                    console.log('🔄 Trying standard click for Next button');
                    await nextButton.click();
                    nextClicked = true;
                } catch (e) {
                    clickError = e;
                    console.log('❌ Standard click failed, trying JavaScript click');
                    
                    // Strategy 2: JavaScript click
                    try {
                        await this.page.evaluate(el => el.click(), nextButton);
                        nextClicked = true;
                    } catch (e2) {
                        clickError = e2;
                        console.log('❌ JavaScript click failed, trying keyboard');
                        
                        // Strategy 3: Keyboard navigation
                        try {
                            await nextButton.focus();
                            await this.humanDelay(500, 800);
                            await this.page.keyboard.press('Enter');
                            nextClicked = true;
                        } catch (e3) {
                            clickError = e3;
                            console.log('❌ Keyboard press failed for Next button');
                        }
                    }
                }
                
                if (nextClicked) {
                    await this.logStep('Click next button', true);
                    console.log('✅ Next button clicked successfully');
                    await this.humanDelay(5000, 7000); // Longer wait after Next click
                } else {
                    throw new Error(`Next button click failed: ${clickError?.message || 'All strategies failed'}`);
                }
            }

            // Find and fill password
            const passwordSelectors = [
                'input[autocomplete="current-password"]',
                'input[name="password"]',
                'input[type="password"]',
                'input[placeholder*="password"]',
                'input[data-testid*="password"]'
            ];

            const passwordInput = await this.waitForElement(passwordSelectors);
            await this.typeHumanLike(passwordInput, TWITTER_PASSWORD);
            await this.logStep('Enter password', true);

            await this.humanDelay(1000, 2000);

            // Find and click login button
            const loginButtonSelectors = [
                'button[data-testid*="Login"]',
                'button[type="submit"]',
                'div[role="button"]',
                'div[data-testid*="login"]',
                '[data-testid*="submit"]',
                '[aria-label*="Log in"]'
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
                if (currentUrl.includes('challenge') || currentUrl.includes('confirm')) {
                    throw new Error('2FA or security check required - please complete manually');
                }
                throw new Error('Login failed - may require manual intervention');
            }

        } catch (error) {
            // Enhanced error handling with retry suggestion
            console.error('❌ Login process failed:', error.message);
            console.log('🔄 Hint: Try checking if there are security challenges or CAPTCHAs');
            console.log('   To retry, clear cookies file and restart script');
            await this.logStep('Login failed', false, error.message);
            return false;
        }
    }

    async findTweetButton() {
        console.log('🎯 Advanced TWEET button detection starting...');
        
        // Take screenshot for debugging
        await this.page.screenshot({
            path: `${SCREENSHOT_DIR}/before_tweet_button_search_${Date.now()}.png`
        });

        // Enhanced tweet button detection strategies
        const tweetButtonStrategies = [
            {
                name: 'Modern Twitter UI Selectors - 2025',
                selectors: [
                    // Primary tweet button selectors
                    '[data-testid="tweetButton"]:not([aria-disabled="true"]):not([disabled])',
                    '[data-testid="tweetButtonInline"]:not([aria-disabled="true"]):not([disabled])',
                    'button[data-testid="tweetButton"]:not([disabled])',
                    'div[data-testid="tweetButton"]:not([aria-disabled="true"])',
                    
                    // Alternative patterns
                    'div[role="button"][aria-label*="post" i]:not([disabled])',
                    'div[role="button"][aria-label*="tweet" i]:not([disabled])',
                    'button[aria-label*="post" i]:not([disabled])',
                    'button[aria-label*="tweet" i]:not([disabled])',
                    
                    // International variants
                    'div[aria-label="Publicar"][role="button"]', // Spanish
                    'div[aria-label="Publier"][role="button"]', // French
                    'div[aria-label="Twittern"][role="button"]', // German
                    'div[aria-label="Pubblicare"][role="button"]', // Italian
                    
                    // Button-specific variants
                    'button[type="submit"][aria-label*="Post"]:not([disabled])',
                    'button[type="submit"]:not([disabled])' // Generic submit button
                ]
            }
        ];

        // Strategy 1: Try standard selectors
        for (const strategy of tweetButtonStrategies) {
            console.log(`🔍 Trying ${strategy.name}...`);
            
            for (const selector of strategy.selectors) {
                try {
                    const elements = await this.page.$$(selector);
                    
                    for (const element of elements) {
                        const isValidTweetButton = await this.page.evaluate(el => {
                            const rect = el.getBoundingClientRect();
                            const style = window.getComputedStyle(el);
                            const text = el.textContent?.toLowerCase() || '';
                            const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
                            
                            // Check visibility
                            const isVisible = rect.width > 0 && rect.height > 0 && 
                                            style.display !== 'none' && 
                                            style.visibility !== 'hidden' &&
                                            style.opacity > 0;
                            
                            // Check if it looks like a tweet button
                            const hasPostKeywords = /post|tweet|publish|share/.test(text + ' ' + ariaLabel);
                            
                            // Check if it's positioned like a tweet button
                            const isInTweetPosition = rect.bottom < window.innerHeight && rect.right < window.innerWidth;
                            
                            // Check if it has button-like styling
                            const hasButtonStyling = style.cursor === 'pointer' || 
                                                   style.backgroundColor !== 'transparent' ||
                                                   el.tagName === 'BUTTON';
                            
                            return isVisible && hasPostKeywords && isInTweetPosition && hasButtonStyling;
                        }, element);
                        
                        if (isValidTweetButton) {
                            console.log(`✅ Found valid tweet button with selector: ${selector}`);
                            return element;
                        }
                    }
                } catch (e) {
                    console.log(`❌ Selector ${selector} failed:`, e.message.slice(0, 50));
                }
            }
        }

        // Strategy 2: Text-based detection
        console.log('🔍 Trying text-based detection...');
        const textBasedButton = await this.page.evaluateHandle(() => {
            const clickableElements = Array.from(document.querySelectorAll('button, div[role="button"], input[type="submit"]'));
            
            const tweetButtons = clickableElements.filter(el => {
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                const text = el.textContent?.toLowerCase().trim() || '';
                const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
                const dataTestId = el.getAttribute('data-testid')?.toLowerCase() || '';
                
                // Visibility checks
                if (rect.width <= 0 || rect.height <= 0 || 
                    style.display === 'none' || 
                    style.visibility === 'hidden' ||
                    parseFloat(style.opacity) < 0.1) {
                    return false;
                }
                
                // Keyword detection
                const fullContext = [text, ariaLabel, dataTestId].join(' ').toLowerCase();
                const hasKeywords = /post|tweet|publish|share/.test(fullContext);
                
                return hasKeywords;
            });
            
            // Sort by preference
            tweetButtons.sort((a, b) => {
                const aText = a.textContent?.toLowerCase().trim() || '';
                const bText = b.textContent?.toLowerCase().trim() || '';
                
                const aExact = /^(post|tweet|publish)$/i.test(aText);
                const bExact = /^(post|tweet|publish)$/i.test(bText);
                
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;
                
                return 0;
            });
            
            return tweetButtons[0] || null;
        });

        if (textBasedButton && textBasedButton.asElement) {
            const element = textBasedButton.asElement();
            if (element) {
                console.log('✅ Found tweet button via text-based detection');
                return element;
            }
        }

        console.log('❌ No tweet button found through any method');
        return null;
    }

    async enhancedTweetButtonClick(tweetButton) {
        console.log('🎯 Starting robust tweet button clicking...');
        
        // Method 1: Standard click
        console.log('🔄 Method 1: Standard click');
        try {
            await tweetButton.scrollIntoViewIfNeeded();
            await this.humanDelay(1000, 1500);
            
            await tweetButton.hover();
            await this.humanDelay(300, 500);
            await tweetButton.click();
            
            await this.humanDelay(3000, 4000);
            
            const success1 = await this.checkTweetSuccess();
            if (success1) {
                console.log('✅ Method 1 successful');
                return true;
            }
        } catch (error) {
            console.log('❌ Method 1 failed:', error.message);
        }

        // Method 2: JavaScript click
        console.log('🔄 Method 2: JavaScript click');
        try {
            await this.page.evaluate(el => {
                el.click();
            }, tweetButton);
            
            await this.humanDelay(3000, 4000);
            
            const success2 = await this.checkTweetSuccess();
            if (success2) {
                console.log('✅ Method 2 successful');
                return true;
            }
        } catch (error) {
            console.log('❌ Method 2 failed:', error.message);
        }

        // Method 3: Keyboard activation
        console.log('🔄 Method 3: Keyboard activation');
        try {
            await tweetButton.focus();
            await this.humanDelay(500, 800);
            
            await this.page.keyboard.press('Enter');
            await this.humanDelay(2000, 3000);
            
            const success3 = await this.checkTweetSuccess();
            if (success3) {
                console.log('✅ Method 3 successful');
                return true;
            }
        } catch (error) {
            console.log('❌ Method 3 failed:', error.message);
        }

        console.log('❌ All tweet button click methods failed');
        return false;
    }

    async checkTweetSuccess() {
        return await this.page.evaluate(() => {
            // Check for success indicators
            const indicators = {
                // Check if tweet composer is closed
                composerGone: document.querySelectorAll('[data-testid="tweetTextarea_0"], div[contenteditable="true"]').length === 0,
                
                // Check for success notifications
                hasSuccessMessage: !!document.querySelector('[data-testid*="success"], [role="alert"]'),
                
                // Check if tweet button is disabled/gone
                tweetButtonGone: !document.querySelector('[data-testid="tweetButton"]:not([aria-disabled="true"])'),
                
                // Check for loading indicators
                hasLoadingIndicator: !!document.querySelector('[role="progressbar"], [data-testid="loading"]')
            };
            
            console.log('Tweet success indicators check:', indicators);
            
            const positiveIndicators = [indicators.composerGone, indicators.hasSuccessMessage, indicators.tweetButtonGone].filter(Boolean).length;
            
            return positiveIndicators >= 1 || indicators.hasSuccessMessage;
        });
    }

    async uploadImageToTwitter(imagePath) {
        try {
            console.log(`📸 Attempting to upload image: ${imagePath}`);
            
            if (!await fs.pathExists(imagePath)) {
                throw new Error(`Image file not found: ${imagePath}`);
            }

            // Look for media upload button
            const mediaButtonSelectors = [
                '[data-testid="fileInput"]',
                '[data-testid="attachments"]',
                'input[type="file"]',
                '[aria-label*="media" i]',
                '[aria-label*="photo" i]',
                '[aria-label*="image" i]'
            ];

            const mediaButton = await this.waitForElement(mediaButtonSelectors, 30000, 5); // Increased timeout for media button
            
            if (!mediaButton) {
                console.log('⚠️ Media upload button not found');
                return false;
            }

            await mediaButton.uploadFile(imagePath);
            await this.logStep('Upload image file', true);
            
            // Wait for upload to complete
            await this.humanDelay(4000, 6000);
            
            return true;

        } catch (error) {
            await this.logStep('Image upload failed', false, error.message);
            console.log('⚠️ Image upload failed, continuing with text-only tweet');
            return false;
        }
    }

    async createTweet() {
        let textInput = null; // Declare textInput at function level for accessibility
        
        try {
            console.log('🏠 Navigating to Twitter home...');
            await this.page.goto('https://x.com/home', {
                waitUntil: 'networkidle2',
                timeout: 120000 // Increased from 70000 to 120000ms (2 minutes)
            });
            
            await this.humanDelay(7000, 10000); // Longer delays after login navigation
            await this.simulateMouseMovement();
            await this.scrollRandomly();
            // Additional state check after load completion
            await this.page.evaluate(() => {
                window.scrollTo(0, 300);
            });
            await this.humanDelay(2000, 3000);

            // Check for image upload parameter
            const imagePath = process.env.TWITTER_IMAGE_PATH;
            if (imagePath) {
                console.log(`📸 Image upload requested: ${imagePath}`);
                await this.logStep('Process image upload request', true);
            }

            // Enhanced tweet creation selectors
            const tweetCreationSelectors = [
                '[data-testid="tweetTextarea_0"]',
                'div[contenteditable="true"]',
                '[role="textbox"]',
                '[data-testid="SideNav_NewTweet_Button"]',
                'div[aria-label*="Tweet text"]',
                'div[data-testid*="tweet"][contenteditable="true"]'
            ];

            let composerOpened = false;

            // Try to find tweet creation area
            for (const selector of tweetCreationSelectors) {
                try {
                    console.log(`🔍 Trying selector: ${selector}`);
                    
                    const element = await this.page.$(selector);
                    if (!element) continue;

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
                            '[data-testid="tweetTextarea_0"]',
                            'div[contenteditable="true"]',
                            '[role="textbox"]'
                        ];
                        
                        try {
                            textInput = await this.waitForElement(textInputSelectors, 15000); // Increased timeout for text input
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
                throw new Error('Could not find or open tweet composer');
            }

            await this.logStep('Open tweet composer', true);

            // Type the tweet content using the command line argument
            console.log('✏️ Typing tweet content...');
            const tweetMessage = process.argv.length > 2 ? process.argv[2] :
                               'Default tweet: Hello world! 🌍 This is an automated test tweet created with enhanced stealth techniques. #automation #test';
            
            await this.simulateMouseMovement();
            await textInput.click();
            await this.humanDelay(500, 1000);
            
            await this.page.evaluate((el) => {
                el.innerHTML = '';
                el.textContent = '';
                if (el.focus) el.focus();
            }, textInput);
        } catch (error) {
            await this.logStep('Create tweet failed', false, error.message);
            
            // Comprehensive error screenshots
            await this.page.screenshot({
                path: path.join(SCREENSHOT_DIR, 'tweet_error_final.png'),
                fullPage: true
            });
            
            console.log('❌ Tweet composition failed - proceeding with typing outside catch');
        }
        
        // MOVE ALL TWEET LOGIC INSIDE TRY-CATCH
        // Type the tweet content and try to post
        try {
            console.log('🎯 Attempting to type and post tweet content...');
            
            // ACTUALLY TYPE THE TWEET CONTENT - This was missing!
            if (textInput) {
                const captionText = tweetMessage || "Hello YOU"; // Use tweet content from UI or fallback
                console.log(`✏️ Typing: "${captionText}"`);
                await this.typeHumanLike(textInput, captionText);
                await this.logStep('Type tweet content', true);
                await this.humanDelay(2000, 3000);

                // TAKE SCREENSHOT OF TWEET WITH CONTENT
                await this.page.screenshot({
                    path: path.join(SCREENSHOT_DIR, 'tweet_with_message.png'),
                    fullPage: true
                });

                // Find and click the TWEET/Post button
                console.log('🔍 Looking for tweet button...');
                
                const tweetButton = await this.findTweetButton();
                if (tweetButton) {
                    console.log('✅ Found tweet button');
                    
                    const posted = await this.enhancedTweetButtonClick(tweetButton);
                    if (posted) {
                        await this.logStep('Tweet posted successfully', true);
                        console.log('🎉 Posted: "Hello YOU"');
                        
                        await this.humanDelay(3000, 5000);
                        await this.page.screenshot({
                            path: path.join(SCREENSHOT_DIR, 'tweet_posted_success.png')
                        });
                        return true;
                    } else {
                        console.log('❌ All click methods failed');
                        await this.logStep('Tweet posting failed', false, 'All click methods failed');
                    }
                } else {
                    throw new Error('Tweet button not found');
                }
            } else {
                throw new Error('Text input element not available for typing');
            }
            
        } catch (tweetError) {
            console.log('❌ Secondary tweet posting attempt failed:', tweetError.message);
            await this.logStep('Failed to post tweet', false, tweetError.message);
            
            await this.page.screenshot({
                path: path.join(SCREENSHOT_DIR, 'final_tweet_error.png')
            });
        }

        console.log('➡️ Tweet creation process completed');
        
        return false;
    }

    async retryOperation(operation, name, maxRetries = 2) {
        console.log(`🔄 Starting retry operation: ${name}`);
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await operation();
                if (result) {
                    console.log(`✅ ${name} succeeded on attempt ${attempt}`);
                    return true;
                }
            } catch (error) {
                console.log(`❌ ${name} attempt ${attempt} failed:`, error.message);
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // Wait before retrying with exponential backoff
                const backoffTime = 2000 * Math.pow(2, attempt - 1);
                console.log(`⏰ Retrying in ${backoffTime}ms...`);
                await this.humanDelay(backoffTime, backoffTime + 1000);
            }
        }
        return false;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 Browser closed');
        }
    }

    async run() {
        console.log('\n🚀 Starting Enhanced Stealth Twitter Automation');
        console.log('🎯 Advanced detection evasion and human-like behavior');
        console.log('🔧 Username:', TWITTER_USERNAME);
        console.log('🔐 Password:', TWITTER_PASSWORD ? '***' : 'NOT SET');

        if (!TWITTER_USERNAME || !TWITTER_PASSWORD) {
            console.error('❌ Missing credentials! Please set TWIT_USERNAME/TWITTER_USERNAME and TWIT_PASSWORD/TWITTER_PASSWORD environment variables.');
            return;
        }

        try {
            await this.initialize();
            
            // Login phase with enhanced timeout info
            console.log('\n🔐 Authentication Phase:');
            console.log('⏱️  Login navigation extended to 2+ minutes for network resilience');
            const loginResult = await this.login();
            
            if (!loginResult) {
                console.error('❌ Authentication failed - cannot continue');
                return;
            }

            console.log('✅ Authentication completed successfully');
            await this.humanDelay(3000, 5000);

            // Tweet creation phase
            console.log('\n📝 Tweet Creation Phase:');
            const tweetResult = await this.createTweet();
            
            if (tweetResult) {
                console.log('\n🎉 SUCCESS! Enhanced Twitter automation completed');
            } else {
                console.log('\n⚠️ Tweet creation failed');
            }

            // Keep browser open only if not in headless mode
            if (!this.headless) {
                console.log('⏳ Keeping browser open for 20 seconds...');
                await this.humanDelay(20000, 22000);
            } else {
                console.log('🤖 Headless mode: Closing browser automatically');
                await this.humanDelay(3000, 5000); // Brief delay for cleanup
            }

        } catch (error) {
            console.error('❌ Automation error:', error.message);
            await this.logStep('Overall Automation', false, error.message);
            
            // Take emergency screenshot
            if (this.page) {
                try {
                    await this.page.screenshot({
                        path: path.join(SCREENSHOT_DIR, 'automation_crashed.png'),
                        fullPage: true
                    });
                    console.log('📸 Emergency screenshot saved');
                } catch (screenshotError) {
                    console.log('⚠️ Could not take emergency screenshot:', screenshotError.message);
                }
            }
        } finally {
            // Only close browser if we're sure we want to exit completely
            const shouldCloseBrowser = !process.env.KEEP_BROWSER_OPEN && this.headless;
            
            if (shouldCloseBrowser) {
                await this.cleanup();
            } else {
                console.log('⚡ Browser staying open for debugging');
                console.log('💡 Set KEEP_BROWSER_OPEN=false and HEADLESS=true for automatic cleanup');
            }
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
    console.log('🤖 Enhanced Stealth Twitter Automation v4.0');
    console.log('🎯 Advanced bot detection evasion with improved tweet button detection');
    
    const automation = new EnhancedTwitterAutomation();
    await automation.run();
})();