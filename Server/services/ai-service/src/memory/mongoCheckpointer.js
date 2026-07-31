import { MongoDBSaver } from '@langchain/langgraph-checkpoint-mongodb';
import { MongoClient } from 'mongodb';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let checkpointer = null;

/**
 * Creates and returns a MongoDB-backed LangGraph checkpointer.
 * Falls back to null (no persistence) if MongoDB is unreachable.
 * The IssueTriageWorkflow will use MemorySaver as fallback in that case.
 */
export async function getMongoCheckpointer() {
  if (checkpointer) return checkpointer;

  try {
    const client = new MongoClient(env.AI_MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    await client.connect();
    logger.info('[Checkpointer] Connected to MongoDB Atlas for LangGraph state persistence.');
    checkpointer = MongoDBSaver.fromClient(client, { dbName: 'maintainer_ai_langgraph' });
    return checkpointer;
  } catch (err) {
    logger.warn(`[Checkpointer] Could not connect to MongoDB (${err.message}). Falling back to in-memory state.`);
    return null;
  }
}
