import "cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { EMBEDDING_URLS } from "./constants/embeddingUrls";

// Define your URLs
const urls = EMBEDDING_URLS;

const pTagSelector = "p";

// Load documents from all URLs
const allDocs = await Promise.all(
  urls.map((url) => {
    const loader = new CheerioWebBaseLoader(url, {
      selector: pTagSelector,
    });
    return loader.load();
  })
);

// Flatten the array of arrays
const flatDocs = allDocs.flat();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
});

// Split all documents into chunks
export const allSplits = await splitter.splitDocuments(flatDocs);
