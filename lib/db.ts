import { OpenAIEmbeddings } from "@langchain/openai";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { allSplits } from "./splitters";

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
});

export const vectorStore = await PGVectorStore.initialize(embeddings, {
  postgresConnectionOptions: {
    connectionString: process.env.POSTGRES_URL,
  },
  tableName: "embeddings",
});

// Index chunks
await vectorStore.addDocuments(allSplits);
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";

const graph = new StateGraph(MessagesAnnotation);
