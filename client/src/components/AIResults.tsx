import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Brain, FileText } from 'lucide-react';

interface PlagiarismMatch {
  id: string;
  similarity: number;
  studentId: string;
  content: string;
}

interface PlagiarismReport {
  id: string;
  matches: PlagiarismMatch[];
  highestSimilarity: number;
  isFlagged: boolean;
}

interface AIGrade {
  id: string;
  score: number;
  maxScore: number;
  feedback: string;
  rubricScores: Record<string, number>;
  reasoning: string[];
}

interface AIResultsProps {
  plagiarismReport?: PlagiarismReport;
  aiGrade?: AIGrade;
  loading?: boolean;
}

export function AIResults({ plagiarismReport, aiGrade, loading }: AIResultsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Processing with AI...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Plagiarism Detection */}
      {plagiarismReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Plagiarism Detection
              {plagiarismReport.isFlagged && (
                <Badge variant="destructive" className="ml-2">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Flagged
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {plagiarismReport.matches.length > 0 ? (
              <div className="space-y-3">
                <Alert className={plagiarismReport.isFlagged ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Found {plagiarismReport.matches.length} similar submission{plagiarismReport.matches.length > 1 ? 's' : ''} 
                    with highest similarity of {plagiarismReport.highestSimilarity}%
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Similar Submissions:</h4>
                  {plagiarismReport.matches.slice(0, 3).map((match, index) => (
                    <div key={match.id} className="p-3 border rounded-lg bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium">Student {match.studentId}</span>
                        <Badge variant={match.similarity >= 90 ? "destructive" : "secondary"}>
                          {match.similarity}% similar
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {match.content}
                      </p>
                    </div>
                  ))}
                  {plagiarismReport.matches.length > 3 && (
                    <p className="text-sm text-gray-500">
                      ... and {plagiarismReport.matches.length - 3} more similar submissions
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>No significant similarities found</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Grading */}
      {aiGrade && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Preliminary Grade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Grade Score */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Score:</span>
                <div className="text-right">
                  <span className="text-2xl font-bold text-blue-600">
                    {aiGrade.score}/{aiGrade.maxScore}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({Math.round((aiGrade.score / aiGrade.maxScore) * 100)}%)
                  </span>
                </div>
              </div>

              {/* Rubric Breakdown */}
              {Object.keys(aiGrade.rubricScores).length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Rubric Breakdown:</h4>
                  <div className="space-y-2">
                    {Object.entries(aiGrade.rubricScores).map(([criterion, score]) => (
                      <div key={criterion} className="flex justify-between items-center">
                        <span className="text-sm">{criterion}:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${score}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-12 text-right">{score}/100</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Feedback */}
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">AI Feedback:</h4>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap text-gray-700">
                    {aiGrade.feedback}
                  </pre>
                </div>
              </div>

              {/* Reasoning */}
              {aiGrade.reasoning && aiGrade.reasoning.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Detailed Reasoning:</h4>
                  <ul className="space-y-1">
                    {aiGrade.reasoning.map((reason, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No AI Results */}
      {!plagiarismReport && !aiGrade && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No AI analysis available for this submission</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
