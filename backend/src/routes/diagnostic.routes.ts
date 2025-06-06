import { Router } from 'express';
import { submitDiagnosticData, getDiagnosticReport, handleChatMessage } from '../controllers/diagnostic.controller'; // Added handleChatMessage
import { validateAndHandle } from '../middlewares/validator.middleware';

const router = Router();

// Endpoint pour recevoir les données de l'agent
// POST /api/collecte
router.post('/collecte', validateAndHandle, submitDiagnosticData);

// Endpoint pour que le frontend récupère le rapport de diagnostic
// GET /api/diagnostic/:taskId
router.get('/diagnostic/:taskId', getDiagnosticReport);

// Endpoint pour le chat IA post-diagnostic
// POST /api/chat/:taskId
router.post('/chat/:taskId', handleChatMessage); // No specific validator for chat yet, can be added

export default router;
