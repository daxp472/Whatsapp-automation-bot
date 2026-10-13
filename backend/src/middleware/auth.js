import { verifyToken } from '../utils/jwt.js';
import { getDb } from '../config/db.js';
import { ObjectId } from 'mongodb';

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required. Please login.' }
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Session expired or token invalid.' }
    });
  }

  try {
    const db = getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found.' }
      });
    }

    req.user = user;
    req.workspaceId = decoded.workspaceId || user.defaultWorkspaceId;
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'AUTH_ERROR', message: err.message }
    });
  }
}
