import express from 'express';
import { getDb } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { getQuotaStatus } from '../services/quota.service.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/summary', async (req, res) => {
  try {
    const db = getDb();
    const wsIdStr = req.workspaceId.toString();

    // 1. Quota
    const quota = await getQuotaStatus(wsIdStr);

    // 2. Count metrics
    const totalInbound = await db.collection('messages').countDocuments({
      workspaceId: wsIdStr,
      direction: 'inbound'
    });

    const totalOutbound = await db.collection('messages').countDocuments({
      workspaceId: wsIdStr,
      direction: 'outbound'
    });

    const aiReplies = await db.collection('messages').countDocuments({
      workspaceId: wsIdStr,
      direction: 'outbound',
      senderType: 'ai'
    });

    const humanReplies = await db.collection('messages').countDocuments({
      workspaceId: wsIdStr,
      direction: 'outbound',
      senderType: 'operator'
    });

    const contactsCount = await db.collection('contacts').countDocuments({
      workspaceId: wsIdStr
    });

    const openConversations = await db.collection('conversations').countDocuments({
      workspaceId: wsIdStr,
      status: 'open'
    });

    const needsAttention = await db.collection('conversations').countDocuments({
      workspaceId: wsIdStr,
      status: 'needs_attention'
    });

    // 3. Last 7 days breakdown for visual charts
    const now = new Date();
    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const dayStart = new Date(d.setHours(0, 0, 0, 0));
      const dayEnd = new Date(d.setHours(23, 59, 59, 999));

      const inboundCount = await db.collection('messages').countDocuments({
        workspaceId: wsIdStr,
        direction: 'inbound',
        createdAt: { $gte: dayStart, $lte: dayEnd }
      });

      const outboundCount = await db.collection('messages').countDocuments({
        workspaceId: wsIdStr,
        direction: 'outbound',
        createdAt: { $gte: dayStart, $lte: dayEnd }
      });

      dailyActivity.push({
        date: dateLabel,
        inbound: inboundCount,
        outbound: outboundCount,
        total: inboundCount + outboundCount
      });
    }

    // 4. Reply rate calculation
    const replyRate = totalInbound > 0
      ? Math.min(100, Math.round((totalOutbound / totalInbound) * 100))
      : 100;

    return res.json({
      success: true,
      data: {
        quota,
        stats: {
          totalInbound,
          totalOutbound,
          aiReplies,
          humanReplies,
          contactsCount,
          openConversations,
          needsAttention,
          replyRate
        },
        dailyActivity
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
