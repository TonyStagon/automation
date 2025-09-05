const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = 3003; // Different port for Meta Enhanced server

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Meta Enhanced Automation server is running',
        version: 'Meta API Enhanced v1.0'
    });
});

// Run Meta Enhanced Facebook debug script
app.post('/api/meta-enhanced/run-facebook', async(req, res) => {
    try {
        const scriptPath = path.join(__dirname, '../facebook-meta-api-enhanced.js');
        const caption = req.body.caption || 'Hello from Meta Enhanced Automation!';
        const effects = req.body.effects || {}; // Allow customization of effects

        console.log(`🚀 Executing Meta Enhanced Facebook script with caption: "${caption}"`);
        console.log('🎨 Effects configuration:', effects);

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
                console.error('❌ Error running Meta Enhanced Facebook script:', error);
                console.error('Stderr:', stderr);

                // Check for specific error types
                let errorType = 'Unknown error';
                if (error.message.includes('timeout')) {
                    errorType = 'Meta Enhanced Script timeout - automation took too long';
                } else if (error.message.includes('ENOENT')) {
                    errorType = 'Meta Enhanced Script file not found';
                } else if (stderr && stderr.includes('credentials')) {
                    errorType = 'Facebook credentials not configured for Meta Enhanced';
                } else if (stderr && stderr.includes('login')) {
                    errorType = 'Meta Enhanced Facebook login failed';
                }

                return res.status(500).json({
                    success: false,
                    error: errorType,
                    details: stderr || error.message,
                    troubleshooting: [
                        'Check Facebook credentials in .env file',
                        'Verify internet connection',
                        'Try running with visible browser mode',
                        'Check for Facebook security challenges',
                        'Ensure Meta Enhanced script is properly configured'
                    ],
                    metaEnhanced: true
                });
            }

            console.log('🎨 Meta Enhanced Script output:', stdout);

            // Enhanced success detection for Meta Enhanced
            const successIndicators = [
                'SUCCESSFUL META ENHANCED SOCIAL AUTOMATION WORKFLOW',
                'Meta Enhanced Posted:',
                'Meta Enhanced Facebook automation completed successfully',
                'Meta API effects applied successfully',
                'Browser kept open'
            ];

            const hasSuccess = successIndicators.some(indicator =>
                stdout.includes(indicator)
            );

            if (hasSuccess) {
                // Extract Meta effects information
                const metaEffects = {
                    launchSequence: stdout.includes('META LAUNCH SEQUENCE COMPLETE'),
                    typingAnimation: stdout.includes('META TYPING SEQUENCE'),
                    postEffects: stdout.includes('Meta post creation effects'),
                    visualFeedback: stdout.includes('Meta: ')
                };

                res.json({
                    success: true,
                    output: stdout,
                    message: '🎉 Meta Enhanced Facebook automation completed successfully!',
                    posted: stdout.includes('Meta Enhanced Posted:') || stdout.includes('SUCCESSFUL META ENHANCED'),
                    caption: caption,
                    metaEnhanced: true,
                    metaEffects: metaEffects,
                    features: {
                        launchAnimation: metaEffects.launchSequence,
                        typingEffects: metaEffects.typingAnimation,
                        postEffects: metaEffects.postEffects,
                        visualFeedback: metaEffects.visualFeedback
                    }
                });
            } else {
                // Check for specific failure reasons
                let failureReason = 'Unknown Meta Enhanced failure';
                if (stdout.includes('credentials not configured')) {
                    failureReason = 'Facebook credentials not configured for Meta Enhanced';
                } else if (stdout.includes('Login failed')) {
                    failureReason = 'Meta Enhanced Facebook login failed';
                } else if (stdout.includes('Security challenge')) {
                    failureReason = 'Meta Enhanced Facebook security challenge detected';
                } else if (stdout.includes('Post creation failed')) {
                    failureReason = 'Meta Enhanced Post creation failed - UI elements not found';
                }

                res.json({
                    success: false,
                    output: stdout,
                    error: failureReason,
                    troubleshooting: [
                        'Check browser screenshots in debug-screenshots folder',
                        'Verify Facebook account is not restricted',
                        'Try manual login to check for security prompts',
                        'Update Facebook credentials if needed',
                        'Check Meta Enhanced effects configuration'
                    ],
                    metaEnhanced: true
                });
            }
        });
    } catch (error) {
        console.error('❌ Error in Meta Enhanced run-facebook:', error);
        res.status(500).json({
            success: false,
            error: 'Meta Enhanced Internal server error',
            details: error.message,
            timestamp: new Date().toISOString(),
            metaEnhanced: true
        });
    }
});

// Get Meta Enhanced configuration
app.get('/api/meta-enhanced/config', (req, res) => {
    const config = {
        version: 'Meta API Enhanced v1.0',
        features: {
            launchAnimation: true,
            typingEffects: true,
            postEffects: true,
            visualFeedback: true
        },
        api: {
            graphAPI: {
                version: 'v18.0',
                baseUrl: 'https://graph.facebook.com',
                requiredPermissions: ['pages_manage_posts', 'pages_read_engagement', 'public_profile']
            }
        },
        endpoints: {
            runFacebook: 'POST /api/meta-enhanced/run-facebook',
            health: 'GET /health',
            config: 'GET /api/meta-enhanced/config'
        }
    };

    res.json({
        success: true,
        config: config,
        message: 'Meta Enhanced configuration retrieved successfully'
    });
});

// Test Meta Enhanced effects individually
app.post('/api/meta-enhanced/test-effects', async(req, res) => {
    try {
        const { effectType } = req.body;
        const scriptPath = path.join(__dirname, '../facebook-meta-api-enhanced.js');

        console.log(`🧪 Testing Meta Enhanced effect: ${effectType}`);

        // Set environment for specific effect testing
        const env = {
            ...process.env,
            KEEP_BROWSER_OPEN: 'true',
            HEADLESS: 'false',
            TEST_EFFECT: effectType || 'all'
        };

        exec(`node ${scriptPath} "Test ${effectType} effect"`, { env }, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Error testing ${effectType} effect:`, error);
                return res.status(500).json({
                    success: false,
                    error: `Failed to test ${effectType} effect`,
                    details: stderr || error.message
                });
            }

            console.log(`✅ ${effectType} effect test output:`, stdout);

            res.json({
                success: true,
                output: stdout,
                effect: effectType,
                message: `${effectType} effect test completed successfully`
            });
        });
    } catch (error) {
        console.error('❌ Error in test-effects:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Unhandled Meta Enhanced error:', error);
    res.status(500).json({
        success: false,
        error: 'Meta Enhanced Internal server error',
        metaEnhanced: true
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Meta Enhanced Endpoint not found',
        metaEnhanced: true
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Meta Enhanced Automation server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`🎨 Meta Enhanced Facebook endpoint: POST http://localhost:${PORT}/api/meta-enhanced/run-facebook`);
    console.log(`⚙️ Meta Enhanced config: GET http://localhost:${PORT}/api/meta-enhanced/config`);
    console.log(`🧪 Meta Enhanced effects testing: POST http://localhost:${PORT}/api/meta-enhanced/test-effects`);
    console.log(`\n🎯 Meta Enhanced Features:`);
    console.log(`• Launch animations and sequences`);
    console.log(`• AI-powered typing effects`);
    console.log(`• Post creation visual feedback`);
    console.log(`• Enhanced human behavior simulation`);
    console.log(`• Meta API integration ready`);
});