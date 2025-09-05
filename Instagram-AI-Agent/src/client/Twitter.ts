import { Browser, DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } from "puppeteer";
import { SchemaType } from '@google/generative-ai';
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import { Server } from "proxy-chain";
import { Xpassword, Xusername } from "../secret";
import logger from "../config/logger";
import { loadCookies, saveCookies, Twitter_cookiesExist } from "../utils";
import { runAgent } from "../Agent";
import { getTwitterCommentSchema } from "../Agent/schema/twitter-schema";

// Add stealth plugin to puppeteer
puppeteer.use(StealthPlugin());
puppeteer.use(
    AdblockerPlugin({
        interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
    })
);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const loginWithCredentials = async (page: any, browser: Browser) => {
    try {
        await page.goto("https://twitter.com/login", { waitUntil: 'networkidle2' });

        // Wait for username field and enter username
        await page.waitForSelector('input[autocomplete="username"]');
        await page.type('input[autocomplete="username"]', Xusername);
        
        // Click Next button
        await page.click('div[role="button"][tabindex="0"]');
        
        // Wait for password field
        await delay(2000);
        await page.waitForSelector('input[name="password"]');
        await page.type('input[name="password"]', Xpassword);
        
        // Click Login button
        const loginButton = await page.$('div[role="button"][data-testid="LoginForm_Login_Button"]');
        if (loginButton) {
            await loginButton.click();
        } else {
            // Fallback for alternative login button
            await page.click('div[role="button"][tabindex="0"]:not([aria-disabled="true"])');
        }

        // Wait for navigation after login
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        // Save cookies after login
        const cookies = await browser.cookies();
        await saveCookies("./cookies/Twittercookies.json", cookies);
    } catch (error) {
        logger.error("Error logging in to Twitter with credentials:");
    }
}

async function runTwitter() {
    const server = new Server({ port: 8001 });
    await server.listen();
    const proxyUrl = `http://localhost:8001`;
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false,
            args: [
                `--proxy-server=${proxyUrl}`,
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ],
            timeout: 30000
        });
    } catch (error: unknown) {
        logger.error('Failed to launch Puppeteer browser:', error);
        const message = error instanceof Error ? error.message : 'Unknown browser launch error';
        throw new Error(`Browser launch failed: ${message}`);
    }

    const page = await browser.newPage();
    const cookiesPath = "./cookies/Twittercookies.json";

    const checkCookies = await Twitter_cookiesExist();
    logger.info(`Checking Twitter cookies existence: ${checkCookies}`);

    if (checkCookies) {
        try {
            const cookies = await loadCookies(cookiesPath);
            await page.setCookie(...cookies);
            logger.info('Twitter cookies loaded and set on the page.');

            // Navigate to Twitter to verify if cookies are valid
            await page.goto("https://twitter.com/home", {
                waitUntil: 'networkidle2',
                timeout: 60000
            });

            // Check if login was successful by verifying page content
            const isLoggedIn = await page.$("a[data-testid='AppTabBar_Profile_Link']");
            if (isLoggedIn) {
                logger.info("Twitter login verified with cookies.");
            } else {
                logger.warn("Twitter cookies invalid or expired. Logging in again...");
                await loginWithCredentials(page, browser);
            }
        } catch (error) {
            logger.error("Error verifying Twitter cookies:", error);
            await loginWithCredentials(page, browser);
        }
    } else {
        // If no cookies are available, perform login with credentials
        await loginWithCredentials(page, browser);
    }

    // Optionally take a screenshot after loading the page
    await page.screenshot({ path: "twitter_logged_in.png" });

    // Navigate to Twitter homepage
    await page.goto("https://twitter.com/home", { waitUntil: 'networkidle2' });

    // Continuously interact with tweets without closing the browser
    while (true) {
        await interactWithTweets(page);
        logger.info("Twitter iteration complete, waiting 30 seconds before refreshing...");
        await delay(30000);
        try {
            await page.reload({ waitUntil: "networkidle2" });
        } catch (e) {
            logger.warn("Error reloading Twitter page, continuing iteration: " + e);
        }
    }
}


