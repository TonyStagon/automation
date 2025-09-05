import fs from 'fs-extra';
import path from 'path';

// Simple test script to demonstrate cookie handling
console.log('🧪 TEST: Facebook Demo Cookie Handling Analysis');

console.log('\n📁 Checking file structure:');
console.log('Current directory:', process.cwd());

// Check if cookies exist
const cookiePath = './cookies/facebook_cookies.json';
const cookiesExist = fs.existsSync(cookiePath);

console.log('\n🍪 Cookie Status:', cookiesExist ? 'FOUND' : 'NOT FOUND');

if (cookiesExist) {
    try {
        const cookieData = fs.readFileSync(cookiePath, 'utf8');
        const cookies = JSON.parse(cookieData);
        console.log(`📦 Cookies count: ${cookies.length}`);
        console.log(`🔐 Domain: ${cookies[0]?.domain || 'unknown'}`);
        console.log(`⏰ Expiry: ${cookies[0]?.expires ? new Date(cookies[0].expires * 1000).toLocaleString() : 'none'}`);
        console.log('📋 Cookie names:', cookies.map(c => c.name).join(', '));

        // Check if demo screenshots directory exists
        const screenshotDir = './demo-screenshots';
        const hasScreenshots = fs.existsSync(screenshotDir);

        if (hasScreenshots) {
            const screenshots = fs.readdirSync(screenshotDir)
                .filter(file => file.endsWith('.png') || file.endsWith('.txt'));
            console.log(`\n📸 Screenshots available: ${screenshots.length}`);

            if (screenshots.length > 0) {
                console.log('   Recent files:');
                screenshots.slice(-5).forEach(file => {
                    console.log(`   - ${file}`);
                });
            }
        } else {
            console.log('\n📸 No screenshot directory found');
            fs.ensureDirSync(screenshotDir);
            console.log('✅ Created demo-screenshots directory');
        }

    } catch (error) {
        console.log('❌ Error reading cookies:', error.message);
    }
} else {
    console.log('\n📝 To test cookie persistence:');
    console.log('1. Run the demo once to log in and create cookies');
    console.log('2. Run it again - it should detect you\'re already logged in');
    console.log('3. The demo will continue to post creation automatically');
    console.log('4. Screenshots are stored in ./demo-screenshots/');

    // Create cookies directory if it doesn't exist
    fs.ensureDirSync('./cookies');
    console.log('✅ Created cookies directory');
}

console.log('\n🚀 To run the enhanced demo:');
console.log('1. Set environment variables:');
console.log('   export FB_USERNAME=your_email@example.com');
console.log('   export FB_PASSWORD=your_password');
console.log('2. Run: node facebook-demo-test.js');

console.log('\n🎯 THE ENHANCEMENT:');
console.log('✅ Multiple login state detection selectors');
console.log('✅ Checks URL, login fields, and logged-in UI elements');
console.log('✅ Always continues to post creation if login succeeds or already logged in');
console.log('✅ Detailed logging and summary reports');
console.log('✅ Cookie persistence tracking');

console.log('\n🔍 Try:');
console.log('- First run: Full login + post creation + cookie save');
console.log('- Second run: Already logged in detection + post creation');
console.log('- Screenshots provide visual confirmation of each step');

console.log('\n🏁 Test ready - run the demo to see cookie persistence in action!');