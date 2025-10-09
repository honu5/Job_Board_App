import { prisma } from '../config/db.js';

export const listNotifications = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const items = await prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 });
    return res.status(200).json({ notifications: items });
  } catch (e) {
    console.error('listNotifications error:', e);
    return res.status(500).json({ message: 'Failed to list notifications' });
  }
};

export const markNotification = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { id } = req.params;
    const n = await prisma.notification.findUnique({ where: { id } });
    if (!n || n.userId !== userId) return res.status(404).json({ message: 'Not found' });
    const updated = await prisma.notification.update({ where: { id }, data: { read: true } });
    return res.status(200).json({ notification: updated });
  } catch (e) {
    console.error('markNotification error:', e);
    return res.status(500).json({ message: 'Failed to mark notification' });
  }
};
