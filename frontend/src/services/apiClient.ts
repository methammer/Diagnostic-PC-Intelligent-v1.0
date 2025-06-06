import axios from 'axios';
// Assuming ChatMessage is defined in backend models and accessible here
// If not, define a similar interface in frontend types
import { DiagnosticTaskStatus, ChatMessage } from '../../../backend/src/models/diagnosticTask.model'; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface SubmitDiagnosticPayload {
  problemDescription: string;
  systemInfoText: string;
}

export interface SubmitDiagnosticResponse {
  message: string;
  taskId: string;
}

export interface AIReportData { // More specific type for the AI report content
  summary: string;
  analysis: Array<{
    component: string;
    status: string;
    details: string;
    recommendation: string;
  }>;
  potentialCauses: string[];
  suggestedSolutions: string[];
  confidenceScore: number;
  generatedAt: string;
  error?: string;
}

export interface DiagnosticReport {
  taskId: string;
  status: DiagnosticTaskStatus;
  submittedAt: string;
  completedAt?: string;
  problemDescription?: string;
  diagnosticReport?: AIReportData; // Use the more specific type
  errorDetails?: string;
  message?: string;
}

export const submitDiagnostic = async (payload: SubmitDiagnosticPayload): Promise<SubmitDiagnosticResponse> => {
  try {
    const response = await axios.post<SubmitDiagnosticResponse>(`${API_BASE_URL}/collecte`, payload);
    return response.data;
  } catch (error) {
    console.error('[apiClient] Error submitting diagnostic:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw error;
    }
    throw new Error('Network error or server unavailable during diagnostic submission.');
  }
};

export const getDiagnosticReport = async (taskId: string): Promise<DiagnosticReport> => {
  try {
    const response = await axios.get<DiagnosticReport>(`${API_BASE_URL}/diagnostic/${taskId}`);
    return response.data;
  } catch (error) {
    console.error(`[apiClient] Error fetching report for task ${taskId}:`, error);
    if (axios.isAxiosError(error) && error.response) {
      throw error;
    }
    throw new Error(`Network error or server unavailable while fetching report for task ${taskId}.`);
  }
};

// New types and function for AI Chat
export interface ChatServiceMessagePayload {
  userMessage: string;
  chatHistory: ChatMessage[]; // Uses ChatMessage from backend models
}

export interface ChatServiceMessageResponse {
  aiResponse: string;
}

export const sendChatMessage = async (taskId: string, payload: ChatServiceMessagePayload): Promise<ChatServiceMessageResponse> => {
  try {
    // console.log(`[apiClient] Sending chat message for task ${taskId}:`, payload.userMessage, `History length: ${payload.chatHistory.length}`);
    const response = await axios.post<ChatServiceMessageResponse>(`${API_BASE_URL}/chat/${taskId}`, payload);
    return response.data;
  } catch (error) {
    console.error(`[apiClient] Error sending chat message for task ${taskId}:`, error);
    if (axios.isAxiosError(error) && error.response) {
      throw error;
    }
    throw new Error(`Network error or server unavailable while sending chat message for task ${taskId}.`);
  }
};
