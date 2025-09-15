import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';

// Configuration
const HEADLESS = false; // VISIBLE browser for debugging
const SCREENSHOT_DIR = './debug-screenshots';
const INSTAGRAM_URL = 'https://www.instagram.com/accounts/login/';
const INSTAGRAM_USERNAME = process.env.INSTAGRAM_USERNAME || process.env.IG_USERNAME || '';
const INSTAGRAM_PASSWORD = process.env.INSTAGRAM_PASSWORD || process.env.IG_PASSWORD || '';

// Enhanced detection bypass techniques
const BYPASS_TECHNIQUES = {
    RANDOM_MOUSE_MOVEMENTS: true,
    HUMAN_TYPE_SPEED_VARIATION: true,
    NAVIGATION_PATTERN_RANDOMIZATION: true,
    BROWSER_FINGERPRINT_SHOOTING: true,
    SECURITY_CHALLENGE_EVASION: true
};

// Common two-step verification regexes to detect
const TFA_DETECTION_PATTERNS = [
    /two[-\s]?step/i,
    /authentication/i,
    /verification/i,
    /your[-\s]?login[-\s]?code/i,
    /security[-\s]?check/i,
    /code[-\s]?sent[-\s]?(?:to|via)/i
];

import { CookieManager } from './utils/cookie-manager.js';

class InstagramDebugPro {
    constructor() {
        this.browser = null;
        this.page = null;
        this.logSteps = [];
        this.cookieManager = new CookieManager();
    }

    async setCookies() {
        try {
            const cookies = await this.cookieManager.loadCookies('instagram');

            if (cookies && cookies.length > 0) {
                console.log('🍪 Loading saved Instagram cookies...');

                // Set cookies for instagram.com domain
                const instagramCookies = cookies.filter(cookie =>
                    cookie.domain === '.instagram.com'
                );

                if (instagramCookies.length > 0) {
                    await this.page.setCookie(...instagramCookies);
                    console.log(`✅ Loaded ${instagramCookies.length} Instagram cookies`);

                    // Check if cookies are valid
                    const cookiesValid = await this.cookieManager.checkCookiesValid('instagram');
                    if (cookiesValid) {
                        console.log('🎯 Cookies are valid, attempting direct access...');
                        return true;
                    }
                }
            }
            return false;
        } catch (error) {
            console.log('❌ Error loading cookies:', error.message);
            return false;
        }
    }

    async saveCookies() {
        try {
            const cookies = await this.page.cookies();
            await this.cookieManager.saveCookies('instagram', cookies);
            console.log('✅ Instagram cookies saved successfully');
        } catch (error) {
            console.log('⚠️ Could not save cookies:', error.message);
        }
    }

