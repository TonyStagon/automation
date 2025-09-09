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

// Run Facebook debug script
app.post('/api/automation/run-facebook-debug', async(req, res) => {
    try {
        const scriptPath = path.join(__dirname, '../facebook-demo-test.js');
        const caption = req.body.caption || 'Hello I am New Here';

        console.log(`Executing Enhanced Facebook automation script with caption: "${caption}"`);

        // Escape the caption for command line to handle special characters
        const escapedCaption = caption.replace(/"/g, '\\"').replace(/'/g, "\\'");

        // Set environment to keep browser open and run in non-headless mode
        const env = {
            ...process.env,
            KEEP_BROWSER_OPEN: req.body.keepBrowserOpen || 'true',
            HEADLESS: req.body.headless || 'false',
            // Add timeout settings
            BROWSER_TIMEOUT: '60000',
            PAGE_TIMEOUT: '30000'
        };

        // Increase timeout for the exec command
        const execOptions = {
            env,
            timeout: 0, // no timeout
            maxBuffer: 1024 * 1024 * 10
        };

        exec(`node ${scriptPath} "${escapedCaption}"`, execOptions, (error, stdout, stderr) => {
            if (error) {
                console.error('Error running Facebook debug script:', error);
                console.error('Stderr:', stderr);

                // Check for specific error types
                let errorType = 'Unknown error';
                if (error.message.includes('timeout')) {
                    errorType = 'Script timeout - Facebook automation took too long';
                } else if (error.message.includes('ENOENT')) {
                    errorType = 'Script file not found';
                } else if (stderr && stderr.includes('credentials')) {
                    errorType = 'Facebook credentials not configured';
                } else if (stderr && stderr.includes('login')) {
                    errorType = 'Facebook login failed';
                }

                return res.status(500).json({
                    success: false,
                    error: errorType,
                    details: stderr || error.message,
                    troubleshooting: [
                        'Check Facebook credentials in .env file',
                        'Verify internet connection',
                        'Try running with visible browser mode',
                        'Check for Facebook security challenges'
                    ]
                });
            }

            console.log('Enhanced Facebook automation output:', stdout);

            // Enhanced success detection for facebook-demo-test.js with output markers
            const successIndicators = [
                'SUCCESS! Enhanced Facebook automation completed',
                '✅ Post published successfully',
                '🎉 SUCCESS! Enhanced Facebook automation completed',
                'Browser kept open',
                'Post published successfully: SUCCESS',
                '✅ Login successful: SUCCESS',
                'EXECUTION SUMMARY:',
                '📈 Completion rate: 8/8 steps (100%)',
                '🎯 Advanced detection evasion and human-like behavior'
            ];

            const hasSuccess = successIndicators.some(indicator =>
                stdout.includes(indicator)
            );

            if (hasSuccess) {
                // Enhanced result analysis
                const posted = stdout.includes('✅ Post published successfully') ||
                    stdout.includes('📈 Completion rate: 8/8 steps (100%)');

                res.json({
                    success: true,
                    output: stdout,
                    message: posted ? '🎉 Facebook post created successfully!' : '🤖 Facebook automation completed - verify browser for results',
                    posted: posted,
                    caption: caption
                });
            } else {
                // Enhanced failure reason detection
                let failureReason = 'Unknown automation failure';
                if (stdout.includes('credentials not configured') || stderr.includes('credentials')) {
                    failureReason = 'Facebook credentials not configured in .env file';
                } else if (stdout.includes('Login failed') || stdout.includes('login timeout')) {
                    failureReason = 'Facebook login failed or authentication issue';
                } else if (stdout.includes('Security challenge') || stdout.includes('checkpoint')) {
                    failureReason = 'Facebook security challenge detected - complete manually first';
                } else if (stdout.includes('Post creation failed') || stdout.includes('COMPLETE FAILURE')) {
                    failureReason = 'Post creation failed - could not locate Facebook post UI elements';
                } else if (stdout.includes('Could not find Post button') || stdout.includes('failed to click')) {
                    failureReason = 'Facebook UI changed - post button detection failed';
                } else if (stdout.includes('timeout') || stderr.includes('timeout')) {
                    failureReason = 'Facebook automation timeout - taking too long to complete';
                } else if (stdout.includes('invalid credentials') || stdout.includes('password incorrect')) {
                    failureReason = 'Facebook credentials incorrect - please update .env file';
                } else if (stdout.includes('browser crashed') || stderr.includes('browser')) {
                    failureReason = 'Browser automation failed - try visible mode first';
                }

                res.json({
                    success: false,
                    output: stdout,
                    error: failureReason,
                    troubleshooting: [
                        'Check browser screenshots in debug-screenshots folder',
                        'Verify Facebook account is not restricted',
                        'Try manual login to check for security prompts',
                        'Update Facebook credentials if needed'
                    ]
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

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Run Instagram debug script
app.post('/api/automation/run-instagram-debug', async(req, res) => {
    try {
        const scriptPath = path.join(__dirname, '../instagram-login-post-test.js');
        const caption = req.body.caption || 'Hello I am New Here';

        console.log(`Executing Instagram debug script with caption: "${caption}"`);

        // Escape the caption for command line to handle special characters
        const escapedCaption = caption.replace(/"/g, '\\"');

        // Set environment to keep browser open and run in non-headless mode
        const env = {
            ...process.env,
            KEEP_BROWSER_OPEN: 'true',
            HEADLESS: 'false'
        };

        exec(`node ${scriptPath} "${escapedCaption}"`, { env }, (error, stdout, stderr) => {
            if (error) {
                console.error('Error running Instagram debug script:', error);
                console.error('Stderr:', stderr);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to run script',
                    details: stderr || error.message
                });
            }

            console.log('Script output:', stdout);

            // Check if script completed successfully or if browser was kept open
            if (stdout.includes('Browser kept open') || stdout.includes('Posted:')) {
                res.json({
                    success: true,
                    output: stdout,
                    message: 'Instagram automation completed - browser kept open for inspection'
                });
            } else {
                res.json({
                    success: false,
                    output: stdout,
                    error: 'Script execution completed but may not have posted successfully'
                });
            }
        });
    } catch (error) {
        console.error('Error in run-instagram-debug:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }

});

// Run Twitter debug script
app.post('/api/automation/run-twitter-debug', async(req, res) => {
    try {
        const scriptPath = path.join(__dirname, '../twitter-demo-test.js');
        const caption = req.body.caption || 'Hello I am New Here on Twitter!';

        console.log(`Executing Enhanced Twitter automation script with caption: "${caption}"`);

        // Escape the caption for command line to handle special characters
        const escapedCaption = caption.replace(/"/g, '\\"').replace(/'/g, "\\'");

        // Set environment to keep browser open and run in non-headless mode
        const env = {
            ...process.env,
            KEEP_BROWSER_OPEN: req.body.keepBrowserOpen || 'true',
            HEADLESS: req.body.headless || 'false',
            // Add timeout settings - longer for analysis
            BROWSER_TIMEOUT: '80000',
            PAGE_TIMEOUT: '40000'
        };

        const execOptions = {
            env,
            timeout: 0, // no timeout for analysis
            maxBuffer: 1024 * 1024 * 10
        };

        exec(`node ${scriptPath} "${escapedCaption}"`, execOptions, (error, stdout, stderr) => {
            if (error) {
                console.error('Error running Twitter debug script:', error);
                console.error('Stderr:', stderr);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to run script',
                    details: stderr || error.message
                });
            }

            console.log('Script output:', stdout);

            // Check if script completed successfully or if browser was kept open
            if (stdout.includes('Browser will stay open') || stdout.includes('SUCCESSFUL SOCIAL AUTOMATION') || stdout.includes('Posted:')) {
                res.json({
                    success: true,
                    output: stdout,
                    message: 'Twitter automation completed - browser kept open for inspection'
                });
            } else {
                res.json({
                    success: false,
                    output: stdout,
                    error: 'Script execution completed but may not have posted successfully on Twitter'
                });
            }
        });
    } catch (error) {
        console.error('Error in run-twitter-debug:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
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

// Update Facebook automation endpoint to handle image file paths
const originalFacebookHandler = app.post.bind(app, '/api/automation/run-facebook-debug');
app.post('/api/automation/run-facebook-debug', async(req, res) => {
            try {
                const { caption, imageFileName, headless = 'false', keepBrowserOpen = 'true' } = req.body;

                console.log(`Executing Facebook automation with caption: "${caption}"${imageFileName ? ` and image: ${imageFileName}` : ''}`);

    // Prepare environment variables
    const env = {
      ...process.env,
      KEEP_BROWSER_OPEN: keepBrowserOpen,
      HEADLESS: headless,
      BROWSER_TIMEOUT: '60000',
      PAGE_TIMEOUT: '30000',
      FB_IMAGE_PATH: imageFileName ? path.join(uploadsDir, imageFileName) : ''
    };

    // Escape caption for command line
    const escapedCaption = caption ? caption.replace(/"/g, '\\"').replace(/'/g, "\\'") : 'Default automated post';

    const scriptPath = path.join(__dirname, '../facebook-demo-test.js');
    const execOptions = {
      env,
      timeout: 0,
      maxBuffer: 1024 * 1024 * 10
    };

    exec(`node ${scriptPath} "${escapedCaption}"`, execOptions, (error, stdout, stderr) => {
      if (error) {
        console.error('Error running Facebook debug script:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to run automation script',
          details: stderr || error.message
        });
      }

      // Check for success indicators
      const successIndicators = [
        'SUCCESS! Enhanced Facebook automation completed',
        '✅ Post published successfully',
        '🎉 SUCCESS! Enhanced Facebook automation completed',
        'Posted:'
      ];

      const hasSuccess = successIndicators.some(indicator => stdout.includes(indicator));

      if (hasSuccess) {
        res.json({
          success: true,
          output: stdout,
          message: imageFileName ?
            '🎉 Facebook post with image created successfully!' :
            '🎉 Facebook post created successfully!',
          posted: true,
          caption: caption,
          hasImage: !!imageFileName
        });
      } else {
        res.json({
          success: false,
          output: stdout,
          error: 'Post creation may not have completed successfully'
        });
      }
    });
  } catch (error) {
    console.error('Error in run-facebook-debug:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
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
    console.log(`🚀 Automation server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 Facebook debug endpoint: POST http://localhost:${PORT}/api/automation/run-facebook-debug`);
    console.log(`📸 Instagram debug endpoint: POST http://localhost:${PORT}/api/automation/run-instagram-debug`);
});