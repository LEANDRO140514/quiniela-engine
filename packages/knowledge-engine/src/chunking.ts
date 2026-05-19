import type { KnowledgeChunk, KnowledgeChunkCategory } from './schemas/knowledge-chunk';

interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

interface ChunkedDocument {
  sourceId: string;
  category: KnowledgeChunkCategory;
  chunks: KnowledgeChunk[];
}

export function chunkText(
  text: string,
  options: ChunkingOptions = {},
): string[] {
  const { chunkSize = 512, chunkOverlap = 64 } = options;
  if (text.length <= chunkSize) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    start += chunkSize - chunkOverlap;
  }

  return chunks;
}

export function chunkDocument(
  sourceId: string,
  content: string,
  category: KnowledgeChunkCategory,
  metadata: KnowledgeChunk['metadata'],
  options?: ChunkingOptions,
): ChunkedDocument {
  const texts = chunkText(content, options);
  const chunks: KnowledgeChunk[] = texts.map((text, i) => ({
    id: `${sourceId}-chunk-${String(i).padStart(3, '0')}`,
    sourceId,
    content: text,
    category,
    metadata: {
      ...metadata,
      chunkIndex: i,
      totalChunks: texts.length,
    },
  }));

  return { sourceId, category, chunks };
}

export function chunkDocuments(
  documents: Array<{ id: string; content: string; category: KnowledgeChunkCategory; metadata?: KnowledgeChunk['metadata'] }>,
  options?: ChunkingOptions,
): ChunkedDocument[] {
  return documents.map((doc) =>
    chunkDocument(doc.id, doc.content, doc.category, doc.metadata ?? {}, options),
  );
}
