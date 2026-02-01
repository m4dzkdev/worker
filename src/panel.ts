import { Env } from './interfaces';
import { AVAILABLE_COUNTRIES, DEFAULT_ALPN_LIST, DEFAULT_FINGERPRINTS, SUPPORTED_PROTOCOLS } from './constants';

export async function renderPanel(request: Request, env: Env, token?: string): Promise<Response> {
  const url = new URL(request.url);
  const hostname = url.hostname;

  // Load current settings from KV
  const settings = await loadSettings(env);

  const tokenParam = token ? `?token=${token}` : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Worker Panel - Proxy Configuration Manager</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        :root {
            --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            --success-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            --dark-bg: #1a1d29;
            --card-bg: #242730;
            --text-muted: #a8b2d1;
        }

        body {
            background: var(--dark-bg);
            color: #e6e6e6;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            min-height: 100vh;
        }

        .hero-section {
            background: var(--primary-gradient);
            padding: 3rem 0;
            margin-bottom: 2rem;
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        }

        .hero-section h1 {
            font-weight: 700;
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }

        .hero-section p {
            opacity: 0.9;
            font-size: 1.1rem;
        }

        .card {
            background: var(--card-bg);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            margin-bottom: 1.5rem;
        }

        .card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(102, 126, 234, 0.3);
        }

        .card-header {
            background: rgba(102, 126, 234, 0.1);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding: 1.25rem;
            border-radius: 16px 16px 0 0 !important;
        }

        .card-header h5 {
            margin: 0;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .subscription-card {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
            border: 2px solid rgba(102, 126, 234, 0.3);
            padding: 1.5rem;
            border-radius: 12px;
            margin-bottom: 1rem;
        }

        .subscription-card h6 {
            color: #667eea;
            font-weight: 600;
            margin-bottom: 1rem;
        }

        .subscription-link {
            background: rgba(0, 0, 0, 0.3);
            padding: 0.75rem;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
            word-break: break-all;
            margin-bottom: 0.75rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-copy {
            background: var(--primary-gradient);
            border: none;
            padding: 0.5rem 1.5rem;
            border-radius: 8px;
            font-weight: 500;
            transition: all 0.3s ease;
        }

        .btn-copy:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .form-control, .form-select {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #e6e6e6;
            border-radius: 8px;
            padding: 0.75rem;
        }

        .form-control:focus, .form-select:focus {
            background: rgba(0, 0, 0, 0.4);
            border-color: #667eea;
            color: #e6e6e6;
            box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }

        .form-check-input {
            background-color: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .form-check-input:checked {
            background-color: #667eea;
            border-color: #667eea;
        }

        .btn-primary {
            background: var(--primary-gradient);
            border: none;
            padding: 0.75rem 2rem;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .btn-outline-secondary {
            border: 2px solid rgba(255, 255, 255, 0.2);
            color: #e6e6e6;
            border-radius: 8px;
            padding: 0.75rem 1.5rem;
            font-weight: 500;
        }

        .btn-outline-secondary:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.3);
            color: #fff;
        }

        .protocol-badge {
            background: rgba(102, 126, 234, 0.2);
            color: #a8b4f5;
            padding: 0.35rem 0.75rem;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 600;
            display: inline-block;
            margin: 0.25rem;
        }

        .feature-icon {
            width: 48px;
            height: 48px;
            background: var(--primary-gradient);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            margin-bottom: 1rem;
        }

        label {
            font-weight: 500;
            color: var(--text-muted);
            margin-bottom: 0.5rem;
        }

        .alert {
            border-radius: 12px;
            border: none;
        }

        .footer {
            margin-top: 3rem;
            padding: 2rem 0;
            text-align: center;
            color: var(--text-muted);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .card {
            animation: fadeIn 0.5s ease-out;
        }
    </style>
</head>
<body>
    <div class="hero-section">
        <div class="container">
            <div class="text-center text-white">
                <h1><i class="fas fa-network-wired"></i> Worker Panel</h1>
                <p>Advanced VLESS & Trojan Proxy Configuration Manager</p>
            </div>
        </div>
    </div>

    <div class="container">
        <!-- Subscription Links Section -->
        <div class="card">
            <div class="card-header">
                <h5><i class="fas fa-link"></i> Subscription Links</h5>
            </div>
            <div class="card-body">
                <div class="subscription-card">
                    <h6><i class="fas fa-code"></i> Base64 Subscription</h6>
                    <div class="subscription-link" id="sub-link">https://${hostname}/sub${tokenParam}</div>
                    <button class="btn btn-copy btn-sm" onclick="copyToClipboard('sub-link')">
                        <i class="fas fa-copy"></i> Copy Link
                    </button>
                </div>

                <div class="subscription-card">
                    <h6><i class="fab fa-github-alt"></i> Clash Subscription</h6>
                    <div class="subscription-link" id="clash-link">https://${hostname}/clash${tokenParam}</div>
                    <button class="btn btn-copy btn-sm" onclick="copyToClipboard('clash-link')">
                        <i class="fas fa-copy"></i> Copy Link
                    </button>
                </div>

                <div class="subscription-card">
                    <h6><i class="fas fa-file-alt"></i> Raw Subscription</h6>
                    <div class="subscription-link" id="raw-link">https://${hostname}/raw${tokenParam}</div>
                    <button class="btn btn-copy btn-sm" onclick="copyToClipboard('raw-link')">
                        <i class="fas fa-copy"></i> Copy Link
                    </button>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="card">
            <div class="card-header">
                <h5><i class="fas fa-bolt"></i> Quick Actions</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <a href="/editor${tokenParam}" class="btn btn-outline-secondary w-100">
                            <i class="fas fa-edit"></i> Address Editor
                        </a>
                    </div>
                    <div class="col-md-6 mb-3">
                        <a href="/bestip${tokenParam}" class="btn btn-outline-secondary w-100">
                            <i class="fas fa-tachometer-alt"></i> Best IP Finder
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Configuration Form -->
        <form method="POST" action="/${tokenParam}">
            <!-- Protocol Selection -->
            <div class="card">
                <div class="card-header">
                    <h5><i class="fas fa-shield-alt"></i> Protocol Configuration</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        ${SUPPORTED_PROTOCOLS.map(protocol => `
                        <div class="col-md-3 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" name="protocols" value="${protocol}"
                                    id="protocol-${protocol}" ${settings.protocols.includes(protocol) ? 'checked' : ''}>
                                <label class="form-check-label" for="protocol-${protocol}">
                                    ${protocol.toUpperCase()}
                                </label>
                            </div>
                        </div>
                        `).join('')}
                        <div class="col-md-3 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" name="protocols" value="built-in"
                                    id="protocol-builtin" ${settings.protocols.includes('built-in') ? 'checked' : ''}>
                                <label class="form-check-label" for="protocol-builtin">
                                    Built-in (VLESS+Trojan)
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- General Settings -->
            <div class="card">
                <div class="card-header">
                    <h5><i class="fas fa-cog"></i> General Settings</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="maxConfigs">Max Configurations</label>
                            <input type="number" class="form-control" name="maxConfigs" id="maxConfigs"
                                min="50" value="${settings.maxConfigs}" required>
                            <small class="text-muted">Minimum: 50, Default: 200</small>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="proxyIP">Proxy IP</label>
                            <input type="text" class="form-control" name="proxyIP" id="proxyIP"
                                value="${settings.proxyIP}" placeholder="e.g., cdn.example.com">
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" name="includeOriginal"
                                    id="includeOriginal" ${settings.includeOriginal ? 'checked' : ''}>
                                <label class="form-check-label" for="includeOriginal">
                                    Include Original Configs
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" name="includeMerged"
                                    id="includeMerged" ${settings.includeMerged ? 'checked' : ''}>
                                <label class="form-check-label" for="includeMerged">
                                    Include Merged Configs
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" name="enableFragments"
                                    id="enableFragments" ${settings.enableFragments ? 'checked' : ''}>
                                <label class="form-check-label" for="enableFragments">
                                    Enable Fragments (DPI Bypass)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" name="blockPorn"
                                    id="blockPorn" ${settings.blockPorn ? 'checked' : ''}>
                                <label class="form-check-label" for="blockPorn">
                                    Block Adult Content
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Advanced Settings -->
            <div class="card">
                <div class="card-header">
                    <h5><i class="fas fa-sliders-h"></i> Advanced Settings</h5>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label for="alpnList">ALPN List (comma-separated)</label>
                        <input type="text" class="form-control" name="alpnList" id="alpnList"
                            value="${settings.alpnList.join(', ')}" placeholder="h3, h2, http/1.1">
                        <small class="text-muted">Application-Layer Protocol Negotiation</small>
                    </div>

                    <div class="mb-3">
                        <label for="fingerprintList">Fingerprint List (comma-separated)</label>
                        <input type="text" class="form-control" name="fingerprintList" id="fingerprintList"
                            value="${settings.fingerprintList.join(', ')}"
                            placeholder="chrome, firefox, safari, edge, random">
                        <small class="text-muted">TLS Client Fingerprints</small>
                    </div>

                    <div class="mb-3">
                        <label for="cleanDomains">Clean Domains (one per line)</label>
                        <textarea class="form-control" name="cleanDomains" id="cleanDomains" rows="3"
                            placeholder="cdn.example.com&#10;proxy.example.net">${settings.cleanDomains.join('\n')}</textarea>
                        <small class="text-muted">Domains used for tunneling/masquerading</small>
                    </div>

                    <div class="mb-3">
                        <label for="countries">Allowed Countries (comma-separated country codes)</label>
                        <input type="text" class="form-control" name="countries" id="countries"
                            value="${settings.countries.join(', ')}" placeholder="US, GB, DE, FR, NL">
                        <small class="text-muted">Leave empty for all countries. Available: ${AVAILABLE_COUNTRIES.join(', ')}</small>
                    </div>
                </div>
            </div>

            <!-- Config Providers -->
            <div class="card">
                <div class="card-header">
                    <h5><i class="fas fa-database"></i> Configuration Providers</h5>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label for="providers">Provider URLs (one per line)</label>
                        <textarea class="form-control" name="providers" id="providers" rows="4"
                            placeholder="https://example.com/configs.txt&#10;https://another.com/subs.yaml">${settings.providers.join('\n')}</textarea>
                        <small class="text-muted">External configuration sources</small>
                    </div>

                    <div class="mb-3">
                        <label for="personalConfigs">Personal Configs (one per line)</label>
                        <textarea class="form-control" name="personalConfigs" id="personalConfigs" rows="4"
                            placeholder="vless://uuid@server:port?...&#10;trojan://password@server:port?...">${settings.personalConfigs.join('\n')}</textarea>
                        <small class="text-muted">Your custom proxy configurations</small>
                    </div>
                </div>
            </div>

            <!-- Address Pool -->
            <div class="card">
                <div class="card-header">
                    <h5><i class="fas fa-server"></i> Address Pool</h5>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label for="addresses">Addresses (one per line)</label>
                        <textarea class="form-control" name="addresses" id="addresses" rows="6"
                            placeholder="cdn.example.com&#10;192.0.2.1:2087#MyServer&#10;[2001:db8::1]:443#IPv6Server">${settings.addresses.join('\n')}</textarea>
                        <small class="text-muted">Supported formats: domain.com, ip:port#remark, [ipv6]:port#remark</small>
                    </div>
                </div>
            </div>

            <!-- Security Settings -->
            <div class="card">
                <div class="card-header">
                    <h5><i class="fas fa-lock"></i> Security Settings</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="newPassword">New Password (optional)</label>
                            <input type="password" class="form-control" name="newPassword" id="newPassword"
                                minlength="6" placeholder="Leave empty to keep current">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="confirmPassword">Confirm Password</label>
                            <input type="password" class="form-control" name="confirmPassword" id="confirmPassword"
                                placeholder="Confirm new password">
                        </div>
                    </div>
                    <small class="text-muted">Password must be at least 6 characters</small>
                </div>
            </div>

            <!-- Submit Button -->
            <div class="text-center mb-4">
                <button type="submit" class="btn btn-primary btn-lg">
                    <i class="fas fa-save"></i> Save Configuration
                </button>
            </div>
        </form>

        <!-- Footer -->
        <div class="footer">
            <p>
                <i class="fas fa-code"></i> Worker Panel v1.0 |
                <a href="https://github.com" target="_blank" class="text-decoration-none">
                    <i class="fab fa-github"></i> GitHub
                </a>
            </p>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        function copyToClipboard(elementId) {
            const element = document.getElementById(elementId);
            const text = element.textContent;

            navigator.clipboard.writeText(text).then(() => {
                const btn = event.target.closest('button');
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                btn.classList.add('btn-success');
                btn.classList.remove('btn-copy');

                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.classList.remove('btn-success');
                    btn.classList.add('btn-copy');
                }, 2000);
            });
        }

        // Password validation
        document.querySelector('form').addEventListener('submit', (e) => {
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword && newPassword !== confirmPassword) {
                e.preventDefault();
                alert('Passwords do not match!');
            }
        });
    </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

