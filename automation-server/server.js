const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Automation server is running' });
});

// Run Facebook debug script - Updated to handle image files
app.post('/api/automation/run-facebook-debug', async(req, res) => {
            try {
                // Parse request data
                const { caption, imageFileName, headless = 'false', keepBrowserOpen = 'true' } = req.body;

                console.log(`Executing Facebook automation with caption: "${caption}"${imageFileName ? ` and image: ${imageFileName}` : ''}`);

        // Check if file exists if imageFileName is provided
        if (imageFileName) {
            const imageFilePath = path.join(__dirname, 'uploads', imageFileName);
            const imageExists = fs.existsSync(imageFilePath);

            console.log(`📸 Image path: ${imageFilePath}`);
            console.log(`🔄 Verifying image file exists: ${imageExists ? '✅ YES' : '❌ NO'}`);

            if (!imageExists) {
                console.log('❌ Image file not found, proceeding without image');
            }
        }

        // Prepare environment variables
        const env = {
            ...process.env,
            KEEP_BROWSER_OPEN: keepBrowserOpen,
            HEADLESS: headless,
            BROWSER_TIMEOUT: '60000',
            PAGE_TIMEOUT: '30000',
            FB_IMAGE_PATH: imageFileName ? path.join(__dirname, 'uploads', imageFileName) : ''
        };

        const scriptPath = path.join(__dirname, '../facebook-demo-test.js');
        const execOptions = {
            env,
            timeout: 0,
            maxBuffer: 1024 * 1024 * 10
        };

        // Escape caption for command line to handle special characters
        const escapedCaption = caption ? caption.replace(/"/g, '\\"').replace(/'/g, "\\'") : 'Default automated post';

        exec(`node ${scriptPath} "${escapedCaption}"`, execOptions, (error, stdout, stderr) => {
            if (error) {
                console.error('Error running Facebook debug script:', error);
                console.error('Stderr:', stderr);

                // Enhanced error detection with image context
                let errorType = imageFileName ? 'Failed to run automation script with image' : 'Failed to run automation script';
                if (error.message.includes('timeout')) {
                    errorType = `Facebook automation took too long ${imageFileName ? 'with image upload' : ''}`;
                } else if (facebook_require_manual_image) {
                    errorType += ' - Manual image review may be needed';
                }

                return res.status(500).json({
                    success: false,
                    error: errorType,
                    details: stderr || error.message
                });
            }

            console.log('Facebook automation output:', stdout);
            console.log('Image processing indication:', imageFileName ? 'Image upload attempted' : 'Text-only post');

            // Enhanced success detection with image context
            const hasSuccess = stdIncludesAny(stdout, [
                'SUCCESS! Enhanced Facebook automation completed',
                '✅ Post published successfully',
                '🎉 SUCCESS! Enhanced Facebook automation completed',
                'Browser kept open',
                'Post published successfully: SUCCESS',
                '✅ Login successful: SUCCESS',
                'EXECUTION SUMMARY:',
                '📈 Completion rate: 8/8 steps (100%)',
                'Posted:'
            ]);

            if (hasSuccess) {
                // Enhanced result analysis for image posts
                const postedWithImage = imageFileName && stdout.includes('SUCCESS!') && !stdout.includes('SCRIPT COMPLETED');
                const postedTextOnly = !imageFileName && stdout.includes('SUCCESS!');

                res.json({
                    success: true,
                    output: stdout,
                    message: imageFileName ?
                        (postedWithImage ? '🎉 Facebook post with image created successfully!' : '🚧 Image upload attempted - check logs for results') :
                        '🎉 Facebook post created successfully!',
                    posted: postedWithImage || postedTextOnly,
                    caption: caption,
                    hasImage: !!imageFileName
                });
            } else {
                res.json({
                    success: false,
                    output: stdout,
                    error: 'Post creation may not have completed successfully',
                    imageProvided: !!imageFileName
                });
            }
        });
    } catch (error) {
        console.error('Error in run-facebook-debug:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Helper function to check if stdout includes any of the indicators
function stdIncludesAny(stdout, indicators) {
    return indicators.some(indicator => stdout.includes(indicator));
}

// Enhanced Twitter debug endpoint for manual debugging
app.post('/api/automation/run-twitter-debug', async(req, res) => {
    try {
        const { caption = 'Debugging Twitter automation', headless = 'false', keepBrowserOpen = 'true' } = req.body;
        const scriptPath = path.join(__dirname, '../twitter-demo-test.js');

        console.log(`🔧 Twitter debug mode: caption="${caption}", headless=${headless}`);

        const env = {
            ...process.env,
            KEEP_BROWSER_OPEN: keepBrowserOpen,
            HEADLESS: headless,
            BROWSER_TIMEOUT: '180000',  // 3 minutes for manual debugging
            PAGE_TIMEOUT: '90000',
            TWITTER_DISABLE_STEALTH: 'false'  // Keep stealth enabled even for debug
        };

        const execOptions = {
            env,
            timeout: 0,
            maxBuffer: 1024 * 1024 * 15
        };

        // Escape caption for command-line safety
        const escapedCaption = caption.replace(/"/g, '\\"').replace(/'/g, "\\'");

        console.log('🪲 Launching Twitter automation in debug mode...');
        
        exec(`node ${scriptPath} "${escapedCaption}"`, execOptions, (error, stdout, stderr) => {
            if (error) {
                console.error('Twitter debug error:', error.message);
                
                // Enhanced error analysis for debugging
                let errorType = 'Script execution error';
                if (error.message.includes('timeout')) errorType = 'Operation timed out';
                if (error.message.includes('login')) errorType = 'Login authentication failed';
                
                res.status(500).json({
                    success: false,
                    error: errorType,
                    details: stderr || error.message,
                    troubleshooting: [
                        '🛠️  Debug suggestions:',
                        '• Check if Chrome/Chromium is installed correctly',
                        '• Verify Twitter credentials in .env file',
                        '• Delete cookies-twitter/ directory for fresh start',
                        headless === 'true' ? '• Try running with headless=false for visual debugging' : null
                    ].filter(Boolean)
                });
                return;
            }

            console.log('📋 Twitter debug completed with output:', stdout.slice(-200));

            // Advanced success detection tailored for debugging
            const successIndicators = [
                '🎉 Tweet posted:',
                '✅ Tweet posted successfully',
                'SUCCESS! Enhanced Twitter automation completed',
                '📈 Completion rate:.*[6789]\d%', // 60-99% completion
                !headless ? 'Keeping browser open' : 'Enhanced stealth browser initialized',
                'Browser will stay open',
                'Authentication completed successfully'
            ];

            const isSuccess = stdIncludesAny(stdout, successIndicators);
            
            if (isSuccess) {
                res.json({
                    success: true,
                    output: stdout,
                    message: 'Twitter debugging completed - check browser for visual inspection',
                    debugInfo: {
                        keepBrowserOpen: keepBrowserOpen === 'true',
                        headless: headless === 'true',
                        executionMode: headless === 'true' ? 'Background' : 'Visible'
                    }
                });
            } else {
                res.json({
                    success: false,
                    output: stdout,
                    error: 'Debug execution completed but may not have achieved full success',
                    debugDetails: {
                        likelyCause: stdout.includes('login') ? 'Login issues' :
                                   stdout.includes('tweet') ? 'Composer/tweet issues' : 'Network or timing',
                        recommendation: 'Run with headless=false for visual inspection'
                    }
                });
            }
        });
    } catch (error) {
        console.error('Twitter debug endpoint error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during Twitter debugging',
            details: error.message
        });
    }
});
// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Enhanced Instagram debug script with image upload support
app.post('/api/automation/run-instagram-debug', async(req, res) => {
    try {
        const scriptPath = path.join(__dirname, '../instagram-login-post-test.js');
        const { caption = 'Hello I am New Here', imageFileName, headless = 'false', keepBrowserOpen = 'true' } = req.body;

        console.log(`📸 Executing Instagram automation with caption: "${caption}"${imageFileName ? ` and image: ${imageFileName}` : ''}`);

        // Check if file exists if imageFileName is provided
        if (imageFileName) {
            const imageFilePath = path.join(__dirname, 'uploads', imageFileName);
            const imageExists = fs.existsSync(imageFilePath);

            console.log(`📸 Instagram image path: ${imageFilePath}`);
            console.log(`🔄 Verifying image file exists: ${imageExists ? '✅ YES' : '❌ NO'}`);

            if (!imageExists) {
                console.log('❌ Image file not found, proceeding without image');
            }
        }

        // Updated environment variables for Instagram automation
        const env = {
            ...process.env,
            KEEP_BROWSER_OPEN: keepBrowserOpen,
            HEADLESS: headless,
            BROWSER_TIMEOUT: '60000',
            PAGE_TIMEOUT: '30000',
            // Instagram-specific image support
            INSTA_IMAGE_PATH: imageFileName ? path.join(__dirname, 'uploads', imageFileName) : '',
            INSTA_CAPTION: caption ? encodeURIComponent(caption) : ''
        };

        // Escape caption for command line to handle special characters
        const escapedCaption = caption.replace(/"/g, '\\"').replace(/'/g, "\\'");

        const execOptions = {
            env,
            timeout: 0,
            maxBuffer: 1024 * 1024 * 10
        };

        exec(`node ${scriptPath} "${escapedCaption}"`, execOptions, (error, stdout, stderr) => {
            if (error) {
                console.error('Error running Instagram debug script:', error);
                console.error('Stderr:', stderr);

                let errorType = imageFileName ? 'Failed to run Instagram automation script with image' : 'Failed to run automation script';
                if (error.message.includes('timeout')) {
                    errorType = `Instagram automation took too long ${imageFileName ? 'with image upload' : ''}`;
                }

                return res.status(500).json({
                    success: false,
                    error: errorType,
                    details: stderr || error.message
                });
            }

            console.log('Instagram automation output:', stdout);
            console.log('Image processing indication:', imageFileName ? 'Image upload attempted' : 'Text-only post');

            // Enhanced success detection with image context
            const instagramSuccessPatterns = [
                'SUCCESS! Instagram automation completed',
                '✅ Post published successfully',
                '🎉 SUCCESS! Instagram automation completed',
                'Browser kept open',
                'Post published',
                'Posted:',
                'Instagram posting successful'
            ];

            const hasSuccess = stdIncludesAny(stdout, instagramSuccessPatterns);

            if (hasSuccess) {
                // Enhanced result analysis for image posts
                const postedDetails = {
                    posted: stdout.includes('SUCCESS!') || stdout.includes('Published:') || stdout.includes('Posted:'),
                    withImage: imageFileName && stdout.includes('Image upload') && stdout.includes('success'),
                    loggedIn: stdout.includes('Already logged in') || stdout.includes('Login successful'),
                    hasBrowserOpen: stdout.includes('Browser kept open')
                };

                res.json({
                    success: true,
                    output: stdout.slice(-300),  // Last 300 characters
                    message: imageFileName ?
                        (postedDetails.withImage ? '🎉 Instagram post with image created successfully!' : '🚧 Image upload attempted - check logs for results') :
                        '🎉 Instagram post created successfully!',
                    posted: postedDetails.posted,
                    details: postedDetails,
                    caption: caption,
                    hasImage: !!imageFileName
                });
            } else {
                res.json({
                    success: false,
                    output: stdout.slice(-300),
                    error: 'Post creation may not have completed successfully',
                    hasImage: !!imageFileName
                });
            }
        });
    } catch (error) {
        console.error('Error in run-instagram-debug:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during Instagram automation',
            details: error.message
        });
    }
});

// Enhanced Twitter automation endpoint
app.post('/api/automation/run-twitter-action', async(req, res) => {
    try {
        const {
            caption = 'Hello from enhanced Twitter automation!',
            headless = 'false',
            keepBrowserOpen = 'true',
            imageFileName = null,
            action = 'post'  // post, login, debug
        } = req.body;

        console.log(`🐦 Running Twitter ${action} action with caption: "${caption}"`);

        const scriptPath = path.join(__dirname, '../twitter-demo-test.js');
        
        // Enhanced environment variables for Twitter automation
        const env = {
            ...process.env,
            KEEP_BROWSER_OPEN: keepBrowserOpen,
            HEADLESS: headless,
            // Updated timeouts for better Twitter reliability
            BROWSER_TIMEOUT: '120000',     // 2 minutes for browser operations
            PAGE_TIMEOUT: '90000',         // 1.5 minutes for page loads
            TWITTER_NAVIGATION_TIMEOUT: '120000',  // Extended Twitter navigation
            TWITTER_ACTION_TIMEOUT: '120000'       // Extended for tweet interactions
        };

        // Handle image if provided
        if (imageFileName) {
            const imagePath = path.join(__dirname, 'uploads', imageFileName);
            if (!fs.existsSync(imagePath)) {
                console.warn('⚠️ Image file not found, proceeding without image');
            } else {
                env.TWITTER_IMAGE_PATH = imagePath;
                console.log(`📸 Twitter image upload enabled: ${imagePath.slice(-20)}`);
            }
        }

        const execOptions = {
            env,
            timeout: 0,  // No timeout for Twitter automation
            maxBuffer: 1024 * 1024 * 20  // Large buffer for verbose output
        };

        // Escape caption and handle special characters
        const escapedCaption = caption.replace(/"/g, '\\"').replace(/'/g, "\\'");

        console.log('🚀 Starting enhanced Twitter automation...');
        console.log(`🔧 Settings: Headless=${headless}, KeepBrowserOpen=${keepBrowserOpen}`);

        const startTime = Date.now();
        
        exec(`node ${scriptPath} "${escapedCaption}"`, execOptions, (error, stdout, stderr) => {
            const executionTime = Date.now() - startTime;
            console.log(`⏱️ Twitter automation completed in ${executionTime}ms`);

            if (error) {
                console.error('❌ Twitter script error:', error.message);
                console.error('Stderr:', stderr);
                return res.status(500).json({
                    success: false,
                    error: executionTime > 60000 ? 'Twitter automation timed out' : 'Twitter script execution failed',
                    details: stderr || error.message,
                    executionTime,
                    troubleshooting: [
                        '• Check internet connection',
                        '• Verify Twitter credentials in .env file',
                        executionTime > 30000 ? '• Twitter may be slow - wait for completion' : null,
                        stdout.includes('login') && executionTime > 45000 ? '• Login may require manual intervention' : null
                    ].filter(Boolean)
                });
            }

            console.log('📊 Twitter automation output:', stdout.slice(-300)); // Last 300 chars
            console.log('📋 Execution summary stats collected');

            // Enhanced success detection for Twitter
            const twitterSuccessPatterns = [
                '🎉 Tweet posted:',
                '✅ Tweet posted successfully',
                'SUCCESS! Enhanced Twitter automation completed',
                '📈 Completion rate:.*[^0]%',
                '✅.*SUCCESS.*post',
                !headless && 'Keeping browser open'
            ];

            const isSuccess = stdIncludesAny(stdout, twitterSuccessPatterns.filter(Boolean));

            if (isSuccess) {
                const posted = /👍.*posted|🎉.*posted/.test(stdout.slice(-200));
                const postedDetails = {
                    posted: posted,
                    withImage: stdout.includes('Image upload') && stdout.includes('success'),
                    loggedIn: stdout.includes('Already logged in') || stdout.includes('Login successful'),
                    tweetId: stdout.match(/tweet.*#(\w+)/i)?.[1] || null
                };

                console.log('✅ Twitter action successful:', postedDetails);
                
                res.json({
                    success: true,
                    posted: posted,
                    output: stdout.slice(-500), // Last 500 chars
                    message: posted ?
                        '🎉 Tweet posted successfully!' :
                        '✅ Twitter account logged in successfully',
                    details: postedDetails,
                    executionTime,
                    scheduled: action === 'debug' && !posted ? 'Login completed, browser ready for debug' : null
                });
            } else {
                // Error analysis for better troubleshooting
                const errorAnalysis = { connectionIssue: stdout.toLowerCase().includes('navigate') };
                
                res.json({
                    success: false,
                    output: stdout.slice(-400),
                    error: 'Twitter action may not have completed fully - check server logs',
                    warning: errorAnalysis.connectionIssue ? 'Possible network/connection issues detected' : null,
                    troubleshooting: [
                        '🗣️ Basic troubleshooting:',
                        '• Verify TWIT_USERNAME/TWITTER_USERNAME and TWIT_PASSWORD/TWITTER_PASSWORD in .env',
                        '• Twitter may have security checks - try running in visible mode (headless=false)',
                        '• Check cookies may be outdated - delete cookies-twitter/twitter_cookies.json if exists'
                    ],
                    executionTime
                });
            }
        });

    } catch (error) {
        console.error('❌ Twitter endpoint error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during Twitter automation',
            details: error.message
        });
    }
});

// Enhanced Twitter public post endpoint for automated posting (hides debug details)
app.post('/api/automation/run-twitter', async (req, res) => {
    console.log('🐦 Twitter automation request received for public posting');
    
    try {
        // Set defaults for public publishing (default headless for production)
        const {
            caption = 'Hello from enhanced Twitter automation!',
            headless = 'true',
            keepBrowserOpen = 'false',
            imageFileName = null
        } = req.body;

        console.log(`🐦 Running Twitter action with caption: "${caption}"`);
        
        const scriptPath = path.join(__dirname, '../twitter-demo-test.js');
        
        // Enhanced environment variables for Twitter automation
        const env = {
            ...process.env,
            KEEP_BROWSER_OPEN: keepBrowserOpen,
            HEADLESS: headless,
            BROWSER_TIMEOUT: '120000',
            PAGE_TIMEOUT: '90000',
            TWITTER_NAVIGATION_TIMEOUT: '120000',
            TWITTER_ACTION_TIMEOUT: '120000'
        };

        // Handle image if provided
        if (imageFileName) {
            const imagePath = path.join(__dirname, 'uploads', imageFileName);
            if (!fs.existsSync(imagePath)) {
                console.warn('⚠️ Image file not found, proceeding without image');
            } else {
                env.TWITTER_IMAGE_PATH = imagePath;
                console.log(`📸 Twitter image upload enabled: ${imagePath.slice(-20)}`);
            }
        }

        const execOptions = {
            env,
            timeout: 0,
            maxBuffer: 1024 * 1024 * 20
        };

        // Escape caption and handle special characters
        const escapedCaption = caption ? caption.replace(/"/g, '\\"').replace(/'/g, "\\'") : 'Hello world!';

        console.log('🚀 Starting enhanced Twitter automation...');
        console.log(`🔧 Settings: Headless=${headless}, KeepBrowserOpen=${keepBrowserOpen}`);

        const startTime = Date.now();
        
        exec(`node ${scriptPath} "${escapedCaption}"`, execOptions, (error, stdout, stderr) => {
            const executionTime = Date.now() - startTime;
            console.log(`⏱️ Twitter automation completed in ${executionTime}ms`);

            if (error) {
                console.error('❌ Twitter script error:', error.message);
                console.error('Stderr:', stderr);
                return res.status(500).json({
                    success: false,
                    error: executionTime > 60000 ? 'Twitter automation timed out' : 'Twitter script execution failed',
                    details: stderr || error.message,
                    executionTime,
                    troubleshooting: [
                        '• Check internet connection',
                        '• Verify Twitter credentials in .env file',
                        executionTime > 30000 ? '• Twitter may be slow - wait for completion' : null,
                        stdout.includes('login') && executionTime > 45000 ? '• Login may require manual intervention' : null
                    ].filter(Boolean)
                });
            }

            console.log('📊 Twitter automation output:', stdout.slice(-300));
            
            // Enhanced success detection for Twitter
            const twitterSuccessPatterns = [
                '🎉 Tweet posted:',
                '✅ Tweet posted successfully',
                'SUCCESS! Enhanced Twitter automation completed',
                '📈 Completion rate:.*[^0]%',
                !headless && 'Keeping browser open'
            ];

            const boolFilter = twitterSuccessPatterns.filter(Boolean);
            const isSuccess = stdIncludesAny(stdout, boolFilter);

            if (isSuccess) {
                const posted = /👍.*posted|🎉.*posted/.test(stdout.slice(-200));
                const postedDetails = {
                    posted: posted,
                    withImage: stdout.includes('Image upload') && stdout.includes('success'),
                    loggedIn: stdout.includes('Already logged in') || stdout.includes('Login successful'),
                    tweetId: stdout.match(/tweet.*#(\w+)/i)?.[1] || null
                };

                console.log('✅ Twitter action successful:', postedDetails);
                
                res.json({
                    success: true,
                    posted: posted,
                    output: stdout.slice(-500),
                    message: posted ?
                        '🎉 Tweet posted successfully!' :
                        '✅ Twitter account logged in successfully',
                    details: postedDetails,
                    executionTime,
                    scheduled: !posted ? 'Login completed, browser ready for debug' : null
                });
            } else {
                // Error analysis for better troubleshooting
                const errorAnalysis = { connectionIssue: stdout.toLowerCase().includes('navigate') };
                
                res.json({
                    success: false,
                    output: stdout.slice(-400),
                    error: 'Twitter action may not have completed fully - check server logs',
                    warning: errorAnalysis.connectionIssue ? 'Possible network/connection issues detected' : null,
                    troubleshooting: [
                        '🗣️ Basic troubleshooting:',
                        '• Verify TWIT_USERNAME/TWITTER_USERNAME and TWIT_PASSWORD/TWITTER_PASSWORD in .env',
                        '• Twitter may have security checks - try running in visible mode (headless=false)',
                        '• Check cookies may be outdated - delete cookies-twitter/twitter_cookies.json if exists'
                    ],
                    executionTime
                });
            }
        });
    } catch (error) {
        console.error('❌ Twitter public endpoint error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during Twitter automation',
            details: error.message
        });
    }
});


// File upload endpoint
const multer = require('multer');
const fs = require('fs-extra');
const uploadsDir = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
fs.ensureDirSync(uploadsDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), async(req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        console.log(`✅ File uploaded: ${req.file.filename} (${req.file.size} bytes)`);

        res.json({
            success: true,
            message: 'File uploaded successfully',
            fileName: req.file.filename,
            filePath: path.join('uploads', req.file.filename),
            ext: path.extname(req.file.originalname).toLowerCase(),
            size: req.file.size
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: 'File upload failed',
            details: error.message
        });
    }
});


// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
    console.log(`🚀 Advanced Social Media Automation Server Active on http://localhost:${PORT}`);
    console.log(`📋 Health check: GET http://localhost:${PORT}/health`);
    console.log(`🔧 Facebook Automation: POST http://localhost:${PORT}/api/automation/run-facebook-debug`);
    console.log(`🐦 Twitter Automation: POST http://localhost:${PORT}/api/automation/run-twitter`);
    console.log(`💯 Twitter Debug Mode: POST http://localhost:${PORT}/api/automation/run-twitter-debug`);
    console.log(`📸 Instagram Automation: POST http://localhost:${PORT}/api/automation/run-instagram-debug`);
    console.log(`📁 File Upload: POST http://localhost:${PORT}/api/upload`);
    console.log('✅ Ready for multi-platform social media automation!');
});