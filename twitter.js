import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';

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
        this.strategyCounters = { selectorsTried: 0, successfulStrategies: 0 };
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

        await this.page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        });

        await this.page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );
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

    async typeHumanLike(element, text) {
        try {
            await element.click({ clickCount: 3 });
            await this.humanDelay(200, 500);

            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('KeyA');
            await this.page.keyboard.up('Control');
            await this.page.keyboard.press('Backspace');

            for (const char of text) {
                await this.page.keyboard.type(char, {
                    delay: Math.random() * 50 + 25
                });
            }
        } catch (error) {
            await element.type(text, { delay: 50 });
        }
    }

    async enhancedClick(selector, description = 'element') {
        const element = await this.page.$(selector);
        if (!element) throw new Error(`${description} not found for selector: ${selector}`);

        // scroll into view before clicking
        await this.page.evaluate(el => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, element);

        await this.humanDelay(500, 1500);
        await element.click();
        console.log(`✅ ${description}: Clicked with scroll`);
    }

    async waitForElement(selectors, timeout = 15000) {
        for (const selector of selectors) {
            try {
                await this.page.waitForSelector(selector, { timeout, visible: true });
                const element = await this.page.$(selector);
                if (element) return element;
            } catch (e) { }
        }
        throw new Error(`Element not found for selectors: ${selectors.join(', ')}`);
    }

    async takeDebugScreenshot(name) {
        try {
            const screenshotPath = path.join(SCREENSHOT_DIR, `${name}_${Date.now()}.png`);
            await this.page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`📸 Debug screenshot saved: ${screenshotPath}`);
        } catch { }
    }

    async checkCurrentLoginState() {
        const passwordFields = await this.page.$$('input[type="password"], input[autocomplete*="password"]');
        if (passwordFields.length > 0) return 'password_screen';

        const usernameFields = await this.page.$$('input[autocomplete="username"], input[name="text"]');
        if (usernameFields.length > 0) return 'username_screen';

        const home = await this.page.$('[data-testid="AppTabBar_Home_Link"]');
        if (home) return 'logged_in';

        return 'unknown';
    }

    async advancedUsernameDetectionAndRecovery() {
        const maxRetries = 3;
        let attempt = 1;

        while (attempt <= maxRetries) {
            console.log(`🔄 Username attempt ${attempt}/${maxRetries}...`);

            const usernameInput = await this.waitForElement([
                'input[autocomplete="username"]',
                'input[name="text"]',
                'input[data-testid*="text"]'
            ]);

            // retype username cleanly
            await usernameInput.click({ clickCount: 3 });
            await this.page.keyboard.press('Backspace');
            await this.typeHumanLike(usernameInput, TWITTER_USERNAME);

            await this.takeDebugScreenshot(`username_entered_${attempt}`);

            // detect next button
            const nextButton = await this.waitForElement([
                'div[role="button"]:has(span:contains("Next"))',
                'button:has(span:contains("Next"))',
                'button[type="submit"]'
            ]);
            await this.enhancedClick('div[role="button"]:has(span:contains("Next"))', 'Next button');

            await this.takeDebugScreenshot(`next_clicked_${attempt}`);

            // wait for either password or username to appear
            await Promise.race([
                this.page.waitForSelector('input[type="password"]', { timeout: 10000 }).catch(() => null),
                this.page.waitForSelector('input[autocomplete="username"]', { timeout: 10000 }).catch(() => null),
            ]);

            const state = await this.checkCurrentLoginState();
            console.log('ℹ️ State after Next click:', state);

            if (state === 'password_screen' || state === 'logged_in') {
                console.log('✅ Successfully advanced beyond username');
                return true;
            }

            attempt++;
            await this.humanDelay(4000, 6000);
        }

        throw new Error('Failed to pass username screen after retries');
    }

    async login() {
        console.log('🌐 Navigating to login...');
        await this.page.goto(TWITTER_URL, { waitUntil: 'networkidle2', timeout: 45000 });
        await this.humanDelay(3000, 5000);

        await this.advancedUsernameDetectionAndRecovery();

        const passwordInput = await this.waitForElement([
            'input[autocomplete="current-password"]',
            'input[name="password"]',
            'input[type="password"]'
        ]);

        await this.typeHumanLike(passwordInput, TWITTER_PASSWORD);
        await this.takeDebugScreenshot('password_entered');

        const loginButton = await this.waitForElement([
            'button[data-testid*="Login"]',
            'button[type="submit"]',
            'div[role="button"]:has(span:contains("Log in"))'
        ]);
        await this.enhancedClick('button[data-testid*="Login"]', 'Login button');

        await this.humanDelay(6000, 9000);
        await this.takeDebugScreenshot('login_clicked');

        const state = await this.checkCurrentLoginState();
        if (state === 'logged_in') {
            console.log('🎉 Logged in successfully');
            return true;
        }

        throw new Error('Login failed');
    }

    async run() {
        if (!TWITTER_USERNAME || !TWITTER_PASSWORD) {
            console.log('❌ Missing credentials');
            return;
        }

        await this.initialize();
        await this.login();
    }
}

const automation = new EnhancedTwitterAutomation();
automation.run();