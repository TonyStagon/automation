import { twitterClient } from './client';
import logger from '../../config/logger';
import { download } from '../../utils/download';
import { canSendTweet, saveTweetData } from '../../utils';
import { runAgent } from '../../Agent';
import { getTwitterTweetSchema } from '../../Agent/schema';
import { excitingTweets } from '../../test/tweets';

// Delay utility function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to post a tweet with text only
async function postTweet(tweetText: string) {
  try {
    logger.info(`Posting tweet: ${tweetText}`);
    const tweet = await twitterClient.v2.tweet({
      text: tweetText,
    });
    
    logger.info(`Tweet posted successfully with ID: ${tweet.data.id}`);
    await saveTweetData(tweetText, '', new Date().toISOString());
    return tweet.data;
  } catch (error) {
    logger.error('Error posting tweet:', error);
    throw error;
  }
}

// Function to post a tweet with an image
async function postTweetWithMedia(tweetText: string, imageUrl: string) {
  return new Promise((resolve, reject) => {
    const filename = "twitter_image.png";
    
    download(imageUrl, filename, async function () {
      try {
        logger.info(`Uploading media from ${imageUrl}`);
        const mediaId = await twitterClient.v1.uploadMedia(`./${filename}`);
        
        logger.info(`Posting tweet with media: ${tweetText}`);
        const tweet = await twitterClient.v2.tweet({
          text: tweetText,
          media: {
            media_ids: [mediaId],
          },
        });
        
        logger.info(`Tweet with media posted successfully with ID: ${tweet.data.id}`);
        await saveTweetData(tweetText, imageUrl, new Date().toISOString());
        resolve(tweet.data);
      } catch (error) {
        logger.error('Error posting tweet with media:', error);
        reject(error);
      }
    });
  });
}

// Function to like a tweet
async function likeTweet(tweetId: string) {
  try {
    logger.info(`Liking tweet: ${tweetId}`);
    const result = await twitterClient.v2.like(process.env.Xusername || '', tweetId);
    logger.info(`Tweet liked successfully: ${tweetId}`);
    return result;
  } catch (error) {
    logger.error(`Error liking tweet ${tweetId}:`, error);
    throw error;
  }
}

// Function to retweet
async function retweet(tweetId: string) {
  try {
    logger.info(`Retweeting: ${tweetId}`);
    const result = await twitterClient.v2.retweet(process.env.Xusername || '', tweetId);
    logger.info(`Retweeted successfully: ${tweetId}`);
    return result;
  } catch (error) {
    logger.error(`Error retweeting ${tweetId}:`, error);
    throw error;
  }
}

// Function to reply to a tweet
async function replyToTweet(inReplyToTweetId: string, replyText: string) {
  try {
    logger.info(`Replying to tweet ${inReplyToTweetId}: ${replyText}`);
    const reply = await twitterClient.v2.reply(replyText, inReplyToTweetId);
    logger.info(`Reply posted successfully with ID: ${reply.data.id}`);
    return reply.data;
  } catch (error) {
    logger.error(`Error replying to tweet ${inReplyToTweetId}:`, error);
    throw error;
  }
}

// Function to get recent tweets from the home timeline
async function getHomeTimeline(maxResults: number = 10) {
  try {
    logger.info(`Getting home timeline (max ${maxResults} tweets)`);
    const timeline = await twitterClient.v2.homeTimeline({
      max_results: maxResults,
      'tweet.fields': ['created_at', 'author_id', 'conversation_id', 'text'],
      'user.fields': ['name', 'username'],
      expansions: ['author_id'],
    });
    
    logger.info(`Retrieved ${timeline.data.data.length} tweets from home timeline`);
    return timeline.data;
  } catch (error) {
    logger.error('Error getting home timeline:', error);
    throw error;
  }
}

// Function to search for tweets with a specific query
async function searchTweets(query: string, maxResults: number = 10) {
  try {
    logger.info(`Searching tweets with query: ${query} (max ${maxResults} results)`);
    const searchResults = await twitterClient.v2.search({
      query,
      max_results: maxResults,
      'tweet.fields': ['created_at', 'author_id', 'conversation_id', 'text'],
      'user.fields': ['name', 'username'],
      expansions: ['author_id'],
    });
    
    logger.info(`Found ${searchResults.data.data.length} tweets matching query`);
    return searchResults.data;
  } catch (error) {
    logger.error(`Error searching tweets with query ${query}:`, error);
    throw error;
  }
}

