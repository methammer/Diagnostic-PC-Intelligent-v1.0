import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel } from '@google/generative-ai';
import { AIReport, ChatMessage } from '../models/diagnosticTask.model'; // Added ChatMessage

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not defined. AI service will not function.");
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const modelName = 'gemini-1.5-flash-latest';

const generationConfig = {
  temperature: 0.7,
  topK: 1,
  topP: 1,
  maxOutputTokens: 8192,
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

function buildPrompt(systemInfoRaw: string | undefined, problemDescription?: string): string {
  const systemInfoSegment = systemInfoRaw && systemInfoRaw.trim().length > 0 
    ? `System Information (raw text):
---
${systemInfoRaw.substring(0, 900000)} ${systemInfoRaw.length > 900000 ? "\n[...SYSTEM INFO TRUNCATED DUE TO LENGTH...]" : ""}
---`
    : "System Information: Not provided or empty.";

  const problemDescriptionSegment = problemDescription && problemDescription.trim().length > 0
    ? `Problem Description:
---
${problemDescription}
---`
    : "Problem Description: Not provided.";

  return `
You are an expert PC diagnostic AI. Your task is to analyze the provided system information and problem description to identify potential issues, their causes, and suggest solutions.

Please provide your analysis STRICTLY in the following JSON format. Do NOT include any text outside of this JSON structure, not even "json" or backticks.

The JSON structure should conform to this TypeScript interface:
\`\`\`typescript
interface AIReportOutput {{
  summary: string; // A concise summary of the overall diagnostic findings.
  analysis: Array<{{
    component: string; // Name of the system component or aspect analyzed (e.g., "Operating System", "CPU", "Memory", "Disk Space", "Specific Driver", "User Reported Issue").
    status: string; // Status of the component (e.g., "Normal", "Warning", "Critical", "Unknown", "Information").
    details: string; // Detailed findings about this component.
    recommendation: string; // Specific recommendation for this component.
  }}>;
  potentialCauses: string[]; // A list of potential root causes for the identified issues.
  suggestedSolutions: string[]; // A list of actionable suggested solutions.
  confidenceScore: number; // A numerical score between 0.0 (low confidence) and 1.0 (high confidence) representing your certainty in this diagnosis.
}}
\`\`\`

${systemInfoSegment}

${problemDescriptionSegment}

Based on all the information, generate the JSON output as described above.
If information is insufficient for a thorough analysis, reflect this in your summary, analysis (e.g., status "Unknown" or "Insufficient Data"), and a lower confidenceScore.
Ensure the 'analysis' array provides a breakdown of different components or aspects you've considered.
If no specific problem is described, focus on a general health check based on system info, if available.
`;
}

export const processWithAI = async (systemInfoRaw: string | undefined, problemDescription?: string): Promise<AIReport> => {
  console.log(`[ai.service] Starting AI processing with Gemini. Problem: "${problemDescription ? problemDescription.substring(0, 50) + '...' : 'N/A'}", System Info Length: ${systemInfoRaw?.length ?? 0}`);

  if (!genAI) {
    console.error("[ai.service] Gemini AI client not initialized due to missing API key.");
    throw new Error("AI Service is not configured. Missing API Key.");
  }

  const model = genAI.getGenerativeModel({ model: modelName, generationConfig, safetySettings });
  const prompt = buildPrompt(systemInfoRaw, problemDescription);

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const aiResponseText = response.text();
    
    console.log("[ai.service] Raw response from Gemini (first 1000 chars):", aiResponseText.substring(0, 1000) + (aiResponseText.length > 1000 ? "..." : ""));
    if (aiResponseText.length > 1000) {
      console.log("[ai.service] Raw response from Gemini (last 1000 chars):" + "..." + aiResponseText.substring(aiResponseText.length - 1000));
    }

    let cleanedJsonText = aiResponseText;
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/im;
    const match = cleanedJsonText.match(jsonRegex);
    if (match && match[1]) {
      cleanedJsonText = match[1];
      console.log("[ai.service] Extracted content from ```json ... ``` block.");
    }
    
    cleanedJsonText = cleanedJsonText.trim();

    if (!cleanedJsonText.startsWith("{") || !cleanedJsonText.endsWith("}")) {
      console.log("[ai.service] Response did not start/end with {}. Attempting to find JSON object within the text.");
      const firstBrace = cleanedJsonText.indexOf('{');
      const lastBrace = cleanedJsonText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanedJsonText = cleanedJsonText.substring(firstBrace, lastBrace + 1);
        console.log("[ai.service] Extracted potential JSON object from within the text.");
      } else {
        console.error("[ai.service] Could not extract a valid JSON object from AI response. Raw text before this attempt:", aiResponseText);
        throw new Error("AI response did not appear to contain a JSON object after initial cleaning.");
      }
    }

    let parsedReport;
    try {
      console.log("[ai.service] Attempting to parse the following text as JSON:", cleanedJsonText.substring(0, 1000) + (cleanedJsonText.length > 1000 ? "..." : ""));
      parsedReport = JSON.parse(cleanedJsonText);
    } catch (parseError: any) {
      console.error("[ai.service] JSON.parse FAILED. Error:", parseError.message);
      console.error("[ai.service] Content that failed to parse (first 2000 chars):", cleanedJsonText.substring(0,2000) + (cleanedJsonText.length > 2000 ? "..." : ""));
      console.error("[ai.service] Original raw response from AI was (first 2000 chars):", aiResponseText.substring(0,2000) + (aiResponseText.length > 2000 ? "..." : ""));
      throw new Error(`AI response parsing error: ${parseError.message}`);
    }

    const finalReport: AIReport = {
      ...parsedReport,
      generatedAt: new Date().toISOString(),
    };
    
    console.log('[ai.service] Successfully parsed AI report.');
    return finalReport;

  } catch (error) {
    console.error("[ai.service] Error during AI processing or parsing:", error);
    let errorMessage = "An unexpected error occurred during AI processing.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    return {
      summary: 'AI Processing Error',
      analysis: [{
        component: 'AI Interaction',
        status: 'Failed',
        details: `Could not get a valid analysis from the AI. Error: ${errorMessage}`,
        recommendation: 'Try submitting again. If the problem persists, check system logs or contact support.'
      }],
      potentialCauses: ['AI service unavailable or returned an invalid response.', 'The AI may have struggled with the format or content of the input data.'],
      suggestedSolutions: ['Verify AI service configuration and API key.', 'Check the AI model limits and prompt complexity.', 'Ensure the input data is clean and does not contain unexpected characters that might break JSON generation.'],
      confidenceScore: 0,
      generatedAt: new Date().toISOString(),
      error: `AI Processing Error: ${errorMessage}`,
    };
  }
};

