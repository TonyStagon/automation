# Facebook Automation Debug Guide

## Common Issues & Solutions

### 1. **Stops After Login - Possible Causes**

#### A. Security Challenges

- **Two-Factor Authentication (2FA)** - Facebook detects automation and requires phone/SMS verification
- **Security Checkpoints** - Facebook asks you to identify friends or verify your identity
- **Suspicious Login Detection** - Facebook blocks the login due to unusual patterns

**Solution:**

```bash
# Run with visible browser to see what's happening
HEADLESS=false KEEP_BROWSER_OPEN=true node facebook-login-post-test.js "Test message"
```

#### B. Page Redirects

- Facebook redirects to security pages after login
- Cookie consent banners blocking interaction
- Profile setup prompts interfering

#### C. Element Detection Issues

- Facebook changed their UI structure
- Post creation box selectors are outdated
- Content is loaded dynamically and not waiting long enough

### 2. **Debugging Steps**

#### Step 1: Check Screenshots

The automation saves screenshots in `./debug-screenshots/` folder. Look for:

- `Navigate_to_Login_[timestamp].png` - Login page loaded?
- `Login_Verification_[timestamp].png` - Successfully logged in?
- `Navigate_to_Home_[timestamp].png` - On Facebook home page?
- `Find_Post_Box_[timestamp].png` - Can you see the "What's on your mind?" box?

#### Step 2: Check Console Output

Look for these indicators in the console:

```
✅ Login Verification: SUCCESS
✅ Navigate to Home: SUCCESS
❌ Find Post Box: FAILED - Could not find post creation box
```

#### Step 3: Run in Visible Mode

```bash
# Set environment variables for debugging
export FB_USERNAME="your_facebook_email"
export FB_PASSWORD="your_facebook_password"
export HEADLESS=false
export KEEP_BROWSER_OPEN=true

# Run the script
node facebook-login-post-test.js "Debug test post"
```

### 3. **Updated Environment Variables**

Add these to your `.env` file:

```env
# Facebook Credentials
FB_USERNAME=your_facebook_email_here
FB_PASSWORD=your_facebook_password_here

# or alternative naming
FBusername=your_facebook_email_here
FBpassword=your_facebook_password_here

# Browser Settings
HEADLESS=false
KEEP_BROWSER_OPEN=true
BROWSER_TIMEOUT=60000
PAGE_TIMEOUT=30000
```

### 4. **Server Endpoint Improvements**

Update your server endpoint to provide better debugging info:

