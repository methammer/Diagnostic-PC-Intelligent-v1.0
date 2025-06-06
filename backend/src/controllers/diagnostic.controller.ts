import { Request, Response } from 'express';
import { processWithAI, chatWithAI } from '../services/ai.service'; // Added chatWithAI
import { DiagnosticTask, DiagnosticTaskStatus, ChatMessage, AIReport } from '../models/diagnosticTask.model'; // Added ChatMessage, AIReport

const tasksDB: Map<string, DiagnosticTask> = new Map();

export const submitDiagnosticData = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('============================================================');
    console.log('[diagnostic.controller submit] Received request for /api/collecte.');
    
    const { problemDescription, systemInfoText } = req.body as { problemDescription?: string, systemInfoText?: string };

    console.log(`[diagnostic.controller submit] Destructured problemDescription: '${problemDescription ? problemDescription.substring(0,100) + '...' : 'N/A'}'`);
    console.log(`[diagnostic.controller submit] Destructured systemInfoText length: ${systemInfoText ? systemInfoText.length : 'N/A'}`);

    if (!problemDescription && (!systemInfoText || systemInfoText.trim().length === 0)) {
      console.error('[diagnostic.controller submit] Validation failed: problemDescription and systemInfoText are effectively missing.');
      res.status(400).json({ message: 'Aucune donnée de diagnostic fournie. Veuillez fournir une description du problème et/ou les informations système.' });
      return;
    }
    const finalProblemDescription = problemDescription || '';
    const finalSystemInfoText = systemInfoText || '';
    
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(`[diagnostic.controller submit] Generated taskId: ${taskId}`);
    
    const newTask: DiagnosticTask = {
      id: taskId,
      status: DiagnosticTaskStatus.PENDING,
      submittedAt: new Date(),
      problemDescription: finalProblemDescription, 
      systemInfoRaw: finalSystemInfoText,
    };
    tasksDB.set(taskId, newTask);
    console.log(`[diagnostic.controller submit Task ${taskId}]: Task created with PENDING status. tasksDB size: ${tasksDB.size}`);

    setTimeout(async () => {
      const task = tasksDB.get(taskId);
      if (!task) {
        console.error(`[diagnostic.controller timeout Task ${taskId}]: Task not found in tasksDB before processing.`);
        return;
      }

      try {
        console.log(`[diagnostic.controller timeout Task ${taskId}]: ENTERING TRY block for AI processing. Current task status: ${task.status}`);
        task.status = DiagnosticTaskStatus.PROCESSING;
        tasksDB.set(taskId, task); 
        console.log(`[diagnostic.controller timeout Task ${taskId}]: Status updated to PROCESSING.`);
        
        console.log(`[diagnostic.controller timeout Task ${taskId}]: PREPARING to call processWithAI. SystemInfoRaw length: ${task.systemInfoRaw ? task.systemInfoRaw.length : 'N/A'}, Problem: ${task.problemDescription ? `'${task.problemDescription.substring(0,50)}...'` : 'N/A'}`);
        
        const aiReport = await processWithAI(task.systemInfoRaw, task.problemDescription);
        console.log(`[diagnostic.controller timeout Task ${taskId}]: RETURNED from processWithAI. Report snippet:`, JSON.stringify(aiReport).substring(0,100) + '...');

        const currentTaskState = tasksDB.get(taskId); 
        if (!currentTaskState) {
            console.error(`[diagnostic.controller timeout Task ${taskId}]: Task disappeared from tasksDB after AI processing.`);
            return;
        }
        
        currentTaskState.report = aiReport;
        currentTaskState.status = DiagnosticTaskStatus.COMPLETED;
        currentTaskState.completedAt = new Date();
        tasksDB.set(taskId, currentTaskState); 
        console.log(`[diagnostic.controller timeout Task ${taskId}]: Status updated to COMPLETED. Report stored.`);

      } catch (aiError) {
        console.error(`[diagnostic.controller timeout Task ${taskId}]: CAUGHT ERROR during AI processing or status update. Type: ${typeof aiError}`, aiError);
        if (aiError instanceof Error) {
            console.error(`[diagnostic.controller timeout Task ${taskId}]: Error Name: ${aiError.name}, Message: ${aiError.message}, Stack: ${aiError.stack}`);
        }
        const taskToFail = tasksDB.get(taskId);
        if (taskToFail) {
          taskToFail.status = DiagnosticTaskStatus.FAILED;
          const errorMessage = aiError instanceof Error ? aiError.message : String(aiError);
          taskToFail.report = { 
            summary: 'Erreur de traitement AI',
            analysis: [{ component: 'AI Processing', status: 'Failed', details: errorMessage, recommendation: 'Veuillez réessayer ou contacter le support.' }],
            potentialCauses: ['Erreur interne'],
            suggestedSolutions: ['Contacter le support technique.'],
            confidenceScore: 0,
            generatedAt: new Date().toISOString(),
            error: 'Erreur lors du traitement AI.'
          };
          taskToFail.error = errorMessage; 
          taskToFail.completedAt = new Date();
          tasksDB.set(taskId, taskToFail); 
          console.log(`[diagnostic.controller timeout Task ${taskId}]: Status updated to FAILED due to error.`);
        } else {
          console.error(`[diagnostic.controller timeout Task ${taskId}]: Task not found in tasksDB when trying to mark as FAILED after an error.`);
        }
      }
    }, 5000); 

    res.status(202).json({ 
      message: 'Données de diagnostic reçues, traitement en cours.',
      taskId: taskId 
    });
    console.log(`[diagnostic.controller submit Task ${taskId}]: Responded 202 to client.`);
    console.log('============================================================');

  } catch (error) {
    console.error('[diagnostic.controller submit] Outer error during submission:', error);
    if (error instanceof Error) {
        console.error(`[diagnostic.controller submit] Outer error details: Name: ${error.name}, Message: ${error.message}, Stack: ${error.stack}`);
    }
    res.status(500).json({ message: 'Erreur interne du serveur lors de la soumission des données.' });
    console.log('============================================================');
  }
};