export const chatWithAI = async (
  systemInfoRaw: string,
  diagnosticReport: AIReport,
  userMessage: string,
  chatHistory: ChatMessage[] // Using the imported ChatMessage type
): Promise<string> => {
  console.log(`[ai.service chatWithAI] User message: "${userMessage.substring(0, 100)}...", History length: ${chatHistory.length}`);

  if (!genAI) {
    console.error("[ai.service chatWithAI] Gemini AI client not initialized.");
    throw new Error("AI Service (chat) is not configured. Missing API Key.");
  }
  
  const modelForChat: GenerativeModel = genAI.getGenerativeModel({ model: modelName, generationConfig, safetySettings });

  // Truncate context to avoid overly long prompts, adjust limits as needed
  const truncatedSystemInfo = systemInfoRaw.substring(0, 100000) + (systemInfoRaw.length > 100000 ? "\n[...SYSTEM INFO TRUNCATED...]" : "");
  const reportString = JSON.stringify(diagnosticReport, null, 2);
  const truncatedReport = reportString.substring(0, 100000) + (reportString.length > 100000 ? "\n[...REPORT TRUNCATED...]" : "");

  const fullPrompt = `
System Preamble:
You are a helpful AI assistant named "Diagnostic Assistant" specializing in PC diagnostics.
You are discussing a PC issue with a user.
You MUST use the following information about the user's system and a previously generated diagnostic report to answer the user's questions.
If the user asks something not covered by the provided System Information or Diagnostic Report, state that the information is not available in the provided documents.
Do not invent information. Be concise and directly answer the user's query in relation to the provided data.
Do not refer to yourself by any other model name (e.g., Gemini).

Context for this specific interaction:
System Information (DiagnosticInfo.txt):
---
${truncatedSystemInfo}
---
Diagnostic Report:
---
${truncatedReport}
---

Conversation History (if any):
${chatHistory.map(entry => `${entry.role === 'user' ? 'User' : 'Assistant'}: ${entry.parts.map(p => p.text).join('\n')}`).join('\n\n')}

Current User Message:
User: ${userMessage}

Assistant Response:
`;

  try {
    const result = await modelForChat.generateContent(fullPrompt);
    const response = result.response;
    const aiResponseText = response.text();
    
    console.log("[ai.service chatWithAI] Raw response from Gemini:", aiResponseText.substring(0, 200) + "...");
    return aiResponseText;

  } catch (error) {
    console.error("[ai.service chatWithAI] Error during AI chat processing:", error);
    let errorMessage = "An unexpected error occurred during AI chat processing.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    // Return a user-friendly error message to be displayed in chat
    return `I'm sorry, I encountered an error trying to process your message: ${errorMessage}. Please try again.`;
  }
};
