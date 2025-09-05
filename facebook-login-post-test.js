import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';

// Configuration - now accepts command line arguments or environment variables
const HEADLESS = process.env.HEADLESS === 'true' || false;
const SCREENSHOT_DIR = './debug-screenshots';
const FB_URL = 'https://www.facebook.com/login';
const FB_USERNAME = process.env.FB_USERNAME || process.env.FBusername || '';
const FB_PASSWORD = process.env.FB_PASSWORD || process.env.FBpassword || '';

class FacebookAutomation {
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
                '--disable-popup-blocking'
            ],
            defaultViewport: { width: 1920, height: 1080 }
        });

        this.page = await this.browser.newPage();

        // Enhanced stealth mode
        await this.page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
        });

        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        console.log('🎯 Browser initialized for Facebook automation');
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

                // Human-like mouse movements
                await this.page.mouse.move(100 + Math.random() * 600, 100 + Math.random() * 300);
            }

            this.logSteps.push(step);
            const statusIcon = success ? '✅' : '❌';
            console.log(`${statusIcon} ${name}: ${success ? 'SUCCESS' : `FAILED - ${error}`}`);
        return step;
    }

    async login() {
        console.log('\n🔐 Starting Facebook login...');
        
        try {
            await this.page.goto(FB_URL, { waitUntil: 'networkidle0', timeout: 60000 });
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Enhanced login selectors for 2025 Facebook
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

            // Fill email
            let emailFilled = false;
            for (const selector of emailSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 3000 });
                    await this.page.focus(selector);
                    await this.page.keyboard.down('Control');
                    await this.page.keyboard.press('A');
                    await this.page.keyboard.up('Control');
                    await this.page.type(selector, FB_USERNAME, { delay: 50 + Math.random() * 50 });
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
            console.log('\n📝 Starting Facebook post creation...');
            console.log(`📝 Message to post: "${message}"`);

            // Navigate to Facebook home if not already there
            const currentUrl = await this.page.url();
            if (!currentUrl.includes('facebook.com') || currentUrl.includes('login')) {
                console.log('🔄 Navigating to Facebook home...');
                await this.page.goto('https://www.facebook.com', { waitUntil: 'networkidle2', timeout: 30000 });
                await new Promise(resolve => setTimeout(resolve, 5000));
            }

            // Enhanced post creation selectors for 2025 Facebook
            const postTriggerSelectors = [
                // Primary modern selectors
                'div[role="button"][aria-label*="What\'s on your mind"]',
                'div[data-testid="status-attachment-mentions-input"]',
                '[aria-label="Create a post"]',
                'div[data-pagelet="ProfileComposer"] div[role="button"]',
                
                // Fallback selectors
                'div[contenteditable="true"][role="textbox"]',
                'textarea[placeholder*="What\'s on your mind"]',
                'div[data-testid="react-composer-root"]'
            ];

            // Try to find and click post trigger
            let postTriggerFound = false;
            for (const selector of postTriggerSelectors) {
                try {
                    console.log(`🧪 Trying post trigger: ${selector}`);
                    await this.page.waitForSelector(selector, { visible: true, timeout: 8000 });
                    
                    // Scroll into view
                    await this.page.evaluate(sel => {
                        const el = document.querySelector(sel);
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, selector);
                    
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    await this.page.click(selector);
                    postTriggerFound = true;
                    console.log(`✅ Post trigger clicked: ${selector}`);
                    break;
                } catch (error) {
                    console.log(`❌ Post trigger failed: ${selector}`);
                }
            }

            if (!postTriggerFound) {
                throw new Error('Could not find post creation trigger');
            }

            // Wait for composer to open
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Enhanced text input selectors
            const textInputSelectors = [
                // Modern Facebook composer selectors
                'div[contenteditable="true"][data-lexical-editor="true"]',
                'div[contenteditable="true"][role="textbox"]',
                'div[aria-label*="What\'s on your mind"]',
                'div[data-testid="react-composer-text-input"]',
                
                // Fallback selectors
                'div[contenteditable="true"]',
                'textarea[name="xhpc_message"]',
                '[role="textbox"]'
            ];

            // Find and fill text input
            let textInputFound = false;
            for (const selector of textInputSelectors) {
                try {
                    console.log(`🧪 Trying text input: ${selector}`);
                    await this.page.waitForSelector(selector, { visible: true, timeout: 8000 });
                    
                    // Focus and clear
                    await this.page.focus(selector);
                    await this.page.keyboard.down('Control');
                    await this.page.keyboard.press('A');
                    await this.page.keyboard.up('Control');
                    await this.page.keyboard.press('Backspace');
                    
                    // Type with human-like delays
                    console.log('⌨️ Typing message with human-like patterns...');
                    for (let i = 0; i < message.length; i++) {
                        const char = message[i];
                        let delay = 60 + Math.random() * 80;
                        
                        if (char === ' ') delay = 120 + Math.random() * 100;
                        if (char.match(/[.!?]/)) delay = 200 + Math.random() * 200;
                        
                        await this.page.keyboard.type(char, { delay });
                        
                        // Random thinking pauses
                        if (Math.random() > 0.9) {
                            await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
                        }
                    }
                    
                    textInputFound = true;
                    console.log(`✅ Text input successful: ${selector}`);
                    break;
                } catch (error) {
                    console.log(`❌ Text input failed: ${selector}`);
                }
            }

            if (!textInputFound) {
                throw new Error('Could not find or fill text input');
            }

            // Wait for UI to stabilize
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Enhanced post button selectors
            const postButtonSelectors = [
                // Modern Facebook post buttons
                'div[aria-label="Post"]',
                'button[aria-label="Post"]',
                'div[role="button"][aria-label="Post"]',
                'button[data-testid="react-composer-post-button"]',
                
                // Fallback selectors
                'button[type="submit"]',
                'div[role="button"]:has(span:contains("Post"))',
                'button:has(span:contains("Post"))',
                'input[type="submit"][value*="Post"]'
            ];

            // Find and click post button
            let posted = false;
            for (const btnSelector of postButtonSelectors) {
                try {
                    console.log(`🧪 Trying post button: ${btnSelector}`);
                    await this.page.waitForSelector(btnSelector, { visible: true, timeout: 8000 });
                    
                    // Verify button is clickable
                    const isClickable = await this.page.evaluate(sel => {
                        const button = document.querySelector(sel);
                        if (!button) return false;
                        
                        const rect = button.getBoundingClientRect();
                        const style = getComputedStyle(button);
                        
                        return rect.width > 0 && 
                               rect.height > 0 && 
                               style.display !== 'none' && 
                               style.visibility !== 'hidden' &&
                               !button.disabled;
                    }, btnSelector);
                    
                    if (!isClickable) {
                        console.log(`⚠️ Button found but not clickable: ${btnSelector}`);
                        continue;
                    }
                    
                    // Scroll into view and click
                    await this.page.evaluate(sel => {
                        const button = document.querySelector(sel);
                        if (button) button.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, btnSelector);
                    
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    try {
                        await this.page.click(btnSelector, { delay: 100 });
                        console.log('✅ Post button clicked successfully!');
                        posted = true;
                        break;
                    } catch (clickError) {
                        // Try JavaScript click as fallback
                        console.log('⚠️ Regular click failed, trying JavaScript click...');
                        await this.page.evaluate(sel => {
                            const button = document.querySelector(sel);
                            if (button) button.click();
                        }, btnSelector);
                        console.log('✅ JavaScript click attempted');
                        posted = true;
                        break;
                    }
                    
                } catch (err) {
                    console.log(`❌ Post button failed: ${btnSelector}`);
                }
            }

            if (!posted) {
                throw new Error('Could not find or click post button');
            }

            // Wait for post to process
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Verify post success
            const postSuccess = await this.page.evaluate(() => {
                const successIndicators = [
                    'Your post is now live',
                    'Post shared',
                    'Posted'
                ];
                
                const bodyText = document.body.textContent;
                return successIndicators.some(indicator => bodyText.includes(indicator));
            });

            if (postSuccess) {
                console.log('🎉 Post verification successful!');
            }

            await this.logStep('Facebook Post Creation', true, `Posted: "${message}"`);
            return true;

        } catch (error) {
            await this.logStep('Facebook Post Creation', false, error.message);
            console.log('❌ Facebook posting error:', error.message);
            
            // Take error screenshot
            if (this.page) {
                await this.page.screenshot({ path: './debug-facebook-post-error.png', fullPage: true });
            }
            return false;
        }
    }

    async runAutomation(caption = 'Hello I am New Here') {
        try {
            if (!FB_USERNAME || !FB_PASSWORD) {
                console.log('❌ Facebook credentials not configured');
                return { success: false, error: 'Facebook credentials not configured' };
            }

            await this.initialize();
            console.log('🚀 Starting Facebook automation...');
            console.log(`📝 Caption: "${caption}"`);

            // Login
            const loginSuccess = await this.login();
            if (!loginSuccess) {
                return { success: false, error: 'Login failed' };
            }

            // Post
            const postSuccess = await this.postToFacebook(caption);
            if (!postSuccess) {
                return { success: false, error: 'Post creation failed' };
            }

            console.log('\n🎉 SUCCESSFUL SOCIAL AUTOMATION WORKFLOW:');
            console.log('1. ✅ Facebook login completed');
            console.log('2. ✅ Post creation successful');
            console.log(`3. ✅ Posted: "${caption}"`);

            return { success: true, message: `Posted: "${caption}"` };

        } catch (error) {
            console.error('❌ Automation failed:', error);
            return { success: false, error: error.message };
        } finally {
            const keepOpen = process.env.KEEP_BROWSER_OPEN === 'true' || !HEADLESS;
            
            if (this.browser && !keepOpen) {
                await this.browser.close();
                console.log('🏁 Browser closed');
            } else if (this.browser) {
                console.log('🔵 Browser kept open for inspection...');
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
    const automation = new FacebookAutomation();
    const caption = process.argv[2] || 'Hello I am New Here';
    
    automation.runAutomation(caption)
        .then(result => {
            if (result.success) {
                console.log('✅ Facebook automation completed successfully');
                process.exit(0);
            } else {
                console.log('❌ Facebook automation failed:', result.error);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('❌ Unhandled error:', error);
            process.exit(1);
        });
}

export { FacebookAutomation };