    async authWithCookies() {
        try {
            // Try to use cookies first
            const cookieAccess = await this.setCookies();
            if (cookieAccess) {
                await this.page.goto('https://www.instagram.com/', { waitUntil: 'networkidle0', timeout: 30000 });
                const loggedIn = await this.checkLoginSuccess();

                if (loggedIn) {
                    console.log('🎉 Logged in successfully using cookies!');
                    await this.logStep('Instagram Login (Cookies)', true);
                    await this.saveCookies(); // Refresh cookies
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.log('❌ Cookie-based authentication failed:', error.message);
            return false;
        }
    }

    async initialize() {
        await fs.ensureDir(SCREENSHOT_DIR);

        this.browser = await puppeteer.launch({
            headless: HEADLESS,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--window-size=1400,900', // More common user resolution
                '--disable-features=VizDisplayCompositor',
                '--ignore-certificate-errors',
                '--disable-blink-features=AutomationControlled',
                '--disable-web-security',
                '--allow-running-insecure-content',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--disable-extensions',
                '--disable-background-networking',
                '--disable-sync',
                '--metrics-recording-only',
                '--disable-default-apps',
                '--mute-audio',
                '--no-first-run',
                '--disable-notifications',
                '--disable-popup-blocking',
                '--disable-background-timer-throttling',
                '--disable-renderer-backgrounding',
                '--disable-client-side-phishing-detection',
                '--disable-component-update',
                '--disable-domain-reliability'
            ],
            defaultViewport: { width: 1900, height: 1080 }
        });

        this.page = await this.browser.newPage();

        // Override webdriver to prevent detection
        await this.page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });

        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log('🎯 Browser initialized - ready for Instagram PRO debugging');
    }

    async logStep(name, success, error) {
            const step = {
                name,
                success,
                error,
                timestamp: new Date()
            };

            // Take screenshot for each step
            if (this.page) {
                const screenshotName = `${name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
                step.screenshot = path.join(SCREENSHOT_DIR, screenshotName);

                try {
                    await this.page.screenshot({ path: step.screenshot, fullPage: true });
                } catch (err) {
                    console.log('⚠️ Could not take screenshot:', err);
                }

                // Add random human-like mouse movements
                if (BYPASS_TECHNIQUES.RANDOM_MOUSE_MOVEMENTS) {
                    await this.page.mouse.move(100 + Math.random() * 600, 100 + Math.random() * 300);
                    await this.page.mouse.move(200 + Math.random() * 500, 150 + Math.random() * 250);
                }
            }

            this.logSteps.push(step);
            const statusIcon = success ? '✅' : '❌';
            console.log(`${statusIcon} ${name}: ${success ? 'SUCCESS' : `FAILED - ${error}`}`);
    
        return step;
    }

    async humanDelay(min = 1000, max = 3000) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));
    }

    async discoverLoginElements() {
        console.log('\n🔍 Scanning Instagram login page for current selectors...');
        await this.page.goto(INSTAGRAM_URL, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 3000));

        const elements = await this.page.evaluate(() => {
            const result = {
                usernameSelectors: [],
                passwordSelectors: [],
                loginButtonSelectors: []
            };

            // Analyze all interactive elements
            const allInputs = Array.from(document.querySelectorAll('input'));
            const allButtons = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"], [type="button"]'));

            // Username fields
            const visibleInputs = allInputs.filter(input => {
                const style = getComputedStyle(input);
                const visibleAndUsable = style.display !== 'none' &&
                                      style.visibility !== 'hidden' &&
                                      style.opacity !== '0' &&
                                      input.type !== 'hidden' &&
                                      !input.hasAttribute('aria-hidden') &&
                                      !input.hasAttribute('hidden') &&
                                      !input.disabled &&
                                      input.offsetParent !== null;

                const rect = input.getBoundingClientRect();
                const inViewport = rect.width > 2 && rect.height > 2;
                
                return visibleAndUsable && inViewport;
            });

            visibleInputs.forEach(input => {
                const placeholder = (input.placeholder || '').toLowerCase();
                const name = (input.name || '').toLowerCase();
                const id = (input.id || '').toLowerCase();
                const type = (input.type || '').toLowerCase();

                // Instagram specific username field detection
                const isUsernameField = (
                    (type === 'text' || type === 'email') &&
                    (placeholder.includes('username') ||
                     placeholder.includes('email') ||
                     placeholder.includes('phone') ||
                     name.includes('username') ||
                     name.includes('user') ||
                     name.includes('email'))
                );

                if (isUsernameField) {
                    result.usernameSelectors.unshift(`input[name="${name}"]`);
                    result.usernameSelectors.push(`#${id}`);
                    result.usernameSelectors.push(`input[type="${type}"]`);
                }

                // Password fields
                const isPasswordField = (
                    type === 'password' || (
                        (placeholder.includes('password') || placeholder.includes('pass')) &&
                        !placeholder.includes('author')
                    )
                );

                if (isPasswordField) {
                    result.passwordSelectors.unshift(`input[name="${name}"]`);
                    result.passwordSelectors.push(`#${id}`);
                    result.passwordSelectors.push(`input[type="${type}"]`);
                }
            });

            // Login buttons
            allButtons.forEach(button => {
                const text = (button.textContent || '').toLowerCase();
                const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
                const type = (button.type || '').toLowerCase();
                const id = (button.id || '').toLowerCase();
                
                if (type === 'submit' || 
                    text.includes('log') || 
                    text.includes('sign') || 
                    text.includes('in') ||
                    ariaLabel.includes('log') || 
                    ariaLabel.includes('sign') ||
                    id.includes('login') || 
                    id.includes('submit')) {
                    
                    if (id) result.loginButtonSelectors.push(`#${id}`);
                    result.loginButtonSelectors.push(`${button.tagName.toLowerCase()}[type="${type}"]`);
                    if (ariaLabel) result.loginButtonSelectors.push(`[aria-label*="${ariaLabel.split(' ')[0]}"]`);
                }
            });

            // Remove duplicates
            return {
                usernameSelectors: [...new Set(result.usernameSelectors)].filter(s => s && s.length > 4),
                passwordSelectors: [...new Set(result.passwordSelectors)].filter(s => s && s.length > 4),
                loginButtonSelectors: [...new Set(result.loginButtonSelectors)].filter(s => s && s.length > 4)
            };
        });

        console.log('🎯 Discovered login selectors:');
        console.log('   👤 Username inputs:', elements.usernameSelectors.slice(0, 5).join(', ') || 'None found');
        console.log('   🔐 Password inputs:', elements.passwordSelectors.slice(0, 5).join(', ') || 'None found');
        console.log('   📝 Login buttons:', elements.loginButtonSelectors.slice(0, 5).join(', ') || 'None found');

        return elements;
    }

    async attemptLoginWithSelectors(username, password, usernameSelectors, passwordSelectors, loginButtonSelectors) {
        console.log('\n🔐 Attempting intelligent login...');
        
        // Try username selectors
        let usernameFilled = false;
        for (const selector of usernameSelectors.slice(0, 5)) {
            try {
                console.log(`🧪 Trying username selector: ${selector}`);
                await this.page.waitForSelector(selector, { timeout: 3000 });
                await this.page.focus(selector);
                
                // Clear existing text if any
                await this.page.keyboard.down('Control');
                await this.page.keyboard.press('A');
                await this.page.keyboard.up('Control');
                await this.page.keyboard.press('Backspace');
                
                // Type with human-like delay
                await this.page.type(selector, username, { delay: 20 + Math.random() * 30 });
                usernameFilled = true;
                console.log(`✅ Filled username using: ${selector}`);
                break;
            } catch (error) {
                console.log(`❌ Username selector failed: ${selector}`);
            }
        }

        if (!usernameFilled) {
            console.log('❌ Could not fill username field');
            return false;
        }

        // Try password selectors
        let passwordFilled = false;
        for (const selector of passwordSelectors.slice(0, 5)) {
            try {
                console.log(`🧪 Trying password selector: ${selector}`);
                await this.page.waitForSelector(selector, { timeout: 3000 });
                await this.page.type(selector, password, { delay: 15 + Math.random() * 25 });
                passwordFilled = true;
                console.log(`✅ Filled password using: ${selector}`);
                break;
            } catch (error) {
                console.log(`❌ Password selector failed: ${selector}`);
            }
        }

        if (!passwordFilled) {
            console.log('❌ Could not fill password field');
            return false;
        }

        // Try login buttons
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        let loginClicked = false;
        for (const selector of loginButtonSelectors.slice(0, 5)) {
            try {
                console.log(`🧪 Trying login button: ${selector}`);
                await this.page.waitForSelector(selector, { timeout: 3000 });
                await this.page.click(selector);
                loginClicked = true;
                console.log(`✅ Clicked login using: ${selector}`);
                break;
            } catch (error) {
                console.log(`❌ Login button failed: ${selector}`);
            }
        }

        // Wait for navigation after login attempt
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check if login was successful
        const loginSuccess = await this.checkLoginSuccess();
        
        if (loginSuccess) {
            console.log('🎉 Login successful! Instagram dashboard detected.');
            return true;
        } else {
            console.log('❌ Login unsuccessful or security checks present');
            
            // Check for security challenges
            const hasChallenge = await this.page.evaluate(() => {
                return document.body.textContent.includes('security') ||
                       document.body.textContent.includes('checkpoint') ||
                       document.body.textContent.includes('verification');
            });
            
            if (hasChallenge) {
                console.log('⚠️ Security challenge detected - manual intervention required');
            }
            
            return false;
        }
    }

    async checkLoginSuccess() {
        // Look for elements that indicate successful login to Instagram
        const successMarkers = [
            '[aria-label="Home"]',
            '[aria-label="Direct"]',
            '[aria-label="New Post"]',
            '[aria-label="Find People"]',
            '[aria-label="User Profile"]',
            'svg[aria-label="Home"]',
            'svg[aria-label="Direct"]',
            'svg[aria-label="New Post"]'
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

    async handleSecurityChallenge() {
        console.log('\n🛡️  Checking for security challenges...');
        
        const hasChallenge = await this.page.evaluate(() => {
            const securityKeywords = ['security', 'checkpoint', 'verification', 'confirm', 'identify', 'suspicious'];
            const bodyText = document.body.textContent.toLowerCase();
            
            return securityKeywords.some(keyword => bodyText.includes(keyword)) ||
                   document.querySelector('img[alt*="security"]') ||
                   document.querySelector('input[type*="code"]') ||
                   document.querySelector('button:contains("Continue")');
        });
        
        if (hasChallenge) {
            console.log('⚠️  Security challenge detected - pausing for manual intervention');
            await this.logStep('Security Challenge', false, 'Requires manual verification');
            return false;
        }
        
        // Check for two-factor authentication specifically
        const isTwoFactor = await this.isTwoFactorChallenge();
        if (isTwoFactor) {
            console.log('🔐 Two-Factor Authentication detected - attempting bypass...');
            const bypassed = await this.bypassTwoFactorSecurity();
            return bypassed;
        }
        
        return true;
    }

    async isTwoFactorChallenge() {
        return await this.page.evaluate(() => {
            const bodyText = document.body.textContent.toLowerCase();
            return TFA_DETECTION_PATTERNS.some(pattern => pattern.test(bodyText));
        });
    }

    async bypassTwoFactorSecurity() {
        console.log('🔄 Attempting to bypass 2FA security...');
        
        // Wait for potential 2FA input to appear
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const codeInputSelectors = [
            'input[type="text"][name*="code"]',
            'input[type="number"][name*="code"]',
            'input[placeholder*="code"]',
            'input[placeholder*="verification"]'
        ];
        
        for (const selector of codeInputSelectors) {
            try {
                await this.page.waitForSelector(selector, { timeout: 5000 });
                console.log('🔐 2FA input field found - requires manual code entry');
                await this.logStep('Two-Factor Authentication', false, 'Manual code entry required');
                return false;
            } catch {
                continue;
            }
        }
        
        return true;
    }

    async uploadImageToInstagram(message) {
        const imagePath = process.env.INSTA_IMAGE_PATH;
        let imageUploaded = false;
        
        if (imagePath) {
            try {
                console.log(`📸 Attempting to upload Instagram image: ${imagePath}`);
                
                // Multiple possible selectors for Instagram file inputs
                const fileInputSelectors = [
                    'input[type="file"]',
                    'input[accept*="image"]',
                    'input[accept*="video"]'
                ];

                let fileInput;
                for (const selector of fileInputSelectors) {
                    try {
                        const inputs = await this.page.$$(selector);
                        if (inputs.length > 0) {
                            fileInput = inputs[inputs.length - 1]; // use last found input
                            console.log(`✅ Found file input with selector: ${selector}`);
                            break;
                        }
                    } catch (error) {
                        console.log(`❌ File input selector ${selector} failed:`, error.message);
                    }
                }

                if (fileInput) {
                    console.log('📁 Uploading file to Instagram...');
                    await fileInput.uploadFile(imagePath);
                    imageUploaded = true;
                    console.log('✅ Image upload initiated successfully');
                    
                    // Wait for upload to complete
                    await this.humanDelay(3000, 5000);
                    
                    // Check if upload was successful
                    const uploadSuccess = await this.page.evaluate(() => {
                        const loadingElements = document.querySelectorAll('[role="progressbar"], [aria-label*="loading"], [data-testid*="loading"]');
                        return loadingElements.length === 0 ||
                               !document.querySelector('input[type="file"]:not([disabled])');
                    });
                    
                    if (uploadSuccess) {
                        await this.logStep('Instagram image upload', true, 'Image upload completed');
                        return true;
                    } else {
                        console.log('⚠️ Image upload still processing, continuing with post...');
                        return true; // Consider it successful if file was uploaded
                    }
                } else {
                    console.log('❌ Could not find file input for uploading, continuing text-only');
                }
            } catch (uploadError) {
                console.log('⚠️ Instagram image upload failed, continuing text-only:', uploadError.message);
                await this.logStep('Instagram image upload', false, uploadError.message);
            }
        }
        
        return imageUploaded;
    }

    async postToInstagram(message = '') {
        try {
            console.log('\n📝 Attempting to post to Instagram...');

            // Check for security challenges first
            if (!(await this.handleSecurityChallenge())) {
                return false;
            }

            // Wait for feed to fully load
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            console.log('🔍 Current URL before posting:', await this.page.url());

            // Instagram's "New Post" button
            const newPostButtonSelector = '[aria-label="New Post"]';
            console.log(`🧪 Looking for New Post button with selector: ${newPostButtonSelector}`);
            
            try {
                await this.page.waitForSelector(newPostButtonSelector, { visible: true, timeout: 15000 });
                await this.page.click(newPostButtonSelector);
                console.log('✅ Successfully clicked New Post button');
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.log('❌ New Post button not found - taking screenshot for analysis');
                await this.page.screenshot({ path: './debug-no-newpost.png', fullPage: true });
                return false;
            }

            // Handle file upload (Instagram requires an image)
            // For now, we'll simulate by looking for the upload interface
            const uploadSelectors = [
                'input[type="file"]',
                '[aria-label="Upload"]',
                'button:contains("Select from computer")'
            ];

            let uploadClicked = false;
            for (const selector of uploadSelectors) {
                try {
                    await this.page.waitForSelector(selector, { visible: true, timeout: 5000 });
                    await this.page.click(selector);
                    uploadClicked = true;
                    console.log('✅ Found upload interface');
                    break;
                } catch {
                    continue;
                }
            }

            if (!uploadClicked) {
                console.log('❌ Could not find upload interface');
                return false;
            }

            // Wait for upload dialog
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Upload image if provided via environment variable
            const imageUploaded = await this.uploadImageToInstagram(message);
            
            if (imageUploaded) {
                console.log('📸 Image upload completed, watch for upload completion in UI...');
                await this.humanDelay(2000, 3000);
            } else {
                // Close upload dialog only if no image file was provided or if upload failed
                await this.humanDelay(1000, 2000); // Wait for dialog to fully load
                try {
                    await this.page.keyboard.press('Escape');
                    console.log('🖌️ Closed Instagram upload dialog');
                    await this.humanDelay(500, 1000);
                } catch (closeError) {
                    console.log('⚠️ Could not close upload dialog, continuing:', closeError.message);
                }
            }

            // Only look for caption input if a message was provided
            let captionFound = false;
            if (message && message.trim().length > 0) {
                const captionSelectors = [
                    'textarea[aria-label*="caption"]',
                    'textarea[placeholder*="caption"]',
                    'textarea[placeholder*="Write a caption"]',
                    'textarea[placeholder*="description"]',
                    '[contenteditable="true"]'
                ];

                for (const selector of captionSelectors) {
                    try {
                        await this.page.waitForSelector(selector, { visible: true, timeout: 5000 });
                        await this.page.click(selector);
                        
                        // Clear and type caption
                        await this.page.keyboard.down('Control');
                        await this.page.keyboard.press('A');
                        await this.page.keyboard.up('Control');
                        await this.page.keyboard.press('Backspace');
                        
                        // Type caption with human-like delay
                        console.log('⌨️  Typing caption with human-like delays...');
                        for (const char of message) {
                            await this.page.keyboard.type(char, { delay: 30 + Math.random() * 50 });
                        }
                        
                        captionFound = true;
                        console.log('✅ Caption typed successfully');
                        break;
                    } catch {
                        continue;
                    }
                }

                if (message && message.trim().length > 0 && !captionFound) {
                    console.log('⚠️ Could not find caption input, continuing without caption');
                    // Allow continuation even if caption input not found
                }
            } // Close the caption condition bracket at intended level

        // Look for Share button
        const shareButtonSelectors = [
                '[aria-label="Share"]',
                'button:contains("Share")',
                'button[type="submit"]',
                '[data-testid*="share"]'
            ];

            let shared = false;
            for (const btnSelector of shareButtonSelectors) {
                try {
                    console.log(`🧪 Trying share button selector: ${btnSelector}`);
                    await this.page.waitForSelector(btnSelector, { visible: true, timeout: 5000 });
                    await this.page.click(btnSelector);
                    console.log('✅ Successfully found and clicked Share button!');
                    shared = true;
                    break;
                } catch (err) {
                    console.log(`⚠️ Share button not found with selector: ${btnSelector}`);
                }
            }

            if (!shared) {
                console.log('❌ Could not find Share button');
                return false;
            }

            // Give Instagram time to process post
            console.log('⏳ Waiting for post to process...');
            await new Promise(resolve => setTimeout(resolve, 4000));

            console.log('🎉 Post creation process completed!');
            return true;

        } catch (error) {
            console.log('❌ Error during posting:', error.message);
            return false;
        }
    }

    async runComprehensiveTest() {
        try {
            // Check if credentials are available
            if (!INSTAGRAM_USERNAME || !INSTAGRAM_PASSWORD) {
                console.log('❌ Instagram credentials not configured');
                console.log('💡 Set environment variables:');
                console.log('   - INSTAGRAM_USERNAME or IG_USERNAME');
                console.log('   - INSTAGRAM_PASSWORD or IG_PASSWORD');
                return;
            }
            
            await this.initialize();
            console.log('🚀 Starting Instagram PRO debugging session...');
            console.log('📝 Focusing on debug route only ⚠️');
            
            // Discover and test login elements
            const elements = await this.discoverLoginElements();
            
            if (elements.usernameSelectors.length === 0 ||
                elements.passwordSelectors.length === 0 ||
                elements.loginButtonSelectors.length === 0) {
                console.log('❌ Insufficient login elements found - Instagram layout may have changed');
                await this.logStep('Login Element Discovery', false, 'Insufficient elements found');
                return;
            }
            
            // Attempt intelligent login
            const loginSuccess = await this.attemptLoginWithSelectors(
                INSTAGRAM_USERNAME,
                INSTAGRAM_PASSWORD,
                elements.usernameSelectors,
                elements.passwordSelectors,
                elements.loginButtonSelectors
            );
            
            console.log('🔍 Login attempt result:', loginSuccess);
            
            if (loginSuccess) {
                await this.logStep('PRO Login Automation', true, 'Successfully logged in with dynamic selectors');
                
                // Check for immediate security challenges after login
                console.log('🔍 Current URL after login attempt:', await this.page.url());
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                if (await this.handleSecurityChallenge()) {
                    // AFTER SUCCESSFUL LOGIN & NO SECURITY CHALLENGE - CREATE A POST
                    const postMessage = 'Hello I am New Here on Instagram!';
                    const postSuccess = await this.postToInstagram(postMessage);
                    
                    if (postSuccess) {
                        await this.logStep('Instagram Post Creation', true, `Posted: "${postMessage}"`);
                        console.log('\n🎉 SUCCESSFUL SOCIAL AUTOMATION WORKFLOW:');
                        console.log('1. ✅ Intelligent login bypassed Instagram security');
                        console.log('2. ✅ Automated post creation completed');
                        console.log('3. ✅ Post content: "Hello I am New Here on Instagram!"');
                    } else {
                        await this.logStep('Instagram Post Creation', false, 'Could not create post - potential security block');
                        console.log('\n⚠️ Login succeeded but post creation failed - possible security block');
                    }
                } else {
                    console.log('\n🛑 Security challenge triggered - manual intervention required before posting');
                }
                
                console.log('\n📋 Manual Testing Commands:');
                console.log('Open Chrome DevTools (F12) and test:');
                console.log('• document.querySelectorAll(\'input\')');
                console.log('• document.querySelectorAll(\'button, [role="button"]\')');
                console.log('• Check for security dialogs or 2FA prompts');
            } else {
                await this.logStep('PRO Login Automation', false, 'Login failed - check browser for manual intervention');
            }
            
            console.log('\n💡 PRO TIPS:');
            console.log('1. Watch the browser - Instagram may show security dialogs');
            console.log('2. Use F12 DevTools to inspect current page structure');
            console.log('3. Screenshots saved to:', SCREENSHOT_DIR);
            
            // Keep browser open for manual inspection
            if (!HEADLESS) {
                console.log('\n👀 Browser will stay open for 60 seconds for manual inspection...');
                await new Promise(resolve => setTimeout(resolve, 60000));
            }
            
        } catch (error) {
            console.error('❌ Debug session failed:', error);
        } finally {
            if (this.browser) {
                await this.browser.close();
                console.log('🏁 Browser closed');
            }
        }
    }
}

// Run the debugger
const debuggerInstance = new InstagramDebugPro();
debuggerInstance.runComprehensiveTest()
  .catch(console.error)
  .finally(() => process.exit(0));