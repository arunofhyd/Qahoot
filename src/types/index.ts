export interface Question {
  id: string;
  text: string;
  type: 'mcq' | 'text';
  options?: string[]; // Optional for text questions
  correctAnswer: number | string; // Index for MCQ, string for text
  timeLimit: number; // in seconds
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  settings?: {
    mode: 'live' | 'self-paced';
    enableTiming: boolean; // Enable timer UI
    enablePoints?: boolean; // Enable points system
    recordTimestamp?: boolean; // Enable start/end timestamp recording
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameSession {
  id: string;
  roomCode: string;
  quizId: string;
  quiz: Quiz;
  hostId: string;
  mode?: 'live' | 'self-paced'; // Add mode
  enableTiming?: boolean; // Add enableTiming
  enablePoints?: boolean; // Add enablePoints
  recordTimestamp?: boolean; // Add recordTimestamp
  status: 'waiting' | 'active' | 'question' | 'answer_reveal' | 'results' | 'leaderboard' | 'finished';
  currentQuestionIndex: number;
  questionStartTime?: number;
  players: Player[];
  createdAt: Date;
}

export interface Player {
  id: string;
  nickname: string;
  score: number;
  answers: PlayerAnswer[];
  isConnected: boolean;
  joinedAt: Date;
}

export interface PlayerAnswer {
  questionId: string;
  selectedOption?: number; // Index for MCQ
  textAnswer?: string; // Text answer for text questions
  isCorrect: boolean;
  timeToAnswer: number; // in milliseconds
  startedAt?: number; // Start timestamp
  endedAt?: number; // End timestamp
  points: number;
}

export interface LeaderboardEntry {
  playerId: string;
  nickname: string;
  score: number;
  rank: number;
  lastQuestionPoints?: number;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
}
