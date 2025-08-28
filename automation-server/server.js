const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Automation server is running' });
});

// Run Facebook debug script
app.post('/api/automation/run-facebook-debug', async(req, res) => {
    try {
        const scriptPath = path.join(__dirname, '../facebook-login-post-test.js');
        const caption = req.body.caption || 'Hello I am New Here';

        console.log(`Executing Facebook debug script with caption: "${caption}"`);

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
                console.error('Error running Facebook debug script:', error);
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
                    message: 'Facebook automation completed - browser kept open for inspection'
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
        console.error('Error in run-facebook-debug:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
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
        const scriptPath = path.join(__dirname, '../twitter-login-post-test.js');
        const caption = req.body.caption || 'Hello I am New Here on Twitter!';

        console.log(`Executing Twitter debug script with caption: "${caption}"`);

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