```javascript
// In automation-server/server.js - Enhanced debugging
app.post("/api/automation/run-facebook-debug", async (req, res) => {
  try {
    const scriptPath = path.join(__dirname, "../facebook-login-post-test.js");
    const caption = req.body.caption || "Hello I am New Here";

    console.log(
      `🚀 Executing Facebook debug script with caption: "${caption}"`
    );

    const env = {
      ...process.env,
      HEADLESS: req.body.headless ? "true" : "false",
      KEEP_BROWSER_OPEN: req.body.keepBrowserOpen ? "true" : "false",
      DEBUG_MODE: "true",
    };

    const execOptions = {
      env,
      timeout: 300000, // 5 minutes timeout
      maxBuffer: 1024 * 1024 * 50, // 50MB buffer
    };

    exec(
      `node ${scriptPath} "${caption}"`,
      execOptions,
      (error, stdout, stderr) => {
        // Enhanced error detection
        if (error) {
          console.error("❌ Script execution error:", error);

          let errorType = "Unknown error";
          let troubleshooting = [];

          if (error.message.includes("timeout")) {
            errorType = "Script timeout - Facebook took too long to respond";
            troubleshooting = [
              "Facebook may have security challenges",
              "Check screenshots in debug-screenshots folder",
              "Try running with HEADLESS=false to see what's happening",
              "Verify Facebook credentials are correct",
            ];
          } else if (stderr.includes("credentials not configured")) {
            errorType = "Facebook credentials missing";
            troubleshooting = [
              "Set FB_USERNAME and FB_PASSWORD in .env file",
              "Or use FBusername and FBpassword variables",
              "Restart the automation server after adding credentials",
            ];
          } else if (
            stdout.includes("Login failed") ||
            stderr.includes("login")
          ) {
            errorType = "Facebook login failed";
            troubleshooting = [
              "Verify Facebook username/email and password",
              "Check if 2FA is enabled on Facebook account",
              "Try logging in manually first to clear any security challenges",
              "Facebook may be blocking automated logins",
            ];
          } else if (
            stdout.includes("Post creation failed") ||
            stdout.includes("Could not find post")
          ) {
            errorType = "Post creation failed - UI elements not found";
            troubleshooting = [
              "Facebook may have updated their interface",
              "Check debug-screenshots for visual clues",
              "Try refreshing Facebook page manually",
              "Script selectors may need updating",
            ];
          }

          return res.status(500).json({
            success: false,
            error: errorType,
            details: stderr || error.message,
            troubleshooting,
            screenshots_location: "./debug-screenshots/",
            stdout_output: stdout,
          });
        }

        console.log("📋 Script output:", stdout);

        // Enhanced success detection
        const successIndicators = [
          "SUCCESSFUL FACEBOOK AUTOMATION WORKFLOW",
          "Successfully posted",
          "Posted:",
          "Post Creation: SUCCESS",
        ];

        const hasSuccess = successIndicators.some((indicator) =>
          stdout.includes(indicator)
        );

        // Enhanced failure detection
        const failureIndicators = [
          "Login failed",
          "Post creation failed",
          "Could not find post",
          "Security challenge detected",
          "credentials not configured",
        ];

        const hasFailure = failureIndicators.some((indicator) =>
          stdout.toLowerCase().includes(indicator.toLowerCase())
        );

        if (hasSuccess && !hasFailure) {
          res.json({
            success: true,
            output: stdout,
            message: "Facebook automation completed successfully!",
            posted: true,
            caption: caption,
            screenshots_available: true,
          });
        } else {
          // Determine specific failure reason
          let failureReason = "Unknown failure";
          let troubleshooting = [];

          if (stdout.includes("credentials not configured")) {
            failureReason = "Facebook credentials not configured";
            troubleshooting = [
              "Add FB_USERNAME and FB_PASSWORD to .env file",
              "Restart automation server after adding credentials",
              "Check server logs for credential loading errors",
            ];
          } else if (stdout.includes("Login failed")) {
            failureReason = "Facebook login failed";
            troubleshooting = [
              "Verify Facebook credentials are correct",
              "Check if account requires 2FA verification",
              "Try manual login to clear security challenges",
              "Account may be temporarily restricted",
            ];
          } else if (
            stdout.includes("Security challenge") ||
            stdout.includes("checkpoint")
          ) {
            failureReason = "Facebook security challenge detected";
            troubleshooting = [
              "Open Facebook in browser and complete security checks",
              "Disable 2FA temporarily if possible",
              "Use a different Facebook account for testing",
              "Wait 24 hours before trying automation again",
            ];
          } else if (
            stdout.includes("Post creation failed") ||
            stdout.includes("Could not find post")
          ) {
            failureReason = "Post creation failed - UI elements not found";
            troubleshooting = [
              "Facebook UI may have changed - selectors need updating",
              "Check screenshots in debug-screenshots folder",
              "Account may need to accept terms or complete profile setup",
              "Try posting manually first to ensure account is active",
            ];
          }

          res.json({
            success: false,
            output: stdout,
            error: failureReason,
            troubleshooting,
            screenshots_available: true,
            debug_info: {
              has_login_success: stdout.includes("Login Verification: SUCCESS"),
              has_navigation_success: stdout.includes(
                "Navigate to Home: SUCCESS"
              ),
              has_post_attempt: stdout.includes("Find Post Box"),
              execution_completed: !error,
            },
          });
        }
      }
    );
  } catch (error) {
    console.error("❌ Error in run-facebook-debug:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});
```

### 5. **Manual Testing Steps**

#### Test 1: Check Credentials

