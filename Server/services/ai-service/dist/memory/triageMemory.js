import { MemorySaver } from '@langchain/langgraph';
// In-memory checkpointer — stores graph state per thread_id (swap for Postgres in production)
export const triageMemory = new MemorySaver();