export const getDiagnosticReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const task = tasksDB.get(taskId);
    
    console.log(`[diagnostic.controller getReport Task ${taskId}]: Request received. tasksDB size: ${tasksDB.size}. Task found: ${!!task}`);

    if (!task) {
      console.log(`[diagnostic.controller getReport Task ${taskId}]: Task not found in DB. Responding 404.`);
      res.status(404).json({ message: `Rapport pour la tâche ${taskId} non trouvé.` });
      return;
    }

    console.log(`[diagnostic.controller getReport Task ${taskId}]: Serving task with status: ${task.status}. SubmittedAt: ${task.submittedAt.toISOString()}`);

    if (task.status === DiagnosticTaskStatus.PENDING || task.status === DiagnosticTaskStatus.PROCESSING) {
      console.log(`[diagnostic.controller getReport Task ${taskId}]: Status is PENDING/PROCESSING. Responding 202.`);
      res.status(202).json({ 
        taskId: task.id,
        status: task.status,
        submittedAt: task.submittedAt.toISOString(),
        problemDescription: task.problemDescription,
        message: task.status === DiagnosticTaskStatus.PENDING ? 'Le diagnostic est en attente de traitement.' : 'Le rapport de diagnostic est en cours de traitement.'
      });
      return;
    }
    
    if (task.status === DiagnosticTaskStatus.FAILED) {
       console.log(`[diagnostic.controller getReport Task ${taskId}]: Status is FAILED. Responding 200 with error details.`);
       res.status(200).json({
        taskId: task.id,
        status: task.status,
        submittedAt: task.submittedAt.toISOString(),
        completedAt: task.completedAt?.toISOString(),
        problemDescription: task.problemDescription,
        diagnosticReport: task.report, 
        errorDetails: `Le traitement du diagnostic a échoué. ${task.error ? `Détails: ${task.error}` : 'Aucun détail supplémentaire.'}`,
      });
      return;
    }

    if (task.status === DiagnosticTaskStatus.COMPLETED && task.report) {
      console.log(`[diagnostic.controller getReport Task ${taskId}]: Status is COMPLETED. Responding 200 with report.`);
      res.status(200).json({
        taskId: task.id,
        status: task.status,
        submittedAt: task.submittedAt.toISOString(),
        completedAt: task.completedAt?.toISOString(),
        problemDescription: task.problemDescription,
        diagnosticReport: task.report,
      });
    } else {
      console.warn(`[diagnostic.controller getReport Task ${taskId}]: Task status is ${task.status} but state is unexpected. Responding 404 or specific error.`);
      res.status(404).json({ 
        message: `Rapport pour la tâche ${taskId} est dans un état inattendu ou incomplet (statut: ${task.status}).`,
        taskId: task.id,
        status: task.status,
        submittedAt: task.submittedAt.toISOString(),
      });
    }

  } catch (error) {
    const taskId = req.params.taskId || 'unknown';
    console.error(`[diagnostic.controller getReport Task ${taskId}]: Outer error during report retrieval:`, error);
     if (error instanceof Error) {
        console.error(`[diagnostic.controller getReport Task ${taskId}] Outer error details: Name: ${error.name}, Message: ${error.message}, Stack: ${error.stack}`);
    }
    res.status(500).json({ message: 'Erreur interne du serveur lors de la récupération du rapport.' });
  }
};

