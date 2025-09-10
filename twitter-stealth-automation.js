import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Add stealth plugin
puppeteer.use(StealthPlugin());

const HEADLESS = process.env.HEADLESS === 'true' || false;
const SCREENSHOT_DIR = './human-screenshots-twitter';
const TWITTER_URL = 'https://x.com/i/flow/login';
const TWITTER_USERNAME = process.env.TWIT_USERNAME || process.env.TWITTER_USERNAME || '';
const TWITTER_PASSWORD = process.env.TWIT_PASSWORD || process.env.TWITTER_PASSWORD || '';
const RANDOM_VIEWPORT = process.env.RANDOM_VIEWPORT === 'true' || true;

// Human-like viewport sizes (common resolutions)
const VIEWPORT_SIZES = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 }
];

// Human user agents
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
];

class HumanTwitterAutomation {
    constructor() {
        this.browser = null;
        this.page = null;
        this.logSteps = [];
        this.humanMetrics = {
            typingSpeed: Math.random() * 40 + 20, // 20-60ms per character
            mouseSpeed: Math.random() * 150 + 100, // 100-250ms per movement
            actionDelay: Math.random() * 3000 + 1000, // 1-4 second delays
            clickAccuracy: 0.8 + Math.random() * 0.2 // 80-100% accuracy
        };
    }

    getRandomViewport() {
        return VIEWPORT_SIZES[Math.floor(Math.random() * VIEWPORT_SIZES.length)];
    }

    getRandomUserAgent() {
        return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    }

    async initialize() {
        await fs.ensureDir(SCREENSHOT_DIR);

        const viewport = RANDOM_VIEWPORT ? this.getRandomViewport() : { width: 1366, height: 768 };
        const userAgent = this.getRandomUserAgent();

        this.browser = await puppeteer.launch({
            headless: HEADLESS,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-dev-shm-usage',
                `--window-size=${viewport.width},${viewport.height}`,
                '--lang=en-US,en'
            ],
            defaultViewport: null,
            ignoreHTTPSErrors: true
        });

        const context = this.browser.defaultBrowserContext();
        await context.overridePermissions('https://x.com', ['geolocation', 'notifications']);

        this.page = await this.browser.newPage();

        // Set random viewport
        await this.page.setViewport(viewport);

        // Set random user agent
        await this.page.setUserAgent(userAgent);

        // Additional stealth: Override webdriver and plugins
        await this.page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
            Object.defineProperty(navigator, 'connection', {
                get: () => ({
                    downlink: 10,
                    effectiveType: '4g',
                    rtt: 50
                })
            });
        });

        console.log('🎯 Human-like browser initialized');
        console.log(`📏 Viewport: ${viewport.width}x${viewport.height}`);
        console.log(`🌐 User Agent: ${userAgent.split(' ')[0]}...`);
    }

    async humanDelay(min = 500, max = 2000) {
        const delay = Math.random() * (max - min) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
        return delay;
    }

    async simulateHumanMouseMovement() {
        try {
            const dimensions = await this.page.evaluate(() => ({
                width: window.innerWidth,
                height: window.innerHeight
            }));

            // Move mouse in natural human pattern
            for (let i = 0; i < 4; i++) {
                const startX = Math.random() * dimensions.width * 0.8;
                const startY = Math.random() * dimensions.height * 0.8;
                const endX = Math.random() * dimensions.width;
                const endY = Math.random() * dimensions.height;

                // Move with curves and random speeds
                const steps = Math.floor(Math.random() * 20) + 10;
                await this.page.mouse.move(startX, startY, { steps: 1 });
                await this.humanDelay(50, 150);
                await this.page.mouse.move(endX, endY, { steps: steps });
                await this.humanDelay(100, 300);
            }

            console.log('🖱️ Natural mouse movement completed');
        } catch (error) {
            console.log('⚠️ Mouse simulation failed (non-critical):', error.message);
        }
    }

    async typeHumanLike(element, text) {
        try {
            await element.click({ clickCount: 3 });
            await this.humanDelay(300, 700);

            // Clear field
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('KeyA');
            await this.page.keyboard.up('Control');
            await this.page.keyboard.press('Backspace');
            await this.humanDelay(200, 500);

            // Type with human-like variability
            for (const char of text) {
                const charDelay = this.humanMetrics.typingSpeed + Math.random() * 20;
                await this.page.keyboard.type(char, { delay: charDelay });

                // Random pauses between words
                if (char === ' ' || Math.random() < 0.1) {
                    await this.humanDelay(100, 400);
                }

                // Occasionally make and correct typos
                if (Math.random() < 0.05 && text.length > 4) {
                    await this.page.keyboard.press('Backspace');
                    await this.humanDelay(100, 300);
                    await this.page.keyboard.type(char, { delay: charDelay });
                }
            }

            console.log(`⌨️ Human-like typing completed: ${text.length} chars`);
            await this.humanDelay(500, 1500); // Pause after typing
        } catch (error) {
            console.log('⚠️ Falling back to simple typing');
            await element.type(text, { delay: 50 });
        }
    }

    async findAndClickElement(selectors, description = 'element') {
        for (const selector of selectors) {
            try {
                const elements = await this.page.$$(selector);
                for (const element of elements) {
                    const isVisible = await this.page.evaluate(el => {
                        const rect = el.getBoundingClientRect();
                        const style = window.getComputedStyle(el);
                        return rect.width > 0 && rect.height > 0 &&
                            style.visibility !== 'hidden' &&
                            style.display !== 'none';
                    }, element);

                    const textContent = await this.page.evaluate(el => el.textContent ? el.textContent.trim() : '', element);

                    if (isVisible && (textContent.toLowerCase().includes('next') || textContent.toLowerCase().includes('log in'))) {
                        console.log(`✅ Found ${description}: "${textContent}"`);

                        // Move to element
                        const rect = await element.boundingBox();
                        const x = rect.x + rect.width / 2;
                        const y = rect.y + rect.height / 2;

                        await this.page.mouse.move(x, y, { steps: Math.floor(Math.random() * 10) + 5 });
                        await this.humanDelay(300, 800);

                        // Click with human accuracy
                        const offsetX = (Math.random() - 0.5) * rect.width * 0.3;
                        const offsetY = (Math.random() - 0.5) * rect.height * 0.3;

                        await this.page.mouse.click(x + offsetX, y + offsetY);
                        console.log(`✅ Clicked ${description}`);

                        return true;
                    }
                }
            } catch (error) {
                console.log(`⚠️ Selector '${selector}' failed:`, error.message);
            }
        }

        throw new Error(`Could not find ${description}`);
    }

    async takeScreenshot(name) {
        try {
            const timestamp = Date.now();
            const screenshotPath = path.join(SCREENSHOT_DIR, `${name}_${timestamp}.png`);
            await this.page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`📸 Screenshot saved: ${screenshotPath}`);
            return screenshotPath;
        } catch (error) {
            console.log('⚠️ Failed to take screenshot:', error.message);
        }
    }

    async login() {
            try {
                console.log('🌐 Navigating to Twitter login page...');

                await this.page.goto(TWITTER_URL, {
                    waitUntil: 'domcontentloaded',
                    timeout: 30000
                });

                await this.simulateHumanMouseMovement();
                await this.humanDelay(3000, 6000);
                aw