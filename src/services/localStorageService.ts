import type { Post } from '../types';

const STORAGE_KEY = 'posts_history';

export class LocalStorageService {
  private static getPostsFromStorage(): Post[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error reading posts from localStorage:', error);
      return [];
    }
  }

  private static savePostsToStorage(posts: Post[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch (error) {
      console.error('Error saving posts to localStorage:', error);
    }
  }

  static async savePost(post: Omit<Post, 'id' | 'createdAt'>, platforms: string[]): Promise<Post> {
    const newPost: Post = {
      ...post,
      id: crypto.randomUUID(),
      platforms: platforms,
      createdAt: new Date(),
      status: 'published' as const
    };

    const existingPosts = this.getPostsFromStorage();
    const updatedPosts = [newPost, ...existingPosts];
    this.savePostsToStorage(updatedPosts);

    return newPost;
  }

  static async getPosts(): Promise<Post[]> {
    return this.getPostsFromStorage();
  }

  static async deletePost(postId: string): Promise<void> {
    const posts = this.getPostsFromStorage();
    const filteredPosts = posts.filter(post => post.id !== postId);
    this.savePostsToStorage(filteredPosts);
  }

  static async updatePost(postId: string, updates: Partial<Post>): Promise<Post | null> {
    const posts = this.getPostsFromStorage();
    const postIndex = posts.findIndex(post => post.id === postId);
    
    if (postIndex === -1) return null;
    
    const updatedPost = { ...posts[postIndex], ...updates };
    posts[postIndex] = updatedPost;
    this.savePostsToStorage(posts);
    
    return updatedPost;
  }

  static async getPost(postId: string): Promise<Post | null> {
    const posts = this.getPostsFromStorage();
    return posts.find(post => post.id === postId) || null;
  }

  static clearAllPosts(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  static getStorageSize(): number {
    const posts = this.getPosts();
    return new Blob([JSON.stringify(posts)]).size;
  }
}