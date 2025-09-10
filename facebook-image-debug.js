#!/usr/bin/env node

/**
 * Facebook Image Upload Debugging Script
 * Tests image upload functionality step by step
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

// Test parameters
const UPLOADS_DIR = './automation-server/uploads';
const TEST_IMAGE_PATH = path.join(UPLOADS_DIR, 'diagnostic_test_image.png');
const DEBUG_SCREENSHOTS = './debug-diagnostic';

class FacebookImageDebugger {
    constructor() {
        this.testResults = [];
    }

    async testStep(name, action) {
        console.log(`\n🔍 ${name}...`);
        try {
            const result = await action();
            this.testResults.push({ step: name, success: true, result });
            console.log('✅ SUCCESS');
            return result;
        } catch (error) {
            this.testResults.push({ step: name, success: false, error: error.message });
            console.log('❌ FAILED:', error.message);
            throw error;
        }
    }

    async createTestImage() {
        // Create a simple test image (1x1 pixel PNG)
        const pngBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            'base64'
        );

        await fs.ensureDir(UPLOADS_DIR);
        await fs.writeFile(TEST_IMAGE_PATH, pngBuffer);
        console.log(`📸 Created test image: ${TEST_IMAGE_PATH}`);
        return TEST_IMAGE_PATH;
    }

    async testFileExists(imagePath) {
        const exists = await fs.pathExists(imagePath);
        if (!exists) {
            throw new Error(`Image file does not exist: ${imagePath}`);
        }

        const stats = await fs.stat(imagePath);
        console.log(`📄 File info: ${stats.size} bytes, created ${stats.birthtime}`);
        return true;
    }

    async testEnvironmentSetup() {
        if (!process.env.FB_USERNAME || !process.env.FB_PASSWORD) {
            throw new Error('Facebook credentials not set in environment variables');
        }

        console.log('✅ Facebook credentials available');
        console.log('✅ Uploads directory exists:', await fs.pathExists(UPLOADS_DIR));
        return true;
    }

    async testUploadFunction(imagePath) {
        // Test the upload function directly with detailed debugging
        return new Promise((resolve, reject) => {
            const env = {
                ...process.env,
                FB_IMAGE_PATH: imagePath,
                HEADLESS: 'false', // Show browser for debugging
                KEEP_BROWSER_OPEN: 'true'
            };

            console.log(`🚀 Testing upload with image: ${imagePath}`);
            console.log(`📁 FB_IMAGE_PATH environment: ${env.FB_IMAGE_PATH}`);

            const scriptPath = path.resolve('./facebook-demo-test.js');
            const execOptions = { env, timeout: 120000 }; // 2 minute timeout

            exec(`node ${scriptPath} "DIAGNOSTIC TEST: Image upload test"`, execOptions, (error, stdout, stderr) => {
                console.log('='.repeat(60));
                console.log('SCRIPT OUTPUT:');
                console.log('='.repeat(60));

                if (stdout) {
                    // Filter and display key output lines
                    const keyLines = stdout.split('\n').filter(line =>
                        (line.includes('📸') || line.includes('🖱️') || line.includes('📁') ||
                            line.includes('✅') || line.includes('❌') || line.includes('⚠️') ||
                            line.includes('upload') || line.includes('image') || line.includes('photo') ||
                            line.includes('SUCCESS') || line.includes('FAILED')) &&
                        !line.includes('password') // Avoid showing credentials
                    );

                    keyLines.forEach(line => console.log(line));
                }

                if (stderr) {
                    console.log('STDERR:', stderr);
                }

                if (error) {
                    console.log('❌ SCRIPT ERROR:', error.message);
                    reject(error);
                } else {
                    // Analyze output for success
                    const successIndicators = [
                        'Image uploaded successfully',
                        'Post published successfully',
                        'SUCCESS! Enhanced Facebook automation completed'
                    ];

                    const hasSuccess = successIndicators.some(indicator =>
                        stdout.includes(indicator)
                    );

                    if (hasSuccess) {
                        console.log('🎉 UPLOAD TEST COMPLETED SUCCESSFULLY');
                        resolve({ success: true, output: stdout });
                    } else {
                        console.log('⚠️ Script completed but may not have uploaded successfully');
                        resolve({ success: false, output: stdout });
                    }
                }
            });
        });
    }

    async runAllTests() {
            console.log('\n🎯 FACEBOOK IMAGE UPLOAD DIAGNOSTIC');
            console.log('='.repeat(60));

            try {
                // Step 1: Environment check
                await this.testStep('Check environment setup', () => this.testEnvironmentSetup());

                // Step 2: Create test image
                const imagePath = await this.testStep('Create test image', () => this.createTestImage());

                // Step 3: Verify file exists
                await this.testStep('Verify image file exists', () => this.testFileExists(imagePath));

                // Step 4: Test upload functionality
                const result = await this.testStep('Test upload function', () => this.testUploadFunction(imagePath));

                console.log('\n' + '='.repeat(60));
                console.log('📊 DIAGNOSTIC RESULTS:');
                console.log('='.rep