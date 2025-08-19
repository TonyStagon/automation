import Bull from 'bull';
import { JobData } from '../types';
export declare class JobQueue {
    private static instance;
    private postQueue;
    private constructor();
    static getInstance(): JobQueue;
    private setupProcessors;
    private setupEventHandlers;
    addPostJob(jobData: JobData, platform: string, delay?: number): Promise<Bull.Job>;
    private processFacebookPost;
    private processInstagramPost;
    private processTwitterPost;
    private processLinkedInPost;
    private updatePostStatus;
    private markPostAsFailed;
    getQueueStats(): Promise<any>;
    removeJob(jobId: string): Promise<void>;
    pauseQueue(): Promise<void>;
    resumeQueue(): Promise<void>;
    closeQueue(): Promise<void>;
}
export declare const jobQueue: JobQueue;
//# sourceMappingURL=JobQueue.d.ts.map