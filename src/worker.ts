import { Env } from './interfaces';
import { renderPanel, handlePanelPost } from './panel';
import { renderLogin, handleLogin, requireAuth } from './auth';
import { handleVlessWebSocket } from './vless';
import { handleTrojanWebSocket } from './trojan';
import {
  generateVlessConfig,
  generateTrojanConfig,
  encodeVlessConfig,
  encodeTrojanConfig,
  parseAddress,
  getRandomItem,
  generateUUIDv5
} from './helpers';
import { collectConfigs } from './collector';
import {
  generateBase64Subscription,
  generateRawSubscription,
  generateClashSubscription
} from './subscription';
import { CLOUDFLARE_PORTS, DEFAULT_PROXY_IPS } from './constants';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle login
    if (path === '/login') {
      if (request.method === 'GET') {
        return renderLogin();
      } else if (request.method === 'POST') {
        return handleLogin(request, env);
      }
    }

    // Check authentication for protected routes
    const isProtected = path === '/' || path.startsWith('/sub') || path.startsWith('/clash') ||
                       path.startsWith('/raw') || path === '/editor' || path === '/bestip';

    if (isProtected) {
      const isAuthed = await requireAuth(request, env);
      if (!isAuthed) {
        return new Response(null, {
          status: 302,
          headers: { 'Location': '/login' }
        });
      }
    }

    // Route handling
    try {
      switch (path) {
        case '/':
          if (request.method === 'GET') {
            const token = url.searchParams.get('token');
            return renderPanel(request, env, token || undefined);
          } else if (request.method === 'POST') {
            return handlePanelPost(request, env);
          }
          break;

        case '/sub':
          return handleSubscription(request, env, 'base64');

        case '/clash':
          return handleSubscription(request, env, 'clash');

        case '/raw':
          return handleSubscription(request, env, 'raw');

        case '/vless-ws':
          return handleVlessWebSocket(request, await getWorkerUUID(env));

        case '/trojan-ws':
          const uuid = await getWorkerUUID(env);
          return handleTrojanWebSocket(request, uuid);

        case '/editor':
          return renderAddressEditor(env, url.searchParams.get('token'));

        case '/bestip':
          return renderBestIPFinder(url.searchParams.get('token'));

        default:
          // Handle address editor save
          if (path === '/editor/save' && request.method === 'POST') {
            return handleEditorSave(request, env);
          }

          return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error: ' + (error as Error).message, { status: 500 });
    }

    return new Response('Method Not Allowed', { status: 405 });
  }
};

