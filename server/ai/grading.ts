interface RubricCriteria {
  [key: string]: number;
}

interface GradingResult {
  score: number;
  maxScore: number;
  feedback: string;
  rubricScores: RubricCriteria;
  reasoning: string[];
}

export function gradeSubmission(
  content: string,
  rubric: RubricCriteria,
  maxScore: number = 100
): GradingResult {
  const cleanContent = content.trim().toLowerCase();
  const words = cleanContent.split(/\s+/).filter(word => word.length > 0);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const paragraphCount = paragraphs.length;
  
  const rubricScores: RubricCriteria = {};
  const reasoning: string[] = [];
  let totalScore = 0;
  let totalWeight = 0;

  // Grade each rubric criterion
  for (const [criterion, weight] of Object.entries(rubric)) {
    const score = gradeCriterion(cleanContent, criterion, wordCount, sentenceCount, paragraphCount);
    rubricScores[criterion] = score;
    totalScore += score * weight;
    totalWeight += weight;
    
    reasoning.push(`${criterion}: ${score}/100 (${getCriterionFeedback(criterion, score)})`);
  }

  // Normalize score to maxScore
  const finalScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * maxScore / 100) : 0;
  
  // Generate overall feedback
  const feedback = generateFeedback(finalScore, maxScore, wordCount, sentenceCount, paragraphCount);
  
  return {
    score: finalScore,
    maxScore,
    feedback,
    rubricScores,
    reasoning
  };
}

function gradeCriterion(
  content: string,
  criterion: string,
  wordCount: number,
  sentenceCount: number,
  paragraphCount: number
): number {
  const criterionLower = criterion.toLowerCase();
  
  // Content Quality (based on length and structure)
  if (criterionLower.includes('content') || criterionLower.includes('quality')) {
    let score = 0;
    
    // Length scoring (optimal range: 150-500 words)
    if (wordCount >= 150 && wordCount <= 500) {
      score += 40;
    } else if (wordCount >= 100 && wordCount < 150) {
      score += 30;
    } else if (wordCount > 500 && wordCount <= 800) {
      score += 35;
    } else if (wordCount < 100) {
      score += 15;
    } else {
      score += 20;
    }
    
    // Structure scoring
    if (sentenceCount >= 5) score += 30;
    else if (sentenceCount >= 3) score += 20;
    else score += 10;
    
    if (paragraphCount >= 2) score += 30;
    else if (paragraphCount >= 1) score += 20;
    else score += 10;
    
    return Math.min(score, 100);
  }
  
  // Correctness (keyword matching for common programming concepts)
  if (criterionLower.includes('correctness') || criterionLower.includes('accuracy')) {
    const programmingKeywords = [
      'function', 'variable', 'loop', 'condition', 'array', 'object',
      'class', 'method', 'return', 'if', 'else', 'for', 'while',
      'try', 'catch', 'import', 'export', 'const', 'let', 'var'
    ];
    
    const keywordMatches = programmingKeywords.filter(keyword => 
      content.includes(keyword)
    ).length;
    
    const keywordScore = Math.min((keywordMatches / programmingKeywords.length) * 100, 100);
    
    // Bonus for proper code structure
    const structureBonus = content.includes('{') && content.includes('}') ? 20 : 0;
    
    return Math.min(keywordScore + structureBonus, 100);
  }
  
  // Documentation (comments and explanations)
  if (criterionLower.includes('documentation') || criterionLower.includes('comments')) {
    const commentLines = content.split('\n').filter(line => 
      line.trim().startsWith('//') || 
      line.trim().startsWith('/*') || 
      line.trim().startsWith('*') ||
      line.trim().startsWith('#')
    ).length;
    
    const totalLines = content.split('\n').length;
    const commentRatio = totalLines > 0 ? commentLines / totalLines : 0;
    
    let score = commentRatio * 100;
    
    // Bonus for inline comments
    if (content.includes('//') || content.includes('/*')) {
      score += 20;
    }
    
    return Math.min(score, 100);
  }
  
  // Style (code formatting and conventions)
  if (criterionLower.includes('style') || criterionLower.includes('formatting')) {
    let score = 0;
    
    // Check for proper indentation
    const lines = content.split('\n');
    const indentedLines = lines.filter(line => 
      line.startsWith('  ') || line.startsWith('\t') || line.trim() === ''
    ).length;
    
    if (lines.length > 0) {
      const indentationScore = (indentedLines / lines.length) * 30;
      score += indentationScore;
    }
    
    // Check for consistent naming (camelCase, snake_case)
    const hasConsistentNaming = /[a-z][a-zA-Z]*[a-z]/.test(content) || 
                               /[a-z]+_[a-z]+/.test(content);
    if (hasConsistentNaming) score += 30;
    
    // Check for proper spacing around operators
    const hasProperSpacing = /[a-zA-Z0-9]\s*[+\-*/=<>!]\s*[a-zA-Z0-9]/.test(content);
    if (hasProperSpacing) score += 20;
    
    // Check for semicolons (if applicable)
    const hasSemicolons = content.includes(';');
    if (hasSemicolons) score += 20;
    
    return Math.min(score, 100);
  }
  
  // Default scoring based on content length and structure
  let score = 0;
  if (wordCount >= 50) score += 30;
  if (sentenceCount >= 3) score += 30;
  if (paragraphCount >= 1) score += 20;
  if (content.length > 100) score += 20;
  
  return Math.min(score, 100);
}

function getCriterionFeedback(criterion: string, score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Satisfactory';
  if (score >= 60) return 'Needs Improvement';
  return 'Poor';
}

function generateFeedback(
  score: number,
  maxScore: number,
  wordCount: number,
  sentenceCount: number,
  paragraphCount: number
): string {
  const percentage = Math.round((score / maxScore) * 100);
  
  let feedback = `AI Preliminary Grade: ${score}/${maxScore} (${percentage}%)\n\n`;
  
  // Length feedback
  if (wordCount < 50) {
    feedback += "• Content is too short. Consider expanding your response.\n";
  } else if (wordCount > 800) {
    feedback += "• Content is quite long. Consider being more concise.\n";
  } else {
    feedback += "• Good content length.\n";
  }
  
  // Structure feedback
  if (sentenceCount < 3) {
    feedback += "• Add more detailed explanations with multiple sentences.\n";
  } else {
    feedback += "• Good use of multiple sentences for clarity.\n";
  }
  
  if (paragraphCount < 2) {
    feedback += "• Consider organizing content into multiple paragraphs.\n";
  } else {
    feedback += "• Good paragraph structure.\n";
  }
  
  // Overall feedback
  if (percentage >= 90) {
    feedback += "\nExcellent work! This submission demonstrates strong understanding.";
  } else if (percentage >= 80) {
    feedback += "\nGood work! Minor improvements could enhance the submission.";
  } else if (percentage >= 70) {
    feedback += "\nSatisfactory work. Consider addressing the areas mentioned above.";
  } else if (percentage >= 60) {
    feedback += "\nNeeds improvement. Please review the feedback and revise.";
  } else {
    feedback += "\nSignificant improvement needed. Please review requirements and resubmit.";
  }
  
  return feedback;
}
