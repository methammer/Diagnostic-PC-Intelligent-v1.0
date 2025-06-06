import { GoogleGenerativeAI } from "@google/generative-ai";

export enum DiagnosticTaskStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface AIReportAnalysisItem {
  component: string;
  status: string;
  details: string;
  recommendation: string;
}

export interface AIReport {
  summary: string;
  analysis: AIReportAnalysisItem[];
  potentialCauses: string[];
  suggestedSolutions: string[];
  confidenceScore: number;
  generatedAt: string; // ISO date string
  error?: string; // Optional error message from AI processing
}

export interface DiagnosticTask {
  id: string;
  status: DiagnosticTaskStatus;
  submittedAt: Date;
  completedAt?: Date;
  problemDescription: string;
  systemInfoRaw: string; // Raw text content of DiagnosticInfo.txt
  report?: AIReport;
  error?: string; // For storing errors during processing
  // chatHistory could be added here if we want to persist it on the server
  // For now, chat history will be managed by the client and passed with each request
}

// Define the structure for chat history messages compatible with Gemini
export interface ChatMessagePart {
  text: string;
}
export interface ChatMessage {
  role: 'user' | 'model';
  parts: ChatMessagePart[];
}
