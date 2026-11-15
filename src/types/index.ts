export type QuestionType = 'multiple_choice' | 'single_choice' | 'written' | 'open';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  categoryId?: string;
  categoryName?: string;
  title: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
  options?: QuestionOption[];
  acceptedAnswers?: string[]; // for written questions (optional)
  explanation: string;
  active: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  textColor: string;
  icon: string;
  description?: string;
  active: boolean;
  isSpecial?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'player';
  pin?: string;
  avatarColor: string;
  totalGamesPlayed: number;
  totalCorrectAnswers: number;
  totalScore?: number;
  createdAt: string;
}

export interface GameTurnResult {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  questionId: string;
  questionTitle: string;
  questionType: QuestionType;
  categoryId?: string;
  categoryName?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  playerAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  hasAnswer?: boolean;
  timeTakenSeconds?: number;
  pointsAwarded?: number;
  streakAtTurn?: number;
}
