import { getDb } from '../config/db.js';
import { ObjectId } from 'mongodb';

export const DEFAULT_FREE_QUOTA = 100;

export async function checkAndDeductQuota(workspaceId) {
  const db = getDb();
  const query = ObjectId.isValid(workspaceId) ? { _id: new ObjectId(workspaceId) } : { _id: workspaceId };
  
  const workspace = await db.collection('workspaces').findOne(query);
  if (!workspace) {
    return { allowed: true, quota: DEFAULT_FREE_QUOTA, used: 0, remaining: DEFAULT_FREE_QUOTA };
  }

  const plan = workspace.plan || {
    name: 'Free Trial',
    messageQuota: DEFAULT_FREE_QUOTA,
    messagesUsed: 0,
    resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };

  // Check if monthly reset date has passed
  if (plan.resetDate && new Date(plan.resetDate) <= new Date()) {
    plan.messagesUsed = 0;
    plan.resetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  if (plan.messagesUsed >= plan.messageQuota) {
    return {
      allowed: false,
      quota: plan.messageQuota,
      used: plan.messagesUsed,
      remaining: 0,
      resetDate: plan.resetDate,
      message: `You have reached your free tier limit of ${plan.messageQuota} messages for this month. Upgrade or wait for the cycle reset.`
    };
  }

  // Deduct 1 credit
  const newUsed = (plan.messagesUsed || 0) + 1;
  await db.collection('workspaces').updateOne(
    query,
    {
      $set: {
        'plan.messagesUsed': newUsed,
        'plan.messageQuota': plan.messageQuota,
        'plan.resetDate': plan.resetDate,
        updatedAt: new Date()
      }
    }
  );

  return {
    allowed: true,
    quota: plan.messageQuota,
    used: newUsed,
    remaining: Math.max(0, plan.messageQuota - newUsed),
    resetDate: plan.resetDate
  };
}

export async function getQuotaStatus(workspaceId) {
  const db = getDb();
  const query = ObjectId.isValid(workspaceId) ? { _id: new ObjectId(workspaceId) } : { _id: workspaceId };
  const workspace = await db.collection('workspaces').findOne(query);

  const plan = workspace?.plan || {
    name: 'Free Trial',
    messageQuota: DEFAULT_FREE_QUOTA,
    messagesUsed: 0,
    resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };

  return {
    name: plan.name || 'Free Trial',
    messageQuota: plan.messageQuota || DEFAULT_FREE_QUOTA,
    messagesUsed: plan.messagesUsed || 0,
    remaining: Math.max(0, (plan.messageQuota || DEFAULT_FREE_QUOTA) - (plan.messagesUsed || 0)),
    resetDate: plan.resetDate
  };
}
