import React from 'react';
import { Quiz, QuizParticipant } from '@shared/api';

interface ScoreResult {
  participantId: string;
  name: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  grade: string;
  questionsCorrect: number;
  questionsAnswered: number;
  submissionTime: string;
  passStatus: 'PASSED' | 'FAILED';
}

interface ScoreCalculatorProps {
  participants: QuizParticipant[];
  quiz: Quiz;
}

export const ScoreCalculator = ({ participants, quiz }: ScoreCalculatorProps) => {
  
  const calculateScoreForParticipant = (participant: QuizParticipant): ScoreResult => {
    console.log(`🧮 Calculating score for: ${participant.name}`);
    console.log(`📝 Participant answers:`, participant.answers);
    
    let score = 0;
    let questionsAnswered = 0;
    let questionsCorrect = 0;
    const totalQuestions = quiz.questions.length;
    
    // Check each question against participant's answers
    quiz.questions.forEach((question, index) => {
      console.log(`\n📋 Question ${index + 1}: "${question.question}"`);
      console.log(`✅ Correct Answer: ${question.correctAnswer}`);
      
      // Find this participant's answer for this question
      const participantAnswer = participant.answers.find(
        answer => answer.questionId === question.id
      );
      
      if (participantAnswer && participantAnswer.answer !== undefined && participantAnswer.answer !== null) {
        questionsAnswered++;
        console.log(`📝 Student Answer: ${participantAnswer.answer}`);
        
        // Compare answers
        let isCorrect = false;
        
        // Handle multiple choice and true/false
        if (question.type === 'multiple-choice' || question.type === 'true-false') {
          let studentAns = participantAnswer.answer;
          let correctAns = question.correctAnswer;
          
          // Convert to numbers if they're strings
          if (typeof studentAns === 'string' && !isNaN(Number(studentAns))) {
            studentAns = Number(studentAns);
          }
          if (typeof correctAns === 'string' && !isNaN(Number(correctAns))) {
            correctAns = Number(correctAns);
          }
          
          isCorrect = studentAns === correctAns;
        }
        
        // Handle short answer
        if (question.type === 'short-answer') {
          const answerText = participantAnswer.answer.toString().trim();
          isCorrect = answerText.length > 0; // Basic validation
        }
        
        if (isCorrect) {
          score++;
          questionsCorrect++;
          console.log(`✅ CORRECT! +1 point`);
        } else {
          console.log(`❌ INCORRECT! 0 points`);
        }
      } else {
        console.log(`❌ NO ANSWER PROVIDED`);
      }
    });
    
    // Calculate percentage and grade
    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
    
    let grade = 'F';
    if (percentage >= 80) grade = 'A';
    else if (percentage >= 50) grade = 'B';
    else if (percentage >= 30) grade = 'C';
    
    const passStatus = grade !== 'F' ? 'PASSED' : 'FAILED';
    
    const submissionTime = participant.submittedAt 
      ? new Date(participant.submittedAt).toLocaleString()
      : participant.answers?.length > 0 ? 'Completed (no timestamp)' : 'Not Started';
    
    console.log(`\n🎯 FINAL RESULT for ${participant.name}:`);
    console.log(`📊 Score: ${score}/${totalQuestions} (${percentage.toFixed(2)}%)`);
    console.log(`🎓 Grade: ${grade} (${passStatus})`);
    
    return {
      participantId: participant.id,
      name: participant.name,
      score,
      totalQuestions,
      percentage: Math.round(percentage * 100) / 100,
      grade,
      questionsCorrect,
      questionsAnswered,
      submissionTime,
      passStatus
    };
  };
  
  // Calculate scores for ALL participants
  const calculateAllScores = (): ScoreResult[] => {
    console.log(`\n🎯 CALCULATING SCORES FOR ${participants.length} PARTICIPANTS`);
    
    const results = participants.map((participant, index) => {
      console.log(`\n--- Processing Participant ${index + 1}/${participants.length} ---`);
      return calculateScoreForParticipant(participant);
    });
    
    // Log summary
    const totalParticipants = results.length;
    const passedCount = results.filter(r => r.passStatus === 'PASSED').length;
    const failedCount = results.filter(r => r.passStatus === 'FAILED').length;
    const averagePercentage = totalParticipants > 0 
      ? results.reduce((sum, r) => sum + r.percentage, 0) / totalParticipants 
      : 0;
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`Total: ${totalParticipants} | Passed: ${passedCount} | Failed: ${failedCount}`);
    console.log(`Average: ${averagePercentage.toFixed(2)}%`);
    
    return results;
  };
  
  return {
    calculateAllScores,
    calculateScoreForParticipant
  };
};

export default ScoreCalculator;
