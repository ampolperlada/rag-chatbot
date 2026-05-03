export async function buildVectorStore(chunks) {
  console.log(`Creating vectors for ${chunks.length} chunks...`);

  const vectorStore = chunks.map((chunk) => ({
    content: chunk.content,
    vector: simpleTFIDFVector(chunk.content),
    index: chunk.index,
  }));

  return vectorStore;
}

export async function searchVectorStore(vectorStore, query, topN = 3) {
  const queryVector = simpleTFIDFVector(query);

  const scored = vectorStore.map((item) => ({
    content: item.content,
    score: cosineSimilarity(queryVector, item.vector),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topN).map((item) => item.content);
}

function simpleTFIDFVector(text) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const freq = {};
  words.forEach((word) => {
    freq[word] = (freq[word] || 0) + 1;
  });

  return freq;
}

function cosineSimilarity(vecA, vecB) {
  const keysA = Object.keys(vecA);
  const keysB = new Set(Object.keys(vecB));

  let dotProduct = 0;
  keysA.forEach((key) => {
    if (keysB.has(key)) {
      dotProduct += vecA[key] * vecB[key];
    }
  });

  const magA = Math.sqrt(keysA.reduce((sum, k) => sum + vecA[k] ** 2, 0));
  const magB = Math.sqrt(Object.values(vecB).reduce((sum, v) => sum + v ** 2, 0));

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}