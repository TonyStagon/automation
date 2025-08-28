import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';

// Configuration
const HEADLESS = false; // VISIBLE browser for debugging
const SCREENSHOT_DIR = './debug-screenshots';
const TWITTER_URL = 'https://twitter.com/login';
const TWITTER_USERNAME = process.env.TWIT_USERNAME || process.env.TWITTER_USERNAME || '';
const TWITTER_PASSWORD = process.env.TWIT_PASSWORD || process.env.TWITTER_PASSWORD || '';

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

class TwitterDebugPro {
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
            defaultViewport: { width: 1400, height: 2700 }
        });

        this.page = await this.browser.newPage();

        // Override webdriver to prevent detection
        await this.page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });

        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log('🎯 Browser initialized - ready for Twitter PRO debugging');
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

    async discoverLoginElements() {
        console.log('\n🔍 Scanning Twitter login page for current selectors...');
        await this.page.goto(TWITTER_URL, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Handle Twitter's potentially awkward UI positioning
        console.log('🔄 Handling Twitter UI positioning...');
        
        // Try different viewport sizes and scrolling approaches
        await this.page.setViewport({ width: 1920, height: 1080 });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Scroll to different areas to find hidden login forms
        await this.page.evaluate(() => {
            window.scrollTo(0, 0);
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await this.page.evaluate(() => {
            window.scrollTo(document.body.scrollWidth, 0);
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await this.page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Back to center
        await this.page.evaluate(() => {
            window.scrollTo(0, 0);
        });
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Take screenshot before scanning
        await this.page.screenshot({ path: './debug-twitter-before-scan.png', fullPage: true });

        const elements = await this.page.evaluate(() => {
            const result = {
                usernameSelectors: [],
                passwordSelectors: [],
                loginButtonSelectors: []
            };

            // Analyze all interactive elements with more lenient visibility criteria
            const allInputs = Array.from(document.querySelectorAll('input'));
            const allButtons = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"], [type="button"]'));

            // More lenient input detection - include elements that might be off-screen
            const visibleInputs = allInputs.filter(input => {
                const style = getComputedStyle(input);
                const visibleAndUsable = style.display !== 'none' &&
                                      style.visibility !== 'hidden' &&
                                      style.opacity !== '0' &&
                                      input.type !== 'hidden' &&
                                      !input.hasAttribute('aria-hidden') &&
                                      !input.disabled;

                const rect = input.getBoundingClientRect();
                const hasSize = rect.width > 0 && rect.height > 0;
                
                return visibleAndUsable && hasSize;
            });

            visibleInputs.forEach(input => {
                const placeholder = (input.placeholder || '').toLowerCase();
                const name = (input.name || '').toLowerCase();
                const id = (input.id || '').toLowerCase();
                const type = (input.type || '').toLowerCase();
                const label = (input.getAttribute('aria-label') || '').toLowerCase();
                const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase();

                // Very broad username field detection for Twitter's awkward UI
                const isUsernameField = (
                    (type === 'text' || type === 'email' || type === 'tel') &&
                    (placeholder.includes('phone') ||
                     placeholder.includes('email') ||
                     placeholder.includes('username') ||
                     placeholder.includes('name') ||
                     label.includes('phone') ||
                     label.includes('email') ||
                     label.includes('username') ||
                     label.includes('name') ||
                     name.includes('username') ||
                     name.includes('user') ||
                     name.includes('email') ||
                     name.includes('phone') ||
                     name.includes('text') ||
                     autocomplete.includes('email') ||
                     autocomplete.includes('username') ||
                     autocomplete.includes('name') ||
                     // Also catch generic text inputs that might be login fields
                     (type === 'text' && !name.includes('search')))
                 );

                if (isUsernameField) {
                    result.usernameSelectors.unshift(`input[name="${name}"]`);
                    result.usernameSelectors.push(`#${id}`);
                    result.usernameSelectors.push(`input[type="${type}"]`);
                    if (label) result.usernameSelectors.push(`input[aria-label*="${label.split(' ')[0]}"]`);
                    if (autocomplete) result.usernameSelectors.push(`input[autocomplete*="${autocomplete}"]`);
                }

                // Password fields - also more lenient
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

            // Enhanced login buttons - much more lenient for awkward UI
            allButtons.forEach(button => {
                const text = (button.textContent || '').toLowerCase();
                const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
                const type = (button.type || '').toLowerCase();
                const id = (button.id || '').toLowerCase();
                const testid = (button.getAttribute('data-testid') || '').toLowerCase();
                const className = (button.className || '').toLowerCase();
                
                // Very broad button detection
                const isRelevantButton = (
                    type === 'submit' || 
                    text.includes('next') ||
                    text.includes('log') ||
                    text.includes('sign') ||
                    text.includes('in') ||
                    text.includes('continue') ||
                    text.includes('enter') ||
                    ariaLabel.includes('next') ||
                    ariaLabel.includes('log') ||
                    ariaLabel.includes('sign') ||
                    ariaLabel.includes('continue') ||
                    (id && (id.includes('login') || id.includes('submit') || id.includes('next') || id.includes('continue'))) ||
                    (testid && (testid.includes('login') || testid.includes('submit') || testid.includes('next') || testid.includes('continue'))) ||
                    (className && (className.includes('login') || className.includes('submit') || className.includes('next')))
                );

                // More aggressive third-party filtering
                const isThirdPartyButton = (
                    text.includes('apple') ||
                    text.includes('google') ||
                    text.includes('facebook') ||
                    text.includes('microsoft') ||
                    ariaLabel.includes('apple') ||
                    ariaLabel.includes('google') ||
                    ariaLabel.includes('facebook') ||
                    ariaLabel.includes('microsoft') ||
                    testid.includes('apple') ||
                    testid.includes('google') ||
                    testid.includes('facebook') ||
                    testid.includes('microsoft') ||
                    className.includes('apple') ||
                    className.includes('google') ||
                    className.includes('facebook')
                );

                if (isRelevantButton && !isThirdPartyButton) {
                    if (id) result.loginButtonSelectors.unshift(`#${id}`);
                    if (testid) result.loginButtonSelectors.unshift(`[data-testid="${testid}"]`);
                    result.loginButtonSelectors.push(`${button.tagName.toLowerCase()}[type="${type}"]`);
                    if (ariaLabel) result.loginButtonSelectors.push(`[aria-label*="${ariaLabel.split(' ')[0]}"]`);
                    if (text) result.loginButtonSelectors.push(`${button.tagName.toLowerCase()}`);
                }
            });

            // Add comprehensive Twitter-specific selectors
            const commonTwitterSelectors = {
                username: [
                    'input[autocomplete="username"]',
                    'input[autocomplete="email"]',
                    'input[name="text"]',
                    'input[data-testid="loginInput"]',
                    'input[placeholder*="email"]',
                    'input[placeholder*="phone"]',
                    'input[placeholder*="username"]',
                    'input[aria-label*="email"]',
                    'input[aria-label*="phone"]',
                    'input[aria-label*="username"]'
                ],
                password: [
                    'input[autocomplete="current-password"]',
                    'input[name="password"]',
                    'input[placeholder*="password"]',
                    'input[aria-label*="password"]'
                ],
                buttons: [
                    '[data-testid="LoginForm_Login_Button"]',
                    '[data-testid="LoginForm_SubmitButton"]',
                    '[data-testid="LoginFormNextButton"]',
                    'button[type="submit"]'
                ]
            };

            // Add common selectors if they exist on the page
            commonTwitterSelectors.username.forEach(selector => {
                if (document.querySelector(selector) && !result.usernameSelectors.includes(selector)) {
                    result.usernameSelectors.unshift(selector);
                }
            });

            commonTwitterSelectors.password.forEach(selector => {
                if (document.querySelector(selector) && !result.passwordSelectors.includes(selector)) {
                    result.passwordSelectors.unshift(selector);
                }
            });

            commonTwitterSelectors.buttons.forEach(selector => {
                try {
                    if (document.querySelector(selector) && !result.loginButtonSelectors.includes(selector)) {
                        result.loginButtonSelectors.unshift(selector);
                    }
                } catch (e) {
                    // Some selectors might be invalid, skip them
                }
            });

            // Remove duplicates and empty selectors
            return {
                usernameSelectors: [...new Set(result.usernameSelectors)].filter(s => s && s.length > 2),
                passwordSelectors: [...new Set(result.passwordSelectors)].filter(s => s && s.length > 2),
                loginButtonSelectors: [...new Set(result.loginButtonSelectors)].filter(s => s && s.length > 2)
            };
        });

        console.log('🎯 Discovered login selectors:');
        console.log('   👤 Username inputs:', elements.usernameSelectors.slice(0, 5).join(', ') || 'None found');
        console.log('   🔐 Password inputs:', elements.passwordSelectors.slice(0, 5).join(', ') || 'None found');
        console.log('   📝 Login buttons:', elements.loginButtonSelectors.slice(0, 5).join(', ') || 'None found');

        // If still no elements found, try more aggressive approaches
        if (elements.usernameSelectors.length === 0 || elements.loginButtonSelectors.length === 0) {
            console.log('🔄 Trying aggressive element discovery approach...');
            await this.page.screenshot({ path: './debug-twitter-aggressive.png', fullPage: true });
            
            // Try clicking in different areas to reveal login forms
            await this.page.mouse.click(100, 100);
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await this.page.mouse.click(500, 300);
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await this.page.mouse.click(900, 500);
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Try keyboard navigation
            await this.page.keyboard.press('Tab');
            await new Promise(resolve => setTimeout(resolve, 200));
            await this.page.keyboard.press('Tab');
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Re-scan after interactions
            const fallbackElements = await this.page.evaluate(() => {
                const allInputs = Array.from(document.querySelectorAll('input'));
                const allButtons = Array.from(document.querySelectorAll('button'));
                
                const inputs = allInputs
                    .filter(input => input.type !== 'hidden')
                    .map(input => ({
                        selector: input.id ? `#${input.id}` : `input[name="${input.name || ''}"]`,
                        type: input.type,
                        placeholder: input.placeholder || '',
                        name: input.name || '',
                        visible: input.offsetWidth > 0 && input.offsetHeight > 0
                    }));

                const buttons = allButtons
                    .map(button => ({
                        selector: button.id ? `#${button.id}` : (button.getAttribute('data-testid') ? `[data-testid="${button.getAttribute('data-testid')}"]` : 'button'),
                        text: (button.textContent || '').substring(0, 30),
                        testid: button.getAttribute('data-testid') || '',
                        visible: button.offsetWidth > 0 && button.offsetHeight > 0
                    }));

                return { inputs, buttons };
            });

            console.log('🔍 Aggressive discovery - All inputs:', fallbackElements.inputs);
            console.log('🔍 Aggressive discovery - All buttons:', fallbackElements.buttons);
            
            // If we find any inputs or buttons, add them to our selectors
            fallbackElements.inputs.forEach(input => {
                if (input.visible && (input.type === 'text' || input.type === 'email') && input.selector.length > 2) {
                    elements.usernameSelectors.push(input.selector);
                }
                if (input.visible && input.type === 'password' && input.selector.length > 2) {
                    elements.passwordSelectors.push(input.selector);
                }
            });
            
            fallbackElements.buttons.forEach(button => {
                if (button.visible && button.selector.length > 2 && !button.testid.includes('apple') && !button.testid.includes('google')) {
                    elements.loginButtonSelectors.push(button.selector);
                }
            });
        }

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

        // Twitter often has a "Next" button before password
        let nextClicked = false;
        for (const selector of loginButtonSelectors.slice(0, 3)) {
            try {
                console.log(`🧪 Trying Next button: ${selector}`);
                await this.page.waitForSelector(selector, { timeout: 3000 });
                await this.page.click(selector);
                nextClicked = true;
                console.log(`✅ Clicked Next using: ${selector}`);
                break;
            } catch (error) {
                console.log(`❌ Next button failed: ${selector}`);
            }
        }

        if (nextClicked) {
            // Wait for password field to appear
            await new Promise(resolve => setTimeout(resolve, 3000));
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

        // Try login buttons (for final login)
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
            console.log('🎉 Login successful! Twitter dashboard detected.');
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
        // Look for elements that indicate successful login to Twitter
        const successMarkers = [
            '[data-testid="primaryColumn"]',
            '[aria-label="Home timeline"]',
            '[data-testid="tweetButton"]',
            '[aria-label="Tweet"]',
            'a[aria-label="Home"]',
            'a[aria-label="Notifications"]',
            'a[aria-label="Messages"]',
            '[data-testid="SideNav_NewTweet_Button"]'
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
                   document.querySelector('input[type*="code"]');
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

    async postToTwitter(message) {
        try {
            console.log('\n📝 Attempting to post to Twitter...');

            // Check for security challenges first
            if (!(await this.handleSecurityChallenge())) {
                return false;
            }

            // Wait for feed to fully load
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            console.log('🔍 Current URL before posting:', await this.page.url());

            // Twitter's tweet button selectors
            const tweetButtonSelectors = [
                '[data-testid="tweetButton"]',
                '[data-testid="SideNav_NewTweet_Button"]',
                '[aria-label="Tweet"]',
                'a[aria-label="Tweet"]',
                'button[aria-label="Tweet"]'
            ];
            
            let tweetButtonClicked = false;
            for (const selector of tweetButtonSelectors) {
                try {
                    console.log(`🧪 Looking for tweet button with selector: ${selector}`);
                    await this.page.waitForSelector(selector, { visible: true, timeout: 15000 });
                    await this.page.click(selector);
                    tweetButtonClicked = true;
                    console.log('✅ Successfully clicked Tweet button');
                    break;
                } catch (error) {
                    console.log(`⚠️ Tweet button not found with selector: ${selector}`);
                }
            }

            if (!tweetButtonClicked) {
                console.log('❌ Tweet button not found - taking screenshot for analysis');
                await this.page.screenshot({ path: './debug-no-tweetbutton.png', fullPage: true });
                return false;
            }

            // Wait for tweet composer to appear
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Look for tweet input box
            const tweetInputSelectors = [
                '[data-testid="tweetTextarea_0"]',
                '[aria-label="Tweet text"]',
                'div[role="textbox"][contenteditable="true"]',
                '[data-testid="tweetTextarea"]'
            ];

            let tweetInputFound = false;
            for (const selector of tweetInputSelectors) {
                try {
                    console.log(`🧪 Looking for tweet input with selector: ${selector}`);
                    await this.page.waitForSelector(selector, { visible: true, timeout: 5000 });
                    await this.page.click(selector);
                    
                    // Clear any existing text
                    await this.page.keyboard.down('Control');
                    await this.page.keyboard.press('A');
                    await this.page.keyboard.up('Control');
                    await this.page.keyboard.press('Backspace');
                    
                    // Type tweet with human-like delay
                    console.log('⌨️  Typing tweet with human-like delays...');
                    for (const char of message) {
                        await this.page.keyboard.type(char, { delay: 30 + Math.random() * 50 });
                    }
                    
                    tweetInputFound = true;
                    console.log('✅ Tweet typed successfully');
                    break;
                } catch (error) {
                    console.log(`⚠️ Tweet input not found with selector: ${selector}`);
                }
            }

            if (!tweetInputFound) {
                console.log('❌ Could not find tweet input');
                return false;
            }

            // Wait a little to stabilize UI
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Look for Tweet button in the composer
            const postTweetButtonSelectors = [
                '[data-testid="tweetButtonInline"]',
                '[data-testid="tweetButton"]',
                'button[data-testid="tweetButton"]'
            ];

            let posted = false;
            console.log('🔍 Looking for Tweet (Post) buttons...');
            
            for (const btnSelector of postTweetButtonSelectors) {
                try {
                    console.log(`🧪 Trying tweet button selector: ${btnSelector}`);
                    await this.page.waitForSelector(btnSelector, { visible: true, timeout: 5000 });
                    await this.page.click(btnSelector);
                    console.log('✅ Successfully found and clicked Tweet button!');
                    posted = true;
                    break;
                } catch (err) {
                    console.log(`⚠️ Tweet button not found with selector: ${btnSelector}`);
                }
            }

            if (!posted) {
                console.log('❌ Could not confirm Tweet button - checking if any buttons visible');
                
                // Debug: what buttons are actually available?
                const availableButtons = await this.page.evaluate(() => {
                    return Array.from(document.querySelectorAll('button, [role="button"]'))
                        .filter(btn => btn.offsetWidth > 0 && btn.offsetHeight > 0)
                        .map(btn => ({
                            text: btn.textContent?.trim().substring(0, 30) || '',
                            ariaLabel: btn.getAttribute('aria-label') || '',
                            id: btn.id || '',
                            class: btn.className,
                            testid: btn.getAttribute('data-testid') || ''
                        }));
                });
                
                console.log('🕵️ Visible buttons on page:', availableButtons);
                
                // Try to find any "Tweet" related button
                const tweetLikeButtons = availableButtons.filter(b =>
                    b.text.toLowerCase().includes('tweet') ||
                    b.ariaLabel.toLowerCase().includes('tweet') ||
                    b.testid.toLowerCase().includes('tweet')
                );
                
                if (tweetLikeButtons.length > 0) {
                    console.log('⚠️ Found potential tweet buttons:', tweetLikeButtons);
                }
                
                return false;
            }

            // Give Twitter time to process post
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
            if (!TWITTER_USERNAME || !TWITTER_PASSWORD) {
                console.log('❌ Twitter credentials not configured');
                console.log('💡 Set environment variables:');
                console.log('   - TWIT_USERNAME or TWITTER_USERNAME');
                console.log('   - TWIT_PASSWORD or TWITTER_PASSWORD');
                return;
            }
            
            await this.initialize();
            console.log('🚀 Starting Twitter PRO debugging session...');
            console.log('📝 Focusing on debug route only ⚠️');
            
            // Discover and test login elements
            const elements = await this.discoverLoginElements();
            
            if (elements.usernameSelectors.length === 0 ||
                elements.passwordSelectors.length === 0 ||
                elements.loginButtonSelectors.length === 0) {
                console.log('❌ Insufficient login elements found - Twitter layout may have changed');
                await this.logStep('Login Element Discovery', false, 'Insufficient elements found');
                return;
            }
            
            // Attempt intelligent login
            const loginSuccess = await this.attemptLoginWithSelectors(
                TWITTER_USERNAME,
                TWITTER_PASSWORD,
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
                    const postMessage = 'Hello I am New Here on Twitter!';
                    const postSuccess = await this.postToTwitter(postMessage);
                    
                    if (postSuccess) {
                        await this.logStep('Twitter Post Creation', true, `Posted: "${postMessage}"`);
                        console.log('\n🎉 SUCCESSFUL SOCIAL AUTOMATION WORKFLOW:');
                        console.log('1. ✅ Intelligent login bypassed Twitter security');
                        console.log('2. ✅ Automated post creation completed');
                        console.log('3. ✅ Post content: "Hello I am New Here on Twitter!"');
                    } else {
                        await this.logStep('Twitter Post Creation', false, 'Could not create post - potential security block');
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
            console.log('1. Watch the browser - Twitter may show security dialogs');
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
const debuggerInstance = new TwitterDebugPro();
debuggerInstance.runComprehensiveTest()
  .catch(console.error)
  .finally(() => process.exit(0));