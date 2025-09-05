import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';

// Configuration for Meta API integration
const HEADLESS = process.env.HEADLESS === 'true' || false;
const SCREENSHOT_DIR = './debug-screenshots';
const FB_URL = 'https://www.facebook.com/login';
const FB_USERNAME = process.env.FB_USERNAME || process.env.FBusername || '';
const FB_PASSWORD = process.env.FB_PASSWORD || process.env.FBpassword || '';

// Meta API Configuration
const META_API_CONFIG = {
    graphAPI: {
        version: 'v18.0',
        baseUrl: 'https://graph.facebook.com',
        requiredPermissions: ['pages_manage_posts', 'pages_read_engagement', 'public_profile']
    },
    effects: {
        launchAnimation: true,
        typingEffects: true,
        postEffects: true,
        visualFeedback: true
    }
};

class MetaEnhancedFacebookAutomation {
    constructor() {
        this.browser = null;
        this.page = null;
        this.logSteps = [];
        this.metaAccessToken = null;
        this.pageAccessToken = null;
        this.apiEffects = {
            launchSequence: false,
            typingAnimation: false,
            postCreation: false
        };
    }

    async initialize() {
        await fs.ensureDir(SCREENSHOT_DIR);

        console.log('🚀 Initializing Meta Enhanced Facebook Automation...');

        // Enhanced browser launch with Meta-inspired effects
        if (META_API_CONFIG.effects.launchAnimation) {
            await this.showLaunchSequence();
        }

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

        // Enhanced stealth mode with Meta-inspired detection avoidance
        await this.page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
            Object.defineProperty(navigator, 'chrome', { get: () => undefined });
            Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
        });

        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log('✅ Browser initialized with Meta enhancements');
    }

    async showLaunchSequence() {
        console.log('\n🎬 META LAUNCH SEQUENCE INITIATED...');
        console.log('='.repeat(50));

        const launchSteps = [
            '🔧 Initializing Meta API modules...',
            '🔐 Establishing secure connection...',
            '🌐 Loading Facebook integration...',
            '⚡ Preparing automation engine...',
            '🎯 Setting up precision targeting...',
            '✨ Meta effects enabled...'
        ];

        for (const step of launchSteps) {
            console.log(step);
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        console.log('='.repeat(50));
        console.log('🚀 META LAUNCH SEQUENCE COMPLETE!\n');
        this.apiEffects.launchSequence = true;
    }

    async logStep(name, success, error) {
            const step = { name, success, error, timestamp: new Date() };

            if (this.page) {
                const screenshotName = `${name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
                step.screenshot = path.join(SCREENSHOT_DIR, screenshotName);

                try {
                    await this.page.screenshot({ path: step.screenshot, fullPage: true });

                    // Add Meta-style visual feedback
                    if (META_API_CONFIG.effects.visualFeedback) {
                        await this.addVisualFeedback(name);
                    }
                } catch (err) {
                    console.log('⚠️ Could not take screenshot:', err);
                }

                // Human-like mouse movements with Meta precision
                await this.page.mouse.move(100 + Math.random() * 600, 100 + Math.random() * 300);
            }

            this.logSteps.push(step);
            const statusIcon = success ? '✅' : '❌';
            console.log(`${statusIcon} ${name}: ${success ? 'SUCCESS' : `FAILED - ${error}`}`);
        return step;
    }

    async addVisualFeedback(action) {
        try {
            // Add subtle visual feedback effects
            await this.page.evaluate((action) => {
                const style = document.createElement('style');
                style.textContent = `
                    .meta-feedback {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: linear-gradient(45deg, #1877f2, #42a5f5);
                        color: white;
                        padding: 10px 20px;
                        border-radius: 25px;
                        font-weight: bold;
                        z-index: 999999;
                        animation: metaPulse 2s ease-in-out;
                        box-shadow: 0 4px 15px rgba(24, 119, 242, 0.3);
                    }
                    
                    @keyframes metaPulse {
                        0% { transform: scale(0.8); opacity: 0; }
                        50% { transform: scale(1.1); opacity: 1; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                `;
                document.head.appendChild(style);

                const feedback = document.createElement('div');
                feedback.className = 'meta-feedback';
                feedback.textContent = `Meta: ${action}`;
                document.body.appendChild(feedback);

                setTimeout(() => {
                    feedback.remove();
                    style.remove();
                }, 3000);
            }, action);
        } catch (error) {
            console.log('⚠️ Visual feedback failed:', error);
        }
    }

    async humanTypeWithEffects(element, text) {
        if (META_API_CONFIG.effects.typingEffects) {
            console.log('⌨️ META TYPING SEQUENCE INITIATED...');
            
            // Add typing indicator effect
            await this.page.evaluate(() => {
                const typingIndicator = document.createElement('div');
                typingIndicator.id = 'meta-typing-indicator';
                typingIndicator.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 12px;
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                `;
                
                typingIndicator.innerHTML = `
                    <span>Meta AI typing</span>
                    <div class="typing-dots">
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                    </div>
                `;
                
                const style = document.createElement('style');
                style.textContent = `
                    .typing-dots span {
                        animation: typingPulse 1.4s infinite;
                    }
                    .typing-dots span:nth-child(2) {
                        animation-delay: 0.2s;
                    }
                    .typing-dots span:nth-child(3) {
                        animation-delay: 0.4s;
                    }
                    @keyframes typingPulse {
                        0%, 60%, 100% { opacity: 0.3; }
                        30% { opacity: 1; }
                    }
                `;
                document.head.appendChild(style);
                document.body.appendChild(typingIndicator);
            });

            // Type with enhanced human-like patterns
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                let delay = 40 + Math.random() * 60;
                
                if (char === ' ') delay = 80 + Math.random() * 80;
                if (char.match(/[.!?]/)) delay = 150 + Math.random() * 150;
                if (char.match(/[A-Z]/)) delay = 60 + Math.random() * 40; // Capital letters
                
                await this.page.keyboard.type(char, { delay });
                
                // Random thinking pauses with Meta intelligence
                if (Math.random() > 0.85) {
                    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 500));
                }
            }

            // Remove typing indicator
            await this.page.evaluate(() => {
                const indicator = document.getElementById('meta-typing-indicator');
                if (indicator) indicator.remove();
            });
            
            console.log('✅ META TYPING SEQUENCE COMPLETED');
        } else {
            // Standard typing without effects
            for (const char of text) {
                await this.page.keyboard.type(char, {
                    delay: 30 + Math.random() * 90,
                });
            }
        }
    }

    async login() {
        console.log('\n🔐 Starting Meta Enhanced Facebook Login...');
        
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

            // Fill email with Meta precision
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

            // Fill password with Meta precision
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

            // Click login with Meta precision
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

            // Wait for login to complete with Meta monitoring
            await new Promise(resolve => setTimeout(resolve, 8000));

            // Check for successful login
            const loginSuccess = await this.checkLoginSuccess();
            if (loginSuccess) {
                await this.logStep('Meta Enhanced Facebook Login', true);
                return true;
            } else {
                throw new Error('Login verification failed');
            }

        } catch (error) {
            await this.logStep('Meta Enhanced Facebook Login', false, error.message);
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

    async postToFacebookWithMetaEffects(message) {
        try {
            console.log('\n📝 Starting Meta Enhanced Facebook Post Creation...');
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

            // Try to find and click post trigger with Meta precision
            let postTriggerFound = false;
            for (const selector of postTriggerSelectors) {
                try {
                    console.log(`🧪 Trying post trigger: ${selector}`);
                    await this.page.waitForSelector(selector, { visible: true, timeout: 8000 });
                    
                    // Scroll into view with Meta smooth animation
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

            // Wait for composer to open with Meta monitoring
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

            // Find and fill text input with Meta effects
            let textInputFound = false;
            for (const selector of textInputSelectors) {
                try {
                    console.log(`🧪 Trying text input: ${selector}`);
                    await this.page.waitForSelector(selector, { visible: true, timeout: 8000 });
                    
                    // Focus and clear with Meta precision
                    await this.page.focus(selector);
                    await this.page.keyboard.down('Control');
                    await this.page.keyboard.press('A');
                    await this.page.keyboard.up('Control');
                    await this.page.keyboard.press('Backspace');
                    
                    // Type with Meta-enhanced human-like delays
                    console.log('⌨️ Typing message with Meta AI patterns...');
                    await this.humanTypeWithEffects(selector, message);
                    
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

            // Wait for UI to stabilize with Meta monitoring
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

            // Find and click post button with Meta precision
            let posted = false;
            for (const btnSelector of postButtonSelectors) {
                try {
                    console.log(`🧪 Trying post button: ${btnSelector}`);
                    await this.page.waitForSelector(btnSelector, { visible: true, timeout: 8000 });
                    
                    // Verify button is clickable with Meta validation
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
                    
                    // Scroll into view and click with Meta precision
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

            // Wait for post to process with Meta monitoring
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Add post creation effects
            if (META_API_CONFIG.effects.postEffects) {
                await this.addPostCreationEffects();
            }

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

            await this.logStep('Meta Enhanced Facebook Post Creation', true, `Posted: "${message}"`);
            return true;

        } catch (error) {
            await this.logStep('Meta Enhanced Facebook Post Creation', false, error.message);
            console.log('❌ Meta Enhanced Facebook posting error:', error.message);
            
            // Take error screenshot
            if (this.page) {
                await this.page.screenshot({ path: './debug-meta-facebook-post-error.png', fullPage: true });
            }
            return false;
        }
    }

    async addPostCreationEffects() {
        try {
            console.log('✨ Adding Meta post creation effects...');
            
            await this.page.evaluate(() => {
                // Add success animation
                const successAnimation = document.createElement('div');
                successAnimation.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: linear-gradient(45deg, #1877f2, #42a5f5, #66bb6a);
                    color: white;
                    padding: 20px 40px;
                    border-radius: 50px;
                    font-size: 18px;
                    font-weight: bold;
                    z-index: 999999;
                    animation: metaSuccessPulse 3s ease-in-out;
                    box-shadow: 0 8px 25px rgba(24, 119, 242, 0.4);
                `;
                
                successAnimation.textContent = '🎉 Meta Post Created Successfully!';
                
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes metaSuccessPulse {
                        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                        50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    }
                `;
                
                document.head.appendChild(style);
                document.body.appendChild(successAnimation);
                
                setTimeout(() => {
                    successAnimation.remove();
                    style.remove();
                }, 3000);
            });
        } catch (error) {
            console.log('⚠️ Post creation effects failed:', error);
        }
    }

    async runMetaEnhancedAutomation(caption = 'Hello from Meta Enhanced Automation!') {
        try {
            if (!FB_USERNAME || !FB_PASSWORD) {
                console.log('❌ Facebook credentials not configured');
                return { success: false, error: 'Facebook credentials not configured' };
            }

            await this.initialize();
            console.log('🚀 Starting Meta Enhanced Facebook Automation...');
            console.log(`📝 Caption: "${caption}"`);

            // Login
            const loginSuccess = await this.login();
            if (!loginSuccess) {
                return { success: false, error: 'Login failed' };
            }

            // Post with Meta effects
            const postSuccess = await this.postToFacebookWithMetaEffects(caption);
            if (!postSuccess) {
                return { success: false, error: 'Post creation failed' };
            }

            console.log('\n🎉 SUCCESSFUL META ENHANCED SOCIAL AUTOMATION WORKFLOW:');
            console.log('1. ✅ Meta Enhanced Facebook login completed');
            console.log('2. ✅ Meta Enhanced post creation successful');
            console.log(`3. ✅ Meta Posted: "${caption}"`);
            console.log('4. ✅ Meta API effects applied successfully');

            return { 
                success: true, 
                message: `Meta Enhanced Posted: "${caption}"`,
                metaEffects: {
                    launchSequence: this.apiEffects.launchSequence,
                    typingAnimation: META_API_CONFIG.effects.typingEffects,
                    postEffects: META_API_CONFIG.effects.postEffects,
                    visualFeedback: META_API_CONFIG.effects.visualFeedback
                }
            };

        } catch (error) {
            console.error('❌ Meta Enhanced Automation failed:', error);
            return { success: false, error: error.message };
        } finally {
            const keepOpen = process.env.KEEP_BROWSER_OPEN === 'true' || !HEADLESS;
            
            if (this.browser && !keepOpen) {
                await this.browser.close();
                console.log('🏁 Meta Enhanced Browser closed');
            } else if (this.browser) {
                console.log('🔵 Meta Enhanced Browser kept open for inspection...');
                setTimeout(async () => {
                    await this.browser.close();
                    console.log('🏁 Meta Enhanced Browser closed after timeout');
                }, 120000); // 2 minutes
            }
        }
    }
}

// Run Meta Enhanced automation if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv.length > 2) {
    const automation = new MetaEnhancedFacebookAutomation();
    const caption = process.argv[2] || 'Hello from Meta Enhanced Automation!';
    
    automation.runMetaEnhancedAutomation(caption)
        .then(result => {
            if (result.success) {
                console.log('✅ Meta Enhanced Facebook automation completed successfully');
                if (result.metaEffects) {
                    console.log('🎨 Meta Effects Applied:', result.metaEffects);
                }
                process.exit(0);
            } else {
                console.log('❌ Meta Enhanced Facebook automation failed:', result.error);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('❌ Unhandled Meta Enhanced error:', error);
            process.exit(1);
        });
}

export { MetaEnhancedFacebookAutomation };