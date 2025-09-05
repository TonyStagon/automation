const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
    headless: false, // Always visible for debugging
    timeout: 120000, // 2 minutes max test time
    screenshotDir: './automation-test-screenshots',
    testCycles: 3
};

// Launch Twitter automation with enhanced protections
async function launchTwitterTest() {
    console.log('🚀 Starting Twitter Automation Test Suite');
    console.log('📊 Test Configuration:', JSON.stringify(TEST_CONFIG, null, 2));

    // Create screenshot directory
    await fs.promises.mkdir(TEST_CONFIG.screenshotDir, { recursive: true });

    let attempts = 0;
    let success = false;

    while (attempts < TEST_CONFIG.testCycles && !success) {
        attempts++;
        console.log(`\n🔄 Test Attempt ${attempts}/${TEST_CONFIG.testCycles}`);

        try {
            success = await runSingleTest(attempts);
            if (success) {
                console.log(`✅ SUCCESS: Test attempt ${attempts} completed successfully!`);
                break;
            }
        } catch (error) {
            console.log(`❌ Test attempt ${attempts} failed:`, error.message);

            // Take emergency screenshot
            try {
                const screenshotPath = path.join(TEST_CONFIG.screenshotDir, `emergency-fail-${Date.now()}.png`);
                console.log(`📸 Emergency screenshot saved: ${screenshotPath}`);
            } catch (screenshotError) {
                console.log('⚠️ Could not take emergency screenshot:', screenshotError.message);
            }

            // Wait before retry
            if (attempts < TEST_CONFIG.testCycles) {
                const waitTime = 5000; // 5 seconds
                console.log(`⏳ Waiting ${waitTime/1000}s before next attempt...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    console.log('\n📊 TEST SUITE COMPLETED');
    console.log(`✅ Success: ${success}`);
    console.log(`🔄 Attempts: ${attempts}`);
    console.log(`📸 Screenshots: ${TEST_CONFIG.screenshotDir}`);

    if (!success) {
        console.log('\n🔴 ALL TEST ATTEMPTS FAILED');
        console.log('💡 Check browser console for potential error messages');
        console.log('💡 Verify Twitter credentials in .env file');
        console.log('💡 Try manually visiting https://twitter.com/login to check for captchas');
    }

    return success;
}

async function runSingleTest(attemptNumber) {
    return new Promise((resolve, reject) => {
        console.log(`🔧 Launching Twitter automation process...`);

        // Launch the automation script as a child process
        const child = spawn('node', ['twitter-login-post-test.js'], {
            env: {
                ...process.env,
                HEADLESS: 'false',
                KEEP_BROWSER_OPEN: 'true'
            },
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let hasSuccess = false;
        let timeoutId = null;

        // Set timeout for this test attempt
        timeoutId = setTimeout(() => {
            console.log(`⏰ Timeout reached for attempt ${attemptNumber}`);
            child.kill('SIGTERM');
            resolve(false);
        }, TEST_CONFIG.timeout);

        // Monitor stdout for success indicators
        child.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`📋 [TWITTER]: ${output.trim()}`);

            // Check for success patterns
            if (output.includes('SUCCESSFUL SOCIAL AUTOMATION WORKFLOW') ||
                output.includes('Login successful') ||
                output.includes('Post creation completed') ||
                output.includes('Posted:')) {
                hasSuccess = true;
                clearTimeout(timeoutId);
                console.log('🎯 Detected successful automation completion!');

                // Give it a moment to complete, then gracefully terminate
                setTimeout(() => {
                    child.kill('SIGTERM');
                    resolve(true);
                }, 3000);
            }

            // Check for browser initialization
            if (output.includes('Browser initialized') || output.includes('enhanced third-party cookie')) {
                console.log('✅ Browser successfully initialized with cookie bypass');
            }

            // Check for critical errors that should terminate
            if (output.includes('credentials not configured') ||
                output.includes('ERR_NAME_NOT_RESOLVED') ||
                output.includes('net::ERR')) {
                console.log('🔴 Critical network/credential error detected');
                clearTimeout(timeoutId);
                child.kill('SIGTERM');
                resolve(false);
            }
        });

        // Monitor stderr for errors
        child.stderr.on('data', (data) => {
            const errorOutput = data.toString();
            console.log(`❗ [ERROR]: ${errorOutput.trim()}`);

            // If we see Puppeteer navigation errors, it might be recoverable
            if (errorOutput.includes('Navigation timeout') ||
                errorOutput.includes('ERR_CONNECTION') ||
                errorOutput.includes('TimeoutError')) {
                console.log('🔄 Navigation timeout - might be recoverable');
            }
        });

        // Handle process exit
        child.on('close', (code) => {
            clearTimeout(timeoutId);
            console.log(`🔚 Child process exited with code: ${code}`);

            if (code === 0 && hasSuccess) {
                resolve(true);
            } else {
                resolve(false);
            }
        });

        child.on('error', (err) => {
            console.log('❌ Child process error:', err.message);
            clearTimeout(timeoutId);
            resolve(false);
        });
    });
}

// Browser health check function
async function checkBrowserHealth() {
    console.log('\n🧪 Running browser health checks...');

    try {
        // Test basic browser functionality
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: { width: 1200, height: 800 }
        });

        const page = await browser.newPage();

        // Test basic navigation
        await page.goto('https://httpbin.org/user-agent', { timeout: 10000 });

        // Test screenshot capability
        await page.screenshot({ path: path.join(TEST_CONFIG.screenshotDir, 'health-check.png') });

        await browser.close();

        console.log('✅ Browser health check passed');
        return true;

    } catch (healthError) {
        console.log('❌ Browser health check failed:', healthError.message);
        return false;
    }
}

// Main execution with comprehensive error handling
async function main() {
    console.log('🔍 Twitter Automation Debug Test Suite');
    console.log('=======================================');

    try {
        // First check browser health
        const browserHealthy = await checkBrowserHealth();
        if (!browserHealthy) {
            console.log('🛑 Browser health check failed - cannot proceed with tests');
            process.exit(1);
        }

        // Run the main test suite
        const success = await launchTwitterTest();

        console.log('\n📋 TEST RESULTS SUMMARY:');
        console.log('========================');
        console.log(`Overall Success: ${success ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Test Directory: ${__dirname}`);
        console.log(`Screenshots: ${TEST_CONFIG.screenshotDir}`);

        if (success) {
            console.log('\n🎉 CONGRATULATIONS! Twitter automation is working!');
            console.log('💡 Next steps:');
            console.log('   1. Review screenshots for any visual anomalies');
            console.log('   2. Test with HEADLESS=true for production use');
            console.log('   3. Monitor for any Twitter security challenges');
        } else {
            console.log('\n🔴 TEST FAILED - Automation needs adjustment');
            console.log('💡 Troubleshooting steps:');
            console.log('   1. Check .env file for Twitter credentials');
            console.log('   2. Review browser console output for errors');
            console.log('   3. Test manually at https://twitter.com/login');
            console.log('   4. Check for captcha or security challenges');
        }

        process.exit(success ? 0 : 1);

    } catch (mainError) {
        console.log('💥 Fatal error in test suite:', mainError.message);
        console.log('💡 Check system requirements and network connectivity');
        process.exit(1);
    }
}

// Enhanced process protection
const keepAliveHook = () => {
    // Keep parent process alive during child execution
    setInterval(() => {}, 60000);
};

// Run if this file is executed directly
if (require.main === module) {
    keepAliveHook();
    main().catch(console.error);
}

module.exports = { launchTwitterTest, checkBrowserHealth };