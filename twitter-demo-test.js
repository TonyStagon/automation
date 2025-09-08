import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const HEADLESS = process.env.HEADLESS === 'true' || false;
const SCREENSHOT_DIR = './demo-screenshots-twitter';
const TWITTER_URL = 'https://x.com/i/flow/login';
const TWITTER_USERNAME = process.env.TWIT_USERNAME || process.env.TWITTER_USERNAME || '';
const TWITTER_PASSWORD = process.env.TWIT_PASSWORD || process.env.TWITTER_PASSWORD || '';

class EnhancedTwitterAutomation {
    constructor() {
        this.browser = null;
        this.page = null;
        this.logSteps = [];
        this.cookieDir = './cookies-twitter';
        this.strategyCounters = {
            selectorsTried: 0,
            successfulStrategies: 0
        };
    }

    async initialize() {
        await fs.ensureDir(SCREENSHOT_DIR);
        await fs.ensureDir(this.cookieDir);

        this.browser = await puppeteer.launch({
            headless: HEADLESS,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--window-size=1366,768',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            ],
            defaultViewport: null,
        });

        this.page = await this.browser.newPage();

        // Stealth techniques
        await this.page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        });

        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        console.log('🎯 Enhanced Twitter browser initialized');
    }

    async logStep(name, success, error = null) {
            const step = { name, success, error };
            this.logSteps.push(step);
            console.log(`${success ? '✅' : '❌'} ${name}: ${success ? 'SUCCESS' : `FAILED - ${error}`}`);
        return step;
    }

    async humanDelay(min = 1000, max = 3000) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));
    }

    // Missing method - simulate human-like mouse movement
    async simulateMouseMovement() {
        try {
            // Get page dimensions
            const dimensions = await this.page.evaluate(() => ({
                width: window.innerWidth,
                height: window.innerHeight
            }));

            // Generate random mouse movements
            for (let i = 0; i < 3; i++) {
                const x = Math.random() * dimensions.width;
                const y = Math.random() * dimensions.height;
                
                await this.page.mouse.move(x, y, { steps: 10 });
                await this.humanDelay(100, 300);
            }
            
            console.log('🖱️ Mouse movement simulation completed');
        } catch (error) {
            console.log('⚠️ Mouse simulation failed (non-critical):', error.message);
        }
    }

    // Missing method - human-like typing
    async typeHumanLike(element, text) {
        try {
            await element.click({ clickCount: 3 }); // Select all existing text
            await this.humanDelay(200, 500);
            
            // Clear field first
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('KeyA');
            await this.page.keyboard.up('Control');
            await this.page.keyboard.press('Backspace');
            
            // Type with human-like delays
            for (const char of text) {
                await this.page.keyboard.type(char, { 
                    delay: Math.random() * 50 + 25 // 25-75ms delay between characters
                });
            }
            
            console.log(`⌨️ Human-like typing completed for text of length ${text.length}`);
        } catch (error) {
            console.log('⚠️ Fallback to simple typing');
            await element.type(text, { delay: 50 });
        }
    }

    async waitForElement(selectors, timeout = 15000, retries = 3) {
        this.strategyCounters.selectorsTried += selectors.length;
        let attempt = 1;
        
        while (attempt <= retries) {
            for (const selector of selectors) {
                try {
                    await this.page.waitForSelector(selector, {
                        timeout: Math.max(timeout / selectors.length, 3000),
                        visible: true
                    });
                    
                    const element = await this.page.$(selector);
                    const isInteractable = await this.page.evaluate((el) => {
                        if (!el) return false;
                        const rect = el.getBoundingClientRect();
                        return rect.width > 0 && rect.height > 0;
                    }, element);
                    
                    if (isInteractable) {
                        console.log(`✅ Found element: ${selector}`);
                        this.strategyCounters.successfulStrategies++;
                        return element;
                    }
                } catch (e) {
                    // Continue to next selector
                }
            }
            
            if (attempt < retries) {
                console.log(`⏳ Retrying element detection (attempt ${attempt}/${retries})...`);
                await this.humanDelay(2000, 3000);
            }
            attempt++;
        }
        throw new Error(`All selectors failed after ${retries} attempts: ${selectors.join(', ')}`);
    }

    async enhanceSelectorsBasedOnContext(baseSelectors) {
        // Twitter often uses data-testid attributes that change
        const enhancedSelectors = [...baseSelectors];
        
        // Add pattern-based selectors
        enhancedSelectors.push(
            'input[autocomplete*="user"]',
            'input[placeholder*="user"]',
            'input[type="text"]',
            'input[name*="text"]'
        );
        
        return enhancedSelectors;
    }

    async takeDebugScreenshot(name) {
        try {
            const screenshotPath = path.join(SCREENSHOT_DIR, `${name}_${Date.now()}.png`);
            await this.page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`📸 Debug screenshot saved: ${screenshotPath}`);
            return screenshotPath;
        } catch (error) {
            console.log('⚠️ Failed to take screenshot:', error.message);
        }
    }

    async login() {
        try {
            console.log('🌐 Navigating to Twitter login page...');
            await this.page.goto(TWITTER_URL, {
                waitUntil: 'networkidle2',
                timeout: 45000
            });
            
            await this.simulateMouseMovement();
            await this.humanDelay(4000, 6000);
            await this.takeDebugScreenshot('01_login_page_loaded');

            // Enhanced username detection with context analysis
            const usernameSelectors = await this.enhanceSelectorsBasedOnContext([
                'input[autocomplete="username"]',
                'input[name="text"]',
                'input[data-testid*="text"]',
                'input[placeholder*="phone"]',
                'input[placeholder*="email"]',
                'input[placeholder*="user"]'
            ]);

            console.log('🔍 Advanced username detection starting...');
            const usernameInput = await this.waitForElement(usernameSelectors);
            await this.typeHumanLike(usernameInput, TWITTER_USERNAME);
            await this.logStep('Enter username/email', true);
            await this.takeDebugScreenshot('02_username_entered');

            // Enhanced next button detection
            const nextButtonSelectors = [
                'button[type="submit"]',
                'div[role="button"]:has(span:contains("Next"))',
                'button:contains("Next")',
                '[data-testid*="Login"]',
                'button:has(div:contains("Next"))',
                'div[data-testid="LoginForm_Login_Button"]'
            ];

            console.log('🔍 Advanced Next button detection...');
            const nextButton = await this.waitForElement(nextButtonSelectors);
            await this.page.evaluate(el => {
                el.scrollIntoViewIfNeeded();
                el.style.backgroundColor = 'rgba(29, 161, 242, 0.1)';
            }, nextButton);
            
            await nextButton.click();
            await this.logStep('Click next', true);
            await this.humanDelay(3500, 5500);
            await this.takeDebugScreenshot('03_next_clicked');

            // Enhanced password detection
            const passwordSelectors = [
                'input[autocomplete="current-password"]',
                'input[name="password"]',
                'input[type="password"]',
                'input[placeholder*="password"]',
                'input[data-testid*="password"]'
            ];

            console.log('🔍 Advanced password detection...');
            const passwordInput = await this.waitForElement(passwordSelectors);
            await this.typeHumanLike(passwordInput, TWITTER_PASSWORD);
            await this.logStep('Enter password', true);
            await this.takeDebugScreenshot('04_password_entered');

            // Enhanced login button detection
            const loginButtonSelectors = [
                'button[data-testid*="Login"]',
                'button[type="submit"]',
                'div[role="button"]:has(span:contains("Log in"))',
                'button:has(span:contains("Log in"))',
                'div[data-testid*="login"]'
            ];

            console.log('🔍 Advanced login button detection...');
            const loginButton = await this.waitForElement(loginButtonSelectors);
            await loginButton.click();
            await this.logStep('Click login', true);
            await this.humanDelay(6000, 9000);
            await this.takeDebugScreenshot('05_login_clicked');

            // Enhanced login verification
            const loginSuccessful = await this.page.evaluate(() => {
                const successMarkers = [
                    document.querySelector('[data-testid="AppTabBar_Home_Link"]'),
                    document.querySelector('[aria-label="Home timeline"]'),
                    document.querySelector('[data-testid="SideNav_NewTweet_Button"]'),
                    document.querySelector('nav[role="navigation"]'),
                    document.title.includes('Home') || document.title.includes('Twitter')
                ];
                return successMarkers.some(marker => marker !== null && marker !== false);
            });

            if (loginSuccessful) {
                await this.logStep('Login successful', true);
                await this.takeDebugScreenshot('06_login_successful');
                
                // Save cookies for future sessions
                const cookies = await this.page.cookies();
                await fs.writeJson(path.join(this.cookieDir, 'session.json'), cookies);
                console.log('🍪 Session cookies saved');
                return true;
            }

            throw new Error('Login verification timeout - may require manual verification');

        } catch (error) {
            console.log('📊 Strategy analysis:', this.strategyCounters);
            
            // Capture debug screenshot
            await this.takeDebugScreenshot('error_login');
            
            await this.logStep('Login failed', false, error.message);
            return false;
        }
    }

    async createPost(message = 'Hello from enhanced Twitter automation!') {
        try {
            console.log('📝 Starting post creation...');
            await this.takeDebugScreenshot('07_before_post');

            // Tweet button
            const tweetButton = await this.waitForElement([
                '[data-testid="SideNav_NewTweet_Button"]',
                'a[href="/compose/tweet"]',
                '[data-testid="tweetButtonInline"]'
            ]);
            await tweetButton.click();
            await this.logStep('Open tweet composer', true);
            await this.humanDelay(2000, 4000);
            await this.takeDebugScreenshot('08_composer_opened');

            // Tweet input
            const tweetInput = await this.waitForElement([
                '[data-testid="tweetTextarea_0"]',
                'div[contenteditable="true"]',
                '[role="textbox"]'
            ]);
            await tweetInput.click();
            await this.page.keyboard.type(message, { delay: 50 });
            await this.logStep('Type tweet content', true);
            await this.takeDebugScreenshot('09_content_typed');

            // Post tweet
            const postButton = await this.waitForElement([
                '[data-testid="tweetButton"]',
                '[data-testid="tweetButtonInline"]',
                'div[role="button"]:has(span:contains("Post"))',
                'button:has(span:contains("Post"))'
            ]);
            await postButton.click();
            await this.logStep('Post tweet', true);
            await this.takeDebugScreenshot('10_post_clicked');

            // Verify post
            await this.humanDelay(3000, 5000);
            await this.takeDebugScreenshot('11_post_completed');
            return true;

        } catch (error) {
            await this.takeDebugScreenshot('error_post');
            await this.logStep('Create post failed', false, error.message);
            return false;
        }
    }

    async run(caption = 'Hello from enhanced Twitter automation!') {
        if (!TWITTER_USERNAME || !TWITTER_PASSWORD) {
            console.log('❌ Twitter credentials not configured in environment variables');
            console.log('💡 Set TWIT_USERNAME/TWIT_PASSWORD or TWITTER_USERNAME/TWITTER_PASSWORD in your .env file');
            return;
        }

        console.log('🚀 Starting Enhanced Twitter Automation v4.1');
        console.log('🤖 Advanced stealth techniques with multiple detection strategies');
        console.log('🔧 Username:', TWITTER_USERNAME);
        console.log('🔐 Password:', '••••••••');

        try {
            await this.initialize();
            
            const loginSuccess = await this.login();
            if (loginSuccess) {
                console.log('✅ Authentication phase completed');
                
                const postSuccess = await this.createPost(caption);
                if (postSuccess) {
                    console.log('🎉 POST CREATION SUCCESSFUL!');
                    console.log('📊 Strategy Performance:');
                    console.log(`   - Total selectors attempted: ${this.strategyCounters.selectorsTried}`);
                    console.log(`   - Successful strategies: ${this.strategyCounters.successfulStrategies}`);
                    console.log(`   - Success rate: ${Math.round((this.strategyCounters.successfulStrategies/this.strategyCounters.selectorsTried)*100)}%`);
                    console.log(`📝 Posted: "${caption.substring(0, 50)}${caption.length > 50 ? '...' : ''}"`);
                }
            }

        } catch (error) {
            console.error('❌ Automation failed with error:', error.message);
            
            // Enhanced error reporting
            if (error.message.includes('timeout')) {
                console.log('💡 Timeout detected - Twitter may have changed their UI or added security measures');
                console.log('💡 Try running with visible browser: HEADLESS=false node twitter-demo-test.js');
            } else if (error.message.includes('selector')) {
                console.log('💡 Selector failure - Twitter UI pattern may have changed');
                console.log('💡 Check debug screenshots for current UI structure');
            }
            
        } finally {
            const keepBrowserOpen = process.env.KEEP_BROWSER_OPEN === 'true' || !HEADLESS;
            
            if (this.browser && !keepBrowserOpen) {
                await this.browser.close();
                console.log('🔒 Browser closed');
            } else if (this.browser) {
                console.log('🔵 Browser kept open for inspection (KEEP_BROWSER_OPEN=true)');
                // Auto-close after 2 minutes if not explicitly kept open
                setTimeout(async () => {
                    if (this.browser) {
                        await this.browser.close();
                        console.log('🔒 Browser auto-closed after 2 minutes');
                    }
                }, 120000);
            }
            
            console.log('📋 Execution Summary:');
            this.logSteps.forEach(step => {
                const status = step.success ? '✅' : '❌';
                console.log(`   ${status} ${step.name}`);
            });
        }
    }
}

// Run the automation
const automation = new EnhancedTwitterAutomation();
const message = process.argv[2] || 'Hello from enhanced Twitter automation!';
automation.run(message);