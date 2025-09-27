import { db } from '../db';
import { submissions, assignments, plagiarismReports, grades } from '@shared/schema';
import { eq, and, ne } from 'drizzle-orm';
import { embedText, findSimilarSubmissions } from './embeddings';
import { gradeSubmission } from './grading';

export interface PlagiarismMatch {
  id: string;
  similarity: number;
  studentId: string;
  content: string;
}

export interface AISubmissionResult {
  plagiarismReport?: {
    id: string;
    matches: PlagiarismMatch[];
    highestSimilarity: number;
    isFlagged: boolean;
  };
  aiGrade?: {
    id: string;
    score: number;
    maxScore: number;
    feedback: string;
    rubricScores: Record<string, number>;
    reasoning: string[];
  };
}

export async function processSubmissionWithAI(
  submissionId: string,
  content: string,
  assignmentId: string
): Promise<AISubmissionResult> {
  const result: AISubmissionResult = {};

  try {
    // 1. Generate embedding for plagiarism detection
    console.log(`🤖 Processing submission ${submissionId} with AI...`);
    const embedding = await embedText(content);
    
    // Update submission with embedding
    await db.update(submissions)
      .set({ embedding: JSON.stringify(embedding) })
      .where(eq(submissions.id, submissionId));

    // 2. Check for plagiarism
    const plagiarismResult = await checkPlagiarism(submissionId, embedding, assignmentId);
    if (plagiarismResult) {
      result.plagiarismReport = plagiarismResult;
    }

    // 3. Generate AI grade
    const gradeResult = await generateAIGrade(submissionId, content, assignmentId);
    if (gradeResult) {
      result.aiGrade = gradeResult;
    }

    console.log(`✅ AI processing completed for submission ${submissionId}`);
    return result;

  } catch (error) {
    console.error(`❌ Error processing submission ${submissionId} with AI:`, error);
    throw error;
  }
}

async function checkPlagiarism(
  submissionId: string,
  embedding: number[],
  assignmentId: string
): Promise<AISubmissionResult['plagiarismReport'] | undefined> {
  try {
    // Get other submissions for the same assignment
    const otherSubmissions = await db
      .select({
        id: submissions.id,
        embedding: submissions.embedding,
        studentId: submissions.studentId,
        content: submissions.content
      })
      .from(submissions)
      .where(
        and(
          eq(submissions.assignmentId, assignmentId),
          ne(submissions.id, submissionId),
          ne(submissions.embedding, null)
        )
      );

    // Convert embeddings back to numbers
    const submissionsWithEmbeddings = otherSubmissions
      .filter(sub => sub.embedding)
      .map(sub => ({
        ...sub,
        embedding: JSON.parse(sub.embedding as string) as number[]
      }));

    if (submissionsWithEmbeddings.length === 0) {
      return undefined;
    }

    // Find similar submissions
    const matches = findSimilarSubmissions(embedding, submissionsWithEmbeddings, 0.75);
    
    if (matches.length === 0) {
      return undefined;
    }

    // Create plagiarism report
    const highestSimilarity = Math.round(matches[0].similarity * 100);
    const isFlagged = highestSimilarity >= 85;

    const report = await db.insert(plagiarismReports).values({
      submissionId,
      matches: JSON.stringify(matches.map(m => ({
        id: m.id,
        similarity: Math.round(m.similarity * 100),
        studentId: m.studentId,
        content: m.content.substring(0, 200) + '...' // Truncate for storage
      }))),
      highestSimilarity,
      isFlagged
    }).returning();

    return {
      id: report[0].id,
      matches: matches.map(m => ({
        id: m.id,
        similarity: Math.round(m.similarity * 100),
        studentId: m.studentId,
        content: m.content
      })),
      highestSimilarity,
      isFlagged
    };

  } catch (error) {
    console.error('❌ Error checking plagiarism:', error);
    return undefined;
  }
}

async function generateAIGrade(
  submissionId: string,
  content: string,
  assignmentId: string
): Promise<AISubmissionResult['aiGrade'] | undefined> {
  try {
    // Get assignment details including rubric
    const assignment = await db
      .select({
        id: assignments.id,
        maxScore: assignments.maxScore,
        rubric: assignments.rubric
      })
      .from(assignments)
      .where(eq(assignments.id, assignmentId))
      .limit(1);

    if (assignment.length === 0) {
      return undefined;
    }

    const assignmentData = assignment[0];
    const rubric = assignmentData.rubric as Record<string, number> || {};
    const maxScore = assignmentData.maxScore || 100;

    // Generate AI grade
    const gradingResult = gradeSubmission(content, rubric, maxScore);

    // Save AI grade to database
    const grade = await db.insert(grades).values({
      submissionId,
      score: gradingResult.score,
      feedback: gradingResult.feedback,
      rubricScores: JSON.stringify(gradingResult.rubricScores),
      gradedBy: 'ai',
      gradedAt: new Date()
    }).returning();

    return {
      id: grade[0].id,
      score: gradingResult.score,
      maxScore: gradingResult.maxScore,
      feedback: gradingResult.feedback,
      rubricScores: gradingResult.rubricScores,
      reasoning: gradingResult.reasoning
    };

  } catch (error) {
    console.error('❌ Error generating AI grade:', error);
    return undefined;
  }
}

export async function getPlagiarismReport(submissionId: string) {
  const report = await db
    .select()
    .from(plagiarismReports)
    .where(eq(plagiarismReports.submissionId, submissionId))
    .limit(1);

  if (report.length === 0) {
    return null;
  }

  return {
    ...report[0],
    matches: JSON.parse(report[0].matches as string)
  };
}

export async function getAIGrade(submissionId: string) {
  const grade = await db
    .select()
    .from(grades)
    .where(
      and(
        eq(grades.submissionId, submissionId),
        eq(grades.gradedBy, 'ai')
      )
    )
    .limit(1);

  if (grade.length === 0) {
    return null;
  }

  return {
    ...grade[0],
    rubricScores: JSON.parse(grade[0].rubricScores as string)
  };
}
