import os from 'os';

async function collectSystemInfo() {
  const cpus = os.cpus();
  const networkInterfaces = os.networkInterfaces();

  const simplifiedCpus = cpus.map(cpu => ({
    model: cpu.model,
    speed: cpu.speed,
  }));
  const simplifiedNetwork = {};
  for (const [key, value] of Object.entries(networkInterfaces)) {
    if (value) {
      simplifiedNetwork[key] = value.map(iface => ({
        address: iface.address,
        netmask: iface.netmask,
        family: iface.family,
        mac: iface.mac,
        internal: iface.internal,
      }));
    }
  }

  const rawTotalMem = os.totalmem();
  const rawFreeMem = os.freemem();

  let totalMemoryMB = "N/A";
  let freeMemoryMB = "N/A";

  if (typeof rawTotalMem === 'number' && rawTotalMem > 0) {
    totalMemoryMB = (rawTotalMem / (1024 * 1024)).toFixed(2);
  } else {
    // console.warn("WARN: os.totalmem() did not return a valid positive number.");
  }

  if (typeof rawFreeMem === 'number' && rawFreeMem >= 0) {
    freeMemoryMB = (rawFreeMem / (1024 * 1024)).toFixed(2);
  } else {
    // console.warn("WARN: os.freemem() did not return a valid number.");
  }

  return {
    timestamp: new Date().toISOString(),
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    hostname: os.hostname(),
    userInfo: {
      username: os.userInfo().username,
      homedir: os.userInfo().homedir,
    },
    uptime: os.uptime(),
    totalMemoryMB: totalMemoryMB,
    freeMemoryMB: freeMemoryMB,
    cpuCount: simplifiedCpus.length,
    cpus: simplifiedCpus,
    networkInterfaces: simplifiedNetwork,
    diskInfo: "Les informations détaillées sur l'espace disque (total, libre, utilisation) ne sont pas accessibles de manière fiable via les modules Node.js standards dans cet environnement. Pour un diagnostic complet, veuillez vérifier manuellement l'état des disques avec les outils système (ex: 'Gestion des disques' ou 'Get-Volume' sur Windows, 'df -h' sur Linux/macOS).",
  };
}

async function main() {
  console.log('Démarrage de l\'agent de diagnostic PC pour la collecte d\'informations...');

  try {
    const systemInfo = await collectSystemInfo();
    console.log('\nInformations système collectées (copiez le JSON ci-dessous) :\n');
    console.log(JSON.stringify(systemInfo, null, 2));
    console.log('\n\nCopiez le bloc JSON ci-dessus et collez-le dans le formulaire de diagnostic sur la page web.');
    console.log('\nAgent de collecte d\'informations terminé.');

  } catch (error) {
    console.error('L\'agent de collecte a rencontré une erreur critique:', error.message);
    if (error.message.includes('os.userInfo is not a function')) {
      console.error('Il semble que vous exécutiez ce script dans un environnement où os.userInfo() n\'est pas disponible (par exemple, une ancienne version de Node.js ou un environnement restreint).');
      console.error('Essayez de commenter la section userInfo dans la fonction collectSystemInfo si le problème persiste.');
    }
    // Pour ne pas sortir immédiatement et permettre de voir le JSON partiel si certaines infos ont été collectées
    // process.exit(1); 
  }
}

main();
