import React, { useState, useRef } from 'react';

interface DiagnosticFormProps {
  onSubmit: (problemDescription: string, systemInfoText: string) => void;
  isLoading: boolean;
}

const DiagnosticForm: React.FC<DiagnosticFormProps> = ({ onSubmit, isLoading }) => {
  const [problemDescription, setProblemDescription] = useState('');
  const [systemInfoText, setSystemInfoText] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemDescription.trim()) {
      setDescriptionError('La description du problème ne peut pas être vide.');
      return;
    }
    setDescriptionError('');

    if (!selectedFile) {
      setFileError('Veuillez sélectionner le fichier DiagnosticInfo.txt.');
      return;
    }

    // This check is important if the file was selected but somehow resulted in empty text
    // (e.g., an empty file was uploaded, or a read error occurred that wasn't caught by reader.onerror)
    if (selectedFile && !systemInfoText.trim()) {
      setFileError('Le fichier sélectionné est vide ou n\'a pas pu être lu. Veuillez vérifier le fichier.');
      return;
    }
    
    setFileError('');
    onSubmit(problemDescription, systemInfoText);
  };

  const handleDownloadScript = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const scriptUrl = e.currentTarget.href;

    try {
      const response = await fetch(scriptUrl);
      if (!response.ok) {
        console.error('Échec de la récupération du script:', response.status, response.statusText);
        alert(`Erreur lors du téléchargement du script: ${response.status} ${response.statusText}.`);
        return;
      }
      const scriptContent = await response.text();
      const blob = new Blob([scriptContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'collect_windows_info.bat');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement du script:', error);
      alert('Une erreur est survenue lors de la tentative de téléchargement du script.');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "text/plain" || file.name.endsWith('.txt') || file.name.endsWith('.log')) {
        setSelectedFile(file);
        setFileError('');
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setSystemInfoText(text);
        };
        reader.onerror = () => {
          setFileError('Erreur lors de la lecture du fichier.');
          setSystemInfoText('');
          setSelectedFile(null); // Clear selected file on read error
           if(fileInputRef.current) { // Reset file input visually
            fileInputRef.current.value = "";
          }
        }
        reader.readAsText(file);
      } else {
        setFileError('Type de fichier non valide. Veuillez sélectionner un fichier .txt ou .log.');
        setSystemInfoText('');
        setSelectedFile(null);
        if(fileInputRef.current) {
          fileInputRef.current.value = ""; // Reset file input
        }
      }
    } else {
      setSelectedFile(null);
      setSystemInfoText(''); // Clear system info if no file is selected
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white shadow-xl rounded-lg">
      <div>
        <label htmlFor="problemDescription" className="block text-sm font-medium text-gray-700 mb-1">
          Décrivez le problème que vous rencontrez :
        </label>
        <textarea
          id="problemDescription"
          name="problemDescription"
          rows={4}
          className={`input-field ${descriptionError ? 'border-red-500' : 'border-gray-300'}`}
          value={problemDescription}
          onChange={(e) => {
            setProblemDescription(e.target.value);
            if (e.target.value.trim()) setDescriptionError('');
          }}
          placeholder="Ex: Mon ordinateur est très lent au démarrage, les applications se bloquent souvent..."
        />
        {descriptionError && <p className="text-xs text-red-600 mt-1">{descriptionError}</p>}
      </div>

      <div className="space-y-4 p-4 border border-blue-200 rounded-md bg-blue-50">
        <h3 className="text-md font-semibold text-blue-700">Collecte des Informations Système (Windows)</h3>
        <p className="text-xs text-gray-600">
          Pour nous aider à diagnostiquer le problème sur un PC Windows, veuillez suivre ces étapes :
        </p>
        <a
          href="/scripts/collect_windows_info.bat" // Ensure this path is correct relative to your public folder
          onClick={handleDownloadScript}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          1. Télécharger le Script de Diagnostic
        </a>
        <p className="text-xs text-gray-600 mt-2">
          <strong>Instructions après téléchargement :</strong>
          <ol className="list-decimal list-inside pl-4 space-y-1 mt-1">
            <li>{'Ouvrez le fichier téléchargé <code>collect_windows_info.bat</code>. Il se peut que Windows affiche un avertissement de sécurité ; vous devrez autoriser son exécution.'}</li>
            <li>{'Une fenêtre de commande s\'ouvrira et collectera les informations. Cela peut prendre quelques instants.'}</li>
            <li>{'Une fois terminé, le script indiquera qu\'il a créé un fichier nommé <code>DiagnosticInfo.txt</code> dans le même dossier où vous avez exécuté le script (généralement votre dossier "Téléchargements").'}</li>
            <li>{'Cliquez sur le bouton "Choisir un fichier" ci-dessous et sélectionnez ce fichier <code>DiagnosticInfo.txt</code>.'}</li>
          </ol>
        </p>
      </div>

      <div>
        <label htmlFor="systemInfoFile" className="block text-sm font-medium text-gray-700 mb-1">
          2. Importer le fichier d'informations système (<code>DiagnosticInfo.txt</code>) :
        </label>
        <input
          type="file"
          id="systemInfoFile"
          name="systemInfoFile"
          ref={fileInputRef}
          accept=".txt,.log" 
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {selectedFile && (
          <p className="text-xs text-green-600 mt-1">Fichier sélectionné : {selectedFile.name}</p>
        )}
        {fileError && <p className="text-xs text-red-600 mt-1">{fileError}</p>}
        
         <p className="text-xs text-gray-500 mt-1">
          Le script génère un fichier <code>DiagnosticInfo.txt</code>. Veuillez l'importer ici.
        </p>
      </div>

      <div>
        <button
          type="submit"
          className="btn btn-primary w-full flex justify-center items-center"
          disabled={isLoading || (descriptionError !== '') || (fileError !== '')}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Soumission en cours...
            </>
          ) : (
            'Soumettre le Diagnostic'
          )}
        </button>
      </div>
    </form>
  );
};

export default DiagnosticForm;
