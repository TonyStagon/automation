export declare class SchedulerService {
    private static instance;
    private cronJobs;
    private isRunning;
    private readonly options;
    private constructor();
    static getInstance(): SchedulerService;
    start(): void;
    stop(): void;
    getStatus(): {
        isRunning: boolean;
        jobCount: number;
        jobs: string[];
    };
    private processScheduledPosts;
    private cleanupOldPosts;
    private performHealthCheck;
}
export declare const schedulerService: SchedulerService;
//# sourceMappingURL=SchedulerService.d.ts.map