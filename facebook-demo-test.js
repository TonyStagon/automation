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
                '--window-size=1366,768', // Common resolution
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

    async waitForElement(selectors, timeout = 10000) {
        const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
        
        for (const selector of selectorArray) {
            try {
                await this.page.waitForSelector(selector, { timeout: timeout / selectorArray.length });
                const element = await this.page.$(selector);
                
                // Check if element is actually visible and interactable
                const isInteractable = await this.page.evaluate((el) => {
                    if (!el) return false;
                    
                    const rect = el.getBoundingClientRect();
                    const style = window.getComputedStyle(el);
                    
                    return rect.width > 0 && 
                           rect.height > 0 && 
                           style.visibility !== 'hidden' && 
                           style.display !== 'none' && 
                           style.opacity !== '0';
                }, element);
                
                if (isInteractable) {
                    return element;
                }
            } catch (e) {
                continue;
            }
        }
        
        throw new Error(`None of the selectors found: ${selectorArray.join(', ')}`);
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
                console.log('🔑 Need to login...');
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
        console.log('🔍 Comprehensive POST button search...');
        
        // Take a screenshot to see what buttons are available
        await this.page.screenshot({ 
            path: path.join(SCREENSHOT_DIR, 'button_search_debug.png'),
            fullPage: false 
        });

        // Method 1: Find all buttons and analyze them
        const allButtons = await this.page.evaluate(() => {
            const buttons = [];
            
            // Find all clickable elements
            const clickableElements = document.querySelectorAll('div[role="button"], button, input[type="submit"]');
            
            clickableElements.forEach((el, index) => {
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                const isVisible = rect.width > 0 && rect.height > 0 && 
                                 style.display !== 'none' && style.visibility !== 'hidden';
                
                if (isVisible) {
                    buttons.push({
                        index,
                        text: el.textContent?.trim() || '',
                        ariaLabel: el.getAttribute('aria-label') || '',
                        className: el.className || '',
                        tagName: el.tagName,
                        disabled: el.hasAttribute('aria-disabled') ? el.getAttribute('aria-disabled') === 'true' : false,
                        rect: {
                            x: Math.round(rect.x),
                            y: Math.round(rect.y),
                            width: Math.round(rect.width),
                            height: Math.round(rect.height)
                        }
                    });
                }
            });
            
            return buttons;
        });

        console.log('📋 Found buttons:');
        allButtons.forEach((btn, i) => {
            console.log(`  ${i + 1}. "${btn.text}" | aria-label: "${btn.ariaLabel}" | disabled: ${btn.disabled}`);
        });

        // Method 2: Smart POST button detection
        const postButtonCandidates = allButtons.filter(btn => {
            const text = btn.text.toLowerCase();
            const ariaLabel = btn.ariaLabel.toLowerCase();
            
            // Look for buttons that likely are POST buttons
            return (text === 'post' || 
                   text.includes('post') && !text.includes('actions') && !text.includes('boost') ||
                   ariaLabel === 'post' ||
                   ariaLabel.includes('post') && !ariaLabel.includes('actions')) &&
                   !btn.disabled;
        });

        console.log(`🎯 POST button candidates: ${postButtonCandidates.length}`);
        postButtonCandidates.forEach((btn, i) => {
            console.log(`  Candidate ${i + 1}: "${btn.text}" | "${btn.ariaLabel}"`);
        });

        // Method 3: Try each candidate
        for (const candidate of postButtonCandidates) {
            try {
                // Get the element again by its characteristics
                const element = await this.page.evaluate((btnInfo) => {
                    const elements = document.querySelectorAll('div[role="button"], button, input[type="submit"]');
                    
                    for (const el of elements) {
                        const rect = el.getBoundingClientRect();
                        const text = el.textContent?.trim() || '';
                        const ariaLabel = el.getAttribute('aria-label') || '';
                        
                        if (Math.abs(rect.x - btnInfo.rect.x) < 5 &&
                            Math.abs(rect.y - btnInfo.rect.y) < 5 &&
                            text === btnInfo.text &&
                            ariaLabel === btnInfo.ariaLabel) {
                            return el;
                        }
                    }
                    return null;
                }, candidate);

                if (element) {
                    console.log(`✅ Found matching POST button: "${candidate.text}"`);
                    return element;
                }
            } catch (e) {
                console.log(`❌ Could not get element for candidate: "${candidate.text}"`);
                continue;
            }
        }

        return null;
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
            console.log('✍️ Typing post content...');
            const postMessage = 'Hello world! 🌍 This is an automated test post created with enhanced stealth techniques. #automation #test';
            
            await this.simulateMouseMovement();
            await textInput.click();
            await this.humanDelay(500, 1000);
            
            // Enhanced typing with better clearing
            await this.page.evaluate((el) => {
                el.innerHTML = '';
                el.textContent = '';
            }, textInput);
            
            await this.typeHumanLike(textInput, postMessage);
            await this.logStep('Type post content', true);

            await this.humanDelay(2000, 4000);

            // Enhanced POST button detection
            console.log('🔍 Starting comprehensive POST button search...');
            
            const postButton = await this.findPostButton();

            if (!postButton) {
                // Last resort: try pressing Enter
                console.log('🎯 POST button not found, trying keyboard shortcut...');
                await textInput.focus();
                await this.humanDelay(500, 1000);
                
                // Try Ctrl+Enter (common shortcut for posting)
                await this.page.keyboard.down('Control');
                await this.page.keyboard.press('Enter');
                await this.page.keyboard.up('Control');
                await this.logStep('Try Ctrl+Enter shortcut', true);
                
                await this.humanDelay(3000, 5000);
                
                // Check if it worked
                const currentUrl = this.page.url();
                if (!currentUrl.includes('composer') && !currentUrl.includes('create')) {
                    await this.logStep('Post published via keyboard shortcut', true);
                    return true;
                } else {
                    await this.page.screenshot({ 
                        path: path.join(SCREENSHOT_DIR, 'all_methods_failed.png'),
                        fullPage: true 
                    });
                    throw new Error('All POST methods failed - manual intervention required');
                }
            }

            // Click POST button with multiple retry strategies
            console.log('📤 Attempting to click POST button...');
            
            // Strategy 1: Regular click
            try {
                await this.simulateMouseMovement();
                await postButton.click();
                console.log('✅ Regular click attempted');
            } catch (e) {
                console.log('❌ Regular click failed, trying alternative methods...');
                
                // Strategy 2: JavaScript click
                try {
                    await this.page.evaluate(el => el.click(), postButton);
                    console.log('✅ JavaScript click attempted');
                } catch (e2) {
                    console.log('❌ JavaScript click failed');
                    
                    // Strategy 3: Dispatch click event
                    try {
                        await this.page.evaluate(el => {
                            const event = new MouseEvent('click', {
                                view: window,
                                bubbles: true,
                                cancelable: true
                            });
                            el.dispatchEvent(event);
                        }, postButton);
                        console.log('✅ Event dispatch click attempted');
                    } catch (e3) {
                        console.log('❌ Event dispatch failed');
                        throw new Error('All click methods failed');
                    }
                }
            }

            await this.logStep('Click post button', true);

            // Wait and verify success
            await this.humanDelay(5000, 8000);
            
            // Multiple success verification methods
            const isSuccess = await this.page.evaluate(() => {
                const url = window.location.href;
                const hasComposer = url.includes('composer') || url.includes('create');
                const hasSuccessIndicators = document.querySelector('[data-testid="post-success"]') ||
                                           document.querySelector('[role="alert"]') ||
                                           !document.querySelector('[contenteditable="true"][data-lexical-editor="true"]');
                
                return !hasComposer || hasSuccessIndicators;
            });
            
            if (isSuccess) {
                await this.logStep('Post published successfully', true);
                return true;
            } else {
                console.log('⚠️ Post status unclear, taking screenshot for manual verification...');
                await this.page.screenshot({ 
                    path: path.join(SCREENSHOT_DIR, 'post_status_unclear.png'),
                    fullPage: true 
                });
                
                // Give it more time in case of slow network
                await this.humanDelay(5000, 7000);
                
                const finalUrl = this.page.url();
                if (!finalUrl.includes('composer')) {
                    await this.logStep('Post likely successful (URL check)', true);
                    return true;
                } else {
                    throw new Error('Post publication could not be confirmed');
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
        console.log('🔑 Password:', FB_PASSWORD ? '***' : 'NOT SET');

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
    console.log('🤖 Enhanced Stealth Facebook Automation v3.0');
    console.log('🎯 Advanced bot detection evasion');
    
    const automation = new EnhancedFacebookAutomation();
    await automation.run();
})();