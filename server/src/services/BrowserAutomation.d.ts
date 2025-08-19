import { JobData, BrowserAutomationResult } from '../types';
export declare class BrowserAutomation {
    private static instance;
    private puppeteerBrowser;
    private playwrightBrowser;
    private constructor();
    static getInstance(): BrowserAutomation;
    initializeBrowser(browserType?: 'puppeteer' | 'playwright', headless?: boolean): Promise<void>;
    postToFacebook(jobData: JobData, browserType?: 'puppeteer' | 'playwright', headless?: boolean): Promise<BrowserAutomationResult>;
    private postToFacebookPuppeteer;
    private postToFacebookPlaywright;
    closeBrowsers(): Promise<void>;
}
export declare const browserAutomation: BrowserAutomation;
//# sourceMappingURL=BrowserAutomation.d.ts.map