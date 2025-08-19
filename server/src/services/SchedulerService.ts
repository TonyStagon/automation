import { schedule, ScheduledTask } from 'node-cron';
import { Post } from '../models/Post';
import { logger } from '../utils/logger';

interface SchedulerOptions {
  scheduled: boolean;
  timezone?: string;
}

export class SchedulerService {
  private static instance: SchedulerService;
  private cronJobs: Map<string, ScheduledTask> = new Map();
  private isRunning = false;
  private readonly options: SchedulerOptions = {
    scheduled: false,
    timezone: 'UTC'
  };

  private constructor() {}

  public static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  public start(): void {
    if (this.isRunning) return;

    try {
      const scheduledPostsTask = schedule('* * * * *', 
        this.processScheduledPosts.bind(this), 
        this.options
      );

      const cleanupTask = schedule('0 * * * *',
        this.cleanupOldPosts.bind(this),
        this.options  
      );

      const healthCheckTask = schedule('*/5 * * * *',
        this.performHealthCheck.bind(this),
        this.options
      );

      this.cronJobs.set('scheduled-posts', scheduledPostsTask);
      this.cronJobs.set('cleanup', cleanupTask);
      this.cronJobs.set('health-check', healthCheckTask);

      this.cronJobs.forEach(task => task.start());
      this.isRunning = true;
    } catch (error) {
      logger.error('Failed to start scheduler:', error);
    }
  }

  public stop(): void {
    if (!this.isRunning) return;

    this.cronJobs.forEach(task => task.stop());
    this.cronJobs.clear();
    this.isRunning = false;
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      jobCount: this.cronJobs.size,
      jobs: Array.from(this.cronJobs.keys())
    };
  }

  private async processScheduledPosts(): Promise<void> {
    try {
      const now = new Date();
      const posts = await Post.find({
        status: 'scheduled',
        scheduledDate: { $lte: now }  
      });

      await Promise.all(posts.map(post => {
        post.status = 'published';
        return post.save();
      }));
    } catch (error) {
      logger.error('Error processing scheduled posts:', error);
    }
  }

  private async cleanupOldPosts(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      await Post.deleteMany({
        status: { $in: ['archived', 'failed'] },
        updatedAt: { $lt: thirtyDaysAgo }
      });
    } catch (error) {
      logger.error('Failed to clean old posts:', error); 
    }
  }

  private async performHealthCheck(): Promise<void> {
    try {
      await Post.findOne(); // Simple connection check
    } catch (error) {
      logger.error('Scheduler health check failed:', error);
    }
  }
}

export const schedulerService = SchedulerService.getInstance();