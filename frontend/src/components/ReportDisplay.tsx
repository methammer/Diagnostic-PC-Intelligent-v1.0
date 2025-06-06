import React, { useState, useEffect, useRef } from 'react';
import { DiagnosticReport, sendChatMessage, ChatServiceMessagePayload, AIReportData } from '../services/apiClient';
import { DiagnosticTaskStatus } from '../types/diagnosticTaskStatus';
import { ChatMessage } from '../../../backend/src/models/diagnosticTask.model'; // For structuring history

interface ReportDisplayProps {
  reportData: DiagnosticReport | null;
  isLoading: boolean;
}

interface DisplayChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ reportData, isLoading }) => {
  const [chatMessages, setChatMessages] = useState<DisplayChatMessage[]>([]);
  const [currentUserMessage, setCurrentUserMessage] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Focus input when chat becomes available
  useEffect(() => {
    if (reportData?.status === DiagnosticTaskStatus.COMPLETED && reportData?.diagnosticReport && chatInputRef.current) {
      // chatInputRef.current.focus(); // Can be slightly aggressive, enable if desired
    }
  }, [reportData?.status, reportData?.diagnosticReport]);


  const handleSendChatMessage = async () => {
    if (!currentUserMessage.trim() || !reportData?.taskId || isChatLoading) return;

    const userDisplayMessage: DisplayChatMessage = { sender: 'user', text: currentUserMessage };
    setChatMessages(prev => [...prev, userDisplayMessage]);
    
    const currentMessageForApi = currentUserMessage;
    setCurrentUserMessage(''); // Clear input after capturing value
    setIsChatLoading(true);

    const historyForAPI: ChatMessage[] = chatMessages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const payload: ChatServiceMessagePayload = {
      userMessage: currentMessageForApi,
      chatHistory: historyForAPI 
    };

    try {
      const response = await sendChatMessage(reportData.taskId, payload);
      setChatMessages(prev => [...prev, { sender: 'ai', text: response.aiResponse }]);
    } catch (error) {
      console.error("Error sending chat message:", error);
      setChatMessages(prev => [...prev, { sender: 'ai', text: "Désolé, une erreur s'est produite lors de la communication avec l'assistant." }]);
    } finally {
      setIsChatLoading(false);
      // chatInputRef.current?.focus(); // Re-focus after response
    }
  };


  if (isLoading && !reportData) {
    return (
      <div className="card text-center animate-fade-in">
        <div className="flex justify-center items-center mb-4">
          <div className="loading-spinner"></div>
        </div>
        <p className="text-brand-primary font-semibold text-lg">Chargement du rapport...</p>
      </div>
    );
  }

  if (!reportData) {
    return null; 
  }

  const getStatusClass = (status: DiagnosticTaskStatus | string) => {
    switch (status) {
      case DiagnosticTaskStatus.PENDING: return 'status-pending';
      case DiagnosticTaskStatus.PROCESSING: return 'status-processing';
      case DiagnosticTaskStatus.COMPLETED: return 'status-completed';
      case DiagnosticTaskStatus.FAILED: return 'status-failed';
      default: return 'text-gray-700';
    }
  };
  
  const renderAnalysis = (analysis: AIReportData['analysis']) => {
    if (!analysis || analysis.length === 0) {
      return <p className="text-sm text-gray-500">Aucune donnée d'analyse détaillée disponible.</p>;
    }
    return analysis.map((item, index) => (
      <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h4 className="font-semibold text-brand-dark text-md">{item.component} - <span className={item.status === 'Normal' ? 'text-green-600' : 'text-red-600'}>{item.status}</span></h4>
        <p className="text-sm text-gray-600 mt-1">{item.details}</p>
        <p className="text-sm text-brand-primary mt-1"><em>Recommandation: {item.recommendation}</em></p>
      </div>
    ));
  };

