import dotenv from 'dotenv';
dotenv.config(); // Load environment variables at the very beginning

import express from 'express';
import cors from 'cors';
import diagnosticRoutes from './routes/diagnostic.routes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // For parsing application/json, increased limit
app.use(express.urlencoded({ limit: '10mb', extended: true })); // For parsing application/x-www-form-urlencoded, increased limit


// Routes
app.use('/api', diagnosticRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Diagnostic PC Intelligent Backend is running!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('[WARNING] GEMINI_API_KEY is not set in the environment variables. AI processing will fail.');
  } else {
    console.log('[INFO] GEMINI_API_KEY is loaded.');
  }
});
