export class SchedulerService {
    private static instance: SchedulerService;
    private constructor() {}

    public static getInstance(): SchedulerService {
        if (!SchedulerService.instance) {
            SchedulerService.instance = new SchedulerService();
        }
        return SchedulerService.instance;
    }

    public start() {
        console.log('Scheduler started');
    }

    public stop() {
        console.log('Scheduler stopped');
    }
}

// Named export matching the import
export const schedulerService = SchedulerService.getInstance();