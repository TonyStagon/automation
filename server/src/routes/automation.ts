import express from 'express';
import { exec } from 'child_process';
import path from 'path';

const router = express.Router();

// Run Facebook debug script temporarily
router.post('/run-facebook-debug', async (req, res) => {
  try {
    const scriptPath = path.join(__dirname, '../../../facebook-login-post-test.js');
    const caption = req.body.caption || 'Hello I am New Here';
    
    // Escape the caption for command line to handle special characters
    const escapedCaption = caption.replace(/"/g, '\\"');
    exec(`node ${scriptPath} "${escapedCaption}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('Error running Facebook debug script:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to run script',
          details: stderr
        });
      }
      res.json({
        success: true,
        output: stdout,
        message: 'Facebook debug script executed successfully'
      });
    });
  } catch (error) {
    console.error('Error in run-facebook-debug:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Run Twitter debug script
router.post('/run-twitter-debug', async (req, res) => {
  try {
    const scriptPath = path.join(__dirname, '../../../twitter-login-post-test.js');
    const caption = req.body.caption || 'Hello I am New Here on Twitter!';
    
    // Escape the caption for command line to handle special characters
    const escapedCaption = caption.replace(/"/g, '\\"');
    exec(`node ${scriptPath} "${escapedCaption}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('Error running Twitter debug script:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to run script',
          details: stderr
        });
      }
      res.json({
        success: true,
        output: stdout,
        message: 'Twitter debug script executed successfully'
      });
    });
  } catch (error) {
    console.error('Error in run-twitter-debug:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;