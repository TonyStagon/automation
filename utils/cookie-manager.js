import fs from 'fs-extra';
import path from 'path';

export class CookieManager {
    constructor() {
        this.cookieDir = './cookies';
        fs.ensureDirSync(this.cookieDir);
    }

    async checkCookiesValid(platform) {
        try {
            const cookiesPath = path.join(this.cookieDir, `${platform}_cookies.json`);

            if (!await fs.pathExists(cookiesPath)) {
                console.log(`❌ No cookies found for ${platform}`);
                return false;
            }

            const cookies = await fs.readJson(cookiesPath);
            const currentTimestamp = Math.floor(Date.now() / 1000);

            // Platform-specific critical cookies
            const criticalCookies = {
                facebook: ['c_user', 'xs', 'fr'],
                instagram: ['sessionid', 'csrftoken'],
                twitter: ['auth_token', 'ct0']
            };

            const required = criticalCookies[platform];

            for (const cookieName of required) {
                const cookie = cookies.find(c => c.name === cookieName);
                if (!cookie) {
                    console.log(`❌ Missing critical cookie for ${platform}: ${cookieName}`);
                    return false;
                }

                // Check expiration
                if (cookie.expires && cookie.expires < currentTimestamp) {
                    console.log(`❌ Expired cookie for ${platform}: ${cookieName}`);
                    return false;
                }
            }

            console.log(`✅ Valid cookies found for ${platform}`);
            return true;
        } catch (error) {
            console.log(`❌ Error checking cookies for ${platform}:`, error.message);
            return false;
        }
    }

    async saveCookies(platform, cookies) {
        try {
            const cookiesPath = path.join(this.cookieDir, `${platform}_cookies.json`);
            const cookieData = {
                cookies: cookies,
                timestamp: Date.now(),
                platform: platform
            };
            await fs.writeJson(cookiesPath, cookieData, { spaces: 2 });
            console.log(`✅ Cookies saved for ${platform}`);
        } catch (error) {
            console.log(`❌ Error saving cookies for ${platform}:`, error.message);
        }
    }

    async loadCookies(platform) {
        try {
            const cookiesPath = path.join(this.cookieDir, `${platform}_cookies.json`);
            if (await fs.pathExists(cookiesPath)) {
                const data = await fs.readJson(cookiesPath);
                return data.cookies || data; // Support both new and old formats
            }
            return [];
        } catch (error) {
            console.log(`❌ Error loading cookies for ${platform}:`, error.message);
            return [];
        }
    }

    async clearCookies(platform) {
        try {
            const cookiesPath = path.join(this.cookieDir, `${platform}_cookies.json`);
            if (await fs.pathExists(cookiesPath)) {
                await fs.remove(cookiesPath);
                console.log(`✅ Cookies cleared for ${platform}`);
            }
        } catch (error) {
            console.log(`❌ Error clearing cookies for ${platform}:`, error.message);
        }
    }

    async getCookieAge(platform) {
        try {
            const cookiesPath = path.join(this.cookieDir, `${platform}_cookies.json`);
            if (await fs.pathExists(cookiesPath)) {
                const data = await fs.readJson(cookiesPath);
                if (data.timestamp) {
                    const ageHours = (Date.now() - data.timestamp) / (1000 * 60 * 60);
                    return ageHours;
                }
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    async shouldRefreshCookies(platform, maxAgeHours = 24) {
        const age = await this.getCookieAge(platform);
        return age === null || age > maxAgeHours;
    }
}