async function handleSubscription(request: Request, env: Env, format: 'base64' | 'clash' | 'raw'): Promise<Response> {
  // Load settings
  const settings = await loadSettings(env);

  // Generate built-in configs
  const builtInConfigs = await generateBuiltInConfigs(env, settings);

  // Collect external configs
  let externalConfigs: any[] = [];
  if (settings.providers.length > 0) {
    externalConfigs = await collectConfigs(
      settings.providers,
      settings.maxConfigs - builtInConfigs.length,
      settings.protocols
    );
  }

  // Add personal configs
  const personalConfigs: any[] = [];
  for (const configUri of settings.personalConfigs) {
    // Parse personal config URIs
    // This would need proper parsing logic
    personalConfigs.push({ remark: 'Personal', type: 'vless' }); // Placeholder
  }

  // Combine all configs
  let allConfigs = [...builtInConfigs];

  if (settings.includeOriginal) {
    allConfigs.push(...externalConfigs);
  }

  if (settings.includeMerged) {
    // TODO: Implement config merging logic
  }

  allConfigs.push(...personalConfigs);

  // Limit to maxConfigs
  allConfigs = allConfigs.slice(0, settings.maxConfigs);

  // Generate subscription
  let content: string;
  let contentType: string;

  switch (format) {
    case 'base64':
      content = generateBase64Subscription(allConfigs);
      contentType = 'text/plain; charset=utf-8';
      break;
    case 'clash':
      content = generateClashSubscription(allConfigs);
      contentType = 'text/yaml; charset=utf-8';
      break;
    case 'raw':
      content = generateRawSubscription(allConfigs);
      contentType = 'text/plain; charset=utf-8';
      break;
  }

  return new Response(content, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="subscription.${format === 'clash' ? 'yaml' : 'txt'}"`
    }
  });
}

async function generateBuiltInConfigs(env: Env, settings: any): Promise<any[]> {
  const configs: any[] = [];

  if (!settings.protocols.includes('built-in')) {
    return configs;
  }

  const hostname = 'your-worker.workers.dev'; // This should come from request
  const addresses = settings.addresses.length > 0 ? settings.addresses : [hostname];

  let index = 1;

  for (const addressStr of addresses) {
    const addressInfo = parseAddress(addressStr);
    if (!addressInfo) continue;

    const fingerprint = getRandomItem(settings.fingerprintList);
    const alpn = getRandomItem(settings.alpnList);

    // Generate VLESS config
    const vlessConfig = await generateVlessConfig(
      addressInfo.address,
      addressInfo.port,
      hostname,
      '/vless-ws?ed=2048',
      `${index++}-VLESS-${addressInfo.remark || addressInfo.address}`
    );
    vlessConfig.fp = fingerprint;
    vlessConfig.alpn = alpn;
    configs.push(vlessConfig);

    // Generate Trojan config
    const uuid = await getWorkerUUID(env);
    const trojanConfig = await generateTrojanConfig(
      addressInfo.address,
      addressInfo.port,
      hostname,
      uuid,
      '/trojan-ws?ed=2048',
      `${index++}-Trojan-${addressInfo.remark || addressInfo.address}`
    );
    trojanConfig.fp = fingerprint;
    trojanConfig.alpn = alpn;
    configs.push(trojanConfig);
  }

  return configs;
}

async function loadSettings(env: Env) {
  const protocols = (await env.settings.get('protocols')) || 'vless,trojan,built-in';
  const maxConfigs = parseInt((await env.settings.get('maxConfigs')) || '200');
  const includeOriginal = (await env.settings.get('includeOriginal')) !== 'false';
  const includeMerged = (await env.settings.get('includeMerged')) !== 'false';
  const cleanDomains = (await env.settings.get('cleanDomains')) || '';
  const alpnList = (await env.settings.get('alpnList')) || 'h3,h2,http/1.1';
  const fingerprintList = (await env.settings.get('fingerprintList')) || 'chrome,firefox,safari,random';
  const providers = (await env.settings.get('providers')) || '';
  const personalConfigs = (await env.settings.get('personalConfigs')) || '';
  const addresses = (await env.settings.get('addresses')) || '';
  const proxyIP = (await env.settings.get('proxyIP')) || '';
  const countries = (await env.settings.get('countries')) || '';
  const enableFragments = (await env.settings.get('enableFragments')) === 'true';
  const blockPorn = (await env.settings.get('blockPorn')) === 'true';

  return {
    protocols: protocols.split(',').map(p => p.trim()),
    maxConfigs,
    includeOriginal,
    includeMerged,
    cleanDomains: cleanDomains ? cleanDomains.split('\n').filter(d => d.trim()) : [],
    alpnList: alpnList.split(',').map(a => a.trim()),
    fingerprintList: fingerprintList.split(',').map(f => f.trim()),
    providers: providers ? providers.split('\n').filter(p => p.trim()) : [],
    personalConfigs: personalConfigs ? personalConfigs.split('\n').filter(c => c.trim()) : [],
    addresses: addresses ? addresses.split('\n').filter(a => a.trim()) : [],
    proxyIP,
    countries: countries ? countries.split(',').map(c => c.trim()) : [],
    enableFragments,
    blockPorn
  };
}

async function getWorkerUUID(env: Env): Promise<string> {
  let uuid = await env.settings.get('workerUUID');
  if (!uuid) {
    uuid = await generateUUIDv5('worker-panel-' + Date.now());
    await env.settings.put('workerUUID', uuid);
  }
  return uuid;
}

function renderAddressEditor(env: Env, token: string | null): Promise<Response> {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Address Editor - Worker Panel</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { background: #1a1d29; color: #e6e6e6; font-family: 'Inter', sans-serif; padding: 2rem; }
        .editor-container { max-width: 1000px; margin: 0 auto; }
        .card { background: #242730; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 2rem; }
        textarea { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: #e6e6e6;
                   border-radius: 8px; min-height: 400px; font-family: 'Courier New', monospace; }
        .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none;
                       padding: 0.75rem 2rem; border-radius: 8px; font-weight: 600; }
    </style>
</head>
<body>
    <div class="editor-container">
        <div class="card">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2><i class="fas fa-edit"></i> Address Editor</h2>
                <a href="/${token ? '?token=' + token : ''}" class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-left"></i> Back
                </a>
            </div>
            <form id="editor-form">
                <div class="mb-3">
                    <label class="form-label">Addresses (one per line)</label>
                    <textarea class="form-control" id="addresses" name="addresses" placeholder="cdn.example.com
192.0.2.1:2087#MyServer
[2001:db8::1]:443#IPv6Server"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> Save Changes
                </button>
                <span id="status" class="ms-3"></span>
            </form>
        </div>
    </div>
    <script>
        // Load addresses
        // Auto-save functionality
        // This would connect to the /editor/save endpoint
    </script>
</body>
</html>`;

  return Promise.resolve(new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  }));
}

function renderBestIPFinder(token: string | null): Promise<Response> {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Best IP Finder - Worker Panel</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { background: #1a1d29; color: #e6e6e6; font-family: 'Inter', sans-serif; padding: 2rem; }
        .finder-container { max-width: 1200px; margin: 0 auto; }
        .card { background: #242730; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 2rem; }
        .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none;
                       padding: 0.75rem 2rem; border-radius: 8px; font-weight: 600; }
        .ip-result { background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; margin-bottom: 0.5rem;
                     display: flex; justify-content: space-between; align-items: center; }
    </style>
</head>
<body>
    <div class="finder-container">
        <div class="card">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2><i class="fas fa-tachometer-alt"></i> Best IP Finder</h2>
                <a href="/${token ? '?token=' + token : ''}" class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-left"></i> Back
                </a>
            </div>
            <div class="mb-4">
                <button id="start-scan" class="btn btn-primary">
                    <i class="fas fa-play"></i> Start Scanning
                </button>
            </div>
            <div id="results"></div>
            <div id="progress" class="mt-3"></div>
        </div>
    </div>
    <script>
        // IP scanning functionality
        // Speed test implementation
        // This would test Cloudflare IPs and rank them by speed
    </script>
</body>
</html>`;

  return Promise.resolve(new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  }));
}

async function handleEditorSave(request: Request, env: Env): Promise<Response> {
  const formData = await request.formData();
  const addresses = formData.get('addresses') as string;

  await env.settings.put('addresses', addresses);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