```bash
# Test if credentials are loaded
node -e "
require('dotenv').config();
console.log('FB_USERNAME:', process.env.FB_USERNAME ? 'Set' : 'Not set');
console.log('FB_PASSWORD:', process.env.FB_PASSWORD ? 'Set' : 'Not set');
console.log('FBusername:', process.env.FBusername ? 'Set' : 'Not set');
console.log('FBpassword:', process.env.FBpassword ? 'Set' : 'Not set');
"
```

#### Test 2: Browser Launch Test

```javascript
// Create test-browser.js
import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto("https://facebook.com/login");

  console.log("Browser launched, Facebook loaded");
  console.log("Current URL:", page.url());

  // Keep open for 30 seconds
  setTimeout(async () => {
    await browser.close();
    console.log("Test completed");
  }, 30000);
})();
```

#### Test 3: Element Detection Test

```javascript
// Add this to your script for debugging
async debugCurrentPage() {
    console.log('🔍 Current page analysis:');
    console.log('URL:', this.page.url());
    console.log('Title:', await this.page.title());

    // Check for common Facebook elements
    const elements = await this.page.evaluate(() => {
        return {
            hasLoginForm: !!document.querySelector('input[name="email"]'),
            hasPasswordField: !!document.querySelector('input[name="pass"]'),
            hasPostBox: !!document.querySelector('[role="textbox"]'),
            hasNavigation: !!document.querySelector('[role="navigation"]'),
            bodyText: document.body.innerText.substring(0, 200)
        };
    });

    console.log('Page elements:', elements);

    // Take screenshot for analysis
    await this.page.screenshot({
        path: `./debug-current-state-${Date.now()}.png`,
        fullPage: true
    });
}
```

### 6. **Common Facebook UI Changes**

Facebook frequently updates their interface. Here are current working selectors (as of 2024):

#### Login Elements:

```javascript
const LOGIN_SELECTORS = {
  email: ['input[name="email"]', 'input[data-testid="royal_email"]', "#email"],
  password: ['input[name="pass"]', 'input[data-testid="royal_pass"]', "#pass"],
  loginButton: [
    'button[name="login"]',
    'button[data-testid="royal_login_button"]',
    'button[type="submit"]',
  ],
};
```

#### Post Creation Elements:

```javascript
const POST_SELECTORS = {
  trigger: [
    '[aria-label="Create a post"]',
    'div[role="button"]:has-text("What\'s on your mind")',
    '[data-pagelet="FeedComposer"]',
  ],
  textBox: [
    'div[role="textbox"][contenteditable="true"]',
    '[data-testid="status-attachment-mentions-input"]',
    'div[contenteditable="true"][aria-label*="What\'s on your mind"]',
  ],
  postButton: [
    'div[aria-label="Post"]',
    'button[aria-label="Post"]',
    '[data-testid="react-composer-post-button"]',
  ],
};
```

### 7. **Troubleshooting Checklist**

- [ ] **Credentials loaded correctly**
- [ ] **Browser launches without errors**
- [ ] **Facebook login page loads**
- [ ] **Login form elements found**
- [ ] **Login submission successful**
- [ ] **Redirected to Facebook home**
- [ ] **Post creation trigger found**
- [ ] **Post text box accessible**
- [ ] **Message typed successfully**
- [ ] **Post button clicked**
- [ ] **Post submission confirmed**

### 8. **Advanced Debugging**

#### Enable Verbose Logging:

```javascript
// Add to your script
async logCurrentState(step) {
    console.log(`\n📊 STATE CHECK: ${step}`);
    console.log('Current URL:', this.page.url());
    console.log('Page title:', await this.page.title());

    // Check for errors in browser console
    this.page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('❌ Browser console error:', msg.text());
        }
    });

    // Check for failed requests
    this.page.on('requestfailed', request => {
        console.log('❌ Failed request:', request.url());
    });
}
```

#### Network Monitoring:

```javascript
// Monitor network requests
this.page.on("response", (response) => {
  if (response.status() >= 400) {
    console.log(`❌ HTTP Error ${response.status()}: ${response.url()}`);
  }
});
```

This guide should help you identify exactly where the automation is stopping and why. The most common issue is Facebook's security measures kicking in after login, which requires manual intervention to complete security challenges.
