import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/replypilot';
const dbName = process.env.MONGODB_DB_NAME || 'replypilot';

let client = null;
let db = null;

export async function connectDB() {
  if (db) return db;
  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log(`[DB] Successfully connected to MongoDB database: ${dbName}`);

    // Create Indexes
    await initIndexes(db);
    return db;
  } catch (error) {
    console.error('[DB] Failed to connect to MongoDB:', error.message);
    throw error;
  }
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return db;
}

async function initIndexes(database) {
  try {
    await database.collection('users').createIndex({ email: 1 }, { unique: true });
    await database.collection('contacts').createIndex({ workspaceId: 1, phoneNumber: 1 }, { unique: true, sparse: true });
    await database.collection('conversations').createIndex({ workspaceId: 1, lastMessageAt: -1 });
    await database.collection('conversations').createIndex({ workspaceId: 1, contactId: 1 });
    await database.collection('messages').createIndex({ workspaceId: 1, conversationId: 1, createdAt: 1 });
    await database.collection('messages').createIndex({ providerMessageId: 1 }, { sparse: true });
    await database.collection('webhookEvents').createIndex({ eventId: 1 }, { unique: true, sparse: true });
    console.log('[DB] Indexes verified and created successfully.');
  } catch (err) {
    console.warn('[DB] Non-critical index creation warning:', err.message);
  }
}
