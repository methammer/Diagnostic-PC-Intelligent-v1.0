import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import DiagnosticForm from './components/DiagnosticForm';
import ReportDisplay from './components/ReportDisplay';
import { submitDiagnostic, getDiagnosticReport, DiagnosticReport, SubmitDiagnosticPayload } from './services/apiClient';
import { DiagnosticTaskStatus } from '../../backend/src/models/diagnosticTask.model'; // Ajustez si le chemin partagé est différent

const App: React.FC = () => {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [reportData, setReportData] = useState<DiagnosticReport | null>(null);
  const [isLoadingForm, setIsLoadingForm] = useState<boolean>(false);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Renamed systemInfoJSON to systemInfoText for clarity
  const handleFormSubmit = async (problemDescription: string, systemInfoText: string) => {
    setIsLoadingForm(true);
    setError(null);
    setReportData(null);
    setTaskId(null);

    // The systemInfoText is already the raw string content from the file.
    // No JSON.parse needed here.
    // The backend expects a field named 'systemInfoText'.

    try {
      // Ensure the payload matches what the backend controller expects in req.body
      // and what SubmitDiagnosticPayload type defines.
      const payload: SubmitDiagnosticPayload = { problemDescription, systemInfoText };
      // console.log("[App.tsx handleFormSubmit] Submitting with payload:", payload);
      const response = await submitDiagnostic(payload);
      setTaskId(response.taskId);
      setIsLoadingReport(true);
    } catch (err) {
      console.error("[App.tsx handleFormSubmit] Erreur lors de la soumission du diagnostic:", err);
      let detailedError = "Impossible de soumettre la demande de diagnostic. Veuillez réessayer.";
      if (axios.isAxiosError(err)) {
        if (err.response) {
          detailedError += ` (Erreur ${err.response.status}: ${err.response.data?.message || err.message})`;
        } else if (err.request) {
          detailedError += ` (Le serveur n'a pas répondu.)`;
        } else {
          detailedError += ` (${err.message})`;
        }
      } else if (err instanceof Error) {
        detailedError += ` (${err.message})`;
      }
      setError(detailedError);
    } finally {
      setIsLoadingForm(false);
    }
  };
  
  const pollReport = useCallback(async (currentTaskId: string) => {
    try {
      const report = await getDiagnosticReport(currentTaskId);
      setReportData(report);
      
      if (report.status === DiagnosticTaskStatus.PENDING || report.status === DiagnosticTaskStatus.PROCESSING) {
        return true; // Continue polling
      } else {
        setIsLoadingReport(false); // Stop loading indicator
        return false; // Stop polling
      }
    } catch (err) {
      console.error(`[App.tsx pollReport] Error polling for ${currentTaskId}:`, err);
      let pollErrorMsg = `Erreur lors de la récupération du rapport. (ID: ${currentTaskId})`;
       if (axios.isAxiosError(err) && err.response) {
          pollErrorMsg += ` (Status: ${err.response.status} - ${err.response.data?.message || err.message})`;
        } else if (err instanceof Error) {
          pollErrorMsg += ` (${err.message})`;
        }
      setError(pollErrorMsg);
      setIsLoadingReport(false);
      setReportData(prev => { // Set a minimal failed report structure
        const existingData = prev && prev.taskId === currentTaskId ? prev : null;
        return {
          taskId: currentTaskId,
          status: DiagnosticTaskStatus.FAILED,
          submittedAt: existingData?.submittedAt || new Date().toISOString(),
          errorDetails: `Erreur de récupération: ${ (err as any)?.message || 'inconnue'}. ${existingData?.errorDetails || ''}`,
          problemDescription: existingData?.problemDescription,
        };
      });
      return false; // Stop polling due to error
    }
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (taskId && isLoadingReport) {
      pollReport(taskId).then(shouldContinuePolling => {
        if (shouldContinuePolling) {
          intervalId = setInterval(async () => {
            if (!taskId) { 
                 clearInterval(intervalId);
                 return;
            }
            const keepPolling = await pollReport(taskId);
            if (!keepPolling) {
              clearInterval(intervalId);
            }
          }, 3000);
        }
      });
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [taskId, isLoadingReport, pollReport]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-light via-slate-100 to-gray-200 py-8 px-4 flex flex-col items-center">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-bold text-brand-primary mb-2">
          Diagnostic PC Intelligent
        </h1>
        <p className="text-xl text-brand-secondary">
          Obtenez une analyse IA de l'état de votre PC.
        </p>
      </header>

      <main className="w-full max-w-2xl">
        {!taskId && !reportData && (
          <div className="card">
            <DiagnosticForm onSubmit={handleFormSubmit} isLoading={isLoadingForm} />
          </div>
        )}

        {error && (
          <div className="card bg-red-50 border-red-500 border animate-fade-in my-4">
            <p className="text-red-700 font-semibold text-center p-4">{error}</p>
          </div>
        )}
        
        {(isLoadingReport || reportData) && (
          <div className="mt-8">
            <ReportDisplay reportData={reportData} isLoading={isLoadingReport && (!reportData || reportData.status === DiagnosticTaskStatus.PENDING || reportData.status === DiagnosticTaskStatus.PROCESSING)} />
          </div>
        )}

        {reportData && (reportData.status === DiagnosticTaskStatus.COMPLETED || reportData.status === DiagnosticTaskStatus.FAILED) && (
           <div className="mt-8 text-center animate-fade-in">
            <button 
              onClick={() => {
                setTaskId(null);
                setReportData(null);
                setError(null);
                setIsLoadingReport(false);
              }}
              className="btn btn-secondary"
            >
              Effectuer un nouveau diagnostic
            </button>
          </div>
        )}
      </main>
      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Diagnostic PC Intelligent. Tous droits réservés.</p>
      </footer>
    </div>
  );
};

export default App;
