import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AIResults } from './AIResults';
import { Upload, Send, Brain } from 'lucide-react';

interface SubmissionFormProps {
  assignmentId: string;
  studentId: string;
  onSubmissionCreated?: (submission: any) => void;
}

export function SubmissionForm({ assignmentId, studentId, onSubmissionCreated }: SubmissionFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResults, setAiResults] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setAiResults(null);

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId,
          studentId,
          content: content.trim(),
          status: 'submitted',
          submittedAt: new Date().toISOString(),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmission(result);
        setAiResults(result.ai);
        onSubmissionCreated?.(result);
        
        // Clear form after successful submission
        setContent('');
      } else {
        console.error('Submission failed:', result.error);
        alert('Failed to submit assignment. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('An error occurred while submitting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Submit Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Your Submission
              </label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your assignment submission here..."
                rows={8}
                className="w-full"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                {content.length} characters
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={isSubmitting || !content.trim()}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Assignment
                  </>
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload File
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* AI Results */}
      {isSubmitting && (
        <AIResults loading={true} />
      )}

      {aiResults && !isSubmitting && (
        <AIResults 
          plagiarismReport={aiResults.plagiarismReport}
          aiGrade={aiResults.aiGrade}
        />
      )}

      {/* Success Message */}
      {submission && !isSubmitting && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700">
              <Brain className="h-5 w-5" />
              <span className="font-medium">Submission processed with AI analysis!</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Your assignment has been submitted and analyzed for plagiarism and grading.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
