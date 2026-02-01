import { ProxyConfig } from './interfaces';
import { base64Decode } from './helpers';

export async function collectConfigs(
  providers: string[],
  maxConfigs: number,
  protocols: string[]
): Promise<ProxyConfig[]> {
  const allConfigs: ProxyConfig[] = [];

  for (const provider of providers) {
    try {
      const configs = await fetchProviderConfigs(provider);
      const filtered = configs.filter(c => protocols.includes(c.type));
      allConfigs.push(...filtered);
    } catch (error) {
      console.error(`Error fetching provider ${provider}:`, error);
    }
  }

  // Remove duplicates
  const unique = removeDuplicates(allConfigs);

  // Limit to maxConfigs
  return unique.slice(0, maxConfigs);
}

async function fetchProviderConfigs(providerUrl: string): Promise<ProxyConfig[]> {
  const response = await fetch(providerUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (contentType.includes('yaml') || text.trim().startsWith('proxies:')) {
    return parseYamlConfigs(text);
  } else if (isBase64(text.trim())) {
    return parseBase64Configs(text.trim());
  } else {
    return parseRawConfigs(text);
  }
}

function parseYamlConfigs(yaml: string): ProxyConfig[] {
  const configs: ProxyConfig[] = [];

  // Simple YAML parsing for proxies section
  const lines = yaml.split('\n');
  let inProxies = false;
  let currentProxy: any = {};

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('proxies:')) {
      inProxies = true;
      continue;
    }

    if (!inProxies) continue;

    if (trimmed.startsWith('- name:') || trimmed.startsWith('-  name:')) {
      if (currentProxy.name) {
        const config = yamlProxyToConfig(currentProxy);
        if (config) configs.push(config);
      }
      currentProxy = { name: trimmed.split('name:')[1].trim().replace(/['"]/g, '') };
    } else if (trimmed.includes(':')) {
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim().replace(/['"]/g, '');
      currentProxy[key.trim()] = value;
    }
  }

  if (currentProxy.name) {
    const config = yamlProxyToConfig(currentProxy);
    if (config) configs.push(config);
  }

  return configs;
}

function yamlProxyToConfig(proxy: any): ProxyConfig | null {
  const type = proxy.type?.toLowerCase();

  if (type === 'vless') {
    return {
      type: 'vless',
      id: proxy.uuid || '',
      address: proxy.server || '',
      port: parseInt(proxy.port) || 443,
      network: proxy.network || 'ws',
      security: proxy.tls ? 'tls' : 'none',
      sni: proxy.servername || proxy.server,
      fp: proxy['client-fingerprint'],
      alpn: proxy.alpn,
      path: proxy['ws-opts']?.path || proxy['h2-opts']?.path || '',
      host: proxy['ws-opts']?.headers?.Host || proxy['h2-opts']?.host?.[0] || '',
      serviceName: proxy['grpc-opts']?.['grpc-service-name'],
      remark: proxy.name || 'Unknown'
    };
  } else if (type === 'trojan') {
    return {
      type: 'trojan',
      password: proxy.password || '',
      address: proxy.server || '',
      port: parseInt(proxy.port) || 443,
      network: proxy.network || 'ws',
      security: proxy.tls ? 'tls' : 'none',
      sni: proxy.servername || proxy.server || proxy.sni,
      fp: proxy['client-fingerprint'],
      alpn: proxy.alpn,
      path: proxy['ws-opts']?.path || '',
      host: proxy['ws-opts']?.headers?.Host || '',
      remark: proxy.name || 'Unknown'
    };
  } else if (type === 'vmess') {
    return {
      type: 'vmess',
      id: proxy.uuid || '',
      address: proxy.server || '',
      port: parseInt(proxy.port) || 443,
      network: proxy.network || 'ws',
      security: proxy.cipher || 'auto',
      alterId: parseInt(proxy.alterId) || 0,
      sni: proxy.servername,
      fp: proxy['client-fingerprint'],
      alpn: proxy.alpn,
      path: proxy['ws-opts']?.path || '',
      host: proxy['ws-opts']?.headers?.Host || '',
      remark: proxy.name || 'Unknown'
    };
  }

  return null;
}

function parseBase64Configs(base64Text: string): ProxyConfig[] {
  try {
    const decoded = base64Decode(base64Text);
    return parseRawConfigs(decoded);
  } catch {
    return [];
  }
}

function parseRawConfigs(text: string): ProxyConfig[] {
  const configs: ProxyConfig[] = [];
  const lines = text.split('\n').filter(line => line.trim());

  for (const line of lines) {
    const config = parseProxyUri(line.trim());
    if (config) {
      configs.push(config);
    }
  }

  return configs;
}

function parseProxyUri(uri: string): ProxyConfig | null {
  try {
    if (uri.startsWith('vless://')) {
      return parseVlessUri(uri);
    } else if (uri.startsWith('trojan://')) {
      return parseTrojanUri(uri);
    } else if (uri.startsWith('vmess://')) {
      return parseVmessUri(uri);
    }
  } catch (error) {
    console.error('Error parsing URI:', error);
  }
  return null;
}

function parseVlessUri(uri: string): ProxyConfig | null {
  const match = uri.match(/^vless:\/\/([^@]+)@([^:]+):(\d+)\?(.+)#(.*)$/);
  if (!match) return null;

  const [, id, address, port, query, remark] = match;
  const params = new URLSearchParams(query);

  return {
    type: 'vless',
    id,
    address,
    port: parseInt(port),
    network: (params.get('type') || 'ws') as any,
    security: (params.get('security') || 'tls') as any,
    sni: params.get('sni') || params.get('host'),
    fp: params.get('fp') || undefined,
    alpn: params.get('alpn') || undefined,
    path: params.get('path') || undefined,
    host: params.get('host') || undefined,
    serviceName: params.get('serviceName') || undefined,
    remark: decodeURIComponent(remark) || 'VLESS'
  };
}

function parseTrojanUri(uri: string): ProxyConfig | null {
  const match = uri.match(/^trojan:\/\/([^@]+)@([^:]+):(\d+)\?(.+)#(.*)$/);
  if (!match) return null;

  const [, password, address, port, query, remark] = match;
  const params = new URLSearchParams(query);

  return {
    type: 'trojan',
    password,
    address,
    port: parseInt(port),
    network: (params.get('type') || 'ws') as any,
    security: (params.get('security') || 'tls') as any,
    sni: params.get('sni') || params.get('host'),
    fp: params.get('fp') || undefined,
    alpn: params.get('alpn') || undefined,
    path: params.get('path') || undefined,
    host: params.get('host') || undefined,
    remark: decodeURIComponent(remark) || 'Trojan'
  };
}

function parseVmessUri(uri: string): ProxyConfig | null {
  try {
    const base64Part = uri.replace('vmess://', '');
    const decoded = base64Decode(base64Part);
    const json = JSON.parse(decoded);

    return {
      type: 'vmess',
      id: json.id || '',
      address: json.add || '',
      port: parseInt(json.port) || 443,
      network: json.net || 'ws',
      security: json.scy || 'auto',
      alterId: parseInt(json.aid) || 0,
      sni: json.sni || json.host,
      path: json.path || '/',
      host: json.host || '',
      remark: json.ps || 'VMess'
    };
  } catch {
    return null;
  }
}

function removeDuplicates(configs: ProxyConfig[]): ProxyConfig[] {
  const seen = new Set<string>();
  const unique: ProxyConfig[] = [];

  for (const config of configs) {
    const key = `${config.type}:${config.address}:${config.port}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(config);
    }
  }

  return unique;
}

function isBase64(str: string): boolean {
  try {
    return btoa(atob(str)) === str;
  } catch {
    return false;
  }
}
