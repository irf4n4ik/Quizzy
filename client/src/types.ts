export type UserRole = "player" | "organizer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: number;
}

export interface Answer {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface Question {
  id: string;
  text: string;
  imageUrl?: string;
  answers: Answer[];
  multipleChoice: boolean;
  timeLimit: number;
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  createdBy: string;
  questions: Question[];
  timePerQuestion: number;
  createdAt: number;
  updatedAt?: number;
}

export interface RoomPlayer {
  id: string;
  userId?: string | null;
  name: string;
  score: number;
  connected: boolean;
}

export interface RoomResult {
  id: string;
  userId?: string | null;
  name: string;
  score: number;
  correctAnswers: number;
}

export interface RoomState {
  id: string;
  code: string;
  quizId: string;
  hostId: string;
  hostName: string;
  status: "waiting" | "playing" | "finished";
  currentQuestionIndex: number;
  startedAt?: number;
  finishedAt?: number;
  questionStartedAt?: number;
  questionEndsAt?: number;
  quiz: {
    id: string;
    title: string;
    description: string;
    category: string;
    timePerQuestion: number;
    questionsCount: number;
  };
  players: RoomPlayer[];
  currentQuestion: Question | null;
  results: RoomResult[];
  mySubmission?: {
    questionId: string;
    submitted: boolean;
    selectedAnswerIds: string[];
  };
}

export interface QuizHistory {
  id: string;
  userId: string;
  quizId: string;
  quizTitle: string;
  roomCode: string;
  date: number;
  playerCount: number;
  role: "host" | "player";
  score?: number;
  rank?: number;
}

export interface PlayerStats {
  totalGames: number;
  wins: number;
  totalScore: number;
  averageScore: number;
}

export interface OrganizerStats {
  totalQuizzes: number;
  hostedGames: number;
  totalPlayers: number;
  averagePlayers: number;
}
