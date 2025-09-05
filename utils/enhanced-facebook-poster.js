import puppeteer from 'puppeteer';

export class EnhancedFacebookPoster {
    constructor(page) {
        this.page = page;
    }

    async humanType(selector, text) {
        await this.page.focus(selector);

        // Clear existing content
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('A');
        await this.page.keyboard.up('Control');
        await this.page.keyboard.press('Backspace');

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            let delay = 60 + Math.random() * 80;

            if (char === ' ') delay = 120 + Math.random() * 100;
            if (char.match(/[.!?]/)) delay = 200 + Math.random() * 200;

            await this.page.keyboard.type(char, { delay });

            // Random thinking pauses
            if (Math.random() > 0.9) {
                await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
            }
        }
    }

    async randomMouseMovement() {
        const moves = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < moves; i++) {
            await this.page.mouse.move(
                100 + Math.random() * 600,
                100 + Math.random() * 300
            );
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        }
    }

    async postToFacebook(message) {
        try {
            console.log('\n📝 Starting Enhanced Facebook post creation...');
            console.log(`📝 Message: "${message}"`);

            // Wait for page to stabilize
            await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

            // Modern Facebook post trigger selectors (January 2025)
            const postTriggerSelectors = [
                'div[role="button"][aria-label*="What\'s on your mind"]',
                'div[data-testid="status-attachment-mentions-input"]',
                '[aria-label="Create a post"]',
                'div[data-pagelet="ProfileComposer"] div[role="button"]',
                'div[contenteditable="true"][role="textbox"]',
                'textarea[placeholder*="What\'s on your mind"]',
                'div[data-testid="react-composer-root"]'
            ];

            // Try each selector with human-like behavior
            let composerOpened = false;
            for (const selector of postTriggerSelectors) {
                try {
                    console.log(`🧪 Trying post trigger: ${selector}`);
                    await this.page.waitForSelector(selector, { visible: true, timeout: 8000 });

                    // Scroll into view and add human-like delay
                    await this.page.evaluate(sel => {
                        const el = document.querySelector(sel);
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, selector);

                    await this.randomMouseMovement();
                    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

                    await this.page.click(selector);
                    composerOpened = true;
                    console.log(`✅ Composer opened with: ${selector}`);
                    break;
                } catch (error) {
                    console.log(`❌ Trigger failed: ${selector}`);
                }
            }

            if (!composerOpened) {
                throw new Error('Could not open Facebook composer');
            }

            // Wait for composer to fully load
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Modern Facebook text input selectors
            const textInputSelectors = [
                'div[contenteditable="true"][data-lexical-editor="true"]',
                'div[contenteditable="true"][role="textbox"]',
                'div[aria-label*="What\'s on your mind"]',
                'div[data-testid="react-composer-text-input"]',
                'div[contenteditable="true"]',
                'textarea[name="xhpc_message"]',
                '[role="textbox"]'
            ];

            // Find and fill text input with human behavior
            let textInputFound = false;
            for (const selector of textInputSelectors) {
                try {
                    console.log(`🧪 Trying text input: ${selector}`);
                    await this.page.waitForSelector(selector, { visible: true, timeout: 8000 });

                    await this.humanType(selector, message);
                    textInputFound = true;
                    console.log(`✅ Text typed successfully: ${selector}`);
                    break;
                } catch (error) {
                    console.log(`❌ Text input failed: ${selector}`);
                }
            }

            if (!textInputFound) {
                throw new Error('Could not find text input field');
            }

            // Wait for UI to stabilize
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

            // Modern Facebook post button selectors
            const postButtonSelectors = [
                'div[aria-label="Post"]',
                'button[aria-label="Post"]',
                'div[role="button"][aria-label="Post"]',
                'button[data-testid="react-composer-post-button"]',
                'button[type="submit"]',
                'div[role="button"]:has(span:contains("Post"))',
                'button:has(span:contains("Post"))'
            ];

            // Find and click post button with verification
            let posted = false;
            for (const btnSelector of postButtonSelectors) {
                try {
                    console.log(`🧪 Trying post button: ${btnSelector}`);
                    await this.page.waitForSelector(btnSelector, { visible: true, timeout: 8000 });

                    // Verify button is clickable and enabled
                    const isClickable = await this.page.evaluate(sel => {
                        const button = document.querySelector(sel);
                        if (!button) return false;

                        const rect = button.getBoundingClientRect();
                        const style = getComputedStyle(button);

                        return rect.width > 0 &&
                            rect.height > 0 &&
                            style.display !== 'none' &&
                            style.visibility !== 'hidden' &&
                            !button.disabled &&
                            !button.hasAttribute('disabled');
                    }, btnSelector);

                    if (!isClickable) {
                        console.log(`⚠️ Button found but not clickable: ${btnSelector}`);
                        continue;
                    }

                    // Human-like button click
                    await this.randomMouseMovement();
                    await new Promise(resolve => setTimeout(resolve, 500));

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
                        posted = true;
                        break;
                    }
                } catch (error) {
                    console.log(`❌ Post button failed: ${btnSelector}`);
                }
            }

            if (!posted) {
                throw new Error('Could not find or click post button');
            }

            // Wait for post to process with success verification
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Verify post success by checking for success indicators
            const postSuccess = await this.page.evaluate(() => {
                const successIndicators = [
                    'Your post is now live',
                    'Post shared',
                    'Posted'
                ];

                const bodyText = document.body.textContent;
                return successIndicators.some(indicator => bodyText.includes(indicator)) ||
                    // Check if we're back to the main feed (another success indicator)
                    document.querySelector('[data-pagelet="MainFeed"]') !== null;
            });

            console.log(`🎉 Post creation completed! Success: ${postSuccess}`);
            return true;

        } catch (error) {
            console.log('❌ Enhanced Facebook posting error:', error.message);

            // Take detailed error screenshot
            if (this.page) {
                await this.page.screenshot({
                    path: `./debug-facebook-enhanced-error-${Date.now()}.png`,
                    fullPage: true
                });
            }
            return false;
        }
    }
}