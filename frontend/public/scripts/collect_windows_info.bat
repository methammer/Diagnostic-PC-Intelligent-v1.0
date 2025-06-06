@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

REM Definit le nom du fichier de sortie
SET OutputFile=DiagnosticInfo.txt
REM Definit le chemin complet du fichier de sortie dans le repertoire du script
SET OutputFilePath=%~dp0%OutputFile%

echo Collecte des informations systeme avancees pour Windows... > "%OutputFilePath%"
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

echo [SECTION_DEBUT: Pilotes Systemes] >> "%OutputFilePath%"
echo ================================== >> "%OutputFilePath%"
echo Liste des pilotes systemes (nom, type, date du lien): >> "%OutputFilePath%"
driverquery /FO LIST >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo Variante CSV des pilotes (peut etre plus facile a lire pour certains): >> "%OutputFilePath%"
driverquery /FO CSV >> "%OutputFilePath%"
echo [SECTION_FIN: Pilotes Systemes] >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"

echo [SECTION_DEBUT: Partitions de Disque] >> "%OutputFilePath%"
echo ===================================== >> "%OutputFilePath%"
echo Informations sur les disques logiques (Nom, Description, Espace Libre, Taille, Systeme de fichiers, Nom Volume): >> "%OutputFilePath%"
wmic logicaldisk get Name, Description, FreeSpace, Size, FileSystem, VolumeName /FORMAT:LIST >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo Informations sur les disques physiques (Modele, Taille, Interface): >> "%OutputFilePath%"
wmic diskdrive get Model, Size, InterfaceType /FORMAT:LIST >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo Informations sur les partitions physiques (Nom, Index du disque, Index de la partition, Taille, Type, Amorcable): >> "%OutputFilePath%"
wmic partition get Name, DiskIndex, Index, Size, Type, Bootable, PrimaryPartition /FORMAT:LIST >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo Informations sur l'etat de sante des disques (S.M.A.R.T.): >> "%OutputFilePath%"
wmic diskdrive get Model, Status /FORMAT:LIST >> "%OutputFilePath%"
echo [SECTION_FIN: Partitions de Disque] >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"

echo [SECTION_DEBUT: Processus en Cours] >> "%OutputFilePath%"
echo =================================== >> "%OutputFilePath%"
echo Liste des processus en cours (Nom, ID Processus, Utilisation Memoire): >> "%OutputFilePath%"
tasklist /FO LIST >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo Variante CSV des processus (peut etre plus facile a lire pour certains): >> "%OutputFilePath%"
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

echo [SECTION_DEBUT: Applications Installees] >> "%OutputFilePath%"
echo ======================================== >> "%OutputFilePath%"
echo Liste des applications installees (Nom, Fournisseur, Version, Date d'installation): >> "%OutputFilePath%"
wmic product get Name, Vendor, Version, InstallDate /FORMAT:LIST >> "%OutputFilePath%"
echo ATTENTION: La commande 'wmic product get' peut etre lente et consommer des ressources. >> "%OutputFilePath%"
echo [SECTION_FIN: Applications Installees] >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"

echo [SECTION_DEBUT: Services Windows] >> "%OutputFilePath%"
echo ================================= >> "%OutputFilePath%"
echo Liste des services Windows (Nom, Nom Affiche, Etat, Mode de demarrage): >> "%OutputFilePath%"
wmic service get Name, DisplayName, State, StartMode /FORMAT:LIST >> "%OutputFilePath%"
echo [SECTION_FIN: Services Windows] >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"

echo [SECTION_DEBUT: Configuration Reseau Detaille] >> "%OutputFilePath%"
echo ============================================= >> "%OutputFilePath%"
ipconfig /all >> "%OutputFilePath%"
echo [SECTION_FIN: Configuration Reseau Detaille] >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"
echo. >> "%OutputFilePath%"

echo Collecte terminee. >> "%OutputFilePath%"
echo Le fichier '%OutputFile%' a ete cree dans le repertoire: %~dp0 >> "%OutputFilePath%"
echo Vous pouvez maintenant importer ce fichier dans le formulaire de diagnostic. >> "%OutputFilePath%"

REM Afficher un message a l'utilisateur dans la console
echo.
echo ================================================================================
echo SCRIPT TERMINE
echo Les informations ont ete enregistrees dans le fichier:
echo %OutputFilePath%
echo.
echo Vous pouvez maintenant fermer cette fenetre et importer ce fichier
echo dans l'application de diagnostic.
echo ================================================================================
echo.
pause
ENDLOCAL
