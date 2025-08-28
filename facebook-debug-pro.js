import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';

// Configuration
const HEADLESS = false; // VISIBLE browser for debugging
const SCREENSHOT_DIR = './debug-screenshots';
const FB_URL = 'https://www.facebook.com/login';
const FB_USERNAME = process.env.FB_USERNAME || process.env.FBusername || '';
const FB_PASSWORD = process.env.FB_PASSWORD || process.env.FBpassword || '';

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
            defaultViewport: { width: 1920, height: 1080 }
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
      
      // Wait for Facebook to fully load and ensure we're on a place where we can post
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Look for the "Create Post" or "What's on your mind" input elements
      const canPost = await this.page.evaluate(() => {
        // Look for various post creation elements
        const postElements = [
          '[aria-label="Create a post"]',
          '[aria-label="What\'s on your mind?"]',
          'textarea[placeholder*="What\'s on your mind"]',
          'div[contenteditable="true"]',
          '[aria-describedby*="placeholder"]'
        ];
        
        // Check if any post elements exist and are visible
        for (const selector of postElements) {
          const element = document.querySelector(selector);
          if (element &&
              element.offsetWidth > 0 &&
              element.offsetHeight > 0 &&
              window.getComputedStyle(element).display !== 'none') {
            return true;
          }
        }
        return false;
      });
      
      if (canPost) {
        // Try different ways to create a post
        const postSelectors = [
          '[aria-label="Create a post"]',
          '[aria-label="What\'s on your mind?"]',
          'div[data-testid*="status-attachment"]',
          '[contenteditable="true"][role="textbox"]'
        ];
        
        for (const selector of postSelectors) {
          try {
            console.log(`Trying post selector: ${selector}`);
            await this.page.waitForSelector(selector, { timeout: 3000 });
            await this.page.click(selector);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Type the message with human-like delays and random pauses
            for (const char of message) {
              await this.page.keyboard.type(char, { delay: 30 + Math.random() * 40 });
              // Random small pauses between characters to mimic human typing
              if (Math.random() > 0.8) {
                await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
              }
            }
            
            // Look for and click the Post button
            const postButtonSelectors = [
              '[aria-label="Post"]',
              'div[aria-label="Post"]',
              '[data-testid="react-composer-post-button"]',
              'button:has(> span:contains("Post"))'
            ];
            
            for (const btnSelector of postButtonSelectors) {
              try {
                await this.page.waitForSelector(btnSelector, { timeout: 2000 });
                await this.page.click(btnSelector);
                console.log('✅ Successfully posted to Facebook!');
                
                // Give time for the post to process
                await new Promise(resolve => setTimeout(resolve, 3000));
                return true;
              } catch {
                continue;
              }
            }
            
            console.log('❌ Could not find Post button');
            return false;
          } catch {
            continue;
          }
        }
      }
      
      console.log('❌ Cannot post - post creation interface not found');
      return false;
      
    } catch (error) {
      console.log('❌ Error during posting:', error.message);
      return false;
    }
  }

  async runComprehensiveTest() {
    try {
      // Check if credentials are available
      if (!FB_USERNAME || !FB_PASSWORD) {
        console.log('❌ Facebook credentials not configured');
        console.log('💡 Set environment variables:');
        console.log('   - FB_USERNAME or FBusername');
        console.log('   - FB_PASSWORD or FBpassword');
        return;
      }
      
      await this.initialize();
      console.log('🚀 Starting Facebook PRO debugging session...');
      
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
      
      if (loginSuccess) {
        await this.logStep('PRO Login Automation', true, 'Successfully logged in with dynamic selectors');
        
        // Check for immediate security challenges after login
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