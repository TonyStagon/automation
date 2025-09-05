import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { logger } from '../utils/logger';

export interface MetaAPIConfig {
  appId: string;
  appSecret: string;
  accessToken?: string;
  pageId?: string;
  version?: string;
}

export interface MetaPostData {
  message: string;
  published?: boolean;
  scheduled_publish_time?: number;
  backdated_time?: string;
  tags?: string[];
  link?: string;
  picture?: string;
  name?: string;
  caption?: string;
  description?: string;
}

export interface MetaPostResponse {
  id: string;
  post_id: string;
  success: boolean;
  message?: string;
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

export class MetaAPIService {
  private config: MetaAPIConfig;
  private tokenFile: string;
  private isInitialized = false;

  constructor(config: MetaAPIConfig) {
    this.config = {
      version: 'v18.0',
      ...config
    };
    this.tokenFile = path.join(process.cwd(), 'meta_tokens.json');
  }

  async initialize(): Promise<void> {
    try {
      // Load existing tokens if available
      await this.loadTokens();
      
      // Validate configuration
      this.validateConfig();
      
      this.isInitialized = true;
      logger.info('Meta API Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Meta API Service:', error);
      throw error;
    }
  }

  private async loadTokens(): Promise<void> {
    try {
      if (await fs.pathExists(this.tokenFile)) {
        const tokens = await fs.readJson(this.tokenFile);
        this.config.accessToken = tokens.accessToken;
        this.config.pageId = tokens.pageId;
        logger.info('Meta API tokens loaded from file');
      }
    } catch (error) {
      logger.warn('Failed to load Meta API tokens:', error);
    }
  }

  private async saveTokens(): Promise<void> {
    try {
      const tokens = {
        accessToken: this.config.accessToken,
        pageId: this.config.pageId,
        lastUpdated: new Date().toISOString()
      };
      await fs.writeJson(this.tokenFile, tokens, { spaces: 2 });
      logger.info('Meta API tokens saved to file');
    } catch (error) {
      logger.error('Failed to save Meta API tokens:', error);
    }
  }

  private validateConfig(): void {
    if (!this.config.appId || !this.config.appSecret) {
      throw new Error('Meta App ID and App Secret are required');
    }
    
    if (!this.config.accessToken && !this.config.pageId) {
      logger.warn('No access token or page ID configured');
    }
  }

  async getAccessToken(): Promise<string> {
    if (!this.config.accessToken) {
      await this.generateAccessToken();
    }
    return this.config.accessToken!;
  }

  async generateAccessToken(): Promise<void> {
    try {
      logger.info('Generating new Meta access token...');
      
      const tokenUrl = `https://graph.facebook.com/oauth/access_token`;
      const params = {
        grant_type: 'client_credentials',
        client_id: this.config.appId,
        client_secret: this.config.appSecret,
        scope: 'pages_manage_posts,pages_read_engagement,public_profile'
      };

      const response = await axios.post(tokenUrl, null, { params });
      
      if (response.data.access_token) {
        this.config.accessToken = response.data.access_token;
        await this.saveTokens();
        logger.info('Meta access token generated successfully');
      } else {
        throw new Error('No access token received from Meta API');
      }
    } catch (error) {
      logger.error('Failed to generate Meta access token:', error);
      throw new Error(`Failed to generate access token: ${error.message}`);
    }
  }

  async getUserPages(): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      const url = `https://graph.facebook.com/${this.config.version}/me/accounts`;
      
      const response = await axios.get(url, {
        params: { access_token: token }
      });

