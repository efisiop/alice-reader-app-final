// src/components/AI/QuizGenerator.tsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Radio, RadioGroup,
  FormControlLabel, FormControl, FormLabel,
  TextField, CircularProgress, Paper
} from '@mui/material';

interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'short-answer';
  options?: string[];
  correctAnswer: string;
}

interface QuizGeneratorProps {
  sectionId: string;
  chapterId: string;
  onComplete: (score: number, totalQuestions: number) => void;
}

const QuizGenerator: React.FC<QuizGeneratorProps> = ({
  sectionId,
  chapterId,
  onComplete
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);

  // Generate questions based on the current section
  useEffect(() => {
    const generateQuestions = async () => {
      setLoading(true);
      
      // In a real implementation, this would call an API to generate questions
      // For now, we'll use mock questions
      const mockQuestions: Question[] = [
        {
          id: '1',
          text: 'What did Alice follow down the rabbit hole?',
          type: 'multiple-choice',
          options: ['A white rabbit', 'A black cat', 'A blue bird', 'A green turtle'],
          correctAnswer: 'A white rabbit'
        },
        {
          id: '2',
          text: 'What was unusual about the rabbit Alice saw?',
          type: 'multiple-choice',
          options: ['It could talk', 'It wore clothes and had a pocket watch', 'It was purple', 'It had wings'],
          correctAnswer: 'It wore clothes and had a pocket watch'
        },
        {
          id: '3',
          text: 'What did Alice say when she fell down the rabbit hole?',
          type: 'short-answer',
          correctAnswer: 'Curiouser and curiouser'
        }
      ];
      
      setQuestions(mockQuestions);
      setLoading(false);
    };
    
    generateQuestions();
  }, [sectionId, chapterId]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate score
      let correctAnswers = 0;
      questions.forEach(question => {
        if (answers[question.id]?.toLowerCase() === question.correctAnswer.toLowerCase()) {
          correctAnswers++;
        }
      });
      
      setScore(correctAnswers);
      setQuizCompleted(true);
      onComplete(correctAnswers, questions.length);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (quizCompleted) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Quiz Completed!
        </Typography>
        <Typography variant="h4" color={score === questions.length ? 'success.main' : 'primary.main'}>
          Score: {score}/{questions.length}
        </Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => {
            setCurrentQuestionIndex(0);
            setAnswers({});
            setQuizCompleted(false);
          }}
        >
          Try Again
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Question {currentQuestionIndex + 1} of {questions.length}
      </Typography>
      
      {currentQuestion && (
        <FormControl component="fieldset" sx={{ width: '100%', mb: 3 }}>
          <FormLabel component="legend">{currentQuestion.text}</FormLabel>
          
          {currentQuestion.type === 'multiple-choice' ? (
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            >
              {currentQuestion.options?.map((option) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
          ) : (
            <TextField
              fullWidth
              margin="normal"
              label="Your answer"
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            />
          )}
        </FormControl>
      )}
      
      <Button
        variant="contained"
        onClick={handleNextQuestion}
        disabled={!answers[currentQuestion?.id]}
      >
        {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
      </Button>
    </Box>
  );
};

export default QuizGenerator;
