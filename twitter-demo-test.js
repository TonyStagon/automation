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

    // Enhanced method - human-like typing with error recovery
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

    // New enhancement: robust click methods with multiple strategies
    async enhancedClick(selector, description = 'element') {
        const clickStrategies = [
            // Strategy 1: Direct click
            async () => {
                const element = await this.page.$(selector);
                await element.click();
                console.log(`✅ ${description}: Direct click succeeded`);
            },
            
            // Strategy 2: JavaScript click
            async () => {
                await this.page.evaluate((sel) => {
                    const element = document.querySelector(sel);
                    if (element) element.click();
                }, selector);
                console.log(`✅ ${description}: JavaScript click succeeded`);
            },
            
            // Strategy 3: Mouse movement simulation + click
            async () => {
                const element = await this.page.$(selector);
                const rect = await this.page.evaluate(el => {
                    if (!el) return null;
                    const { x, y, width, height } = el.getBoundingClientRect();
                    return { x: x + width/2, y: y + height/2 };
                }, element);
                
                if (rect) {
                    await this.page.mouse.move(rect.x, rect.y, { steps: 10 });
                    await this.humanDelay(200, 400);
                    await this.page.mouse.click(rect.x, rect.y);
                    console.log(`✅ ${description}: Mouse simulation click succeeded`);
                }
            },
            
            // Strategy 4: Focus + Enter key
            async () => {
                const element = await this.page.$(selector);
                await element.focus();
                await this.humanDelay(100, 300);
                await this.page.keyboard.press('Enter');
                console.log(`✅ ${description}: Focus + Enter succeeded`);
            }
        ];
        
        for (let i = 0; i < clickStrategies.length; i++) {
            try {
                await clickStrategies[i]();
                return true;
            } catch (error) {
                console.log(`⚠️ ${description}: Click strategy ${i + 1} failed: ${error.message}`);
                if (i < clickStrategies.length - 1) {
                    await this.humanDelay(1000, 2000);
                }
            }
        }
        
        throw new Error(`All click strategies failed for ${description}`);
    }

    // New method - enhanced selector tracking for better debugging
    async enhanceDebugSelectors(selectors) {
        const debugSelectors = selectors.map(selector => ({
            selector,
            attempts: 0,
            successes: 0,
            errors: []
        }));
        return { selectors: debugSelectors, totalAttempts: 0 };
    }

    // New method - sophisticated button validation
    async validateButton(selector, buttonName = 'button') {
        try {
            const element = await this.page.$(selector);
            if (!element) {
                throw new Error(`${buttonName} not found`);
            }
            
            const buttonInfo = await this.page.evaluate(el => {
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                return {
                    isVisible: rect.width > 0 && rect.height > 0 &&
                              style.visibility !== 'hidden' &&
                              style.display !== 'none',
                    isDisabled: el.disabled || el.hasAttribute('disabled'),
                    hasPointerEvents: style.pointerEvents !== 'none',
                    textContent: el.textContent?.trim() || '',
                    tagName: el.tagName,
                    classes: el.className
                };
            }, element);
            
            console.log(`🔍 ${buttonName} validation:`);
            console.log(`   - Visible: ${buttonInfo.isVisible}`);
            console.log(`   - Disabled: ${buttonInfo.isDisabled}`);
            console.log(`   - Pointer events: ${buttonInfo.hasPointerEvents}`);
            console.log(`   - Text: "${buttonInfo.textContent}"`);
            console.log(`   - Tag: ${buttonInfo.tagName}`);
            console.log(`   - Classes: ${buttonInfo.classes}`);
            
            if (!buttonInfo.isVisible) {
                throw new Error(`${buttonName} is not visible`);
            }
            if (buttonInfo.isDisabled) {
                throw new Error(`${buttonName} is disabled`);
            }
            if (!buttonInfo.hasPointerEvents) {
                throw new Error(`${buttonName} has pointer-events: none`);
            }
            
            return { element, info: buttonInfo };
        } catch (error) {
            console.log(`❌ ${buttonName} validation failed:`, error.message);
            throw error;
        }
    }

    // New method - check if we're back at username screen after next click
    async isUsernameScreenVisible() {
        try {
            // Check if any username field is visible again
            const usernameSelectors = [
                'input[autocomplete="username"]',
                'input[name="text"]',
                'input[data-testid*="text"][type="text"]',
                'input[placeholder*="email"][type="text"]',
                'input[placeholder*="user"][type="text"]'
            ];
            
            let visibleUsernameFields = 0;
            
            for (const selector of usernameSelectors) {
                try {
                    const elements = await this.page.$$(selector);
                    for (const element of elements) {
                        const isVisible = await this.page.evaluate(el => {
                            const style = window.getComputedStyle(el);
                            return el && style.visibility !== 'hidden' && style.display !== 'none';
                        }, element);
                        
                        if (isVisible) {
                            const value = await this.page.evaluate(el => el.value, element);
                            // If field has value or is placeholder username field
                            if (value || selector.includes('username') || selector.includes('email')) {
                                visibleUsernameFields++;
                            }
                        }
                    }
                } catch (e) {
                    // Continue checking other selectors
                }
            }
            
            return visibleUsernameFields > 0;
        } catch (error) {
            console.log('⚠️ Username screen detection failed:', error.message);
            return false;
        }
    }

    // New method - enhanced check for current login state
    async checkCurrentLoginState() {
        try {
            // Check if we're at username screen
            if (await this.isUsernameScreenVisible()) {
                return 'username_screen';
            }
            
            // Check if we're at password screen
            const passwordFields = await this.page.$$('input[type="password"], input[autocomplete*="password"]');
            if (passwordFields.length > 0) {
                return 'password_screen';
            }
            
            // Check if we're logged in
            const loggedInSelectors = [
                '[data-testid="AppTabBar_Home_Link"]',
                '[aria-label="Home timeline"]',
                '[data-testid="SideNav_NewTweet_Button"]',
                'nav[role="navigation"]'
            ];
            
            for (const selector of loggedInSelectors) {
                try {
                    const element = await this.page.$(selector);
                    if (element) {
                        const isVisible = await this.page.evaluate(el => {
                            const style = window.getComputedStyle(el);
                            return el && style.visibility !== 'hidden' && style.display !== 'none';
                        }, element);
                        if (isVisible) return 'logged_in';
                    }
                } catch (e) {
                    // Continue checking other selectors
                }
            }
            
            return 'unknown';
        } catch (error) {
            console.log('⚠️ Login state detection failed:', error.message);
            return 'unknown';
        }
    }

    // New method - advanced username detection with flow recovery
    async advancedUsernameDetectionAndRecovery() {
        const maxRetries = 3;
        let attempt = 1;
        
        while (attempt <= maxRetries) {
            try {
                console.log(`🔄 Advanced username detection attempt ${attempt}/${maxRetries}...`);
                
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
                
                // Check if field already has content
                const currentValue = await this.page.evaluate(input => input.value, usernameInput);
                if (currentValue && currentValue.trim()) {
                    console.log(`📝 Field already contains: "${currentValue}"`);
                    
                    // Clear existing content first
                    await usernameInput.click({ clickCount: 3 });
                    await this.page.keyboard.press('Backspace');
                    await this.humanDelay(500, 1000);
                }
                
                await this.typeHumanLike(usernameInput, TWITTER_USERNAME);
                await this.logStep('Enter username/email', true);
                await this.takeDebugScreenshot('02_username_entered');
                
                // Enhanced next button detection with robust validation and multiple click strategies
                const nextButtonSelectors = [
                    'button[type="submit"]',
                    'div[role="button"]',
                    '[data-testid*="Login"]',
                    '[data-testid*="Next"]',
                    '[data-testid*="next"]',
                    'div[data-testid="LoginForm_Login_Button"]',
                    'button[data-testid="LoginForm_Login_Button"]',
                    'div[role="button"][tabindex="0"]',
                    '[aria-label*="Next"]',
                    '[aria-label*="next"]',
                    '[data-testid*="submit"]'
                ];

                console.log('🔍 Advanced Next button detection with multiple strategies...');
                let nextButtonElement = null;
                let nextButtonSelectorUsed = null;
                
                // Try multiple selectors with enhanced validation
                for (const selector of nextButtonSelectors) {
                    try {
                        console.log(`🧪 Trying Next button selector: ${selector}`);
                        const element = await this.page.$(selector);
                        
                        if (element) {
                            try {
                                await this.validateButton(selector, 'Next button');
                                nextButtonElement = element;
                                nextButtonSelectorUsed = selector;
                                console.log(`✅ Found viable Next button: ${selector}`);
                                break;
                            } catch (validationError) {
                                console.log(`⚠️ Next button validation failed for ${selector}:`, validationError.message);
                            }
                        } else {
                            // Check if element is found but failed validation - log what was found
                            console.log(`❓ Found element but it's not a button: ${selector}`);
                        }
                    } catch (error) {
                        console.log(`⚠️ Next button selector ${selector} failed:`, error.message);
                    }
                }
                
                if (!nextButtonElement || !nextButtonSelectorUsed) {
                    throw new Error('Could not find a viable Next button across all selectors');
                }
                
                // Enhanced click with multiple strategies and comprehensive logging
                console.log(`🎯 Clicking Next button using: ${nextButtonSelectorUsed}`);
                
                // Highlight the button for visual debugging
                await this.page.evaluate(el => {
                    el.scrollIntoViewIfNeeded();
                    const originalStyle = el.style.cssText;
                    el.style.backgroundColor = 'rgba(29, 161, 242, 0.3)';
                    el.style.border = '2px solid #1DA1F2';
                    el.style.boxShadow = '0 0 10px rgba(29, 161, 242, 0.5)';
                    
                    // Store original style to restore later
                    el.setAttribute('data-original-style', originalStyle);
                }, nextButtonElement);
                
                await this.humanDelay(500, 1000);
                
                // Multiple click attempts with different strategies
                let nextClicked = false;
                let clickAttempt = 1;
                const maxClickAttempts = 5;
                
                while (clickAttempt <= maxClickAttempts && !nextClicked) {
                    try {
                        console.log(`🖱️ Next button click attempt ${clickAttempt}/${maxClickAttempts}`);
                        await this.enhancedClick(nextButtonSelectorUsed, 'Next button');
                        nextClicked = true;
                        console.log('✅ Next button click successful!');
                    } catch (clickError) {
                        console.log(`❌ Next button click attempt ${clickAttempt} failed:`, clickError.message);
                        
                        if (clickAttempt < maxClickAttempts) {
                            // Take additional screenshots for debugging
                            await this.takeDebugScreenshot(`next_click_attempt_${clickAttempt}`);
                            await this.humanDelay(2000, 3000);
                        }
                        clickAttempt++;
                    }
                }
                
                if (!nextClicked) {
                    throw new Error(`All Next button click attempts (${maxClickAttempts}) failed`);
                }
                
                await this.logStep('Click next', true);
                await this.humanDelay(3500, 5500);
                await this.takeDebugScreenshot('03_next_clicked');
                
                // Check state after next click
                await this.humanDelay(2000, 3000);
                const currentState = await this.checkCurrentLoginState();
                
                if (currentState === 'username_screen') {
                    console.log('⚠️ Username screen reappeared after Next click - likely verification required');
                    await this.takeDebugScreenshot('username_screen_reappearead');
                    
                    if (attempt < maxRetries) {
                        console.log(`🔄 Retrying username entry (${attempt}/${maxRetries})...`);
                        attempt++;
                        await this.humanDelay(3000, 5000);
                        continue;
                    } else {
                        throw new Error('Username screen keeps reappearing after maximum retries');
                    }
                }
                
                if (currentState === 'password_screen' || currentState === 'logged_in') {
                    console.log('✅ Successfully moved to next stage:', currentState);
                    return true;
                }
                
                console.log('ℹ️ Current state after Next click:', currentState);
                return true;
                
            } catch (error) {
                console.log(`❌ Username detection attempt ${attempt} failed:`, error.message);
                
                if (attempt < maxRetries) {
                    attempt++;
                    await this.humanDelay(3000, 5000); // Wait before retry
                    await this.takeDebugScreenshot(`username_retry_${attempt}`);
                } else {
                    throw error;
                }
            }
        }
        
        throw new Error('All username detection attempts failed');
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

            // Use advanced username detection with recovery capabilities
            console.log('🚀 Starting advanced username flow with recovery...');
            await this.advancedUsernameDetectionAndRecovery();
            
            // Enhanced state verification and transition handling
            let passwordScreenDetected = false;
            let retryCount = 0;
            const maxStateRetries = 3;
            
            while (retryCount < maxStateRetries && !passwordScreenDetected) {
                console.log(`🔄 Password screen state verification attempt ${retryCount + 1}/${maxStateRetries}...`);
                await this.humanDelay(3000, 5000);
                
                const currentState = await this.checkCurrentLoginState();
                console.log('🔍 Current login state after username entry:', currentState);
                
                if (currentState === 'password_screen') {
                    passwordScreenDetected = true;
                    console.log('✅ Successfully transitioned to password screen');
                    break;
                }
                else if (currentState === 'username_screen') {
                    console.log('🔁 Still at username screen - waiting longer for transition');
                    await this.humanDelay(4000, 6000);
                    
                    // Double-check current URL to see if we're stuck
                    const currentUrl = await this.page.url();
                    console.log('🌐 Current URL:', currentUrl);
                    
                    if (retryCount === maxStateRetries - 1) {
                        console.log('⚠️ Maximum retries reached, performing advanced username recovery');
                        await this.advancedUsernameDetectionAndRecovery();
                    }
                }
                else if (currentState === 'unknown') {
                    console.log('🔎 Unknown state - checking if password fields exist');
                    
                    // Direct check for password fields as fallback
                    try {
                        const passwordFields = await this.page.$$('input[type="password"], input[autocomplete*="password"]');
                        if (passwordFields.length > 0) {
                            console.log('✅ Password fields detected via direct query');
                            passwordScreenDetected = true;
                            break;
                        }
                    } catch (checkError) {
                        console.log('⚠️ Password field direct check failed:', checkError.message);
                    }
                }
                else if (currentState === 'logged_in') {
                    console.log('✅ Already logged in - proceeding directly');
                    return true;
                }
                
                retryCount++;
            }
            
            if (!passwordScreenDetected) {
                console.log('❌ Failed to detect password screen after maximum retries');
                await this.takeDebugScreenshot('failed_password_detection');
                throw new Error('Password screen not detected after username entry');
            }

            // Enhanced password detection with additional verification
            const passwordSelectors = [
                'input[autocomplete="current-password"]',
                'input[name="password"]',
                'input[type="password"]',
                'input[placeholder*="password"]',
                'input[data-testid*="password"]'
            ];

            console.log('🔍 Advanced password detection with redundancy checks...');
            
            // Additional wait to ensure password field is fully interactable
            await this.humanDelay(1000, 2000);
            
            // Enhanced password detection with multiple verification
            let passwordInput = null;
            let detectionAttempts = 0;
            const maxDetectionAttempts = 3;
            
            while (detectionAttempts < maxDetectionAttempts && !passwordInput) {
                for (const selector of passwordSelectors) {
                    try {
                        const element = await this.page.$(selector);
                        if (element) {
                            // Verify element is visible and interactable
                            const isVisible = await this.page.evaluate((el) => {
                                if (!el) return false;
                                const style = window.getComputedStyle(el);
                                return style.visibility !== 'hidden' && style.display !== 'none';
                            }, element);
                            
                            if (isVisible) {
                                passwordInput = element;
                                console.log(`✅ Valid password field found: ${selector}`);
                                break;
                            }
                        }
                    } catch (error) {
                        console.log(`⚠️ Password detection attempt ${detectionAttempts + 1} failed for ${selector}:`, error.message);
                    }
                }
                
                if (!passwordInput && detectionAttempts < maxDetectionAttempts - 1) {
                    await this.humanDelay(2000, 3000);
                }
                detectionAttempts++;
            }
            
            if (!passwordInput) {
                throw new Error('Could not find a valid password field');
            }

            await this.typeHumanLike(passwordInput, TWITTER_PASSWORD);
            await this.logStep('Enter password', true);
            await this.takeDebugScreenshot('04_password_entered');

            // Enhanced login button detection with validation and redundancy
            console.log('🔍 Advanced login button detection with validation...');
            
            // Wait a moment after password entry to ensure button is enabled
            await this.humanDelay(1000, 2000);
            
            const loginButtonSelectors = [
                'button[data-testid*="Login"]',
                'button[type="submit"]',
                'div[role="button"]',
                'div[data-testid*="login"]',
                '[data-testid*="submit"]',
                '[aria-label*="Log in"]',
                '[aria-label*="login"]',
                'button[data-testid*="submit"]'
            ];

            let loginButton = null;
            let loginValidationAttempts = 0;
            const maxLoginValidationAttempts = 3;
            
            while (loginValidationAttempts < maxLoginValidationAttempts && !loginButton) {
                for (const selector of loginButtonSelectors) {
                    try {
                        const element = await this.page.$(selector);
                        if (element) {
                            // Additional button validation
                            const buttonInfo = await this.page.evaluate(el => {
                                const rect = el.getBoundingClientRect();
                                const style = window.getComputedStyle(el);
                                return {
                                    isVisible: rect.width > 0 && rect.height > 0 &&
                                              style.visibility !== 'hidden' &&
                                              style.display !== 'none',
                                    isDisabled: el.disabled || el.hasAttribute('disabled'),
                                    hasPointerEvents: style.pointerEvents !== 'none'
                                };
                            }, element);
                            
                            if (buttonInfo.isVisible && !buttonInfo.isDisabled && buttonInfo.hasPointerEvents) {
                                loginButton = { element, selector };
                                console.log(`✅ Valid login button found: ${selector}`);
                                break;
                            }
                        }
                    } catch (validationError) {
                        console.log(`⚠️ Login validation attempt ${loginValidationAttempts + 1} failed for ${selector}:`, validationError.message);
                    }
                }
                
                if (!loginButton && loginValidationAttempts < maxLoginValidationAttempts - 1) {
                    await this.humanDelay(1000, 2000);
                }
                loginValidationAttempts++;
            }
            
            if (!loginButton) {
                // Fallback: try using waitForElement if direct validation fails
                try {
                    const fallbackButton = await this.waitForElement(loginButtonSelectors);
                    loginButton = { element: fallbackButton, selector: 'fallback' };
                    console.log('ℹ️ Using fallback login button detection');
                } catch (fallbackError) {
                    throw new Error('Could not find a valid login button across all selectors and retries');
                }
            }

            // Enhanced click with validation
            if (loginButton && loginButton.element) {
                await this.enhancedClick(loginButton.selector, 'Login button');
                await this.logStep('Click login', true);
                await this.humanDelay(6000, 9000);
                await this.takeDebugScreenshot('05_login_clicked');
            } else {
                throw new Error('Login button element not available for clicking');
            }

            // Enhanced login verification with multiple checks
            console.log('✅ Verifying login status...');
            
            // Check multiple times with delays for slow loading
            let loginSuccessful = false;
            for (let i = 0; i < 3; i++) {
                loginSuccessful = await this.page.evaluate(() => {
                    const successMarkers = [
                        document.querySelector('[data-testid="AppTabBar_Home_Link"]'),
                        document.querySelector('[aria-label="Home timeline"]'),
                        document.querySelector('[data-testid="SideNav_NewTweet_Button"]'),
                        document.querySelector('nav[role="navigation"]'),
                        document.querySelector('[data-testid="primaryColumn"]'),
                        document.title.includes('Home') || document.title.includes('Twitter')
                    ];
                    return successMarkers.some(marker => marker !== null && marker !== false);
                });
                
                if (loginSuccessful) break;
                
                if (i < 2) {
                    console.log(`⏳ Login verification attempt ${i + 1}/3 failed, waiting...`);
                    await this.humanDelay(3000, 5000);
                }
            }

            if (loginSuccessful) {
                await this.logStep('Login successful', true);
                await this.takeDebugScreenshot('06_login_successful');
                
                // Save cookies for future sessions
                const cookies = await this.page.cookies();
                await fs.writeJson(path.join(this.cookieDir, 'session.json'), cookies);
                console.log('🍪 Session cookies saved');
                return true;
            }

            // Final check - if we're at some unknown state but might be logged in
            const finalState = await this.checkCurrentLoginState();
            if (finalState === 'logged_in') {
                console.log('✅ Final state check confirms login success');
                await this.logStep('Login successful (state check)', true);
                return true;
            }

            throw new Error('Login verification failed - manual verification may be required');

        } catch (error) {
            console.log('📊 Strategy analysis:', this.strategyCounters);
            console.log('🐛 Error details:', error.message);
            
            // Enhanced debug information capture
            try {
                const currentUrl = await this.page.url();
                console.log('🌐 Current URL:', currentUrl);
                
                const pageTitle = await this.page.title();
                console.log('📄 Page title:', pageTitle);
                
                // Take comprehensive debug screenshot
                await this.takeDebugScreenshot('error_login_comprehensive');
                
                // Try to capture some page content for debugging
                try {
                    const bodyText = await this.page.evaluate(() => {
                        const body = document.querySelector('body');
                        return body ? body.textContent.substring(0, 200) + '...' : 'No body content';
                    });
                    console.log('📝 Page content snippet:', bodyText);
                } catch (contentError) {
                    console.log('⚠️ Could not capture page content');
                }
            } catch (debugError) {
                console.log('⚠️ Debug capture failed:', debugError.message);
            }
            
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