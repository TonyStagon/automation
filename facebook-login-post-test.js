import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';

// Configuration
const HEADLESS = false; // VISIBLE browser for debugging
const SCREENSHOT_DIR = './debug-screenshots';
const FB_URL = 'https://www.facebook.com/login';
const FB_USERNAME = 'rtester535@gmail.com';
const FB_PASSWORD = 'Unicorn25$';

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

class FacebookDebugPro {
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
            defaultViewport: { width: 1900, height: 1080 }
        });

        this.page = await this.browser.newPage();

        // Override webdriver to prevent detection
        await this.page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });

        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log('🎯 Browser initialized - ready for Facebook PRO debugging');
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
    console.log('\n🔍 Scanning Facebook login page for current selectors...');
    await this.page.goto(FB_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    const elements = await this.page.evaluate(() => {
      const result = {
        emailSelectors: [],
        passwordSelectors: [],
        loginButtonSelectors: []
      };

      // Analyze all interactive elements
      const allInputs = Array.from(document.querySelectorAll('input'));
      const allButtons = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"], [type="button"]'));

      // Email/Username fields
      // CRITICAL: Filter out invisible and hidden elements FIRST to prevent security detection
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

        // Check if actually visible on the screen (not offscreen or covered)
        const rect = input.getBoundingClientRect();
        const inViewport = rect.width > 2 && rect.height > 2;
        
        return visibleAndUsable && inViewport;
      });

      visibleInputs.forEach(input => {
        const placeholder = (input.placeholder || '').toLowerCase();
        const name = (input.name || '').toLowerCase();
        const id = (input.id || '').toLowerCase();
        const type = (input.type || '').toLowerCase();

        // STRICT verification - only accept fields that are PROBABLY login fields
        const isLoginField = (
          (type === 'email' || type === 'text') &&
          (placeholder.includes('email') ||
           placeholder.includes('phone') ||
           placeholder.includes('username') ||
           name.includes('email') ||
           name.includes('user'))
        );

        if (isLoginField) {
          // Add with better priority scheme
          result.emailSelectors.unshift(`input[name="${name}"]`); // PREFERRED: name
          result.emailSelectors.push(`#${id}`);              // SECONDARY: ID
          result.emailSelectors.push(`input[type="${type}"]`); // FALLBACK: type
        }

        // Password fields - CRITICAL: Only match CLEAR password indicators
        const isPasswordField = (
          type === 'password' || (
            (placeholder.includes('password') || placeholder.includes('pass')) &&
            !placeholder.includes('author') // Avoid false positives
          )
        );

        if (isPasswordField) {
          result.passwordSelectors.unshift(`input[name="${name}"]`); // PREFERRED: name
          result.passwordSelectors.push(`#${id}`);                   // SECONDARY: ID
          result.passwordSelectors.push(`input[type="${type}"]`);    // FALLBACK: type
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
        emailSelectors: [...new Set(result.emailSelectors)].filter(s => s && s.length > 4),
        passwordSelectors: [...new Set(result.passwordSelectors)].filter(s => s && s.length > 4),
        loginButtonSelectors: [...new Set(result.loginButtonSelectors)].filter(s => s && s.length > 4)
      };
    });

    console.log('🎯 Discovered login selectors:');
    console.log('   📧 Email inputs:', elements.emailSelectors.slice(0, 5).join(', ') || 'None found');
    console.log('   🔐 Password inputs:', elements.passwordSelectors.slice(0, 5).join(', ') || 'None found');
    console.log('   📝 Login buttons:', elements.loginButtonSelectors.slice(0, 5).join(', ') || 'None found');

    return elements;
  }

  async attemptLoginWithSelectors(username, password, emailSelectors, passwordSelectors, loginButtonSelectors) {
    console.log('\n🔐 Attempting intelligent login...');
    
    // Try email selectors
    let emailFilled = false;
    for (const selector of emailSelectors.slice(0, 5)) {
      try {
        console.log(`🧪 Trying email selector: ${selector}`);
        await this.page.waitForSelector(selector, { timeout: 3000 });
        await this.page.focus(selector);
        
        // Clear existing text if any
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('A');
        await this.page.keyboard.up('Control');
        await this.page.keyboard.press('Backspace');
        
        // Type with human-like delay
        await this.page.type(selector, username, { delay: 20 + Math.random() * 30 });
        emailFilled = true;
        console.log(`✅ Filled email using: ${selector}`);
        break;
      } catch (error) {
        console.log(`❌ Email selector failed: ${selector}`);
      }
    }

    if (!emailFilled) {
      console.log('❌ Could not fill email field');
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
    await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause between fields
    
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
    
    // Check if login was successful by looking for dashboard elements
    const loginSuccess = await this.checkLoginSuccess();
    
    if (loginSuccess) {
      console.log('🎉 Login successful! Facebook dashboard detected.');
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
    // Look for elements that indicate successful login
    const successMarkers = [
      '[aria-label="Facebook"]',
      '[data-pagelet="MainFeed"]',
      '[role="main"]',
      '[aria-label="News Feed"]',
      'text/Welcome to Facebook'
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
    
    // Look for common security challenge indicators
    const hasChallenge = await this.page.evaluate(() => {
      const securityKeywords = ['security', 'checkpoint', 'verification', 'confirm', 'identify'];
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

  async postToFacebook(message) {
    try {
      console.log('\n📝 Attempting to post to Facebook...');

      // Check for security challenges first
      if (!(await this.handleSecurityChallenge())) {
        return false;
      }

      // Wait for feed to fully load
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('🔍 Current URL before posting:', await this.page.url());

      // Facebook's primary post box selector
      const postBoxSelector = '[role="textbox"][contenteditable="true"]';
      console.log(`🧪 Looking for post box with selector: ${postBoxSelector}`);
      
      // Ensure post box is visible
      try {
        await this.page.waitForSelector(postBoxSelector, { visible: true, timeout: 15000 });
      } catch (error) {
        console.log('❌ Post box not found - taking screenshot for analysis');
        await this.page.screenshot({ path: './debug-no-postbox.png', fullPage: true });
        
        // Scan for any plausible post boxes
        const possibleBoxes = await this.page.evaluate(() => {
          const candidates = [
            '[role="textbox"]',
            '[contenteditable="true"]',
            'textarea',
            '[aria-label*="post"]',
            '[placeholder*="what\'s on your mind"]'
          ];
          
          const results = [];
          candidates.forEach(selector => {
            const elements = Array.from(document.querySelectorAll(selector));
            elements.forEach(el => {
              if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
                results.push({
                  selector: selector,
                  textContent: el.textContent?.substring(0, 100) || '',
                  tagName: el.tagName,
                  attributes: Array.from(el.attributes).map(a => `${a.name}=${a.value}`)
                });
              }
            });
          });
          return results;
        });
        
        console.log('🕵️  Potential post elements found:', possibleBoxes.length);
        if (possibleBoxes.length > 0) {
          console.log('Top candidates:', JSON.stringify(possibleBoxes.slice(0, 3), null, 2));
        }
        
        return false;
      }

      // Scroll into view - modern Facebook requires scrolling for interactive elements
      await this.page.evaluate(selector => {
        const el = document.querySelector(selector);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, postBoxSelector);
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Focus and click with careful timing
      await this.page.click(postBoxSelector, { clickCount: 1, delay: 500 });
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Clear any existing text
      await this.page.keyboard.down('Control');
      await this.page.keyboard.press('A');
      await this.page.keyboard.up('Control');
      await this.page.keyboard.press('Backspace');
      
      await new Promise(resolve => setTimeout(resolve, 500));

      // Type caption with human-like delay
      console.log('⌨️  Typing message with human-like delays...');
      for (const char of message) {
        await this.page.keyboard.type(char, { delay: 30 + Math.random() * 50 });
      }

      // Wait a little to stabilize UI
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Look for Post button with comprehensive selector options
      const postButtonSelectors = [
        '[aria-label="Post"]',
        'div[aria-label="Post"]',
        '[data-testid="react-composer-post-button"]',
        'button[type="submit"]',
        'button:has(> span:contains("Post"))',
        'div[role="button"]:has(> span:contains("Post"))',
        '[data-pagelet*="Composer"] button',
        'button[data-sigil*="composer"]'
      ];

      let posted = false;
      console.log('🔍 Looking for Post buttons...');
      
      for (const btnSelector of postButtonSelectors) {
        try {
          console.log(`🧪 Trying button selector: ${btnSelector}`);
          await this.page.waitForSelector(btnSelector, { visible: true, timeout: 5000 });
          await this.page.click(btnSelector);
          console.log('✅ Successfully found and clicked Post button!');
          posted = true;
          break;
        } catch (err) {
          console.log(`⚠️ Post button not found with selector: ${btnSelector}`);
        }
      }

      if (!posted) {
        console.log('❌ Could not confirm Post button - checking if any buttons visible');
        
        // Debug: what buttons are actually available?
        const availableButtons = await this.page.evaluate(() => {
          return Array.from(document.querySelectorAll('button, [role="button"]'))
            .filter(btn => btn.offsetWidth > 0 && btn.offsetHeight > 0)
            .map(btn => ({
              text: btn.textContent?.trim().substring(0, 30) || '',
              ariaLabel: btn.getAttribute('aria-label') || '',
              id: btn.id || '',
              class: btn.className
            }));
        });
        
        console.log('🕵️ Visible buttons on page:', availableButtons);
        
        // Try to find any "Post" related button
        const postLikeButtons = availableButtons.filter(b =>
          b.text.toLowerCase().includes('post') ||
          b.ariaLabel.toLowerCase().includes('post')
        );
        
        if (postLikeButtons.length > 0) {
          console.log('⚠️ Found potential post buttons:', postLikeButtons);
        }
        
        return false;
      }

      // Give Facebook time to process post
      console.log('⏳ Waiting for post to process...');
      await new Promise(resolve => setTimeout(resolve, 4000));
      

      console.log('🎉 Post creation process completed!');
      return true;

    } catch (error) {
      console.log('❌ Error during posting:', error.message);
      return false;
    }
  }

  async runComprehensiveTestOLD() {
    try {
      await this.initialize();
      console.log('🚀 Starting COMPREHENSIVE route');
      return {
        logSteps: this.logSteps,
        success: true
      }
    } catch (error) {
      console.log('❌ Previous comprehensive route failed:', error);
      return { success: false, error };
    }
  }

  async runComprehensiveTest() {
    try {
      await this.initialize();
      console.log('🚀 Starting Facebook PRO debugging session...');
      console.log('📝 Focusing on debug route only ⚠️');
      
      // Discover and test login elements
      const elements = await this.discoverLoginElements();
      
      if (elements.emailSelectors.length === 0 ||
          elements.passwordSelectors.length === 0 ||
          elements.loginButtonSelectors.length === 0) {
        console.log('❌ Insufficient login elements found - Facebook layout may have changed');
        await this.logStep('Login Element Discovery', false, 'Insufficient elements found');
        return;
      }
      
      // Attempt intelligent login
      const loginSuccess = await this.attemptLoginWithSelectors(
        FB_USERNAME,
        FB_PASSWORD,
        elements.emailSelectors,
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
          const postMessage = 'Hello I am New Here';
          const postSuccess = await this.postToFacebook(postMessage);
          
          if (postSuccess) {
            await this.logStep('Facebook Post Creation', true, `Posted: "${postMessage}"`);
            console.log('\n🎉 SUCCESSFUL SOCIAL AUTOMATION WORKFLOW:');
            console.log('1. ✅ Intelligent login bypassed Facebook security');
            console.log('2. ✅ Automated post creation completed');
            console.log('3. ✅ Post content: "Hello I am New Here"');
          } else {
            await this.logStep('Facebook Post Creation', false, 'Could not create post - potential security block');
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
      console.log('1. Watch the browser - Facebook may show security dialogs');
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
const debuggerInstance = new FacebookDebugPro();
debuggerInstance.runComprehensiveTest()
  .catch(console.error)
  .finally(() => process.exit(0));