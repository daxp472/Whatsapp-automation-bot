import { getDb } from '../config/db.js';

export async function getRelevantFaqs(workspaceId, queryText = '', limit = 8) {
  const db = getDb();
  const allFaqs = await db.collection('faqs').find({
    workspaceId: workspaceId.toString(),
    enabled: true
  }).toArray();

  if (!allFaqs.length) return [];
  if (!queryText.trim()) return allFaqs.slice(0, limit);

  const queryTerms = queryText.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  const scoredFaqs = allFaqs.map(faq => {
    let score = 0;
    const qLower = (faq.question || '').toLowerCase();
    const aLower = (faq.answer || '').toLowerCase();
    const catLower = (faq.category || '').toLowerCase();
    const sourceLower = (faq.sourceDocumentTitle || '').toLowerCase();
    const snippetLower = (faq.sourceSnippet || '').toLowerCase();

    for (const term of queryTerms) {
      if (qLower.includes(term)) score += 6;
      if (aLower.includes(term)) score += 3;
      if (catLower.includes(term)) score += 3;
      if (sourceLower.includes(term)) score += 2;
      if (snippetLower.includes(term)) score += 2;
    }

    return { ...faq, score };
  });

  scoredFaqs.sort((a, b) => b.score - a.score);
  return scoredFaqs.slice(0, limit);
}