async function interactWithTweets(page: any) {
    let tweetCount = 1; // Start with the first tweet
    const maxTweets = 40; // Limit to prevent infinite scrolling

    while (tweetCount <= maxTweets) {
        try {
            // Twitter uses article elements for tweets
            const tweetSelector = `article[data-testid="tweet"]:nth-of-type(${tweetCount})`;

            // Check if the tweet exists
            if (!(await page.$(tweetSelector))) {
                console.log("No more tweets found. Ending Twitter iteration...");
                return;
            }

            // Extract tweet text content
            const tweetTextSelector = `${tweetSelector} div[data-testid="tweetText"]`;
            const tweetTextElement = await page.$(tweetTextSelector);

            let tweetText = "";
            if (tweetTextElement) {
                tweetText = await tweetTextElement.evaluate((el: HTMLElement) => el.innerText);
                console.log(`Content of tweet ${tweetCount}: ${tweetText}`);
            } else {
                console.log(`No text content found for tweet ${tweetCount}.`);
            }

            // Like the tweet if not already liked
            const likeButtonSelector = `${tweetSelector} div[data-testid="like"]`;
            const likeButton = await page.$(likeButtonSelector);
            
            if (likeButton) {
                const isLiked = await page.evaluate((selector: string) => {
                    const button = document.querySelector(selector);
                    return button?.getAttribute('data-testid') === 'unlike';
                }, likeButtonSelector);

                if (!isLiked) {
                    console.log(`Liking tweet ${tweetCount}...`);
                    await likeButton.click();
                    console.log(`Tweet ${tweetCount} liked.`);
                } else {
                    console.log(`Tweet ${tweetCount} is already liked.`);
                }
            }

            // Reply to the tweet
            if (tweetText) {
                // Click reply button
                const replyButtonSelector = `${tweetSelector} div[data-testid="reply"]`;
                const replyButton = await page.$(replyButtonSelector);
                
                if (replyButton) {
                    await replyButton.click();
                    
                    // Wait for reply textarea to appear
                    await page.waitForSelector('div[data-testid="tweetTextarea_0"]');
                    
                    // Generate a reply using the Agent
                    const prompt = `Craft a thoughtful, engaging, and professional reply to the following tweet: "${tweetText}". Ensure the reply is relevant, insightful, and adds value to the conversation. It should be concise (max 280 characters) and reflect a good understanding of the topic. Avoid generic responses.`;
                    const schema: {
                        type: SchemaType.OBJECT;
                        properties: {
                            comment: {
                                type: SchemaType.STRING;
                                description: string;
                                maxLength: number;
                            };
                        };
                        required: string[];
                    } = {
                        type: SchemaType.OBJECT,
                        properties: {
                            comment: {
                                type: SchemaType.STRING,
                                description: "A reply between 50 and 280 characters",
                                maxLength: 280
                            }
                        },
                        required: ["comment"]
                    };
                    const result = await runAgent(schema, prompt);
                    const comment = result.comment;
                    
                    // Type the reply
                    await page.type('div[data-testid="tweetTextarea_0"]', comment);
                    
                    // Click the Reply button
                    await page.waitForSelector('div[data-testid="tweetButton"]');
                    await page.click('div[data-testid="tweetButton"]');
                    
                    // Wait for the reply to be posted
                    await delay(3000);
                    console.log(`Replied to tweet ${tweetCount} with: ${comment}`);
                }
            }

            // Wait before moving to the next tweet
            const waitTime = Math.floor(Math.random() * 5000) + 8000; // 8-13 seconds
            console.log(`Waiting ${waitTime / 1000} seconds before moving to the next tweet...`);
            await delay(waitTime);

            // Scroll to the next tweet
            await page.evaluate(() => {
                window.scrollBy(0, 400); // Scroll down by 400px
            });

            tweetCount++;
        } catch (error) {
            console.error(`Error interacting with tweet ${tweetCount}:`, error);
            break;
        }
    }
}


export { runTwitter };