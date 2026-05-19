import { z } from 'zod';

export const KnowledgeChunkCategory = z.enum([
  'faq',
  'procedure',
  'policy',
  'terminology',
  'emergency',
  'insurance',
  'pricing',
  'onboarding',
  'general',
]);

export const KnowledgeChunkMetadataSchema = z.object({
  source: z.string().optional(),
  chunkIndex: z.number().int().min(0).optional(),
  totalChunks: z.number().int().min(1).optional(),
  tags: z.array(z.string()).optional(),
});

export const KnowledgeChunkSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  content: z.string().min(10),
  category: KnowledgeChunkCategory,
  metadata: KnowledgeChunkMetadataSchema.optional(),
  embedding: z.array(z.number()).optional(),
});

export type KnowledgeChunk = z.infer<typeof KnowledgeChunkSchema>;
export type KnowledgeChunkCategory = z.infer<typeof KnowledgeChunkCategory>;

export const KnowledgeChunkArraySchema = z.array(KnowledgeChunkSchema);
