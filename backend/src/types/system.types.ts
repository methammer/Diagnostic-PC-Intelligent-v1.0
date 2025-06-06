// Explicitly define UserInfo to match models/diagnosticTask.model.ts
export interface UserInfo {
  username: string;
  uid: number;
  gid: number;
  shell: string | null;
  homedir: string;
}

// Explicitly define CpuInfo to match models/diagnosticTask.model.ts
// Note the casing: 'CpuInfo' not 'CPUInfo' from the 'os' module.
export interface CpuInfo {
  model: string;
  speed: number;
  times: {
    user: number;
    nice: number;
    sys: number;
    idle: number;
    irq: number;
  };
}

// Explicitly define NetworkInterfaceInfo to match models/diagnosticTask.model.ts
export interface NetworkInterfaceInfo {
  address: string;
  netmask: string;
  family: string; // 'IPv4' or 'IPv6'
  mac: string;
  internal: boolean;
  cidr: string | null;
}

// This SystemInfo interface uses the explicitly defined sub-types above
export interface SystemInfo {
  timestamp: string;
  platform: string;
  release: string;
  arch: string;
  hostname: string;
  userInfo?: UserInfo; // Uses the explicitly defined UserInfo
  uptime: number;
  totalMemoryMB: string | number;
  freeMemoryMB: string | number;
  cpuCount: number;
  cpus?: CpuInfo[]; // Uses the explicitly defined CpuInfo (correct casing)
  networkInterfaces?: { [key: string]: NetworkInterfaceInfo[] }; // Uses the explicitly defined NetworkInterfaceInfo
  diskInfo?: any;
}

export const defaultSystemInfo: SystemInfo = {
  timestamp: new Date(0).toISOString(),
  platform: "N/A",
  release: "N/A",
  arch: "N/A",
  hostname: "N/A",
  userInfo: { // This structure matches the new UserInfo definition
    uid: -1,
    gid: -1,
    username: "N/A",
    homedir: "N/A",
    shell: null,
  },
  uptime: 0,
  totalMemoryMB: "N/A",
  freeMemoryMB: "N/A",
  cpuCount: 0,
  cpus: [], // Default cpus array is compatible with CpuInfo[]
  networkInterfaces: {},
  diskInfo: "N/A",
};
