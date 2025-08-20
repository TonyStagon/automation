import puppeteer, { Browser, Page } from 'puppeteer';
import { chromium, Browser as PlaywrightBrowser, Page as PlaywrightPage } from 'playwright';
import { logger } from '../utils/logger';
import { JobData, BrowserAutomationResult } from '../types';

export class BrowserAutomation {
  private static instance: BrowserAutomation;
  private puppeteerBrowser: Browser | null = null;
  private playwrightBrowser: PlaywrightBrowser | null = null;

  private constructor() {}

  public static getInstance(): BrowserAutomation {
    if (!BrowserAutomation.instance) {
      BrowserAutomation.instance = new BrowserAutomation();
    }
    return BrowserAutomation.instance;
  }

  async initializeBrowser(browserType: 'puppeteer' | 'playwright' = 'puppeteer', headless = true): Promise<void> {
    try {
      if (browserType === 'puppeteer' && !this.puppeteerBrowser) {
        this.puppeteerBrowser = await puppeteer.launch({
          headless,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        });
        logger.info('Puppeteer browser initialized');
      } else if (browserType === 'playwright' && !this.playwrightBrowser) {
        this.playwrightBrowser = await chromium.launch({
          headless,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
          ]
        });
        logger.info('Playwright browser initialized');
      }
    } catch (error) {
      logger.error(`Error initializing ${browserType} browser:`, error);
      throw error;
    }
  }

  async postToFacebook(
    jobData: JobData, 
    browserType: 'puppeteer' | 'playwright' = 'puppeteer',
    headless = true
  ): Promise<BrowserAutomationResult> {
    let page: Page | PlaywrightPage | null = null;
    
    try {
      await this.initializeBrowser(browserType, headless);

      if (browserType === 'puppeteer' && this.puppeteerBrowser) {
        page = await this.puppeteerBrowser.newPage();
        return await this.postToFacebookPuppeteer(page as Page, jobData);
      } else if (browserType === 'playwright' && this.playwrightBrowser) {
        page = await this.playwrightBrowser.newPage();
        return await this.postToFacebookPlaywright(page as PlaywrightPage, jobData);
      }

      throw new Error('Browser not initialized');
    } catch (error) {
      logger.error('Error posting to Facebook:', error);
      return {
        success: false,
        platform: 'facebook',
        message: 'Failed to post to Facebook',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  private async postToFacebookPuppeteer(page: Page, jobData: JobData): Promise<BrowserAutomationResult> {
    try {
      // Set user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

      // Navigate to Facebook login
      await page.goto('https://www.facebook.com/login', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Login
      const fbUsername = process.env.FB_USERNAME || process.env.FBusername;
      const fbPassword = process.env.FB_PASSWORD || process.env.FBpassword;

      if (!fbUsername || !fbPassword) {
        throw new Error('Facebook credentials not configured');
      }

      await page.type('#email', fbUsername);
      await page.type('#pass', fbPassword);
      await page.click('#loginbutton');

      // Wait for navigation after login
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });

      // Check if login was successful (look for home page elements or alternative selectors)
      // Facebook may use different selectors based on layout
      try {
        await page.waitForSelector('[role="main"]', { timeout: 5000 });
      } catch {
        // Fallback selectors if [role="main"] is not found
        try {
          await page.waitForSelector('[data-pagelet="MainFeed"]', { timeout: 3000 });
        } catch {
          try {
            await page.waitForSelector('[aria-label="Facebook"]', { timeout: 3000 });
          } catch {
            // If login fails, Facebook might show an error message
            const errorText = await page.evaluate(() => {
              return document.body.textContent || '';
            });
            
            if (errorText.includes('incorrect') || errorText.includes('error')) {
              throw new Error('Facebook login failed - check your credentials');
            }
            
            // If no specific error found but can't load main page, wait a bit and continue
            await page.waitForTimeout(2000);
          }
        }
      }

      // Navigate to create post
      await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle0' });

      // Try multiple selectors for "What's on your mind" button with fallbacks
      let foundPostButton = false;
      const postButtonSelectors = [
        '[role="button"][aria-label*="mind"]',
        '[aria-label="Create"]',
        'text="What\'s on your mind"',
        '.x1lq5wgf.xgqcy7u.x30kzoy.x9jhf4c.x1lliihq', // Common Facebook class pattern
        '[data-pagelet="ProfileComposer"]' // Profile composer element
      ];
      
      for (const selector of postButtonSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 });
          await page.click(selector);
          foundPostButton = true;
          break;
        } catch {
          continue;
        }
      }
      
      if (!foundPostButton) {
        throw new Error('Could not find post creation button on Facebook');
      }
      
      // Wait for dialog with multiple selector options
      const dialogSelectors = [
        '[role="dialog"]',
        '[aria-label="Create a post"]',
        '[data-pagelet="Composer"]'
      ];
      
      let foundDialog = false;
      for (const selector of dialogSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          foundDialog = true;
          break;
        } catch {
          continue;
        }
      }
      
      if (!foundDialog) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Type the caption
      const textArea = await page.waitForSelector('[role="textbox"][aria-label*="What"]');
      if (textArea) {
        await textArea.type(jobData.caption);
      }

      // Handle media upload if provided
      if (jobData.media && jobData.media.length > 0) {
        try {
          // Look for photo/video upload button
          const uploadButton = await page.$('[aria-label*="Photo/video"]');
          if (uploadButton) {
            // This is a simplified approach - in practice, you'd need to handle file uploads
            logger.info('Media upload would be handled here');
          }
        } catch (error) {
          logger.warn('Could not upload media:', error);
        }
      }

      // Post the content
      const postButton = await page.waitForSelector('[aria-label="Post"]', { timeout: 5000 });
      if (postButton) {
        await postButton.click();
        
        // Wait for post to be published
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        logger.info('Facebook post published successfully');
        return {
          success: true,
          platform: 'facebook',
          message: 'Post successfully published to Facebook',
          analytics: {
            reach: 0,
            likes: 0,
            comments: 0,
            impressions: 0
          }
        };
      }

      throw new Error('Could not find post button');
    } catch (error) {
      logger.error('Error in Facebook posting process:', error);
      return {
        success: false,
        platform: 'facebook',
        message: 'Failed to post to Facebook',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async postToFacebookPlaywright(page: PlaywrightPage, jobData: JobData): Promise<BrowserAutomationResult> {
    // Similar implementation but using Playwright API
    try {
      const fbUsername = process.env.FB_USERNAME || process.env.FBusername;
      const fbPassword = process.env.FB_PASSWORD || process.env.FBpassword;

      if (!fbUsername || !fbPassword) {
        throw new Error('Facebook credentials not configured');
      }

      await page.goto('https://www.facebook.com/login');
      
      await page.fill('#email', fbUsername);
      await page.fill('#pass', fbPassword);
      await page.click('#loginbutton');
      
      await page.waitForLoadState('networkidle');
      
      // Give more time for login processing
      await page.waitForTimeout(3000);
      
      // Navigate to home and create post - verify we're on Facebook first
      await page.goto('https://www.facebook.com/');
      
      // Try multiple selectors for "What's on your mind" button
      try {
        await page.click('[role="button"][aria-label*="mind"]');
      } catch {
        try {
          await page.click('[aria-label="Create"]');
        } catch {
          try {
            await page.click('text="What\'s on your mind"');
          } catch {
            throw new Error('Could not find post creation button');
          }
        }
      }
      
      // Wait for dialog with multiple selector options
      try {
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      } catch {
        try {
          await page.waitForSelector('[aria-label="Create a post"]', { timeout: 3000 });
        } catch {
          await page.waitForSelector('.x1lq5wgf.xgqcy7u.x30kzoy.x9jhf4c.x1lliihq', { timeout: 3000 });
        }
      }
      
      // Find and fill textarea with multiple selector options
      try {
        await page.fill('[role="textbox"][aria-label*="What"]', jobData.caption);
      } catch {
        try {
          await page.fill('[contenteditable="true"]', jobData.caption);
        } catch {
          // Fallback: add script to directly set the value in any contenteditable
          await page.evaluate((caption: string) => {
            const editor = document.querySelector('[contenteditable="true"]');
            if (editor) {
              editor.textContent = caption;
            }
          }, jobData.caption);
        }
      }
      
      // Post
      await page.click('[aria-label="Post"]');
      await page.waitForTimeout(3000);
      
      return {
        success: true,
        platform: 'facebook',
        message: 'Post successfully published to Facebook',
        analytics: {
          reach: 0,
          likes: 0,
          comments: 0,
          impressions: 0
        }
      };
    } catch (error) {
      logger.error('Error in Facebook posting process (Playwright):', error);
      return {
        success: false,
        platform: 'facebook',
        message: 'Failed to post to Facebook',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  public async closeBrowsers(): Promise<void> {
    try {
      if (this.puppeteerBrowser) {
        await this.puppeteerBrowser.close();
        this.puppeteerBrowser = null;
        logger.info('Puppeteer browser closed');
      }
      
      if (this.playwrightBrowser) {
        await this.playwrightBrowser.close();
        this.playwrightBrowser = null;
        logger.info('Playwright browser closed');
      }
    } catch (error) {
      logger.error('Error closing browsers:', error);
    }
  }
}

export const browserAutomation = BrowserAutomation.getInstance();