// Generate AI-based tweet content
async function generateTweetContent(context: string = '') {
  try {
    logger.info("Generating AI tweet content");
    const schema = getTwitterTweetSchema();
    const prompt = `Generate an engaging tweet about AI chatbot technology that helps businesses with customer support. The tweet should be concise (less than 280 characters), engaging, and include relevant hashtags. ${context ? `Context for the tweet: ${context}` : ''}`;
    
    const { tweet } = await runAgent(getTwitterTweetSchema(), prompt);
    return tweet;
    if (Array.isArray(tweet) && tweet[0]) {
      logger.info(`AI generated tweet: ${tweet[0]}`);
      return tweet[0];
    } else {
      // Fallback to predefined tweets
      const fallbackTweet = excitingTweets[Math.floor(Math.random() * excitingTweets.length)];
      logger.info(`Using fallback tweet: ${fallbackTweet}`);
      return fallbackTweet;
    }
  } catch (error) {
    logger.error('Error generating tweet content:', error);
    // Fallback to predefined tweets
    const fallbackTweet = excitingTweets[Math.floor(Math.random() * excitingTweets.length)];
    logger.info(`Using fallback tweet after error: ${fallbackTweet}`);
    return fallbackTweet;
  }
}

// Function to generate an AI response to a specific tweet
async function generateTweetReply(tweetText: string) {
  try {
    logger.info(`Generating AI reply to: ${tweetText}`);
    const schema = getTwitterTweetSchema();
    const prompt = `Craft a thoughtful, engaging reply to the following tweet: "${tweetText}". The reply should be relevant, insightful, and add value to the conversation. It should be under 280 characters and appropriate for Twitter.`;
    
    const { tweet } = await runAgent(getTwitterTweetSchema(), prompt);
    return tweet;
    if (Array.isArray(tweet) && tweet[0]) {
      logger.info(`AI generated reply: ${tweet[0]}`);
      return tweet[0];
    } else {
      // Fallback reply
      const fallbackReply = "Thanks for sharing! This is really interesting. Looking forward to learning more about this topic. #EngagingConversations";
      logger.info(`Using fallback reply: ${fallbackReply}`);
      return fallbackReply;
    }
  } catch (error) {
    logger.error('Error generating tweet reply:', error);
    // Fallback reply
    const fallbackReply = "Thanks for sharing! This is really interesting. Looking forward to learning more about this topic. #EngagingConversations";
    logger.info(`Using fallback reply after error: ${fallbackReply}`);
    return fallbackReply;
  }
}

// Main function to run the Twitter agent
async function runTwitter() {
  try {
    logger.info("Starting Twitter agent...");
    
    // Check if we can send a tweet today (limit to 17 per day)
    const canSend = await canSendTweet();
    if (!canSend) {
      logger.info("Daily tweet limit reached (17 tweets). Skipping tweet.");
      return;
    }

    // Generate tweet content
    const tweetContent = await generateTweetContent();
    
    // Decide whether to include an image (50% chance)
    const includeImage = Math.random() > 0.5;
    
    if (includeImage) {
      // Sample image URLs - replace with your own image URLs or use a service
      const imageUrls = [
        "https://th.bing.com/th/id/R.ae6f69f96681689598d25c19fb2f6b8c?rik=pep5uJzjHTlqxQ&pid=ImgRaw&r=0",
        "https://cdn.pixabay.com/photo/2021/09/15/08/14/artificial-intelligence-6626581_1280.jpg",
        "https://cdn.pixabay.com/photo/2019/04/15/11/47/artificial-intelligence-4129238_1280.jpg"
      ];
      const randomImageUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)];
      
      // Post tweet with image
      await postTweetWithMedia(tweetContent, randomImageUrl);
    } else {
      // Post text-only tweet
      await postTweet(tweetContent);
    }

    // Get recent tweets to engage with
    const timeline = await getHomeTimeline(5);
    
    // Engage with some tweets (like, retweet, reply)
    for (const tweet of timeline.data) {
      // 30% chance to like a tweet
      if (Math.random() < 0.3) {
        await likeTweet(tweet.id);
        await delay(2000); // Wait 2 seconds to avoid rate limits
      }
      
      // 10% chance to retweet
      if (Math.random() < 0.1) {
        await retweet(tweet.id);
        await delay(2000);
      }
      
      // 20% chance to reply
      if (Math.random() < 0.2) {
        const replyContent = await generateTweetReply(tweet.text);
        await replyToTweet(tweet.id, replyContent);
        await delay(2000);
      }
    }
    
    logger.info("Twitter agent iteration completed successfully");
  } catch (error) {
    logger.error("Error in Twitter agent:", error);
  }
}

export { 
  runTwitter, 
  postTweet, 
  postTweetWithMedia, 
  likeTweet, 
  retweet, 
  replyToTweet,
  getHomeTimeline,
  searchTweets,
  generateTweetContent,
  generateTweetReply
};