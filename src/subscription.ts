import { ProxyConfig, ClashProxy } from './interfaces';
import { base64Encode, encodeVlessConfig, encodeTrojanConfig } from './helpers';

export function generateBase64Subscription(configs: ProxyConfig[]): string {
  const uris = configs.map(config => configToUri(config));
  return base64Encode(uris.join('\n'));
}

export function generateRawSubscription(configs: ProxyConfig[]): string {
  const uris = configs.map(config => configToUri(config));
  return uris.join('\n');
}

export function generateClashSubscription(configs: ProxyConfig[]): string {
  const clashProxies = configs.map(config => configToClash(config));

  const yaml = `# Worker Panel - Clash Subscription
# Generated: ${new Date().toISOString()}

mixed-port: 7890
allow-lan: true
mode: rule
log-level: info
external-controller: 127.0.0.1:9090

dns:
  enable: true
  listen: 0.0.0.0:53
  enhanced-mode: fake-ip
  nameserver:
    - 1.1.1.1
    - 8.8.8.8
  fallback:
    - https://1.1.1.1/dns-query
    - https://8.8.8.8/dns-query

proxies:
${clashProxies.map(p => yamlStringify(p, 2)).join('\n')}

proxy-groups:
  - name: "Auto Select"
    type: url-test
    proxies:
${clashProxies.map(p => `      - "${p.name}"`).join('\n')}
    url: 'https://www.gstatic.com/generate_204'
    interval: 300

  - name: "Fallback"
    type: fallback
    proxies:
${clashProxies.map(p => `      - "${p.name}"`).join('\n')}
    url: 'https://www.gstatic.com/generate_204'
    interval: 300

  - name: "Load Balance"
    type: load-balance
    proxies:
${clashProxies.map(p => `      - "${p.name}"`).join('\n')}
    url: 'https://www.gstatic.com/generate_204'
    interval: 300

rules:
  - DOMAIN-SUFFIX,google.com,Auto Select
  - DOMAIN-SUFFIX,youtube.com,Auto Select
  - DOMAIN-SUFFIX,github.com,Auto Select
  - DOMAIN-SUFFIX,cloudflare.com,Auto Select
  - DOMAIN-KEYWORD,google,Auto Select
  - GEOIP,CN,DIRECT
  - MATCH,Auto Select
`;

  return yaml;
}

function configToUri(config: ProxyConfig): string {
  if (config.type === 'vless') {
    return encodeVlessConfig(config);
  } else if (config.type === 'trojan') {
    return encodeTrojanConfig(config);
  } else if (config.type === 'vmess') {
    return encodeVmessConfig(config);
  }
  return '';
}

function encodeVmessConfig(config: any): string {
  const vmessObj = {
    v: '2',
    ps: config.remark,
    add: config.address,
    port: config.port.toString(),
    id: config.id,
    aid: config.alterId?.toString() || '0',
    net: config.network,
    type: 'none',
    host: config.host || '',
    path: config.path || '/',
    tls: config.security === 'tls' ? 'tls' : '',
    sni: config.sni || '',
    scy: config.security || 'auto'
  };

  return 'vmess://' + base64Encode(JSON.stringify(vmessObj));
}

function configToClash(config: ProxyConfig): ClashProxy {
  const base: any = {
    name: config.remark,
    type: config.type,
    server: config.address,
    port: config.port,
    tls: config.security === 'tls',
    'skip-cert-verify': true
  };

  if (config.sni) {
    base.servername = config.sni;
  }

  if (config.fp) {
    base['client-fingerprint'] = config.fp;
  }

  if (config.type === 'vless') {
    base.uuid = config.id;
    base.network = config.network;

    if (config.network === 'ws') {
      base['ws-opts'] = {
        path: config.path || '/',
        headers: { Host: config.host || config.address }
      };
    } else if (config.network === 'grpc') {
      base['grpc-opts'] = {
        'grpc-service-name': config.serviceName || ''
      };
    } else if (config.network === 'h2') {
      base['h2-opts'] = {
        path: config.path || '/',
        host: [config.host || config.address]
      };
    }
  } else if (config.type === 'trojan') {
    base.password = config.password;
    base.network = config.network;

    if (config.network === 'ws') {
      base['ws-opts'] = {
        path: config.path || '/',
        headers: { Host: config.host || config.address }
      };
    } else if (config.network === 'grpc') {
      base['grpc-opts'] = {
        'grpc-service-name': config.serviceName || ''
      };
    }
  } else if (config.type === 'vmess') {
    base.uuid = config.id;
    base.alterId = config.alterId || 0;
    base.cipher = config.security || 'auto';
    base.network = config.network;

    if (config.network === 'ws') {
      base['ws-opts'] = {
        path: config.path || '/',
        headers: { Host: config.host || config.address }
      };
    } else if (config.network === 'grpc') {
      base['grpc-opts'] = {
        'grpc-service-name': config.serviceName || ''
      };
    }
  }

  return base;
}

function yamlStringify(obj: any, indent: number = 0): string {
  const spaces = ' '.repeat(indent);
  let result = `${spaces}- `;
  const keys = Object.keys(obj);

  result += `name: "${obj.name}"\n`;

  for (const key of keys) {
    if (key === 'name') continue;

    const value = obj[key];

    if (typeof value === 'object' && !Array.isArray(value)) {
      result += `${spaces}  ${key}:\n`;
      for (const subKey of Object.keys(value)) {
        const subValue = value[subKey];
        if (typeof subValue === 'object') {
          result += `${spaces}    ${subKey}:\n`;
          if (Array.isArray(subValue)) {
            for (const item of subValue) {
              result += `${spaces}      - ${item}\n`;
            }
          } else {
            for (const k of Object.keys(subValue)) {
              result += `${spaces}      ${k}: ${subValue[k]}\n`;
            }
          }
        } else {
          result += `${spaces}    ${subKey}: ${subValue}\n`;
        }
      }
    } else if (typeof value === 'boolean') {
      result += `${spaces}  ${key}: ${value}\n`;
    } else if (typeof value === 'number') {
      result += `${spaces}  ${key}: ${value}\n`;
    } else {
      result += `${spaces}  ${key}: ${value}\n`;
    }
  }

  return result;
}
