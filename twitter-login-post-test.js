import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const HEADLESS = process.env.HEADLESS === 'true' || process.env.headless === 'true' || false;
const SCREENSHOT_DIR = './debug-screenshots';
const TWITTER_URL = 'https://x.com/i/flow/login';
const TWITTER_USERNAME = process.env.TWIT_USERNAME || process.env.TWITTER_USERNAME || '';
const TWITTER_PASSWORD = process.env.TWIT_PASSWORD || process.env.TWITTER_PASSWORD || '';

class TwitterAutomation {
    constructor() {
        this.browser = null;
        this.page = null;
        this.logSteps = [];
    }

    async initialize() {
        await fs.ensureDir(SCREENSHOT_DIR);

        this.browser = await puppeteer.launch({
            headless: HEADLESS,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--window-size=1920,1080',
                '--disable-features=VizDisplayCompositor',
                '--ignore-certificate-errors',
                '--disable-blink-features=AutomationControlled',
                '--disable-web-security',
                '--allow-running-insecure-content',
                '--disable-gpu',
                '--disable-extensions',
                '--no-first-run',
                '--disable-notifications',
                '--disable-popup-blocking',
                '--disable-background-timer-throttling',
                '--disable-renderer-backgrounding'
            ],
            defaultViewport: { width: 1920, height: 1080 }
        });

        this.page = await this.browser.newPage();

