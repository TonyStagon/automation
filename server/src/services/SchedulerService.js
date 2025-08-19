"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schedulerService = exports.SchedulerService = void 0;
const node_cron_1 = require("node-cron");
const Post_1 = require("../src/models/Post");
const logger_1 = require("../src/utils/logger");
class SchedulerService {
    constructor() {
        this.cronJobs = new Map();
        this.isRunning = false;
        this.options = {
            scheduled: false,
            timezone: 'UTC'
        };
    }
    static getInstance() {
        if (!SchedulerService.instance) {
            SchedulerService.instance = new SchedulerService();
        }
        return SchedulerService.instance;
    }
    start() {
        if (this.isRunning)
            return;
        try {
            const scheduledPostsTask = (0, node_cron_1.schedule)('* * * * *', this.processScheduledPosts.bind(this), this.options);
            const cleanupTask = (0, node_cron_1.schedule)('0 * * * *', this.cleanupOldPosts.bind(this), this.options);
            const healthCheckTask = (0, node_cron_1.schedule)('*/5 * * * *', this.performHealthCheck.bind(this), this.options);
            this.cronJobs.set('scheduled-posts', scheduledPostsTask);
            this.cronJobs.set('cleanup', cleanupTask);
            this.cronJobs.set('health-check', healthCheckTask);
            this.cronJobs.forEach(task => task.start());
            this.isRunning = true;
        }
        catch (error) {
            logger_1.logger.error('Failed to start scheduler:', error);
        }
    }
    stop() {
        if (!this.isRunning)
            return;
        this.cronJobs.forEach(task => task.stop());
        this.cronJobs.clear();
        this.isRunning = false;
    }
    getStatus() {
        return {
            isRunning: this.isRunning,
            jobCount: this.cronJobs.size,
            jobs: Array.from(this.cronJobs.keys())
        };
    }
    async processScheduledPosts() {
        try {
            const now = new Date();
            const posts = await Post_1.Post.find({
                status: 'scheduled',
                scheduledDate: { $lte: now }
            });
            await Promise.all(posts.map(post => {
                post.status = 'published';
                return post.save();
            }));
        }
        catch (error) {
            logger_1.logger.error('Error processing scheduled posts:', error);
        }
    }
    async cleanupOldPosts() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        try {
            await Post_1.Post.deleteMany({
                status: { $in: ['archived', 'failed'] },
                updatedAt: { $lt: thirtyDaysAgo }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to clean old posts:', error);
        }
    }
    async performHealthCheck() {
        try {
            await Post_1.Post.findOne(); // Simple connection check
        }
        catch (error) {
            logger_1.logger.error('Scheduler health check failed:', error);
        }
    }
}
exports.SchedulerService = SchedulerService;
exports.schedulerService = SchedulerService.getInstance();
//# sourceMappingURL=SchedulerService.js.map