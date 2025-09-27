import { pipeline } from '@xenova/transformers';

// Cache the pipeline to avoid reloading
let embeddingPipeline: any = null;

export async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    console.log('🤖 Loading AI embedding model...');
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    console.log('✅ AI embedding model loaded');
  }
  return embeddingPipeline;
}

export async function embedText(text: string): Promise<number[]> {
  try {
    const pipeline = await getEmbeddingPipeline();
    
    // Clean and prepare text
    const cleanText = text
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 512); // Limit to 512 tokens for efficiency
    
    if (!cleanText) {
      throw new Error('Empty text provided for embedding');
    }

    const result = await pipeline(cleanText, { pooling: 'mean', normalize: true });
    
    // Convert to regular array
    return Array.from(result.data);
  } catch (error) {
    console.error('❌ Error generating embedding:', error);
    throw new Error('Failed to generate text embedding');
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

export function findSimilarSubmissions(
  currentEmbedding: number[],
  otherSubmissions: Array<{ id: string; embedding: number[]; studentId: string; content: string }>,
  threshold: number = 0.85
): Array<{ id: string; similarity: number; studentId: string; content: string }> {
  const similarities = otherSubmissions
    .map(sub => ({
      id: sub.id,
      similarity: cosineSimilarity(currentEmbedding, sub.embedding),
      studentId: sub.studentId,
      content: sub.content
    }))
    .filter(sub => sub.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);

  return similarities;
}