async function loadSettings(env: Env): Promise<any> {
  const protocols = await env.settings.get('protocols') || 'vless,trojan,built-in';
  const maxConfigs = await env.settings.get('maxConfigs') || '200';
  const includeOriginal = await env.settings.get('includeOriginal') || 'true';
  const includeMerged = await env.settings.get('includeMerged') || 'true';
  const cleanDomains = await env.settings.get('cleanDomains') || '';
  const alpnList = await env.settings.get('alpnList') || DEFAULT_ALPN_LIST.join(', ');
  const fingerprintList = await env.settings.get('fingerprintList') || DEFAULT_FINGERPRINTS.join(', ');
  const providers = await env.settings.get('providers') || '';
  const personalConfigs = await env.settings.get('personalConfigs') || '';
  const addresses = await env.settings.get('addresses') || '';
  const proxyIP = await env.settings.get('proxyIP') || '';
  const countries = await env.settings.get('countries') || '';
  const enableFragments = await env.settings.get('enableFragments') || 'false';
  const blockPorn = await env.settings.get('blockPorn') || 'false';

  return {
    protocols: protocols.split(',').map((p: string) => p.trim()),
    maxConfigs: parseInt(maxConfigs),
    includeOriginal: includeOriginal === 'true',
    includeMerged: includeMerged === 'true',
    cleanDomains: cleanDomains ? cleanDomains.split('\n').filter((d: string) => d.trim()) : [],
    alpnList: alpnList.split(',').map((a: string) => a.trim()),
    fingerprintList: fingerprintList.split(',').map((f: string) => f.trim()),
    providers: providers ? providers.split('\n').filter((p: string) => p.trim()) : [],
    personalConfigs: personalConfigs ? personalConfigs.split('\n').filter((c: string) => c.trim()) : [],
    addresses: addresses ? addresses.split('\n').filter((a: string) => a.trim()) : [],
    proxyIP: proxyIP,
    countries: countries ? countries.split(',').map((c: string) => c.trim()) : [],
    enableFragments: enableFragments === 'true',
    blockPorn: blockPorn === 'true'
  };
}

