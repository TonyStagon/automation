#!/usr/bin/env node

/**
 * Test script for Facebook image upload automation
 * Tests the enhanced sequence: image upload FIRST, then caption
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

// Create a test image in the automation-server/uploads directory
const uploadsDir = './automation-server/uploads';
const testImagePath = path.join(uploadsDir, `test-image-${Date.now()}.png`);

// Create a simple test image (red square)
async function createTestImage() {
    try {
        await fs.ensureDir(uploadsDir);

        // Copy an existing image if available, or create a placeholder
        const existingImages = await fs.readdir(uploadsDir);
        if (existingImages.length > 0) {
            const firstImage = path.join(uploadsDir, existingImages[0]);
            await fs.copy(firstImage, testImagePath);
            console.log(`📸 Using existing image: ${testImagePath}`);
        } else {
            // Create a simple test image using a base64 placeholder
            const placeholderImage = Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                'base64'
            );
            await fs.writeFile(testImagePath, placeholderImage);
            console.log(`📸 Created test image: ${testImagePath}`);
        }
        return testImagePath;
    } catch (error) {
        console.error('Error creating test image:', error.message);
        process.exit(1);
    }
}

// Test the full automation with image upload
async function testImageAutomation() {
    console.log('🧪 Testing Facebook image upload automation...');
    console.log('🎯 Testing sequence: IMAGE UPLOAD FIRST → THEN CAPTION');

    const imagePath = await createTestImage();

    // Set environment variables for the automation
    const env = {
        ...process.env,
        FB_IMAGE_PATH: imagePath,
        HEADLESS: 'true', // Run in headless mode for testing
        FB_USERNAME: process.env.FB_USERNAME,
        FB_PASSWORD: process.env.FB_PASSWORD
    };

    if (!env.FB_USERNAME || !env.FB_PASSWORD) {
        console.error('❌ Error: FB_USERNAME and FB_PASSWORD environment variables are required');
        console.log('📝 Set them in your .env file or export them before running this test');
        process.exit(1);
    }

    console.log(`🔧 Environment configured:`);
    console.log(`   - FB_IMAGE_PATH: ${env.FB_IMAGE_PATH}`);
    console.log(`   - HEADLESS: ${env.HEADLESS}`);
    console.log(`   - FB_USERNAME: ${env.FB_USERNAME}`);
    console.log('');

    // Execute the Facebook automation script
    console.log('🚀 Starting Facebook automation with image upload...');
    const automationProcess = spawn('node', ['facebook-demo-test.js'], {
        env,
        stdio: 'pipe'
    });

    automationProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(output);

        // Look for specific success indicators
        if (output.includes('Image upload processed successfully')) {
            console.log('✅ IMAGE UPLOAD PROCESS STARTED SUCCESSFULLY');
        }
        if (output.includes('Typing post content (after image upload)')) {
            console.log('✅ CORRECT SEQUENCE: Image uploaded first, now typing caption');
        }
        if (output.includes('Post published successfully')) {
            console.log('🎉 AUTOMATION COMPLETED SUCCESSFULLY WITH IMAGE!');
        }
    });

    automationProcess.stderr.on('data', (data) => {
        console.error('❌ ERROR:', data.toString());
    });

    automationProcess.on('close', (code) => {
        console.log(`\n📊 Automation process exited with code ${code}`);

        // Clean up test image
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log('🧹 Cleaned up test image');
        }

        if (code === 0) {
            console.log('🎉 TEST PASSED: Image upload automation completed successfully!');
            console.log('✅ Sequence: Image → Caption (Facebook preferred flow)');
        } else {
            console.log('❌ TEST FAILED: Automation encountered errors');
            console.log('💡 Check the debug screenshots in automation-server/debug-screenshots/');
        }
    });
}

// Check if we should run the automation server first
const runServerFirst = process.argv.includes('--with-server');

if (runServerFirst) {
    console.log('🔄 Starting automation server first...');

    const serverProcess = spawn('node', ['automation-server/server.js'], {
        stdio: 'pipe',
        cwd: process.cwd()
    });

    serverProcess.stdout.on('data', (data) => {
        console.log('[SERVER]', data.toString().trim());
        if (data.toString().includes('Server running on port')) {
            console.log('✅ Automation server started successfully');
            // Wait a bit for server to stabilize, then run the test
            setTimeout(testImageAutomation, 2000);
        }
    });

    serverProcess.stderr.on('data', (data) => {
        console.error('[SERVER ERROR]', data.toString());
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down server...');
        serverProcess.kill('SIGINT');
        process.exit(0);
    });
} else {
    // Just run the test
    testImageAutomation();
}