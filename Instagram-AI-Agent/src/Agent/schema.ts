import mongoose from 'mongoose';
import { SchemaType } from '@google/generative-ai';

// Define the schema for Instagram comments
const InstagramCommentSchema = new mongoose.Schema({
  comment: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Define the schema for Twitter tweets
const TwitterTweetSchema = new mongoose.Schema({
  tweet: {
    type: String,
    required: true,
    maxlength: 280, // Twitter's character limit
  },
  imageUrl: {
    type: String,
    required: false,
  },
  timeTweeted: {
    type: Date,
    default: Date.now,
  },
});

// Create models from schemas
const InstagramComment = mongoose.model('InstagramComment', InstagramCommentSchema);
const TwitterTweet = mongoose.model('TwitterTweet', TwitterTweetSchema);

// Function to get the Instagram comment schema
export const getInstagramCommentSchema = (): {
  type: SchemaType.OBJECT,
  properties: {
    comment: {
      type: SchemaType.STRING,
      description: string
    }
  },
  required: string[]
} => {
  return {
    type: SchemaType.OBJECT,
    properties: {
      comment: {
        type: SchemaType.STRING,
        description: "A thoughtful, engaging Instagram comment that's relevant to the post content",
      },
    },
    required: ['comment'],
  };
};

// Function to get the Twitter tweet schema
export const getTwitterTweetSchema = (): {
  type: SchemaType.OBJECT,
  properties: {
    tweet: {
      type: SchemaType.STRING,
      description: string,
      maxLength?: number
    }
  },
  required: string[]
} => {
  return {
    type: SchemaType.OBJECT,
    properties: {
      tweet: {
        type: SchemaType.STRING,
        description: 'An engaging Twitter tweet of 280 characters or less with relevant hashtags',
        maxLength: 280,
      },
    },
    required: ['tweet'],
  };
};

export default TwitterTweet;