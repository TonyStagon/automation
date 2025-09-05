# Twitter Bot Guide

This guide provides all the necessary steps for configuring and running the Twitter Bot.

## 1. Prerequisites & File Structure

Before running the bot, ensure the project has the following structure and files:

```
├── .env              # Environment variables including Xusername and Xpassword
├── cookies/          # Directory for storing session cookies (Twittercookies.json)
└── src/
    ├── secret/
    │   └── index.ts  # Exports Twitter credentials (Xusername and Xpassword)
    └── Agent/
        ├── schema/
        │   └── twitter-schema.ts  # Twitter comment schema definition
        └── training/ # Directory containing training data files (PDFs, MP3s, TXT, URLs)
```

## 2. Setup Checklist

### Credentials & Secret Management

- Place your Twitter credentials in the `.env` file:
  ```env
  Xusername=your_twitter_username
  Xpassword=your_twitter_password
  ```
- Ensure `src/secret/index.ts` exports these credentials correctly.

### Cookie Management

- On the first run, the bot will handle cookie creation automatically and store them in `cookies/Twittercookies.json`.
- For subsequent runs, ensure the `cookies` directory exists to allow the bot to load valid sessions.

## 3. Agent Training Data Configuration

The bot uses training data to refine and tailor the comments it posts. In this context, "training" refers to the process where the bot:

- **Uses Input Data Types Such As:**
  - **Text Files (.txt):** Provide sample responses and templates for Twitter engagement.
  - **PDF Documents:** Contain technical documents or guidelines to improve response relevancy.
  - **Audio Files (.mp3):** Supply samples for tone and conversational style.
  - **URLs:** Allow scraping of website content for context.
- **Training Process:**
  1. Add your training files to `src/Agent/training/`.
  2. On execution, the bot processes these files to update its response generation model.
  3. The model updates periodically (e.g., weekly) as new data is added.
- **Customization:**
  - Modify the training data to adjust how the bot crafts its responses.
  - Supported formats offer flexibility in providing contextual data for improved accuracy.

## 4. Core Customization Points

### Comment Generation Engine

- **Location:** `src/Agent/schema/twitter-schema.ts`
- **Details:**
  - Defines response length limits (max 280 characters for Twitter).
  - Sets tone rules to ensure responses are professional and engaging.
  - Specifies banned content or phrases, maintaining compliance with Twitter's guidelines.

### Interaction Patterns

- **Location:** `src/client/Twitter.ts`
- **Configurable Parameters:**
  - **maxTweets:** The maximum number of tweets the bot will interact with (default is 40).
  - **waitTime:** A randomized delay between interactions to mimic natural behavior.
  ```javascript
  const maxTweets = 40; // Maximum tweets to process
  const waitTime = Math.floor(Math.random() * 5000) + 8000; // Delay range: 8 to 13 seconds
  ```

### Personality Configuration

- **Location:** `src/Agent/characters/`
- **Details:**
  - Customize the bot's personality by modifying JSON files.
  - Adjust vocabulary, tone, and emoji usage specific to Twitter's culture.
  - Set cultural reference preferences to better tailor interactions.
  - To use a new custom character:
    1. Add its JSON file to the `src/Agent/characters/` directory.
    2. Update the configuration in **`src/Agent/index.ts`**.
- **Example usage:**

  ```javascript
  // In src/Agent/index.ts:
  // Set the character file path to the custom character JSON file you created:
  const twitterCharacterFile = "src/Agent/characters/YourTwitterCharacter.json";

  // Also, update the import statement to load your custom character:
  import twitterCharacter from "./characters/YourTwitterCharacter.json";
  ```

## 5. Running the Bot

Once the setup is complete:

1. Confirm that your credentials and training data are correctly placed.
2. Run the Twitter bot using your preferred method (via the start script or command line).
3. Monitor console logs to verify successful login and tweet interactions.
4. Check the `cookies/Twittercookies.json` file after the first run for session management.

## 6. Additional Considerations

### Twitter-Specific Limitations

- **Tweet Length:** All comments are limited to 280 characters maximum.
- **Rate Limiting:** Twitter has strict rate limits. The bot includes built-in delays and interaction limits to avoid being flagged as spam.
- **Tweet Engagement:** The bot likes tweets and replies to them with thoughtful comments.

### Safety & Compliance

- **Stealth Settings:** Puppeteer stealth plugins help reduce detection risks.
- **Proxy Configuration:** For enhanced anonymity, configure proxy settings in `src/client/Twitter.ts`.
- **Content Guidelines:** Ensure the bot's responses comply with Twitter's Terms of Service.

### Maintenance & Monitoring

- **Cookie Refresh:** Twitter sessions may expire; the bot will automatically re-login if needed.
- **Training Updates:** Regularly update your training data in `src/Agent/training/` to keep the bot effective and engaging.
- **Error Handling:** Check logs for any authentication issues or interaction failures.

## 7. Differences from Instagram Bot

- **Authentication Flow:** Twitter uses a different login process that the bot is configured to handle.
- **UI Selectors:** Twitter's DOM elements have different selectors than Instagram, which are accounted for in the implementation.
- **Character Limits:** Twitter has a 280-character limit (compared to Instagram's longer comment allowance).
- **Interaction Types:** The bot is configured to like tweets and reply to them (as opposed to Instagram's comment functionality).
