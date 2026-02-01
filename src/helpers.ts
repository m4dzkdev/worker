import { VlessConfig, TrojanConfig, AddressInfo } from './interfaces';
import { CLOUDFLARE_PORTS } from './constants';

// UUID v5 generation
export function generateUUIDv5(name: string, namespace: string = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'): string {
  // Simple UUID generation based on string hash
  const hash = sha256(namespace + name);
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '5' + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + hash.substring(18, 20),
    hash.substring(20, 32)
  ].join('-');
}

// SHA-256 hash function
export async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// SHA-224 hash function for Trojan
export async function sha224(message: string): Promise<string> {
  const hash = await sha256(message);
  return hash.substring(0, 56); // SHA-224 is SHA-256 truncated to 224 bits (56 hex chars)
}

// Generate VLESS config
export async function generateVlessConfig(
  address: string,
  port: number,
  sni: string,
  path: string = '/vless-ws',
  remark: string = 'Worker-VLESS'
): Promise<VlessConfig> {
  const uuid = generateUUIDv5(sni);

  return {
    type: 'vless',
    id: uuid,
    address,
    port,
    network: 'ws',
    security: 'tls',
    sni,
    fp: 'random',
    alpn: 'h2,http/1.1',
    path,
    host: sni,
    remark
  };
}

// Generate Trojan config
export async function generateTrojanConfig(
  address: string,
  port: number,
  sni: string,
  uuid: string,
  path: string = '/trojan-ws',
  remark: string = 'Worker-Trojan'
): Promise<TrojanConfig> {
  const password = await sha224(uuid);

  return {
    type: 'trojan',
    password,
    address,
    port,
    network: 'ws',
    security: 'tls',
    sni,
    fp: 'random',
    alpn: 'h2,http/1.1',
    path,
    host: sni,
    remark
  };
}

// Encode VLESS config to URI
export function encodeVlessConfig(config: VlessConfig): string {
  const params = new URLSearchParams();

  if (config.security) params.set('security', config.security);
  if (config.sni) params.set('sni', config.sni);
  if (config.fp) params.set('fp', config.fp);
  if (config.alpn) params.set('alpn', config.alpn);
  if (config.network) params.set('type', config.network);

  if (config.network === 'ws') {
    if (config.path) params.set('path', config.path);
    if (config.host) params.set('host', config.host);
  } else if (config.network === 'grpc' && config.serviceName) {
    params.set('serviceName', config.serviceName);
  }

  params.set('encryption', 'none');

  return `vless://${config.id}@${config.address}:${config.port}?${params.toString()}#${encodeURIComponent(config.remark)}`;
}

// Encode Trojan config to URI
export function encodeTrojanConfig(config: TrojanConfig): string {
  const params = new URLSearchParams();

  if (config.security) params.set('security', config.security);
  if (config.sni) params.set('sni', config.sni);
  if (config.fp) params.set('fp', config.fp);
  if (config.alpn) params.set('alpn', config.alpn);
  if (config.network) params.set('type', config.network);

  if (config.network === 'ws') {
    if (config.path) params.set('path', config.path);
    if (config.host) params.set('host', config.host);
  } else if (config.network === 'grpc' && config.serviceName) {
    params.set('serviceName', config.serviceName);
  }

  params.set('allowInsecure', '1');

  return `trojan://${config.password}@${config.address}:${config.port}?${params.toString()}#${encodeURIComponent(config.remark)}`;
}

// Parse address string (domain.com, ip:port#remark, [ipv6]:port#remark)
export function parseAddress(addressStr: string): AddressInfo | null {
  try {
    const parts = addressStr.split('#');
    const addressPart = parts[0].trim();
    const remark = parts[1]?.trim();

    // Check for [ipv6]:port format
    const ipv6Match = addressPart.match(/^\[([^\]]+)\]:(\d+)$/);
    if (ipv6Match) {
      return {
        address: ipv6Match[1],
        port: parseInt(ipv6Match[2]),
        remark
      };
    }

    // Check for ip:port or domain:port format
    const colonIndex = addressPart.lastIndexOf(':');
    if (colonIndex > 0) {
      const address = addressPart.substring(0, colonIndex);
      const port = parseInt(addressPart.substring(colonIndex + 1));
      return { address, port, remark };
    }

    // Just domain, use random Cloudflare port
    return {
      address: addressPart,
      port: CLOUDFLARE_PORTS[Math.floor(Math.random() * CLOUDFLARE_PORTS.length)],
      remark
    };
  } catch {
    return null;
  }
}

// Get random item from array
export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Base64 encode
export function base64Encode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

// Base64 decode
export function base64Decode(str: string): string {
  return decodeURIComponent(escape(atob(str)));
}

// Generate random IP from CIDR
export function generateRandomIPFromCIDR(cidr: string): string {
  const [baseIP, prefixLength] = cidr.split('/');
  const prefix = parseInt(prefixLength);

  const ipParts = baseIP.split('.').map(part => parseInt(part));
  const hostBits = 32 - prefix;
  const maxHosts = Math.pow(2, hostBits) - 1;

  const randomHost = Math.floor(Math.random() * maxHosts) + 1;

  // Apply random host number to IP
  let result = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
  result = (result & ~maxHosts) | randomHost;

  return [
    (result >>> 24) & 255,
    (result >>> 16) & 255,
    (result >>> 8) & 255,
    result & 255
  ].join('.');
}

// Format bytes
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Validate UUID
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Random string generator
export function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
