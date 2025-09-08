import puppeteer from 'puppeteer';
import fs from 'fs-extra';

async function analyzeTwitterUI() {
    console.log('🔍 Analyzing Twitter/X login page structure...');

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        await page.goto('https://x.com/i/flow/login', { waitUntil: 'networkidle0', timeout: 30000 });

        // Wait a bit for page to load
        await page.waitForTimeout(5000);

        console.log('📋 Current Twitter Login Page Analysis:');
        console.log('='.repeat(60));

        // Analyze page title and URL
        const pageTitle = await page.title();
        const currentUrl = page.url();
        console.log(`🌐 Page Title: ${pageTitle}`);
        console.log(`🔗 Current URL: ${currentUrl}`);

        // Capture all input fields
        const inputs = await page.$$eval('input', elements =>
            elements.map(el => ({
                type: el.type,
                name: el.name,
                placeholder: el.placeholder,
                id: el.id,
                'data-testid': el.getAttribute('data-testid'),
                autocomplete: el.autocomplete,
                class: el.className
            }))
        );

        console.log('\n📝 INPUT FIELDS FOUND:');
        inputs.forEach((input, index) => {
            console.log(`${index + 1}. Type: ${input.type}, Name: ${input.name}, Placeholder: ${input.placeholder}`);
            console.log(`   ID: ${input.id}, Data-testid: ${input['data-testid']}, Autocomplete: ${input.autocomplete}`);
        });

        // Capture all buttons
        const buttons = await page.$$eval('button, [role="button"]', elements =>
            elements.map(el => ({
                tagName: el.tagName,
                text: el.textContent ? el.textContent.trim() : '',
                type: el.type,
                'data-testid': el.getAttribute('data-testid'),
                class: el.className,
                disabled: el.disabled
            }))
        );

        console.log('\n🖱️ BUTTONS FOUND:');
        buttons.forEach((button, index) => {
            console.log(`${index + 1}. Tag: ${button.tagName}, Text: "${button.text}", Type: ${button.type}`);
            console.log(`   Data-testid: ${button['data-testid']}, Disabled: ${button.disabled}`);
        });

        // Capture form structure
        const forms = await page.$$eval('form', elements =>
            elements.map((form, index) => ({
                index,
                id: form.id,
                action: form.action,
                method: form.method,
                'data-testid': form.getAttribute('data-testid')
            }))
        );

        console.log('\n📋 FORMS FOUND:');
        forms.forEach(form => {
            console.log(`Form ${form.index}: ID=${form.id}, Action=${form.action}, Method=${form.method}`);
            console.log(`   Data-testid: ${form['data-testid']}`);
        });

        // Take screenshot for reference
        await page.screenshot({ path: './twitter-login-analysis.png', fullPage: true });
        console.log('\n📸 Screenshot saved: twitter-login-analysis.png');

    } catch (error) {
        console.error('❌ Analysis failed:', error.message);

        // Still try to get basic page info
        try {
            const pageTitle = await page.title();
            console.log(`Basic page info - Title: ${pageTitle}`);
        } catch (e) {
            console.log('Could not retrieve basic page information');
        }

    } finally {
        await browser.close();
    }
}

// Run the analysis
analyzeTwitterUI().catch(console.error);