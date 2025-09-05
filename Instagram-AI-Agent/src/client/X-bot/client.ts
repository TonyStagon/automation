import TwitterApi from 'twitter-api-v2';
import { TWITTER_API_CREDENTIALS } from '../../secret';
import logger from '../../config/logger';

// Create a Twitter client instance
// Create Twitter client with OAuth1.0a credentials
const twitterClient = new TwitterApi({
  appKey: TWITTER_API_CREDENTIALS.consumerKey,
  appSecret: TWITTER_API_CREDENTIALS.consumerSecret,
  accessToken: TWITTER_API_CREDENTIALS.accessToken,
  accessTokenSecret: TWITTER_API_CREDENTIALS.accessTokenSecret,
});

// Create v1 client for Twitter API v1.1 endpoints
const v1Client = twitterClient.v1;

// Read-only client for read operations
const readOnlyClient = twitterClient.readOnly;

// Read-write client for both reading and writing operations
const readWriteClient = twitterClient.readWrite;

export { twitterClient, readOnlyClient, readWriteClient };