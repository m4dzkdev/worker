// Core interfaces for worker-panel
export interface Env {
  settings: KVNamespace;
  PASSWORD?: string;
}

export interface ProxySettings {
  protocols: string[];
  maxConfigs: number;
  includeOriginal: boolean;
  includeMerged: boolean;
  cleanDomains: string[];
  alpnList: string[];
  fingerprintList: string[];
  providers: string[];
  personalConfigs: string[];
  addresses: string[];
  proxyIP: string;
  countries: string[];
  enableFragments: boolean;
  blockPorn: boolean;
}

export interface VlessConfig {
  type: 'vless';
  id: string;
  address: string;
  port: number;
  network: 'ws' | 'h2' | 'grpc';
  security: 'tls' | 'none';
  sni?: string;
  fp?: string;
  alpn?: string;
  path?: string;
  host?: string;
  serviceName?: string;
  remark: string;
  merged?: boolean;
}

export interface TrojanConfig {
  type: 'trojan';
  password: string;
  address: string;
  port: number;
  network: 'ws' | 'h2' | 'grpc';
  security: 'tls' | 'none';
  sni?: string;
  fp?: string;
  alpn?: string;
  path?: string;
  host?: string;
  remark: string;
  merged?: boolean;
}

export interface VmessConfig {
  type: 'vmess';
  id: string;
  address: string;
  port: number;
  network: 'ws' | 'h2' | 'grpc' | 'tcp';
  security: string;
  alterId?: number;
  sni?: string;
  fp?: string;
  alpn?: string;
  path?: string;
  host?: string;
  remark: string;
  merged?: boolean;
}

export type ProxyConfig = VlessConfig | TrojanConfig | VmessConfig;

export interface ClashProxy {
  name: string;
  type: 'vless' | 'trojan' | 'vmess';
  server: string;
  port: number;
  uuid?: string;
  password?: string;
  network: string;
  tls: boolean;
  'skip-cert-verify'?: boolean;
  servername?: string;
  'client-fingerprint'?: string;
  'ws-opts'?: {
    path: string;
    headers: { Host: string };
  };
  'h2-opts'?: {
    path: string;
    host: string[];
  };
  'grpc-opts'?: {
    'grpc-service-name': string;
  };
}

export interface AddressInfo {
  address: string;
  port: number;
  remark?: string;
}