      return response.data.data || [];
    } catch (error) {
      logger.error('Failed to get user pages:', error);
      throw error;
    }
  }

  async setPageId(pageId: string): Promise<void> {
    try {
      // Verify the page is accessible
      const token = await this.getAccessToken();
      const url = `https://graph.facebook.com/${this.config.version}/${pageId}`;
      
      await axios.get(url, {
        params: { access_token: token, fields: 'name' }
      });

      this.config.pageId = pageId;
      await this.saveTokens();
      logger.info(`Meta page ID set to: ${pageId}`);
    } catch (error) {
      logger.error(`Failed to set page ID to ${pageId}:`, error);
      throw new Error(`Invalid page ID or insufficient permissions: ${error.message}`);
    }
  }

  async createPost(postData: MetaPostData): Promise<MetaPostResponse> {
    try {
      if (!this.config.pageId) {
        throw new Error('Page ID is required for posting');
      }

      const token = await this.getAccessToken();
      const url = `https://graph.facebook.com/${this.config.version}/${this.config.pageId}/feed`;
      
      const params = {
        access_token: token,
        message: postData.message,
        published: postData.published !== false,
        ...Object.fromEntries(
          Object.entries(postData).filter(([key]) => 
            !['message', 'published'].includes(key)
          )
        )
      };

      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await axios.post(url, null, { params });
      
      const result: MetaPostResponse = {
        id: response.data.id,
        post_id: response.data.post_id || response.data.id,
        success: true,
        message: 'Post created successfully'
      };

      logger.info(`Meta post created: ${result.post_id}`);
      return result;
    } catch (error: any) {
      logger.error('Failed to create Meta post:', error);
      
      const result: MetaPostResponse = {
        id: '',
        post_id: '',
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message,
          type: error.response?.data?.error?.type || 'unknown',
          code: error.response?.data?.error?.code || 0
        }
      };

      return result;
    }
  }

  async schedulePost(postData: MetaPostData, scheduledTime: Date): Promise<MetaPostResponse> {
    try {
      const scheduledTimestamp = Math.floor(scheduledTime.getTime() / 1000);
      
      const scheduledPostData = {
        ...postData,
        published: false,
        scheduled_publish_time: scheduledTimestamp
      };

      return await this.createPost(scheduledPostData);
    } catch (error) {
      logger.error('Failed to schedule Meta post:', error);
      throw error;
    }
  }

  async getPostInsights(postId: string): Promise<any> {
    try {
      const token = await this.getAccessToken();
      const url = `https://graph.facebook.com/${this.config.version}/${postId}/insights`;
      
      const response = await axios.get(url, {
        params: { 
          access_token: token,
          metric: 'post_engaged_users,post_impressions,post_clicks'
        }
      });

      return response.data.data;
    } catch (error) {
      logger.error('Failed to get post insights:', error);
      throw error;
    }
  }

  async validatePermissions(): Promise<{ valid: boolean; missing: string[] }> {
    try {
      const token = await this.getAccessToken();
      const url = `https://graph.facebook.com/${this.config.version}/me/permissions`;
      
      const response = await axios.get(url, { params: { access_token: token } });
      
      const requiredPermissions = [
        'pages_manage_posts',
        'pages_read_engagement',
        'public_profile'
      ];
      
      const grantedPermissions = response.data.data.map((p: any) => p.permission);
      const missingPermissions = requiredPermissions.filter(p => !grantedPermissions.includes(p));
      
      return {
        valid: missingPermissions.length === 0,
        missing: missingPermissions
      };
    } catch (error) {
      logger.error('Failed to validate permissions:', error);
      return { valid: false, missing: ['unknown'] };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const token = await this.getAccessToken();
      const url = `https://graph.facebook.com/${this.config.version}/me`;
      
      const response = await axios.get(url, {
        params: { access_token: token, fields: 'name' }
      });

      return {
        success: true,
        message: `Connected as: ${response.data.name}`
      };
    } catch (error) {
      logger.error('Meta API connection test failed:', error);
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }

  async revokeToken(): Promise<void> {
    try {
      if (this.config.accessToken) {
        const url = `https://graph.facebook.com/${this.config.version}/me/permissions`;
        await axios.delete(url, {
          params: { access_token: this.config.accessToken }
        });
        
        this.config.accessToken = undefined;
        this.config.pageId = undefined;
        await this.saveTokens();
        
        logger.info('Meta API token revoked successfully');
      }
    } catch (error) {
      logger.error('Failed to revoke Meta API token:', error);
    }
  }

  // Enhanced methods for automation effects
  async createPostWithEffects(postData: MetaPostData, effects?: {
    launchAnimation?: boolean;
    typingEffects?: boolean;
    postEffects?: boolean;
    visualFeedback?: boolean;
  }): Promise<MetaPostResponse> {
    try {
      // Apply effects if enabled
      if (effects?.launchAnimation) {
        await this.showLaunchSequence();
      }

      if (effects?.typingEffects) {
        await this.simulateTyping(postData.message);
      }

      // Create the post
      const result = await this.createPost(postData);

      if (effects?.postEffects && result.success) {
        await this.addPostCreationEffects(result.post_id);
      }

      return result;
    } catch (error) {
      logger.error('Failed to create post with effects:', error);
      throw error;
    }
  }

  private async showLaunchSequence(): Promise<void> {
    logger.info('🎬 META API LAUNCH SEQUENCE INITIATED...');
    const steps = [
      '🔧 Initializing Meta API modules...',
      '🔐 Establishing secure connection...',
      '🌐 Loading Facebook integration...',
      '⚡ Preparing automation engine...',
      '🎯 Setting up precision targeting...',
      '✨ Meta API effects enabled...'
    ];

    for (const step of steps) {
      logger.info(step);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    logger.info('🚀 META API LAUNCH SEQUENCE COMPLETE!');
  }

  private async simulateTyping(message: string): Promise<void> {
    logger.info('⌨️ META API TYPING SEQUENCE INITIATED...');
    
    // Simulate typing with delays
    for (let i = 0; i < message.length; i++) {
      const char = message[i];
      let delay = 40 + Math.random() * 60;
      
      if (char === ' ') delay = 80 + Math.random() * 80;
      if (char.match(/[.!?]/)) delay = 150 + Math.random() * 150;
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Random thinking pauses
      if (Math.random() > 0.85) {
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 500));
      }
    }
    
    logger.info('✅ META API TYPING SEQUENCE COMPLETED');
  }

  private async addPostCreationEffects(postId: string): Promise<void> {
    logger.info('✨ Adding Meta API post creation effects...');
    
    // Could add additional effects here like:
    // - Analytics tracking
    // - Notification systems
    // - Cross-platform posting
    // - Enhanced logging
    
    logger.info(`🎉 Meta API post ${postId} created with enhanced effects!`);
  }

  // Configuration management
  updateConfig(newConfig: Partial<MetaAPIConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Meta API configuration updated');
  }

  getConfig(): MetaAPIConfig {
    return { ...this.config };
  }

  isReady(): boolean {
    return this.isInitialized && !!this.config.accessToken;
  }
}

// Export singleton instance
export const metaAPIService = new MetaAPIService({
  appId: process.env.META_APP_ID || '',
  appSecret: process.env.META_APP_SECRET || '',
  accessToken: process.env.META_ACCESS_TOKEN,
  pageId: process.env.META_PAGE_ID,
  version: process.env.META_API_VERSION || 'v18.0'
});