export async function handlePanelPost(request: Request, env: Env): Promise<Response> {
  try {
    const formData = await request.formData();

    // Extract and save all settings
    const protocols = formData.getAll('protocols').join(',');
    const maxConfigs = formData.get('maxConfigs') || '200';
    const includeOriginal = formData.has('includeOriginal') ? 'true' : 'false';
    const includeMerged = formData.has('includeMerged') ? 'true' : 'false';
    const cleanDomains = formData.get('cleanDomains') || '';
    const alpnList = formData.get('alpnList') || DEFAULT_ALPN_LIST.join(', ');
    const fingerprintList = formData.get('fingerprintList') || DEFAULT_FINGERPRINTS.join(', ');
    const providers = formData.get('providers') || '';
    const personalConfigs = formData.get('personalConfigs') || '';
    const addresses = formData.get('addresses') || '';
    const proxyIP = formData.get('proxyIP') || '';
    const countries = formData.get('countries') || '';
    const enableFragments = formData.has('enableFragments') ? 'true' : 'false';
    const blockPorn = formData.has('blockPorn') ? 'true' : 'false';

    // Save to KV
    await Promise.all([
      env.settings.put('protocols', protocols as string),
      env.settings.put('maxConfigs', maxConfigs as string),
      env.settings.put('includeOriginal', includeOriginal),
      env.settings.put('includeMerged', includeMerged),
      env.settings.put('cleanDomains', cleanDomains as string),
      env.settings.put('alpnList', alpnList as string),
      env.settings.put('fingerprintList', fingerprintList as string),
      env.settings.put('providers', providers as string),
      env.settings.put('personalConfigs', personalConfigs as string),
      env.settings.put('addresses', addresses as string),
      env.settings.put('proxyIP', proxyIP as string),
      env.settings.put('countries', countries as string),
      env.settings.put('enableFragments', enableFragments),
      env.settings.put('blockPorn', blockPorn)
    ]);

    // Handle password update if provided
    const newPassword = formData.get('newPassword');
    if (newPassword) {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash(newPassword, 10);
      await env.settings.put('passwordHash', hash);
    }

    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    return new Response(null, {
      status: 302,
      headers: { 'Location': `/${token ? '?token=' + token : ''}` }
    });
  } catch (error) {
    return new Response('Error saving settings: ' + (error as Error).message, { status: 500 });
  }
}
