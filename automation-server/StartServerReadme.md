## Quick Start

Start the automation server using one of the following commands:

### Using npm (recommended)

```bash
npm start
```

### Using node directly

```bash
node server.js
```

## What's New

The server has been **updated** to properly load environment variables from the root `.env` file.

### Key Features:

- ✅ **Instagram Integration Fixed** - Environment variables are now loaded correctly
- ✅ **Credentials Security** - Uses your existing `.env` file from root directory
- ✅ **Cross-Platform Support** - Works with Windows, Linux, and macOS

## Environment Variables Configuration

Make sure your root `.env` file contains:

- `INSTAGRAM_USERNAME` or `IG_USERNAME` - Your Instagram username
- `INSTAGRAM_PASSWORD` or `IG_PASSWORD` - Your Instagram password

## Available Endpoints

The server provides these automation endpoints:

- **POST** `/api/automation/run-facebook-debug` - Facebook automation
- **POST** `/api/automation/run-instagram-debug` - Instagram automation
- **POST** `/api/automation/run-twitter-debug` - Twitter automation
- **GET** `/health` - Health check endpoint

## Debug Output

When running automation scripts, the server will:

- Show detailed console logs of the automation process
- Take screenshots for debugging
- Keep browser windows open for visual inspection (when HEADLESS=false)

## Troubleshooting

Common issues:

- If credentials aren't loading: Make sure your `.env` file is in the root directory
- If npm install fails: Delete `node_modules` and run `npm install` again
- If browser automation fails: Check the debug screenshots in `debug-screenshots/` folder

## Security Notes

- Credentials are loaded from environment variables, not hardcoded
- Passwords are masked in logs for security
- Browser windows can be configured to run headless for automation
