"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobQueue = exports.JobQueue = void 0;
const bull_1 = __importDefault(require("bull"));
const BrowserAutomation_1 = require("./BrowserAutomation");
const Post_1 = require("../src/models/Post");
const logger_1 = require("../src/utils/logger");
class JobQueue {
    constructor() {
        this.postQueue = new bull_1.default('post automation', {
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
    static getInstance() {
        if (!JobQueue.instance) {
            JobQueue.instance = new JobQueue();
        }
        return JobQueue.instance;
    }
    setupProcessors() {
        this.postQueue.process('facebook-post', 5, this.processFacebookPost.bind(this));
        this.postQueue.process('instagram-post', 3, this.processInstagramPost.bind(this));
        this.postQueue.process('twitter-post', 5, this.processTwitterPost.bind(this));
        this.postQueue.process('linkedin-post', 3, this.processLinkedInPost.bind(this));
    }
    setupEventHandlers() {
        this.postQueue.on('completed', (job, result) => {
            logger_1.logger.info('Job completed successfully', {
                jobId: job.id,
                jobType: job.name,
                result
            });
        });
        this.postQueue.on('failed', (job, err) => {
            logger_1.logger.error('Job failed', {
                jobId: job.id,
                jobType: job.name,
                error: err.message
            });
        });
        this.postQueue.on('stalled', (job) => {
            logger_1.logger.warn('Job stalled', {
                jobId: job.id,
                jobType: job.name
            });
        });
    }
    async addPostJob(jobData, platform, delay = 0) {
        const jobOptions = {
            delay,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
        };
        const jobName = `${platform}-post`;
        logger_1.logger.info('Adding post job to queue', {
            jobName,
            postId: jobData.postId,
            platform,
            delay
        });
        return await this.postQueue.add(jobName, jobData, jobOptions);
    }
    async processFacebookPost(job) {
        logger_1.logger.info('Processing Facebook post job', { jobId: job.id, postId: job.data.postId });
        try {
            const result = await BrowserAutomation_1.browserAutomation.postToFacebook(job.data);
            await this.updatePostStatus(job.data.postId, result);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error processing Facebook post:', error);
            await this.markPostAsFailed(job.data.postId, error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }
    async processInstagramPost(job) {
        logger_1.logger.info('Processing Instagram post job', { jobId: job.id, postId: job.data.postId });
        try {
            // Instagram automation would be implemented here
            const result = {
                success: false,
                platform: 'instagram',
                message: 'Instagram automation not yet implemented',
                error: 'Feature not available'
            };
            await this.updatePostStatus(job.data.postId, result);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error processing Instagram post:', error);
            await this.markPostAsFailed(job.data.postId, error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }
    async processTwitterPost(job) {
        logger_1.logger.info('Processing Twitter post job', { jobId: job.id, postId: job.data.postId });
        try {
            // Twitter automation would be implemented here
            const result = {
                success: false,
                platform: 'twitter',
                message: 'Twitter automation not yet implemented',
                error: 'Feature not available'
            };
            await this.updatePostStatus(job.data.postId, result);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error processing Twitter post:', error);
            await this.markPostAsFailed(job.data.postId, error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }
    async processLinkedInPost(job) {
        logger_1.logger.info('Processing LinkedIn post job', { jobId: job.id, postId: job.data.postId });
        try {
            // LinkedIn automation would be implemented here
            const result = {
                success: false,
                platform: 'linkedin',
                message: 'LinkedIn automation not yet implemented',
                error: 'Feature not available'
            };
            await this.updatePostStatus(job.data.postId, result);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error processing LinkedIn post:', error);
            await this.markPostAsFailed(job.data.postId, error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }
    async updatePostStatus(postId, result) {
        try {
            const post = await Post_1.Post.findById(postId);
            if (!post) {
                logger_1.logger.error('Post not found for status update', { postId });
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
            }
            else {
                post.status = 'failed';
                post.errorMessage = result.error || result.message;
            }
            await post.save();
            logger_1.logger.info('Post status updated', { postId, status: post.status });
        }
        catch (error) {
            logger_1.logger.error('Error updating post status:', error);
        }
    }
    async markPostAsFailed(postId, errorMessage) {
        try {
            await Post_1.Post.findByIdAndUpdate(postId, {
                status: 'failed',
                errorMessage
            });
            logger_1.logger.info('Post marked as failed', { postId, errorMessage });
        }
        catch (error) {
            logger_1.logger.error('Error marking post as failed:', error);
        }
    }
    async getQueueStats() {
        try {
            const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
                this.postQueue.getWaiting(),
                this.postQueue.getActive(),
                this.postQueue.getCompleted(),
                this.postQueue.getFailed(),
                this.postQueue.getDelayed(),
                this.postQueue.getWaiting(),
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
        }
        catch (error) {
            logger_1.logger.error('Error getting queue stats:', error);
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
    async removeJob(jobId) {
        try {
            const job = await this.postQueue.getJob(jobId);
            if (job) {
                await job.remove();
                logger_1.logger.info('Job removed from queue', { jobId });
            }
        }
        catch (error) {
            logger_1.logger.error('Error removing job from queue:', error);
        }
    }
    async pauseQueue() {
        await this.postQueue.pause();
        logger_1.logger.info('Queue paused');
    }
    async resumeQueue() {
        await this.postQueue.resume();
        logger_1.logger.info('Queue resumed');
    }
    async closeQueue() {
        await this.postQueue.close();
        logger_1.logger.info('Queue closed');
    }
}
exports.JobQueue = JobQueue;
exports.jobQueue = JobQueue.getInstance();
//# sourceMappingURL=JobQueue.js.map