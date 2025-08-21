import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';

// Configuration
const HEADLESS = false; // VISIBLE browser for debugging
const SCREENSHOT_DIR = './debug-screenshots';
const FB_URL = 'https://www.facebook.com/login';

interface DebugStep {
  name: string;
  success: boolean;
  error?: string;
  screenshot?: string;
  timestamp: Date;
  duration?: number;
}

class FacebookDebugger {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private logSteps: DebugStep[] = [];
  
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
        '--ignore-certificate-errors'
      ],
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    this.page = await this.browser.newPage();
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('🎯 Browser initialized - ready for Facebook debugging');
  }
  
  async logStep(name: string, success: boolean, error?: string) {
    const step: DebugStep = {
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
        await this.page.screenshot({ path: step.screenshot, fullPage: false });
      } catch (err) {
        console.log('⚠️  Could not take screenshot:', err);
      }
    }
    
    this.logSteps.push(step);
    const statusIcon = success ? '✅' : '❌';
    console.log(`${statusIcon} ${name}: ${success ? 'SUCCESS' : `FAILED - ${error}`}`);
    
    return step;
  }
  
  async queryElement(selector: string, timeout = 4000, context?: string): Promise<boolean> {
    if (!this.page) throw new Error('Page not initialized');
    
    try {
      await this.page.waitForSelector(selector, { timeout });
      const element = await this.page.$(selector);
      
      if (element) {
        const visible = await this.page.evaluate(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }, element);
        
        if (visible) {
          console.log(`   • Found and visible: "${selector}" ${context ? `(${context})` : ''}`);
          return true;
        } else {
          console.log(`   • Found but hidden: "${selector}"`);
          return false;
        }
      }
      
      return false;
    } catch (err) {
      console.log(`   • Not found after ${timeout}ms: "${selector}"`);
      return false;
    }
  }
  
  async testLoginPage() {
    console.log('\n🔍 Testing Facebook login page selectors...');
    
    if (!this.page) throw new Error('Page not initialized');
    
    try {
      await this.page.goto(FB_URL, { waitUntil: 'networkidle0', timeout: 120000 });
      await this.logStep('Navigate to Facebook', true);
    } catch (err) {
      return await this.logStep('Navigate to Facebook', false, err instanceof Error ? err.message : 'Navigation timeout');
    }
    
    // Test all common login input selectors
    const loginTests = [
      // Email inputs
      "#email",
      "input[name='email']",
      "input[type='email']",  
      "[data-testid='royal_email']",
      '*[placeholder*="Email address"]',
      '*[placeholder*="email"]',
      
      // Password inputs
      "#pass",
      "input[name='pass']", 
      "input[type='password']",
      "[data-testid='royal_pass']",
      '*[placeholder*="Password"]',
      
      // Login buttons
      "#loginbutton",
      "*[type='submit']", 
      "button[name='login']",
      "[data-testid='royal_login_button']",
      "*[aria-label*='Log In']",
      "text/Log In"
    ];
    
    let foundAny = false;
    for (const selector of loginTests) {
      const found = await this.queryElement(selector, 2000);
      if (found) foundAny = true;
    }
    
    return this.logStep('Scan login form selectors', foundAny, foundAny ? undefined : 'No login elements found');
  }
  
  async testAllPostedSelectors() {
    console.log('\n📋 Testing Facebook main page and post creation selectors...');
    
    try {
      await this.page?.goto('https://www.facebook.com', { waitUntil: 'networkidle0', timeout: 60000 });
      await this.logStep('Navigate to Facebook home', true);
    } catch (err) {
      return this.logStep('Navigate to Facebook home', false, 'Navigation failed');
    }
    
    // More comprehensive selector testing
    const postCreationTests = [
      // "Create Post"/"What's on your mind" buttons
      '[role="button"][aria-label*="What\'s on your mind"]',
      '[aria-label="Create"]',
      'div:has(> text):contains("What\'s on your mind")',
      '*[contenteditable="true"][aria-label*="What"]',
      '[data-pagelet="ProfileComposer"]',
      '[data-testid="status-attachment-mentions-input"]',
      
      // Action/menu buttons
      '[aria-label="Profile"]',
      '[data-testid="search-icon-button"]',
      'div[role="navigation"]',
      
      // Text composition areas
      'div[contenteditable="true"]',
      '[role="textbox"]',
      '[placeholder*="Write something"]'
    ];
    
    const searchElements = [
      '[role="search"]',
      'input[placeholder*="Search Facebook"]',
      '[aria-label*="Search"]'
    ];
    
    console.log('🧪 Testing post creation elements:');
    let foundPostElements = false;
    for (const selector of postCreationTests) {
      const found = await this.queryElement(selector, 3000);
      if (found) foundPostElements = true;
    }
    
    console.log('🔍 Testing search/navigation elements:');
    let foundSearchElements = false;
    for (const selector of searchElements) {
      const found = await this.queryElement(selector, 2000);
      if (found) foundSearchElements = true;
    }
    
    return this.logStep(
      'Scan post creation interface', 
      foundPostElements, 
      foundPostElements ? undefined : 'No post creation elements found'
    );
  }
  
  async testCredentialProtection() {
    console.log('\n🔐 Checking for account protection roadblocks...');
    
    const protectionSigns = [
      // Security challenges
      'text/Facebook Checkpoint',
      'text/Confirm Your Account',
      'text/id verification',
      'text/security challenge',
      
      // Lockouts
      'text/Account Locked',
      'text/Suspended access',
      'text/blocked from access',
      
      // Two-factor prompts
      'text/Two-factor',
      'text/code sent',
      'input[name="approvals_code"]',
      
      // Suspicious activity warnings
      'text/suspicious activity',
      '#approvals_code', 
      '#checkpointSubmitButton'
    ];
    
    let foundProtection = false;
    for (const selector of protectionSigns) {
      const found = await this.queryElement(selector, 2000);
      if (found) foundProtection = true;
    }
    
    return this.logStep(
      'Check account protection', 
      !foundProtection, 
      foundProtection ? 'Account protection detected - manual intervention required' : undefined
    );
  }
  
  async automateManualTest() {
    console.log('\n🎛️  To test interactively:');
    console.log('1. Open the Chrome DevTools (F12)');
    console.log('2. Go to Console tab');
    console.log('3. Test selectors using: document.querySelectorAll("[your-selector]")');
    console.log('4. OR: $$("[your-selector]") for multiple matches');
    console.log('5. Check visibility: document.querySelector("[selector]").offsetParent !== null');
    console.log('\n📁 Screenshots saved to:', SCREENSHOT_DIR);
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('\n🖱️  You can now manually operate the browser to inspect current Facebook UI...');
  }
  
  async runComprehensiveTest() {
    try {
      await this.initialize();
      console.log('🚀 Starting comprehensive Facebook automation debug session...');
      
      await this.testLoginPage();
      await this.testAllPostedSelectors();
      await this.testCredentialProtection();
      
      if (!HEADLESS) {
        await this.automateManualTest();
      } else {
        await this.close();
      }
      
      console.log('\n📊 TEST SUMMARY:');
      this.logSteps.forEach((step, index) => {
        const duration = step.duration ? ` in ${step.duration}ms` : '';
        console.log(`${index + 1}. ${step.success ? '✅' : '❌'} ${step.name}${duration}`);
        if (step.error) console.log(`   👉 ${step.error}`);
      });
      
    } catch (error) {
      console.error('❌ Debug session failed:', error);
    }
  }
  
  async close() {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
    console.log('🏁 Browser closed');
  }
}

// Run the debugger immediately when script starts
const debuggerInstance = new FacebookDebugger();
debuggerInstance.runComprehensiveTest()
  .catch(console.error)
  .finally(() => process.exit(0));