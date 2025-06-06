@echo off
echo Collecte des informations systeme avancees pour Windows...
echo Veuillez patienter, cela peut prendre quelques instants.
echo.

echo [SECTION_DEBUT: Pilotes Systemes]
echo ==================================
echo Liste des pilotes systemes (nom, type, date du lien):
driverquery /FO LIST
echo.
echo Variante CSV des pilotes (peut etre plus facile a lire pour certains):
driverquery /FO CSV
echo [SECTION_FIN: Pilotes Systemes]
echo.
echo.

echo [SECTION_DEBUT: Partitions de Disque]
echo =====================================
echo Informations sur les disques logiques (Nom, Description, Espace Libre, Taille, Systeme de fichiers, Nom Volume):
wmic logicaldisk get Name, Description, FreeSpace, Size, FileSystem, VolumeName /FORMAT:LIST
echo.
echo Informations sur les disques physiques (Modele, Taille):
wmic diskdrive get Model, Size, InterfaceType /FORMAT:LIST
echo [SECTION_FIN: Partitions de Disque]
echo.
echo.

echo [SECTION_DEBUT: Processus en Cours]
echo ===================================
echo Liste des processus en cours (Nom, ID Processus, Utilisation Memoire):
tasklist /FO LIST
echo.
echo Variante CSV des processus (peut etre plus facile a lire pour certains):
tasklist /FO CSV
echo [SECTION_FIN: Processus en Cours]
echo.
echo.

echo [SECTION_DEBUT: Applications Installees]
echo ========================================
echo Liste des applications installees (Nom, Fournisseur, Version, Date d'installation):
wmic product get Name, Vendor, Version, InstallDate /FORMAT:LIST
echo ATTENTION: La commande 'wmic product get' peut etre lente et consommer des ressources.
echo [SECTION_FIN: Applications Installees]
echo.
echo.

echo [SECTION_DEBUT: Services Windows]
echo =================================
echo Liste des services Windows (Nom, Nom Affiche, Etat, Mode de demarrage):
wmic service get Name, DisplayName, State, StartMode /FORMAT:LIST
echo [SECTION_FIN: Services Windows]
echo.
echo.

echo Collecte terminee. Copiez tout le texte ci-dessus (a partir de "[SECTION_DEBUT: Pilotes Systemes]")
echo et collez-le dans le champ approprie du formulaire de diagnostic.
echo.
pause
