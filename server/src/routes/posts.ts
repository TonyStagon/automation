import express from 'express';
import { Post } from '../models/Post';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { postLimiter } from '../middleware/rateLimiter';
import { browserAutomation } from '../../services/BrowserAutomation';
import { logger } from '../../utils/logger';

const router = express.Router();

// Get all posts for authenticated user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { status, limit = '10', offset = '0' } = req.query;
    
    const query: any = { userId: req.user.id };
    if (status && typeof status === 'string') {
      query.status = status;
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + parseInt(limit as string) < total
      }
    });
  } catch (error) {
    logger.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single post
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const post = await Post.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    logger.error('Error fetching post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new post
router.post('/', authenticateToken, postLimiter, async (req: AuthRequest, res) => {
  try {
    const { title, caption, media, platforms, scheduledDate } = req.body;

    if (!caption) {
      return res.status(400).json({ error: 'Caption is required' });
    }

    if (!platforms || platforms.length === 0) {
      return res.status(400).json({ error: 'At least one platform must be selected' });
    }

    // Validate scheduled date if provided
    if (scheduledDate && new Date(scheduledDate) <= new Date()) {
      return res.status(400).json({ error: 'Scheduled date must be in the future' });
    }

    const post = new Post({
      title: title || '',
      caption,
      media: media || [],
      platforms,
      userId: req.user.id,
      status: scheduledDate ? 'scheduled' : 'draft',
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined
    });

    await post.save();

    logger.info('Post created successfully', { 
      postId: post._id, 
      userId: req.user.id,
      status: post.status 
    });

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    logger.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update post
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { title, caption, media, platforms, scheduledDate, status } = req.body;

    const post = await Post.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Validate status transition if provided
    if (status && !Post.validateStatusTransition(post.status, status)) {
      return res.status(400).json({ 
        error: `Cannot transition from ${post.status} to ${status}` 
      });
    }

    // Update fields
    if (title !== undefined) post.title = title;
    if (caption !== undefined) post.caption = caption;
    if (media !== undefined) post.media = media;
    if (platforms !== undefined) post.platforms = platforms;
    if (scheduledDate !== undefined) {
      if (scheduledDate && new Date(scheduledDate) <= new Date()) {
        return res.status(400).json({ error: 'Scheduled date must be in the future' });
      }
      post.scheduledDate = scheduledDate ? new Date(scheduledDate) : undefined;
    }
    if (status !== undefined) post.status = status;

    await post.save();

    logger.info('Post updated successfully', { postId: post._id });

    res.json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    logger.error('Error updating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete post
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const post = await Post.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    logger.info('Post deleted successfully', { postId: req.params.id });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    logger.error('Error deleting post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Facebook posting endpoint (for direct testing)
router.post('/facebook', async (req, res) => {
  try {
    const { caption, media, headlessMode = true } = req.body;

    if (!caption) {
      return res.status(400).json({ 
        success: false, 
        message: 'Caption is required' 
      });
    }

    logger.info('Starting Facebook post automation', { 
      captionLength: caption.length,
      hasMedia: !!media,
      headlessMode 
    });

    // Create job data for Facebook posting
    const jobData = {
      postId: Date.now().toString(),
      userId: 'demo-user',
      platforms: ['facebook'],
      caption,
      media: media ? [media] : [],
    };

    // Post to Facebook using browser automation
    const result = await browserAutomation.postToFacebook(
      jobData, 
      'puppeteer', 
      headlessMode
    );

    if (result.success) {
      logger.info('Facebook post completed successfully');
      res.json({
        success: true,
        message: 'Post successfully published to Facebook',
        result
      });
    } else {
      logger.error('Facebook post failed', { error: result.error });
      res.status(500).json({
        success: false,
        message: result.message || 'Failed to post to Facebook',
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Facebook posting error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get post analytics
router.get('/:id/analytics', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const post = await Post.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.status !== 'published') {
      return res.status(400).json({ 
        error: 'Analytics only available for published posts' 
      });
    }

    res.json({
      postId: post._id,
      analytics: post.analytics || {
        reach: 0,
        likes: 0,
        comments: 0,
        impressions: 0,
        views: 0
      },
      platforms: post.platforms,
      publishedAt: post.updatedAt
    });
  } catch (error) {
    logger.error('Error fetching post analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;