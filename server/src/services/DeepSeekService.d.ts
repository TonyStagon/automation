export declare class DeepSeekService {
    private static instance;
    private apiKey;
    private apiUrl;
    private constructor();
    static getInstance(): DeepSeekService;
    generateCaption(keywords: string[], platforms: string[], tone?: string, language?: string): Promise<string>;
    generateHashtags(keywords: string[], platforms: string[], count?: number, language?: string): Promise<string[]>;
    improveCaption(caption: string, platforms: string[], language?: string): Promise<string>;
    translateCaption(caption: string, targetLanguage: string): Promise<string>;
}
export declare const deepSeekService: DeepSeekService;
//# sourceMappingURL=DeepSeekService.d.ts.map