        // Enhanced stealth mode for Twitter
        await this.page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });

            // Override automation detection
            window.chrome = { runtime: {} };
            Object.defineProperty(navigator, 'permissions', {
                get: () => ({
                    query: () => Promise.resolve({ state: 'granted' })
                })
            });
        });

        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        console.log('🎯 Browser initialized for Twitter automation');
    }

    async logStep(name, success, error) {
            const step = { name, success, error, timestamp: new Date() };

            if (this.page) {
                const screenshotName = `twitter_${name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
                step.screenshot = path.join(SCREENSHOT_DIR, screenshotName);

                try {
                    await this.page.screenshot({ path: step.screenshot, fullPage: true });
                } catch (err) {
                    console.log('⚠️ Could not take screenshot:', err);
                }
            }

            this.logSteps.push(step);
            const statusIcon = success ? '✅' : '❌';
            console.log(`${statusIcon} ${name}: ${success ? 'SUCCESS' : `FAILED - ${error}`}`);
        return step;
    }

    async login() {
        console.log('\n🔐 Starting Twitter login...');
        
        try {
            // Navigate to Twitter login
            await this.page.goto(TWITTER_URL, { waitUntil: 'networkidle0', timeout: 60000 });
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Enhanced username input selectors for 2025 Twitter/X
            const usernameSelectors = [
                'input[autocomplete="username"]',
                'input[name="text"]',
                'input[data-testid="ocfEnterTextTextInput"]',
                'input[placeholder*="email"]',
                'input[placeholder*="username"]',
                'input[placeholder*="phone"]',
                'input[type="text"]'
            ];

            // Fill username/email
            let usernameFilled = false;
            for (const selector of usernameSelectors) {
                try {
                    console.log(`🧪 Trying username selector: ${selector}`);
                    await this.page.waitForSelector(selector, { visible: true, timeout: 5000 });
                    
                    await this.page.focus(selector);
                    await this.page.keyboard.down('Control');
                    await this.page.keyboard.press('A');
                    await this.page.keyboard.up('Control');
                    
                    // Type with realistic delays
                    await this.page.type(selector, TWITTER_USERNAME, { delay: 80 + Math.random() * 60 });
                    usernameFilled = true;
                    console.log(`✅ Username filled using: ${selector}`);
                    break;
                } catch (error) {
                    console.log(`❌ Username selector failed: ${selector}`);
                }
            }

            if (!usernameFilled) {
                throw new Error('Could not fill username field');
            }

            // Click Next button
            const nextButtonSelectors = [
                'button[role="button"]:has(span:contains("Next"))',
                'div[role="button"]:has(span:contains("Next"))',
                'button:contains("Next")',
                '[data-testid="LoginForm_Login_Button"]',
                'button[type="submit"]'
            ];

            let nextClicked = false;
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            for (const selector of nextButtonSelectors) {
                try {
                    console.log(`🧪 Trying Next button: ${selector}`);
                    await this.page.waitForSelector(selector, { visible: true, timeout: 5000 });
                    await this.page.click(selector);
                    nextClicked = true;
                    console.log(`✅ Next button clicked: ${selector}`);
                    break;
                } catch (error) {
                    console.log(`❌ Next button failed: ${selector}`);
                }
            }

            if (!nextClicked) {
                throw new Error('Could not click Next button');
            }

            // Wait for password field to appear
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Enhanced password selectors
            const passwordSelectors = [
                'input[autocomplete="current-password"]',
                'input[name="password"]',
                'input[type="password"]',
                'input[placeholder*="password"]',
                'input[data-testid="ocfEnterTextTextInput"]'
            ];

            // Fill password
            let passwordFilled = false;
            for (const selector of passwordSelectors) {
                try {
                    console.log(`🧪 Trying password selector: ${selector}`);
                    await this.page.waitForSelector(selector, { visible: true, timeout: 8000 });
                    await this.page.type(selector, TWITTER_PASSWORD, { delay: 70 + Math.random() * 50 });
                    passwordFilled = true;
                    console.log(`✅ Password filled using: ${selector}`);
                    break;
                } catch (error) {
                    console.log(`❌ Password selector failed: ${selector}`);
                }
            }

            if (!passwordFilled) {
                throw new Error('Could not fill password field');
            }

            // Click login button
            const loginButtonSelectors = [
                'button[data-testid="LoginForm_Login_Button"]',
                'div[role="button"]:has(span:contains("Log in"))',
                'button:contains("Log in")',
                'button[type="submit"]'
            ];

            let loginClicked = false;
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            for (const selector of loginButtonSelectors) {
                try {
                    console.log(`🧪 Trying login button: ${selector}`);
                    await this.page.waitForSelector(selector, { visible: true, timeout: 5000 });
                    await this.page.click(selector);
                    loginClicked = true;
                    console.log(`✅ Login button clicked: ${selector}`);
                    break;
                } catch (error) {
                    console.log(`❌ Login button failed: ${selector}`);
                }
            }

            if (!loginClicked) {
                throw new Error('Could not click login button');
            }

            // Wait for login to complete with extended timeout
            await new Promise(resolve => setTimeout(resolve, 10000));

            // Check for successful login
            const loginSuccess = await this.checkLoginSuccess();
            if (loginSuccess) {
                await this.logStep('Twitter Login', true);
                return true;
            } else {
                throw new Error('Login verification failed');
            }

        } catch (error) {
            await this.logStep('Twitter Login', false, error.message);
            return false;
        }
    }

    async checkLoginSuccess() {
        const successMarkers = [
            '[data-testid="primaryColumn"]',
            '[aria-label="Home timeline"]',
            '[data-testid="tweetButton"]',
            '[data-testid="SideNav_NewTweet_Button"]',
            'a[aria-label="Home"]',
            'nav[role="navigation"]'
        ];
        
        for (const selector of successMarkers) {
            try {
                await this.page.waitForSelector(selector, { timeout: 5000 });
                console.log(`✅ Login success marker found: ${selector}`);
                return true;
            } catch {
                continue;
            }
        }
        return false;
    }

    async postToTwitter(message) {
        try {
            console.log('\n📝 Starting Twitter post creation...');
            console.log(`📝 Message to post: "${message}"`);

            // Wait for page to fully load
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Enhanced tweet button selectors
            const tweetButtonSelectors = [
                '[data-testid="tweetButton"]',
                '[data-testid="SideNav_NewTweet_Button"]',
                'a[aria-label="Tweet"]',
                'button[aria-label="Tweet"]',
                'div[role="button"][aria-label="Tweet"]'
            ];

            // Find and click tweet button
            let tweetButtonClicked = false;
            for (const selector of tweetButtonSelectors) {
                try {
                    console.log(`🧪 Trying tweet button: ${selector}`);
                    await this.page.waitForSelector(selector, { visible: true, timeout: 10000 });
                    await this.page.click(selector);
                    tweetButtonClicked = true;
                    console.log(`✅ Tweet button clicked: ${selector}`);
                    break;
                } catch (error) {
                    console.log(`❌ Tweet button failed: ${selector}`);
                }
            }

            if (!tweetButtonClicked) {
                throw new Error('Could not find tweet button');
            }

            // Wait for composer to open
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Enhanced tweet input selectors
            const tweetInputSelectors = [
                '[data-testid="tweetTextarea_0"]',
                'div[role="textbox"][contenteditable="true"]',
                '[aria-label="Tweet text"]',
                '[data-testid="tweetTextarea"]',
                'div[contenteditable="true"]'
            ];

            // Find and fill tweet input
            let tweetInputFound = false;
            for (const selector of tweetInputSelectors) {
                try {
                    console.log(`🧪 Trying tweet input: ${selector}`);
                    await this.page.waitForSelector(selector, { visible: true, timeout: 8000 });
                    
                    await this.page.focus(selector);
                    await this.page.keyboard.down('Control');
                    await this.page.keyboard.press('A');
                    await this.page.keyboard.up('Control');
                    await this.page.keyboard.press('Backspace');
                    
                    // Type with human-like delays
                    console.log('⌨️ Typing tweet...');
                    for (const char of message) {
                        await this.page.keyboard.type(char, { delay: 50 + Math.random() * 70 });
                        
                        // Random thinking pauses
                        if (Math.random() > 0.92) {
                            await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 500));
                        }
                    }
                    
                    tweetInputFound = true;
                    console.log(`✅ Tweet input successful: ${selector}`);
                    break;
                } catch (error) {
                    console.log(`❌ Tweet input failed: ${selector}`);
                }
            }

            if (!tweetInputFound) {
                throw new Error('Could not find tweet input');
            }

            // Wait for UI to stabilize
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Enhanced post tweet button selectors
            const postTweetButtonSelectors = [
                '[data-testid="tweetButtonInline"]',
                'button[data-testid="tweetButton"]',
                'div[role="button"]:has(span:contains("Post"))',
                'button:has(span:contains("Post"))',
                'button:has(span:contains("Tweet"))'
            ];

            // Find and click post button
            let posted = false;
            for (const btnSelector of postTweetButtonSelectors) {
                try {
                    console.log(`🧪 Trying post tweet button: ${btnSelector}`);
                    await this.page.waitForSelector(btnSelector, { visible: true, timeout: 8000 });
                    
                    // Verify button is enabled
                    const isEnabled = await this.page.evaluate(sel => {
                        const button = document.querySelector(sel);
                        return button && !button.disabled && !button.hasAttribute('disabled');
                    }, btnSelector);
                    
                    if (!isEnabled) {
                        console.log(`⚠️ Button found but disabled: ${btnSelector}`);
                        continue;
                    }
                    
                    await this.page.click(btnSelector);
                    console.log('✅ Post tweet button clicked!');
                    posted = true;
                    break;
                } catch (error) {
                    console.log(`❌ Post tweet button failed: ${btnSelector}`);
                }
            }

            if (!posted) {
                throw new Error('Could not find or click post button');
            }

            // Wait for tweet to process
            await new Promise(resolve => setTimeout(resolve, 5000));

            await this.logStep('Twitter Post Creation', true, `Posted: "${message}"`);
            return true;

        } catch (error) {
            await this.logStep('Twitter Post Creation', false, error.message);
            console.log('❌ Twitter posting error:', error.message);
            
            if (this.page) {
                await this.page.screenshot({ path: './debug-twitter-post-error.png', fullPage: true });
            }
            return false;
        }
    }

    async runAutomation(caption = 'Hello I am New Here on Twitter!') {
        try {
            if (!TWITTER_USERNAME || !TWITTER_PASSWORD) {
                console.log('❌ Twitter credentials not configured');
                return { success: false, error: 'Twitter credentials not configured' };
            }

            console.log('🚀 Starting Twitter automation...');
            console.log(`🔧 Username: ${TWITTER_USERNAME}`);
            console.log(`🔐 Password: ${TWITTER_PASSWORD.replace(/./g, '•')}`);
            console.log(`📝 Caption: "${caption}"`);
            
            await this.initialize();

            // Login with extended timeout handling
            const loginSuccess = await this.login();
            if (!loginSuccess) {
                return { success: false, error: 'Login failed' };
            }

            // Post with retry logic
            let postSuccess = false;
            const maxRetries = 3;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                console.log(`\n🔄 Post attempt ${attempt}/${maxRetries}...`);
                
                try {
                    postSuccess = await this.postToTwitter(caption);
                    if (postSuccess) break;
                } catch (error) {
                    console.log(`❌ Post attempt ${attempt} failed:`, error.message);
                }
                
                if (attempt < maxRetries) {
                    console.log('⏳ Waiting before retry...');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }

            if (!postSuccess) {
                return { success: false, error: 'Post creation failed after retries' };
            }

            console.log('\n🎉 SUCCESSFUL SOCIAL AUTOMATION WORKFLOW:');
            console.log('1. ✅ Twitter login completed');
            console.log('2. ✅ Post creation successful');
            console.log(`3. ✅ Posted: "${caption}"`);

            return { success: true, message: `Posted: "${caption}"` };

        } catch (error) {
            console.error('❌ Twitter automation failed:', error);
            return { success: false, error: error.message };
        } finally {
            const keepOpen = process.env.KEEP_BROWSER_OPEN === 'true' || !HEADLESS;
            
            if (this.browser && !keepOpen) {
                await this.browser.close();
                console.log('🏁 Browser closed');
            } else if (this.browser) {
                console.log('🔵 Browser will stay open for inspection...');
                setTimeout(async () => {
                    await this.browser.close();
                    console.log('🏁 Browser closed after timeout');
                }, 120000); // 2 minutes
            }
        }
    }
}

// Run automation if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv.length > 2) {
    const automation = new TwitterAutomation();
    const caption = process.argv[2] || 'Hello I am New Here on Twitter!';
    
    // Add global timeout to prevent hanging
    const globalTimeout = setTimeout(() => {
        console.log('⏰ Global timeout reached - terminating Twitter automation');
        process.exit(2);
    }, 300000); // 5 minutes max
    
    automation.runAutomation(caption)
        .then(result => {
            clearTimeout(globalTimeout);
            if (result.success) {
                console.log('✅ Twitter automation completed successfully');
                process.exit(0);
            } else {
                console.log('❌ Twitter automation failed:', result.error);
                process.exit(1);
            }
        })
        .catch(error => {
            clearTimeout(globalTimeout);
            console.error('❌ Unhandled error:', error);
            process.exit(1);
        });
}

export { TwitterAutomation };