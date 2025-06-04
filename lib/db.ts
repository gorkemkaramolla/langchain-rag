import { OpenAIEmbeddings } from '@langchain/openai';
import { PrismaVectorStore } from '@langchain/community/vectorstores/prisma';
import { Document as LangchainDocument } from '@langchain/core/documents';
import { Document as PrismaDocument } from '@/lib/generated/prisma';
import { prisma } from '@/lib/prisma';

const embeddings = new OpenAIEmbeddings({
  model: 'text-embedding-3-small',
});

const vectorStore = PrismaVectorStore.withModel<PrismaDocument>(prisma).create(
  embeddings,
  {
    prisma: prisma,
    tableName: 'Document',
    vectorColumnName: 'vector',
    columns: {
      id: PrismaVectorStore.IdColumn,
      content: PrismaVectorStore.ContentColumn,
    },
  }
);

// Define your documents with required metadata
const documents: LangchainDocument<{
  id: string;
  content: string;
  namespace: string | null;
}>[] = [
  new LangchainDocument({
    pageContent: 'Hello world',
    metadata: {
      id: 'doc1',
      content: 'Hello world',
      namespace: null,
    },
  }),
  new LangchainDocument({
    pageContent: 'LangChain with Prisma',
    metadata: {
      id: 'doc2',
      content: 'LangChain with Prisma',
      namespace: null,
    },
  }),
];

await vectorStore.addDocuments(documents);