  const renderList = (title: string, items: string[] | undefined) => {
    if (!items || items.length === 0) {
      return <p className="text-sm text-gray-500">Aucune information disponible pour "{title}".</p>;
    }
    return (
      <>
        <h4 className="font-semibold text-brand-dark text-md mt-4 mb-2">{title}</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          {items.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
      </>
    );
  };


  return (
    <div className="card animate-slide-in-bottom">
      <h2 className="text-2xl font-bold text-brand-dark mb-2">Rapport de Diagnostic</h2>
      <p className="text-sm text-gray-500 mb-1">ID de la tâche: <span className="font-mono">{reportData.taskId}</span></p>
      <p className="text-md font-semibold mb-4">
        Statut: <span className={`${getStatusClass(reportData.status)} font-bold`}>{reportData.status}</span>
      </p>

      {reportData.problemDescription && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-brand-dark mb-1">Problème soumis :</h3>
          <p className="text-gray-700 italic bg-gray-100 p-3 rounded-md">{reportData.problemDescription}</p>
        </div>
      )}
      
      {(reportData.status === DiagnosticTaskStatus.PENDING || reportData.status === DiagnosticTaskStatus.PROCESSING) && reportData.message && (
         <div className="my-4 p-4 bg-blue-50 border border-blue-200 rounded-md text-center">
            <div className="flex justify-center items-center mb-2">
              <div className="loading-spinner"></div>
            </div>
            <p className="text-brand-info">{reportData.message}</p>
        </div>
      )}

      {reportData.status === DiagnosticTaskStatus.FAILED && (
        <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-lg font-semibold text-red-600 mb-1">Échec du Diagnostic</h3>
          <p className="text-red-700">{reportData.errorDetails || 'Une erreur est survenue.'}</p>
          {reportData.diagnosticReport?.error && <p className="text-sm text-red-700 mt-1">Détails IA: {reportData.diagnosticReport.error}</p>}
        </div>
      )}

      {reportData.status === DiagnosticTaskStatus.COMPLETED && reportData.diagnosticReport && (
        <div>
          <h3 className="text-xl font-semibold text-brand-dark mt-6 mb-3">Détails de l'Analyse IA :</h3>
          
          <div className="mb-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
             <h4 className="font-semibold text-brand-dark text-md">Résumé IA</h4>
             <p className="text-sm text-gray-700 mt-1">{reportData.diagnosticReport.summary}</p>
             <p className="text-xs text-gray-500 mt-2">Score de confiance: { (reportData.diagnosticReport.confidenceScore * 100).toFixed(1) }%</p>
          </div>

          {renderAnalysis(reportData.diagnosticReport.analysis)}
          {renderList("Causes Potentielles", reportData.diagnosticReport.potentialCauses)}
          {renderList("Solutions Suggérées", reportData.diagnosticReport.suggestedSolutions)}
          
          {reportData.diagnosticReport.generatedAt && 
            <p className="text-xs text-gray-400 mt-6 text-right">Rapport généré le: {new Date(reportData.diagnosticReport.generatedAt).toLocaleString('fr-FR')}</p>
          }

          {/* AI Chat Section */}
          <div className="mt-8 pt-6 border-t border-gray-300">
            <h3 className="text-xl font-semibold text-brand-dark mb-4">Discuter avec l'Assistant IA</h3>
            <div ref={chatContainerRef} className="h-80 overflow-y-auto border border-gray-300 rounded-lg p-4 mb-4 bg-gray-100 space-y-4 shadow-inner">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[80%] px-4 py-2 rounded-xl shadow ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-xl bg-gray-200 text-gray-800 rounded-bl-none">
                    <p className="text-sm italic flex items-center">
                      <span className="animate-pulse mr-2">●</span>
                      <span className="animate-pulse mr-2 delay-150">●</span>
                      <span className="animate-pulse delay-300">●</span>
                    </p>
                  </div>
                </div>
              )}
               {chatMessages.length === 0 && !isChatLoading && (
                <p className="text-sm text-gray-500 text-center py-4">Posez une question concernant votre rapport ou les informations système.</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={chatInputRef}
                type="text"
                value={currentUserMessage}
                onChange={(e) => setCurrentUserMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isChatLoading && handleSendChatMessage()}
                placeholder="Votre question..."
                className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
                disabled={isChatLoading}
              />
              <button 
                onClick={handleSendChatMessage} 
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                disabled={isChatLoading || !currentUserMessage.trim()}
              >
                {isChatLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : "Envoyer"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {reportData.status === DiagnosticTaskStatus.COMPLETED && !reportData.diagnosticReport && (
        <div className="my-4 p-4 bg-yellow-50 border border-yellow-300 rounded-md">
          <h3 className="text-lg font-semibold text-yellow-700 mb-1">Données de Rapport Incomplètes</h3>
          <p className="text-yellow-800">Le statut est "COMPLETED", mais les détails du rapport IA ne sont pas disponibles. Veuillez vérifier les logs ou contacter le support.</p>
          <p className="text-xs text-yellow-600">Raw diagnosticReport value: {JSON.stringify(reportData.diagnosticReport)}</p>
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500">
        <p>Soumis le: {new Date(reportData.submittedAt).toLocaleString('fr-FR')}</p>
        {reportData.completedAt && <p>Terminé le: {new Date(reportData.completedAt).toLocaleString('fr-FR')}</p>}
      </div>
    </div>
  );
};

export default ReportDisplay;
