import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { type Faq, FaqArraySchema } from '../schemas/faq';
import { type Procedure, ProcedureArraySchema } from '../schemas/procedure';
import { type KnowledgeChunkCategory } from '../schemas/knowledge-chunk';

interface KnowledgeIndex<T> {
  entries: T[];
  byId: Map<string, T>;
  byTag: Map<string, T[]>;
  byCategory: Map<string, T[]>;
}

function buildIndex<T extends { id: string; category?: string; tags?: string[] }>(
  entries: T[],
): KnowledgeIndex<T> {
  const byId = new Map<string, T>();
  const byTag = new Map<string, T[]>();
  const byCategory = new Map<string, T[]>();

  for (const entry of entries) {
    byId.set(entry.id, entry);

    const cat = entry.category ?? 'general';
    const existingCat = byCategory.get(cat);
    if (existingCat) {
      existingCat.push(entry);
    } else {
      byCategory.set(cat, [entry]);
    }

    if (entry.tags) {
      for (const tag of entry.tags) {
        const normalized = tag.toLowerCase().trim();
        const existingTag = byTag.get(normalized);
        if (existingTag) {
          existingTag.push(entry);
        } else {
          byTag.set(normalized, [entry]);
        }
      }
    }
  }

  return { entries, byId, byTag, byCategory };
}

function resolveVerticalPath(vertical: string, filePath: string): string {
  return path.resolve(__dirname, '..', '..', '..', '..', 'verticals', vertical, filePath);
}

async function loadJsonFile<T>(filePath: string, schema: { parse: (data: unknown) => T }): Promise<T> {
  const raw = await readFile(filePath, 'utf-8');
  const parsed = JSON.parse(raw) as unknown;
  return schema.parse(parsed);
}

let _faqIndex: KnowledgeIndex<Faq> | null = null;
let _procedureIndex: KnowledgeIndex<Procedure> | null = null;

export async function loadFAQs(vertical = 'dental'): Promise<KnowledgeIndex<Faq>> {
  if (_faqIndex) return _faqIndex;
  const filePath = resolveVerticalPath(vertical, 'knowledge/faq.json');
  const data = await loadJsonFile(filePath, FaqArraySchema);
  _faqIndex = buildIndex(data);
  return _faqIndex;
}

export async function loadProcedures(vertical = 'dental'): Promise<KnowledgeIndex<Procedure>> {
  if (_procedureIndex) return _procedureIndex;
  const filePath = resolveVerticalPath(vertical, 'knowledge/procedures.json');
  const data = await loadJsonFile(filePath, ProcedureArraySchema);
  _procedureIndex = buildIndex(data);
  return _procedureIndex;
}

export async function loadPolicies(vertical = 'dental'): Promise<KnowledgeIndex<{ id: string; category: string; title: string; content: string; tags?: string[] }>> {
  const filePath = resolveVerticalPath(vertical, 'knowledge/policies.json');
  const raw = await readFile(filePath, 'utf-8');
  const data = JSON.parse(raw) as Array<{ id: string; category: string; title: string; content: string; tags?: string[] }>;
  return buildIndex(data);
}

export async function loadKnowledge(vertical = 'dental'): Promise<{
  faqs: KnowledgeIndex<Faq>;
  procedures: KnowledgeIndex<Procedure>;
  policies: KnowledgeIndex<{ id: string; category: string; title: string; content: string; tags?: string[] }>;
}> {
  const [faqs, procedures, policies] = await Promise.all([
    loadFAQs(vertical),
    loadProcedures(vertical),
    loadPolicies(vertical),
  ]);
  return { faqs, procedures, policies };
}

export function searchKnowledgeByCategory<T extends { id: string; category?: string; tags?: string[] }>(
  index: KnowledgeIndex<T>,
  query: { category?: string; tag?: string; textContains?: string },
): T[] {
  let results: T[];

  if (query.category) {
    results = index.byCategory.get(query.category) ?? [];
  } else {
    results = index.entries;
  }

  if (query.tag) {
    const tagKey = query.tag.toLowerCase().trim();
    const tagResults = index.byTag.get(tagKey) ?? [];
    const tagIds = new Set(tagResults.map((e) => e.id));
    results = results.filter((e) => tagIds.has(e.id));
  }

  if (query.textContains) {
    const lower = query.textContains.toLowerCase();
    results = results.filter((e) => {
      const searchable = JSON.stringify(e).toLowerCase();
      return searchable.includes(lower);
    });
  }

  return results;
}

export type { KnowledgeIndex };
