import { Document, Types } from 'mongoose';
declare global {
    interface IBrowserAutomation {
        closeBrowsers(): Promise<void>;
        postToFacebook(content: string): Promise<void>;
    }
}
export interface IPost extends Document {
    title: string;
    content: string;
    caption?: string;
    media?: string[];
    scheduledDate?: Date;
    status: 'draft' | 'published' | 'archived' | 'failed';
    userId: Types.ObjectId;
    platforms: string[];
    errorMessage?: string;
    analytics?: {
        views: number;
        likes: number;
        reach: number;
        comments: number;
        impressions: number;
    };
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=models.d.ts.map