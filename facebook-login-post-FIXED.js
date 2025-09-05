import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';

// Configuration - now accepts command line arguments or environment variables
const HEADLESS = process.env.HEADLESS === 'true' || false;
const SCREENSHOT_DIR = './debug-screenshots';
const FB_URL = 'https://www.facebook.com/login';
const FB_USERNAME = process.env.FB_USERNAME || process.env.FBusername || '';
const FB_PASSWORD = process.env.FB_PASSWORD || process.env.FBpassword || '';

class FacebookAutomationFixed {
    constructor() {
        this.browser = null;
        this.page = null;
        this.logSteps = [];
        this.cookieDir = './cookies';
    }

    async initialize() {
        await fs.ensureDir(SCREENSHOT_DIR);
        await fs.ensureDir(this.cookieDir);

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
                '--disable-popup-blocking'
            ],
            defaultViewport: { width: 1920, height: 1080 }
        });

        this.page = await this.browser.newPage();

        // Enhanced stealth mode (Instagram-AI-Agent pattern)
        await this.page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });

            // Advanced stealth techniques from Instagram-AI-Agent
            window.chrome = { runtime: {} };
            Object.defineProperty(navigator, 'permissions', {
                get: () => ({
                    query: () => Promise.resolve({ state: 'granted' })
                })
            });
        });

        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        console.log('🎯 Browser initialized for Enhanced Facebook automation');
    }

    async logStep(name, success, error) {
            const step = { name, success, error, timestamp: new Date() };

            if (this.page) {
                const screenshotName = `${name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
                step.screenshot = path.join(SCREENSHOT_DIR, screenshotName);

                try {
                    await this.page.screenshot({ path: step.screenshot, fullPage: true });
                } catch (err) {
                    console.log('⚠️ Could not take screenshot:', err);
                }

                // Human-like mouse movements (Instagram-AI-Agent pattern)
                await this.randomMouseMovement();
            }

            this.logSteps.push(step);
            const statusIcon = success ? '✅' : '❌';
            console.log(`${statusIcon} ${name}: ${success ? 'SUCCESS' : `FAILED - ${error}`}`);
        return step;
    }

    async randomMouseMovement() {
        const moves = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < moves; i++) {
            await this.page.mouse.move(
                100 + Math.random() * 600, 
                100 + Math.random() * 300
            );
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        }
    }

    async checkCookiesValid() {
        try {
            const cookiesPath = path.join(this.cookieDir, 'facebook_cookies.json');
            
            if (!await fs.pathExists(cookiesPath)) {
                console.log('❌ No Facebook cookies found');
                return false;
            }

            const cookieData = await fs.readJson(cookiesPath);
            const cookies = cookieData.cookies || cookieData;
            const currentTimestamp = Math.floor(Date.now() / 1000);

            // Critical Facebook cookies from Instagram-AI-Agent pattern
            const criticalCookies = ['c_user', 'xs', 'fr'];
            
            for (const cookieName of criticalCookies) {
                const cookie = cookies.find(c => c.name === cookieName);
                if (!cookie) {
                    console.log(`❌ Missing critical cookie: ${cookieName}`);
                    return false;
                }
                
                if (cookie.expires && cookie.expires < currentTimestamp) {
                    console.log(`❌ Expired cookie: ${cookieName}`);
                    return false;
                }
            }

            console.log('✅ Valid Facebook cookies found');
            return true;
        } catch (error) {
            console.log('❌ Error checking cookies:', error.message);
            return false;
        }
    }

    async saveCookies(cookies) {
        try {
            const cookiesPath = path.join(this.cookieDir, 'facebook_cookies.json');
            const cookieData = {
                cookies: cookies,
                timestamp: Date.now(),
                platform: 'facebook'
            };
            await fs.writeJson(cookiesPath, cookieData, { spaces: 2 });
            console.log('✅ Facebook cookies saved');
        } catch (error) {
            console.log('❌ Error saving cookies:', error.message);
        }
    }

    async loadCookies() {
        try {
            const cookiesPath = path.join(this.cookieDir, 'facebook_cookies.json');
            if (await fs.pathExists(cookiesPath)) {
                const data = await fs.readJson(cookiesPath);
                return data.cookies || data;
            }
            return [];
        } catch (error) {
            console.log('❌ Error loading cookies:', error.message);
            return [];
        }
    }

    async humanType(selector, text) {
        await this.page.focus(selector);
        
        // Clear existing content
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('A');
        await this.page.keyboard.up('Control');
        await this.page.keyboard.press('Backspace');
        
        // Instagram-AI-Agent typing pattern
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            let delay = 60 + Math.random() * 80;
            
            if (char === ' ') delay = 120 + Math.random() * 100;
            if (char.match(/[.!?]/)) delay = 200 + Math.random() * 200;
            
            await this.page.keyboard.type(char, { delay });
            
            // Random thinking pauses (Instagram-AI-Agent pattern)
            if (Math.random() > 0.9) {
                await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
            }
        }
    }

    async login() {
        console.log('\n🔐 Starting Enhanced Facebook login (Instagram-AI-Agent pattern)...');
        
        try {
            // Check for existing valid cookies first (Instagram-AI-Agent approach)
            const hasValidCookies = await this.checkCookiesValid();
            if (hasValidCookies) {
                console.log('✅ Loading existing Facebook cookies...');
                const cookies = await this.loadCookies();
                await this.page.setCookie(...cookies);
                
                await this.page.goto('https://www.facebook.com', { waitUntil: 'networkidle2', timeout: 60000 });
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Verify login success
                const loginSuccess = await this.checkLoginSuccess();
                if (loginSuccess) {
                    console.log('✅ Successfully logged in with existing cookies');
                    return true;
                } else {
                    console.log('⚠️ Cookies expired, proceeding with fresh login...');
                }
            }

            await this.page.goto(FB_URL, { waitUntil: 'networkidle0', timeout: 60000 });
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Enhanced login selectors from Instagram-AI-Agent pattern
            const emailSelectors = [
                'input[name="email"]',
                '#email',
                'input[type="email"]',
                'input[autocomplete="username"]',
                'input[data-testid="royal_email"]'
            ];

            const passwordSelectors = [
                'input[name="pass"]',
                '#pass',
                'input[type="password"]',
                'input[autocomplete="current-password"]',
                'input[data-testid="royal_pass"]'
            ];

            const loginButtonSelectors = [
                'button[name="login"]',
                '#loginbutton',
                'button[type="submit"]',
                'button[data-testid="royal_login_button"]',
                'input[type="submit"]'
            ];

            // Fill email with human-like behavior
            let emailFilled = false;
            for (const selector of emailSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 3000 });
                    await this.humanType(selector, FB_USERNAME);
                    emailFilled = true;
                    console.log(`✅ Email filled using: ${selector}`);
                    break;
                } catch (error) {
                    console.log(`❌ Email selector failed: ${selector}`);
                }
            }

            if (!emailFilled) {
                throw new Error('Could not fill email field');
            }

            // Fill password
            let passwordFilled = false;
            for (const selector of passwordSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 3000 });
                    await this.page.type(selector, FB_PASSWORD, { delay: 40 + Math.random() * 40 });
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

            // Click login
            await new Promise(resolve => setTimeout(resolve, 1000));
            let loginClicked = false;
            for (const selector of loginButtonSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 3000 });
                    await this.page.click(selector);
                    loginClicked = true;
                    console.log(`✅ Login clicked using: ${selector}`);
                    break;
                } catch (error) {
                    console.log(`❌ Login button failed: ${selector}`);
                }
            }

            if (!loginClicked) {
                throw new Error('Could not click login button');
            }

            // Wait for login to complete
            await new Promise(resolve => setTimeout(resolve, 8000));

            // Check for successful login
            const loginSuccess = await this.checkLoginSuccess();
            if (loginSuccess) {
                // Save cookies for future use (Instagram-AI-Agent pattern)
                const cookies = await this.page.cookies();
                await this.saveCookies(cookies);
                
                await this.logStep('Facebook Login', true);
                return true;
            } else {
                throw new Error('Login verification failed');
            }

        } catch (error) {
            await this.logStep('Facebook Login', false, error.message);
            return false;
        }
    }

    async checkLoginSuccess() {
        const successMarkers = [
            '[aria-label="Facebook"]',
            '[data-pagelet="MainFeed"]',
            '[role="main"]',
            'div[data-pagelet="MainFeed"]',
            'div[data-pagelet="ProfileComposer"]'
        ];
        
        for (const selector of successMarkers) {
            try {
                await this.page.waitForSelector(selector, { timeout: 3000 });
                return true;
            } catch {
                continue;
            }
        }
        return false;
    }

    async postToFacebook(message) {
        try {
            console.log('\n📝 Starting Enhanced Facebook post creation (Instagram-AI-Agent pattern)...');
            console.log(`📝 Message: "${message}"`);

            // Navigate to Facebook home if not already there
            const currentUrl = await this.page.url();
            if (!currentUrl.includes('facebook.com') || currentUrl.includes('login')) {
                console.log('🔄 Navigating to Facebook home...');
                await this.page.goto('https://www.facebook.com', { waitUntil: 'networkidle2', timeout: 30000 });
                await new Promise(resolve => setTimeout(resolve, 5000));
            }

            // Wait for page to stabilize with human-like delay
            await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

            // Enhanced post trigger selectors (Instagram-AI-Agent pattern)
            const postTriggerSelectors = [
                'div[role="button"][aria-label*="What\'s on your mind"]',
                'div[data-testid="status-attachment-mentions-input"]',
                '[aria-label="Create a post"]',
                'div[data-pagelet="ProfileComposer"] div[role="button"]',
                'div[contenteditable="true"][role="textbox"]',
                'textarea[placeholder*="What\'s on your mind"]',
                'div[data-testid="react-composer-root"]'
            ];

            // Try each selector with human-like behavior
            let composerOpened = false;
            for (const selector of postTriggerSelectors) {
                try {
                    console.log(`🧪 Trying post trigger: ${selector}`);
                    await this.page.waitForSelector(selector, { visible: true, timeout: 8000 });
                    
                    // Scroll into view and add human-like delay
                    await this.page.evaluate(sel => {
                        const el = document.querySelector(sel);
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, selector);
                    
                    await this.randomMouseMovement();
                    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
                    
                    await this.page.click(selector);
                    composerOpened = true;
                    console.log(`✅ Composer opened with: ${selector}`);
                    break;
                } catch (error) {
                    console.log(`❌ Trigger failed: ${selector}`);
                }
            }

            if (!composerOpened) {
                throw new Error('Could not open Facebook composer');
            }

            // Wait for composer to fully load
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Enhanced text input selectors (Instagram-AI-Agent pattern)
            const textInputSelectors = [
                'div[contenteditable="true"][role="textbox"]',
                'div[data-testid="status-attachment-mentions-input"] > div[contenteditable="true"]',
                'textarea[placeholder*="What\'s on your mind"]',
                'div[contenteditable="true"][aria-label*="What\'s on your mind"]'
            ];

            // Human-like typing in the composer (Instagram-AI-Agent pattern)
            let textTyped = false;
            for (const selector of textInputSelectors) {
                try {
                    await this.page.waitForSelector(selector, { visible: true, timeout: 5000 });
                    
                    // Add focus and contenteditable setup
                    await this.page.evaluate(sel => {
                        const el = document.querySelector(sel);
                        if (el) {
                            el.focus();
                            // Ensure it's editable
                            el.setAttribute('contenteditable', 'true');
                        }
                    }, selector);
                    
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // Clear any existing text
                    await this.page.evaluate(sel => {
                        const el = document.querySelector(sel);
                        if (el) {
                            el.textContent = '';
                        }
                    }, selector);
                    
                    // Human-like typing with Instagram-AI-Agent timing
                    await this.humanType(selector, message);
                    textTyped = true;
                    console.log(`✅ Text typed using: ${selector}`);
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    break;
                } catch (error) {
                    console.log(`❌ Text input failed: ${selector}`);
                }
            }

            if (!textTyped) {
                throw new Error('Could not type message into Facebook composer');
            }

            // Enhanced post button selectors (Instagram-AI-Agent pattern)
            const postButtonSelectors = [
                'div[data-testid="react-composer-post-button"]',
                'div[aria-label="Post"]',
                'button[type="submit"]',
                'button:contains("Post")',
                'span:contains("Post")'
            ];

            // Click post button with multi-selector approach
            let postClicked = false;
            for (const selector of postButtonSelectors) {
                if (selector.includes(':contains')) {
                    // Handle jQuery-style text matching
                    try {
                        const element = await this.page.evaluateHandle((text) => {
                            const elements = Array.from(document.querySelectorAll('button, div[role="button"], span'));
                            return elements.find(el => el.textContent.includes(text));
                        }, 'Post');
                        
                        if (element) {
                            await element.click();
                            postClicked = true;
                            console.log('✅ Post button clicked using text selector');
                            break;
                        }
                    } catch (error) {
                        // Fall through to DOM selectors
                    }
                } else {
                    try {
                        await this.page.waitForSelector(selector, { visible: true, timeout: 3000 });
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        await this.page.evaluate(sel => {
                            const el = document.querySelector(sel);
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, selector);
                        
                        await this.randomMouseMovement();
                        await this.page.click(selector);
                        postClicked = true;
                        console.log(`✅ Posted using: ${selector}`);
                        break;
                    } catch (error) {
                        console.log(`❌ Post button failed: ${selector}`);
                    }
                }
            }

            if (!postClicked) {
                throw new Error('Could not find valid post button');
            }

            // Wait for post to complete and verify success
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Check post success (Instagram-AI-Agent validation pattern)
            const postSuccess = await this.verifyPostSuccess();
            if (postSuccess) {
                console.log('🎉 Facebook post created successfully!');
                await this.logStep('Facebook Post Creation', true);
                return true;
            } else {
                throw new Error('Post verification failed - please check manually');
            }

        } catch (error) {
            await this.locateAlternativePostFeatures();
            throw error;
        }
    }

    async verifyPostSuccess() {
        const successMarkers = [
            '[data-testid*="post"]',
            '.userContentWrapper',
            '.story_body_container',
            '[data-pagelet*="Feed"] div[role="article"]',
            'm-entertainment-feed-unit'
        ];

        // Also check for absence of composer
        const composerClosed = !await this.page.$('[data-testid="react-composer-root"]');
        
        if (composerClosed) {
            console.log('✅ Composer closed, likely posting was successful');
            return true;
        }

        // Check visible posts
        for (const selector of successMarkers) {
            try {
                const element = await this.page.$(selector);
                if (element) {
                    console.log('✅ Found post element after submission');
                    return true;
                }
            } catch (error) {
                continue;
            }
        }

        return false;
    }

    async locateAlternativePostFeatures() {
        console.log('\n🔍 Looking for alternative post features...');
        
        // Instagram-AI-Agent alternative discovery pattern
        const possibleAlternates = [
            'use profile publish element',
            'try groups for posting',
            'check marketplace publish options',
            'resort to meta integrations API'
        ];
        
        console.log('ℹ️  Alternative posting strategies:');
        possibleAlternates.forEach(strat => console.log(`   - ${strat}`));
        
        // Take diagnostic screenshot
        await this.page.screenshot({ path: path.join(SCREENSHOT_DIR, 'alternative_features.png') });
        console.log('📸 Screenshot taken for manual analysis');
    }

    async cleanup() {
        try {
            if (this.browser) {
                await this.browser.close();
                console.log('🧹 Browser closed');
            }
        } catch (error) {
            console.log('⚠️  Error during cleanup:', error.message);
        }
    }

    async generateTestReport() {
        const successRate = (this.logSteps.filter(s => s.success).length / this.logSteps.length) * 100;
        
        console.log('\n📊 Summary Report');
        console.log('='.repeat(40));
        console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);
        console.log(`🔬 Steps Executed: ${this.logSteps.length}`);
        
        const issues = this.logSteps.filter(s => !s.success);
        if (issues.length > 0) {
            console.log('\n⚠️  Issues Found:');
            issues.forEach(issue => {
                console.log(`   ❌ ${issue.name}: ${issue.error}`);
            });
        } else {
            console.log('🎉 All operations successful!');
        }
    }
}

// Main execution with enhanced validation
(async () => {
    // Validate environment variables
    if (!FB_USERNAME || !FB_PASSWORD) {
        console.error('❌ Missing Facebook credentials!');
        console.log('   Export environment variables:');
        console.log('   export FBusername="your_username"');
        console.log('   export FBpassword="your_password"');
        console.log('   OR directly: FB_USERNAME=... FB_PASSWORD=... node script.js');
        process.exit(1);
    }

    console.log('🚀 Starting Enhanced Facebook Automation Follow-up Utility');
    console.log('📦 Instagram-AI-Agent patterns integrated for reliability');
    console.log('🔒 Credentials validation: ✅');
    
    const automation = new FacebookAutomationFixed();
    const messageToPost = process.argv[2] || 'Test post from enhanced automation script!';

    try {
        console.time('🌐 Total Execution Time');
        await automation.initialize();
        
        const hasCookies = await automation.checkCookiesValid();
        if (hasCookies) {
            // Load existing cookies
            const cookies = await automation.loadCookies();
            await automation.page.setCookie(...cookies);
            console.log('🍪 Using existing session cookies');
        }
        
        const loggedIn = await automation.login();
        if (!loggedIn && hasCookies) {
            console.log('🔄 Cookies expired, cleaning up and retrying fresh login...');
            await fs.remove('./cookies/facebook_cookies.json');
            const loggedInFresh = await automation.login();
            if (!loggedInFresh) {
                throw new Error('Fresh login failed after cookie cleanup');
            }
        } else if (!loggedIn) {
            throw new Error('Login attempt failed');
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const posted = await automation.postToFacebook(messageToPost);
        if (!posted) {
            console.log('⚠️  Post creation might have had issues - please check screenshots');
        }

        await automation.generateTestReport();
        console.timeEnd('🌐 Total Execution Time');

        if (loggedIn) {
            console.log('✅ Task completed successfully!');
            process.exit(0);
        } else {
            console.log('❌ Task completed with failures');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        await automation.generateTestReport();
        process.exit(1);
    } finally {
        await automation.cleanup();
    }
})();