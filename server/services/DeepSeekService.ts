import { logger } from '../utils/logger';

export class DeepSeekService {
  private static instance: DeepSeekService;

  private constructor() {
    logger.info('DeepSeek service initialized (AI features disabled)');
  }

  public static getInstance(): DeepSeekService {
    if (!DeepSeekService.instance) {
      DeepSeekService.instance = new DeepSeekService();
    }
    return DeepSeekService.instance;
  }

  async generateCaption(
    keywords: string[], 
    platforms: string[], 
    tone: string = 'engaging', 
    language: string = 'en'
  ): Promise<string> {
    // Simple fallback caption generation
    const emojis = ['✨', '🚀', '💡', '🎯', '⭐', '🔥', '💪', '🌟'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    const keywordText = keywords.slice(0, 3).join(', ');
    
    const templates = [
      `Excited to share something amazing about ${keywordText}! ${randomEmoji}`,
      `Let's talk about ${keywordText} - it's incredible! ${randomEmoji}`,
      `Discovering new insights about ${keywordText} ${randomEmoji}`,
      `Here's what I've learned about ${keywordText} ${randomEmoji}`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  async generateHashtags(
    keywords: string[], 
    platforms: string[], 
    count: number = 10, 
    language: string = 'en'
  ): Promise<string[]> {
    const hashtagKeywords = keywords.map(k => k.replace(/\s+/g, '').toLowerCase());
    const commonTags = ['socialmedia', 'content', 'engagement', 'community', 'growth'];
    
    const allTags = [...hashtagKeywords, ...commonTags]
      .map(tag => `#${tag}`)
      .slice(0, count);
    
    // Fill remaining slots if needed
    while (allTags.length < count) {
      const extraTags = ['trending', 'viral', 'amazing', 'awesome', 'incredible'];
      const randomTag = extraTags[Math.floor(Math.random() * extraTags.length)];
      if (!allTags.includes(`#${randomTag}`)) {
        allTags.push(`#${randomTag}`);
      }
    }
    
    return allTags.slice(0, count);
  }

  async improveCaption(
    caption: string, 
    platforms: string[], 
    language: string = 'en'
  ): Promise<string> {
    // Simple improvement: add emoji if not present
    const hasEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(caption);
    
    if (!hasEmoji) {
      const emojis = ['✨', '🚀', '💡', '⭐'];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      return `${caption} ${randomEmoji}`;
    }
    
    return caption;
  }

  async translateCaption(caption: string, targetLanguage: string): Promise<string> {
    // For now, just return the original caption
    logger.warn('Translation not implemented - returning original caption');
    return caption;
  }
}

export const deepSeekService = DeepSeekService.getInstance();