import Bull from 'bull';
import { redis } from '../config/redis';
import { browserAutomation } from './BrowserAutomation';
import { JobData, BrowserAutomationResult } from '../types';
import { Post } from '../models/Post';
import { logger } from '../utils/logger';

export class JobQueue {
  private static instance: JobQueue;
  private postQueue: Bull.Queue;

  private constructor() {
    this.postQueue = new Bull('post automation', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    this.setupProcessors();
    this.setupEventHandlers();
  }

  public static getInstance(): JobQueue {
    if (!JobQueue.instance) {
      JobQueue.instance = new JobQueue();
    }
    return JobQueue.instance;
  }

  private setupProcessors(): void {
    this.postQueue.process('facebook-post', 5, this.processFacebookPost.bind(this));
    this.postQueue.process('instagram-post', 3, this.processInstagramPost.bind(this));
    this.postQueue.process('twitter-post', 5, this.processTwitterPost.bind(this));
    this.postQueue.process('linkedin-post', 3, this.processLinkedInPost.bind(this));
  }

  private setupEventHandlers(): void {
    this.postQueue.on('completed', (job, result) => {
      logger.info('Job completed successfully', { 
        jobId: job.id, 
        jobType: job.name,
        result 
      });
    });

    this.postQueue.on('failed', (job, err) => {
      logger.error('Job failed', { 
        jobId: job.id, 
        jobType: job.name,
        error: err.message 
      });
    });

    this.postQueue.on('stalled', (job) => {
      logger.warn('Job stalled', { 
        jobId: job.id, 
        jobType: job.name 
      });
    });
  }

  async addPostJob(
    jobData: JobData, 
    platform: string, 
    delay: number = 0
  ): Promise<Bull.Job> {
    const jobOptions: Bull.JobOptions = {
      delay,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    };

    const jobName = `${platform}-post`;
    
    logger.info('Adding post job to queue', { 
      jobName, 
      postId: jobData.postId,
      platform,
      delay 
    });

    return await this.postQueue.add(jobName, jobData, jobOptions);
  }

  private async processFacebookPost(job: Bull.Job<JobData>): Promise<BrowserAutomationResult> {
    logger.info('Processing Facebook post job', { jobId: job.id, postId: job.data.postId });
    
    try {
      const result = await browserAutomation.postToFacebook(job.data);
      await this.updatePostStatus(job.data.postId, result);
      return result;
    } catch (error) {
      logger.error('Error processing Facebook post:', error);
      await this.markPostAsFailed(job.data.postId, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async processInstagramPost(job: Bull.Job<JobData>): Promise<BrowserAutomationResult> {
    logger.info('Processing Instagram post job', { jobId: job.id, postId: job.data.postId });
    
    try {
      // Instagram automation would be implemented here
      const result: BrowserAutomationResult = {
        success: false,
        platform: 'instagram',
        message: 'Instagram automation not yet implemented',
        error: 'Feature not available'
      };
      
      await this.updatePostStatus(job.data.postId, result);
      return result;
    } catch (error) {
      logger.error('Error processing Instagram post:', error);
      await this.markPostAsFailed(job.data.postId, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async processTwitterPost(job: Bull.Job<JobData>): Promise<BrowserAutomationResult> {
    logger.info('Processing Twitter post job', { jobId: job.id, postId: job.data.postId });
    
    try {
      // Twitter automation would be implemented here
      const result: BrowserAutomationResult = {
        success: false,
        platform: 'twitter',
        message: 'Twitter automation not yet implemented',
        error: 'Feature not available'
      };
      
      await this.updatePostStatus(job.data.postId, result);
      return result;
    } catch (error) {
      logger.error('Error processing Twitter post:', error);
      await this.markPostAsFailed(job.data.postId, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async processLinkedInPost(job: Bull.Job<JobData>): Promise<BrowserAutomationResult> {
    logger.info('Processing LinkedIn post job', { jobId: job.id, postId: job.data.postId });
    
    try {
      // LinkedIn automation would be implemented here
      const result: BrowserAutomationResult = {
        success: false,
        platform: 'linkedin',
        message: 'LinkedIn automation not yet implemented',
        error: 'Feature not available'
      };
      
      await this.updatePostStatus(job.data.postId, result);
      return result;
    } catch (error) {
      logger.error('Error processing LinkedIn post:', error);
      await this.markPostAsFailed(job.data.postId, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async updatePostStatus(postId: string, result: BrowserAutomationResult): Promise<void> {
    try {
      const post = await Post.findById(postId);
      if (!post) {
        logger.error('Post not found for status update', { postId });
        return;
      }

      if (result.success) {
        post.status = 'published';
        if (result.analytics) {
          post.analytics = {
            ...post.analytics,
            ...result.analytics
          };
        }
      } else {
        post.status = 'failed';
        post.errorMessage = result.error || result.message;
      }

      await post.save();
      logger.info('Post status updated', { postId, status: post.status });
    } catch (error) {
      logger.error('Error updating post status:', error);
    }
  }

  private async markPostAsFailed(postId: string, errorMessage: string): Promise<void> {
    try {
      await Post.findByIdAndUpdate(postId, {
        status: 'failed',
        errorMessage
      });
      logger.info('Post marked as failed', { postId, errorMessage });
    } catch (error) {
      logger.error('Error marking post as failed:', error);
    }
  }

  async getQueueStats(): Promise<any> {
    try {
      const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
        this.postQueue.getWaiting(),
        this.postQueue.getActive(),
        this.postQueue.getCompleted(),
        this.postQueue.getFailed(),
        this.postQueue.getDelayed(),
        this.postQueue.getPaused(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        paused: paused.length,
        total: waiting.length + active.length + completed.length + failed.length + delayed.length + paused.length
      };
    } catch (error) {
      logger.error('Error getting queue stats:', error);
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: 0,
        total: 0
      };
    }
  }

  async removeJob(jobId: string): Promise<void> {
    try {
      const job = await this.postQueue.getJob(jobId);
      if (job) {
        await job.remove();
        logger.info('Job removed from queue', { jobId });
      }
    } catch (error) {
      logger.error('Error removing job from queue:', error);
    }
  }

  async pauseQueue(): Promise<void> {
    await this.postQueue.pause();
    logger.info('Queue paused');
  }

  async resumeQueue(): Promise<void> {
    await this.postQueue.resume();
    logger.info('Queue resumed');
  }

  async closeQueue(): Promise<void> {
    await this.postQueue.close();
    logger.info('Queue closed');
  }
}

export const jobQueue = JobQueue.getInstance();