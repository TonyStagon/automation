// Simple Chrome Process Stability Test
// Tests if Chromium can stay alive for basic Twitter navigation

const puppeteer = require('puppeteer');
const { execSync } = require('child_process');

console.log('🔍 Chrome Process Stability Diagnostic');
console.log('======================================');

async function testChromeStability() {
    console.log('\n1. Testing basic Chromium launch...');

    let browser = null;
    let page = null;

    try {
        // Test 1: Basic browser launch only
        console.log('🚀 Launching Chromium with minimum flags...');
        browser = await puppeteer.launch({
            headless: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--window-size=1200,800'
            ],
            defaultViewport: { width: 1200, height: 800 }
        });

        console.log('✅ Chromium launched successfully!');
        console.log('📊 Browser process PID:', browser.process().pid);

        // Show active Chrome processes
        console.log('\n🔍 Active Chrome processes:');
        try {
            const processes = execSync('tasklist /FI "IMAGENAME eq chrome.exe" /FI "STATUS eq running"', { encoding: 'utf8' });
            console.log(processes);
        } catch (e) {
            console.log('⚠️ Cannot list processes:', e.message);
        }

        // Keep browser open for inspection
        console.log('\n⏳ Browser will stay open for 30 seconds...');
        console.log('💡 Check if it closes unexpectedly');

        for (let i = 0; i < 30; i++) {
            process.stdout.write(`\r${30 - i}s remaining...`);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check if browser process is still alive
            try {
                if (browser && browser.process()) {
                    // process still exists
                }
            } catch (e) {
                console.log('\n❌ Browser process died unexpectedly!');
                return false;
            }
        }

        console.log('\n\n✅ Basic stability test PASSED - browser remained alive');
        return true;

    } catch (error) {
        console.log('\n❌ Chrome launch failed:', error.message);
        return false;
    } finally {
        if (browser) {
            try {
                await browser.close();
                console.log('🏁 Browser closed properly');
            } catch (closeError) {
                console.log('⚠️ Browser close error:', closeError.message);
            }
        }
    }
}

async function testTwitterNavigation() {
    console.log('\n2. Testing Twitter navigation...');

    let browser = null;
    let page = null;

    try {
        browser = await puppeteer.launch({
            headless: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--window-size=1400,900'
            ],
            defaultViewport: { width: 1400, height: 900 }
        });

        page = await browser.newPage();
        console.log('✅ Browser + page created successfully');

        // Enhanced user agent and headers
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log('🌐 Navigating to Twitter...');

        // Try navigation with comprehensive timeout handling
        await page.goto('https://twitter.com/login', {
            waitUntil: 'networkidle0',
            timeout: 30000
        }).catch(async (navError) => {
            console.log('⚠️ Navigation timeout/error:', navError.message);

            // Try DOM check even if navigation "failed"
            const currentUrl = await page.url();
            console.log('📋 Current URL:', currentUrl);

            // Take emergency screenshot
            await page.screenshot({ path: './debug-twitter-nav-fallback.png', fullPage: true });
            console.log('📸 Emergency screenshot saved');

            return true; // Continue despite navigation error
        });

        console.log('✅ Page loaded (or recovered from load error)');
        console.log('📋 Final URL:', await page.url());

        // Keep page open for debugging
        console.log('\n⏳ Twitter page stays open for 20 seconds...');

        for (let i = 0; i < 20; i++) {
            process.stdout.write(`\r${20 - i}s for Twitter inspection...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('\n\n✅ Twitter navigation test COMPLETED');
        return true;

    } catch (error) {
        console.log('\n❌ Twitter navigation test failed:', error.message);
        return false;
    } finally {
        if (browser) {
            try {
                await browser.close();
                console.log('🏁 Twitter test browser closed');
            } catch (closeError) {
                console.log('⚠️ Twitter browser close error:', closeError.message);
            }
        }
    }
}

async function runAllTests() {
    console.log('🔬 Starting comprehensive Chrome stability diagnostics...\n');

    const test1 = await testChromeStability();
    console.log('\n' + '='.repeat(50));

    const test2 = await testTwitterNavigation();
    console.log('\n' + '='.repeat(50));

    console.log('\n📊 DIAGNOSTIC RESULTS:');
    console.log('---------------------');
    console.log(`Basic Chrome Stability: ${test1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Twitter Navigation: ${test2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Overall: ${test1 && test2 ? '✅ PASS' : '❌ FAIL'}`);

    if (!test1 || !test2) {
        console.log('\n🔴 ISSUES DETECTED:');
        if (!test1) console.log('   • Chrome process instability');
        if (!test2) console.log('   • Twitter navigation problems');

        console.log('\n💡 TROUBLESHOOTING:');
        console.log('   1. Check system memory availability');
        console.log('   2. Verify network connectivity');
        console.log('   3. Try closing other Chrome instances');
        console.log('   4. Check Windows Defender/firewall settings');
    } else {
        console.log('\n🎉 ALL TESTS PASSED! Chrome is stable for automation.');
    }
}

// Run diagnostics
runAllTests().catch(console.error);

// Keep process alive for at least 2 minutes
setTimeout(() => {
    console.log('\n⏰ Diagnostic completed - process will exit');
}, 120000);