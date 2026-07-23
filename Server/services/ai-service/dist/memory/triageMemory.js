import { MemorySaver } from '@langchain/langgraph';
// Standard checkpointer memory saver for state persistence and threads
export const triageMemory = new MemorySaver();