export const handleChatMessage = async (req: Request, res: Response): Promise<void> => {
  const { taskId } = req.params;
  const { userMessage, chatHistory } = req.body as { 
    userMessage?: string, 
    chatHistory?: ChatMessage[] // Use imported ChatMessage type
  };

  console.log(`[diagnostic.controller chat Task ${taskId}]: Received chat message. User: "${userMessage ? userMessage.substring(0,50) + '...' : 'N/A'}". History length: ${chatHistory?.length ?? 0}`);

  if (!userMessage || userMessage.trim() === "") {
    res.status(400).json({ message: "User message cannot be empty." });
    return;
  }

  const task = tasksDB.get(taskId);
  if (!task) {
    console.warn(`[diagnostic.controller chat Task ${taskId}]: Task not found.`);
    res.status(404).json({ message: `Task ${taskId} not found.` });
    return;
  }

  if (task.status !== DiagnosticTaskStatus.COMPLETED || !task.report) {
    console.warn(`[diagnostic.controller chat Task ${taskId}]: Chat attempted on non-completed/reportless task. Status: ${task.status}`);
    res.status(400).json({ message: `Chat is only available for completed tasks with a report. Task status: ${task.status}` });
    return;
  }

  if (typeof task.systemInfoRaw !== 'string' || !task.report) {
      console.error(`[diagnostic.controller chat Task ${taskId}]: Missing systemInfoRaw or report for completed task.`);
      res.status(500).json({ message: "Internal error: Diagnostic data for chat is incomplete." });
      return;
  }
  
  try {
    const aiResponse = await chatWithAI(
      task.systemInfoRaw, 
      task.report as AIReport, // Cast as AIReport, as it's checked above
      userMessage,
      chatHistory || [] 
    );
    console.log(`[diagnostic.controller chat Task ${taskId}]: AI response received: "${aiResponse.substring(0,100)}..."`);
    res.status(200).json({ aiResponse });
  } catch (error) {
    console.error(`[diagnostic.controller chat Task ${taskId}]: Error in chatWithAI call:`, error);
    if (error instanceof Error) {
        console.error(`[diagnostic.controller chat Task ${taskId}]: Error details: Name: ${error.name}, Message: ${error.message}`);
    }
    res.status(500).json({ message: "Error processing chat message with AI." });
  }
};
