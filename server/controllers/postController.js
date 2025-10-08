import { prisma } from '../config/db.js';

export const listFeed = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { likes: true, comments: true } },
        comments: {
          take: 2,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true } } }
        }
      }
    });
    return res.status(200).json({ posts });
  } catch (e) {
    console.error('listFeed error:', e);
    return res.status(500).json({ message: 'Failed to load feed' });
  }
};

export const createPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { content, mediaUrl, mediaType } = req.body;
    // If file uploaded, prefer it
    let finalMediaUrl = mediaUrl || null;
    let finalMediaType = mediaType || null;
    if (req.file) {
      finalMediaUrl = `/uploads/${req.file.filename}`;
      finalMediaType = req.file.mimetype?.startsWith('video/') ? 'video' : 'image';
    }
    const post = await prisma.post.create({ data: { authorId: userId, content, mediaUrl: finalMediaUrl, mediaType: finalMediaType } });
    return res.status(201).json({ post });
  } catch (e) {
    console.error('createPost error:', e);
    return res.status(500).json({ message: 'Failed to create post' });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const existing = await prisma.postLike.findUnique({ where: { postId_userId: { postId: id, userId } } });
    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } });
      return res.status(200).json({ liked: false });
    } else {
      await prisma.postLike.create({ data: { postId: id, userId } });
      return res.status(201).json({ liked: true });
    }
  } catch (e) {
    console.error('toggleLike error:', e);
    return res.status(500).json({ message: 'Failed to toggle like' });
  }
};

export const addComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ message: 'Comment cannot be empty' });
    const c = await prisma.postComment.create({ data: { postId: id, userId, content: content.trim() } });
    return res.status(201).json({ comment: c });
  } catch (e) {
    console.error('addComment error:', e);
    return res.status(500).json({ message: 'Failed to add comment' });
  }
};

export const updatePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { id } = req.params;
    const { content, mediaUrl, mediaType } = req.body;
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Post not found' });
    if (existing.authorId !== userId && role !== 'ADMIN') return res.status(403).json({ message: 'Not allowed' });

    let finalMediaUrl = mediaUrl === undefined ? existing.mediaUrl : mediaUrl;
    let finalMediaType = mediaType === undefined ? existing.mediaType : mediaType;
    if (req.file) {
      finalMediaUrl = `/uploads/${req.file.filename}`;
      finalMediaType = req.file.mimetype?.startsWith('video/') ? 'video' : 'image';
    }

    const updated = await prisma.post.update({
      where: { id },
      data: {
        content: content === undefined ? existing.content : content,
        mediaUrl: finalMediaUrl,
        mediaType: finalMediaType
      }
    });
    return res.status(200).json({ post: updated });
  } catch (e) {
    console.error('updatePost error:', e);
    return res.status(500).json({ message: 'Failed to update post' });
  }
};

export const deletePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { id } = req.params;
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Post not found' });
    if (existing.authorId !== userId && role !== 'ADMIN') return res.status(403).json({ message: 'Not allowed' });
    await prisma.post.delete({ where: { id } });
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('deletePost error:', e);
    return res.status(500).json({ message: 'Failed to delete post' });
  }
};
