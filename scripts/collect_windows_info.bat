@echo off
REM Change la page de code de la console en UTF-8 pour afficher correctement les accents
chcp 65001 > nul

SETLOCAL ENABLEDELAYEDEXPANSION

REM --- Configuration des couleurs avec les séquences d'échappement ANSI ---
REM On récupère le caractère d'échappement (ESC)
for /f "tokens=1 delims= " %%A in ('"prompt $E & for %%B in (1) do rem"') do set "ESC=%%A"

REM On définit les variables de couleur
set "cReset=%ESC%[0m"
set "cBlue=%ESC%[94m"
set "cGreen=%ESC%[92m"
set "cYellow=%ESC%[93m"
set "cRed=%ESC%[91m"
set "cWhite=%ESC%[97m"


REM --- DEBUT DU SCRIPT ---

SET OutputFile=DiagnosticInfo.txt
SET OutputFilePath=%~dp0%OutputFile%

REM > Vider le fichier de sortie précédent
type nul > "%OutputFilePath%"

echo %cBlue%Démarrage de la collecte des informations système avancées pour Windows...%cReset%
echo %cWhite%Veuillez patienter, plusieurs étapes vont s'exécuter.%cReset%
echo.

echo Collecte des informations systeme avancees pour Windows... >> "%OutputFilePath%"
echo Veuillez patienter, cela peut prendre quelques instants. >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo Fichier de sortie sera enregistre ici: %OutputFilePath% >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"

echo [SECTION_DEBUT: Informations Generales] >> "%OutputFilePath%"
echo ======================================= >> "%OutputFilePath%"
echo Date et Heure de la collecte: %date% %time% >> "%OutputFilePath%"
echo Script execute depuis: %~dp0 >> "%OutputFilePath%"
echo Nom du fichier de sortie: %OutputFile% >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo [SECTION_FIN: Informations Generales] >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"

echo %cBlue%Étape 1 sur 5 : Analyse des journaux d'événements critiques...%cReset%
echo [SECTION_DEBUT: Erreurs Recentes du Journal Systeme] >> "%OutputFilePath%"
echo ================================================== >> "%OutputFilePath%"
wevtutil qe System /c:50 /rd:true /f:text /q:"*[System[Level=1 or Level=2]]" >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo [SECTION_FIN: Erreurs Recentes du Journal Systeme] >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo [SECTION_DEBUT: Erreurs Recentes du Journal Application] >> "%OutputFilePath%"
echo ===================================================== >> "%OutputFilePath%"
wevtutil qe Application /c:50 /rd:true /f:text /q:"*[System[Level=1 or Level=2]]" >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo [SECTION_FIN: Erreurs Recentes du Journal Application] >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"

echo %cBlue%Étape 2 sur 5 : Collecte des pilotes et des services Windows...%cReset%
echo [SECTION_DEBUT: Pilotes Systemes] >> "%OutputFilePath%"
echo ================================== >> "%OutputFilePath%"
driverquery /FO LIST >> "%OutputFilePath%"
driverquery /FO CSV >> "%OutputFilePath%"
echo [SECTION_FIN: Pilotes Systemes] >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo [SECTION_DEBUT: Services Windows] >> "%OutputFilePath%"
echo ================================= >> "%OutputFilePath%"
wmic service get Name, DisplayName, State, StartMode /FORMAT:LIST >> "%OutputFilePath%"
echo [SECTION_FIN: Services Windows] >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"

echo %cBlue%Étape 3 sur 5 : Inspection des disques, partitions et état de santé S.M.A.R.T...%cReset%
echo [SECTION_DEBUT: Disques et Partitions] >> "%OutputFilePath%"
echo ===================================== >> "%OutputFilePath%"
wmic logicaldisk get Name, Description, FreeSpace, Size, FileSystem, VolumeName /FORMAT:LIST >> "%OutputFilePath%"
wmic diskdrive get Model, Size, InterfaceType /FORMAT:LIST >> "%OutputFilePath%"
wmic partition get Name, DiskIndex, Index, Size, Type, Bootable, PrimaryPartition /FORMAT:LIST >> "%OutputFilePath%"
wmic diskdrive get Model, Status /FORMAT:LIST >> "%OutputFilePath%"
echo [SECTION_FIN: Disques et Partitions] >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"

echo %cBlue%Étape 4 sur 5 : Listage des processus, applications et programmes au démarrage...%cReset%
echo [SECTION_DEBUT: Processus en Cours] >> "%OutputFilePath%"
echo =================================== >> "%OutputFilePath%"
tasklist /FO LIST >> "%OutputFilePath%"
tasklist /FO CSV >> "%OutputFilePath%"
echo [SECTION_FIN: Processus en Cours] >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo [SECTION_DEBUT: Programmes au Demarrage] >> "%OutputFilePath%"
echo ======================================= >> "%OutputFilePath%"
wmic startup get Caption, Command, User /FORMAT:LIST >> "%OutputFilePath%"
echo [SECTION_FIN: Programmes au Demarrage] >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo %cYellow%  -> Récupération de la liste des logiciels installés. CETTE OPERATION PEUT ETRE TRES LONGUE, merci de patienter...%cReset%
echo [SECTION_DEBUT: Applications Installees] >> "%OutputFilePath%"
echo ======================================== >> "%OutputFilePath%"
wmic product get Name, Vendor, Version, InstallDate /FORMAT:LIST >> "%OutputFilePath%"
echo [SECTION_FIN: Applications Installees] >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"

echo %cBlue%Étape 5 sur 5 : Vérification de la configuration réseau...%cReset%
echo [SECTION_DEBUT: Configuration Reseau Detaille] >> "%OutputFilePath%"
echo ============================================= >> "%OutputFilePath%"
ipconfig /all >> "%OutputFilePath%"
echo [SECTION_FIN: Configuration Reseau Detaille] >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"

REM --- FIN DU SCRIPT ---

echo Collecte terminee. >> "%OutputFilePath%"
echo Le fichier '%OutputFile%' a ete cree dans le repertoire: %~dp0 >> "%OutputFilePath%"
echo Vous pouvez maintenant importer ce fichier dans le formulaire de diagnostic. >> "%OutputFilePath%"

echo.
echo %cGreen%================================================================================%cReset%
echo %cGreen%COLLECTE TERMINEE%cReset%
echo.
echo %cWhite%Les informations ont été enregistrées dans le fichier :%cReset%
echo %cYellow%%OutputFilePath%%cReset%
echo.
echo %cWhite%Vous pouvez maintenant fermer cette fenêtre et importer ce fichier%cReset%
echo %cWhite%dans l'application de diagnostic.%cReset%
echo %cGreen%================================================================================%cReset%
echo.
pause
ENDLOCAL