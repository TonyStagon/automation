export interface Post {
  id: string;
  caption: string;
  media?: string;
  platforms: string[];
  status: 'draft' | 'published' | 'failed';
  createdAt: Date;
}

export interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  maxChars: number;
  supportsHashtags: boolean;
  supportsMedia: boolean;
}

export interface AutomationRequest {
  caption: string;
  HEADLESS: string;
  KEEP_BROWSER_OPEN: string;
  headless: boolean;
  keepBrowserOpen: boolean;
  imageFileName?: string;
}