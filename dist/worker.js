var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw new Error('Dynamic require of "' + x + '" is not supported');
});

// src/constants.ts
var CLOUDFLARE_PORTS = [443, 2053, 2083, 2087, 2096, 8443];
var DEFAULT_ALPN_LIST = ["h3", "h2", "http/1.1"];
var DEFAULT_FINGERPRINTS = [
  "chrome",
  "firefox",
  "safari",
  "edge",
  "ios",
  "android",
  "random",
  "randomized"
];
var SUPPORTED_PROTOCOLS = ["vless", "vmess", "trojan"];
var AVAILABLE_COUNTRIES = [
  "US",
  "GB",
  "DE",
  "FR",
  "NL",
  "CA",
  "AU",
  "SG",
  "JP",
  "IN",
  "BR",
  "IT",
  "ES",
  "SE",
  "CH",
  "NO"
];

// src/panel.ts
async function renderPanel(request, env, token) {
  const url = new URL(request.url);
  const hostname = url.hostname;
  const settings = await loadSettings(env);
  const tokenParam = token ? `?token=${token}` : "";
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
                        ${SUPPORTED_PROTOCOLS.map((protocol) => `
                        <div class="col-md-3 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" name="protocols" value="${protocol}"
                                    id="protocol-${protocol}" ${settings.protocols.includes(protocol) ? "checked" : ""}>
                                <label class="form-check-label" for="protocol-${protocol}">
                                    ${protocol.toUpperCase()}
                                </label>
                            </div>
                        </div>
                        `).join("")}
                        <div class="col-md-3 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" name="protocols" value="built-in"
                                    id="protocol-builtin" ${settings.protocols.includes("built-in") ? "checked" : ""}>
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
                                    id="includeOriginal" ${settings.includeOriginal ? "checked" : ""}>
                                <label class="form-check-label" for="includeOriginal">
                                    Include Original Configs
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" name="includeMerged"
                                    id="includeMerged" ${settings.includeMerged ? "checked" : ""}>
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
                                    id="enableFragments" ${settings.enableFragments ? "checked" : ""}>
                                <label class="form-check-label" for="enableFragments">
                                    Enable Fragments (DPI Bypass)
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" name="blockPorn"
                                    id="blockPorn" ${settings.blockPorn ? "checked" : ""}>
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
                            value="${settings.alpnList.join(", ")}" placeholder="h3, h2, http/1.1">
                        <small class="text-muted">Application-Layer Protocol Negotiation</small>
                    </div>

                    <div class="mb-3">
                        <label for="fingerprintList">Fingerprint List (comma-separated)</label>
                        <input type="text" class="form-control" name="fingerprintList" id="fingerprintList"
                            value="${settings.fingerprintList.join(", ")}"
                            placeholder="chrome, firefox, safari, edge, random">
                        <small class="text-muted">TLS Client Fingerprints</small>
                    </div>

                    <div class="mb-3">
                        <label for="cleanDomains">Clean Domains (one per line)</label>
                        <textarea class="form-control" name="cleanDomains" id="cleanDomains" rows="3"
                            placeholder="cdn.example.com&#10;proxy.example.net">${settings.cleanDomains.join("\n")}</textarea>
                        <small class="text-muted">Domains used for tunneling/masquerading</small>
                    </div>

                    <div class="mb-3">
                        <label for="countries">Allowed Countries (comma-separated country codes)</label>
                        <input type="text" class="form-control" name="countries" id="countries"
                            value="${settings.countries.join(", ")}" placeholder="US, GB, DE, FR, NL">
                        <small class="text-muted">Leave empty for all countries. Available: ${AVAILABLE_COUNTRIES.join(", ")}</small>
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
                            placeholder="https://example.com/configs.txt&#10;https://another.com/subs.yaml">${settings.providers.join("\n")}</textarea>
                        <small class="text-muted">External configuration sources</small>
                    </div>

                    <div class="mb-3">
                        <label for="personalConfigs">Personal Configs (one per line)</label>
                        <textarea class="form-control" name="personalConfigs" id="personalConfigs" rows="4"
                            placeholder="vless://uuid@server:port?...&#10;trojan://password@server:port?...">${settings.personalConfigs.join("\n")}</textarea>
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
                            placeholder="cdn.example.com&#10;192.0.2.1:2087#MyServer&#10;[2001:db8::1]:443#IPv6Server">${settings.addresses.join("\n")}</textarea>
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

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"><\/script>
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
    <\/script>
</body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
__name(renderPanel, "renderPanel");
async function loadSettings(env) {
  const protocols = await env.settings.get("protocols") || "vless,trojan,built-in";
  const maxConfigs = await env.settings.get("maxConfigs") || "200";
  const includeOriginal = await env.settings.get("includeOriginal") || "true";
  const includeMerged = await env.settings.get("includeMerged") || "true";
  const cleanDomains = await env.settings.get("cleanDomains") || "";
  const alpnList = await env.settings.get("alpnList") || DEFAULT_ALPN_LIST.join(", ");
  const fingerprintList = await env.settings.get("fingerprintList") || DEFAULT_FINGERPRINTS.join(", ");
  const providers = await env.settings.get("providers") || "";
  const personalConfigs = await env.settings.get("personalConfigs") || "";
  const addresses = await env.settings.get("addresses") || "";
  const proxyIP = await env.settings.get("proxyIP") || "";
  const countries = await env.settings.get("countries") || "";
  const enableFragments = await env.settings.get("enableFragments") || "false";
  const blockPorn = await env.settings.get("blockPorn") || "false";
  return {
    protocols: protocols.split(",").map((p) => p.trim()),
    maxConfigs: parseInt(maxConfigs),
    includeOriginal: includeOriginal === "true",
    includeMerged: includeMerged === "true",
    cleanDomains: cleanDomains ? cleanDomains.split("\n").filter((d) => d.trim()) : [],
    alpnList: alpnList.split(",").map((a) => a.trim()),
    fingerprintList: fingerprintList.split(",").map((f) => f.trim()),
    providers: providers ? providers.split("\n").filter((p) => p.trim()) : [],
    personalConfigs: personalConfigs ? personalConfigs.split("\n").filter((c) => c.trim()) : [],
    addresses: addresses ? addresses.split("\n").filter((a) => a.trim()) : [],
    proxyIP,
    countries: countries ? countries.split(",").map((c) => c.trim()) : [],
    enableFragments: enableFragments === "true",
    blockPorn: blockPorn === "true"
  };
}
__name(loadSettings, "loadSettings");
async function handlePanelPost(request, env) {
  try {
    const formData = await request.formData();
    const protocols = formData.getAll("protocols").join(",");
    const maxConfigs = formData.get("maxConfigs") || "200";
    const includeOriginal = formData.has("includeOriginal") ? "true" : "false";
    const includeMerged = formData.has("includeMerged") ? "true" : "false";
    const cleanDomains = formData.get("cleanDomains") || "";
    const alpnList = formData.get("alpnList") || DEFAULT_ALPN_LIST.join(", ");
    const fingerprintList = formData.get("fingerprintList") || DEFAULT_FINGERPRINTS.join(", ");
    const providers = formData.get("providers") || "";
    const personalConfigs = formData.get("personalConfigs") || "";
    const addresses = formData.get("addresses") || "";
    const proxyIP = formData.get("proxyIP") || "";
    const countries = formData.get("countries") || "";
    const enableFragments = formData.has("enableFragments") ? "true" : "false";
    const blockPorn = formData.has("blockPorn") ? "true" : "false";
    await Promise.all([
      env.settings.put("protocols", protocols),
      env.settings.put("maxConfigs", maxConfigs),
      env.settings.put("includeOriginal", includeOriginal),
      env.settings.put("includeMerged", includeMerged),
      env.settings.put("cleanDomains", cleanDomains),
      env.settings.put("alpnList", alpnList),
      env.settings.put("fingerprintList", fingerprintList),
      env.settings.put("providers", providers),
      env.settings.put("personalConfigs", personalConfigs),
      env.settings.put("addresses", addresses),
      env.settings.put("proxyIP", proxyIP),
      env.settings.put("countries", countries),
      env.settings.put("enableFragments", enableFragments),
      env.settings.put("blockPorn", blockPorn)
    ]);
    const newPassword = formData.get("newPassword");
    if (newPassword) {
      const bcrypt = __require("bcryptjs");
      const hash = await bcrypt.hash(newPassword, 10);
      await env.settings.put("passwordHash", hash);
    }
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    return new Response(null, {
      status: 302,
      headers: { "Location": `/${token ? "?token=" + token : ""}` }
    });
  } catch (error) {
    return new Response("Error saving settings: " + error.message, { status: 500 });
  }
}
__name(handlePanelPost, "handlePanelPost");

// src/helpers.ts
async function generateUUIDv5(name, namespace = "6ba7b810-9dad-11d1-80b4-00c04fd430c8") {
  const hash = await sha256(namespace + name);
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    "5" + hash.substring(13, 16),
    (parseInt(hash.substring(16, 18), 16) & 63 | 128).toString(16).padStart(2, "0") + hash.substring(18, 20),
    hash.substring(20, 32)
  ].join("-");
}
__name(generateUUIDv5, "generateUUIDv5");
async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256, "sha256");
async function sha224(message) {
  const hash = await sha256(message);
  return hash.substring(0, 56);
}
__name(sha224, "sha224");
async function generateVlessConfig(address, port, sni, path = "/vless-ws", remark = "Worker-VLESS") {
  const uuid = await generateUUIDv5(sni);
  return {
    type: "vless",
    id: uuid,
    address,
    port,
    network: "ws",
    security: "tls",
    sni,
    fp: "random",
    alpn: "h2,http/1.1",
    path,
    host: sni,
    remark
  };
}
__name(generateVlessConfig, "generateVlessConfig");
async function generateTrojanConfig(address, port, sni, uuid, path = "/trojan-ws", remark = "Worker-Trojan") {
  const password = await sha224(uuid);
  return {
    type: "trojan",
    password,
    address,
    port,
    network: "ws",
    security: "tls",
    sni,
    fp: "random",
    alpn: "h2,http/1.1",
    path,
    host: sni,
    remark
  };
}
__name(generateTrojanConfig, "generateTrojanConfig");
function encodeVlessConfig(config) {
  const params = new URLSearchParams();
  if (config.security)
    params.set("security", config.security);
  if (config.sni)
    params.set("sni", config.sni);
  if (config.fp)
    params.set("fp", config.fp);
  if (config.alpn)
    params.set("alpn", config.alpn);
  if (config.network)
    params.set("type", config.network);
  if (config.network === "ws") {
    if (config.path)
      params.set("path", config.path);
    if (config.host)
      params.set("host", config.host);
  } else if (config.network === "grpc" && config.serviceName) {
    params.set("serviceName", config.serviceName);
  }
  params.set("encryption", "none");
  return `vless://${config.id}@${config.address}:${config.port}?${params.toString()}#${encodeURIComponent(config.remark)}`;
}
__name(encodeVlessConfig, "encodeVlessConfig");
function encodeTrojanConfig(config) {
  const params = new URLSearchParams();
  if (config.security)
    params.set("security", config.security);
  if (config.sni)
    params.set("sni", config.sni);
  if (config.fp)
    params.set("fp", config.fp);
  if (config.alpn)
    params.set("alpn", config.alpn);
  if (config.network)
    params.set("type", config.network);
  if (config.network === "ws") {
    if (config.path)
      params.set("path", config.path);
    if (config.host)
      params.set("host", config.host);
  } else if (config.network === "grpc" && config.serviceName) {
    params.set("serviceName", config.serviceName);
  }
  params.set("allowInsecure", "1");
  return `trojan://${config.password}@${config.address}:${config.port}?${params.toString()}#${encodeURIComponent(config.remark)}`;
}
__name(encodeTrojanConfig, "encodeTrojanConfig");
function parseAddress(addressStr) {
  try {
    const parts = addressStr.split("#");
    const addressPart = parts[0].trim();
    const remark = parts[1]?.trim();
    const ipv6Match = addressPart.match(/^\[([^\]]+)\]:(\d+)$/);
    if (ipv6Match) {
      return {
        address: ipv6Match[1],
        port: parseInt(ipv6Match[2]),
        remark
      };
    }
    const colonIndex = addressPart.lastIndexOf(":");
    if (colonIndex > 0) {
      const address = addressPart.substring(0, colonIndex);
      const port = parseInt(addressPart.substring(colonIndex + 1));
      return { address, port, remark };
    }
    return {
      address: addressPart,
      port: CLOUDFLARE_PORTS[Math.floor(Math.random() * CLOUDFLARE_PORTS.length)],
      remark
    };
  } catch {
    return null;
  }
}
__name(parseAddress, "parseAddress");
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}
__name(getRandomItem, "getRandomItem");
function base64Encode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
__name(base64Encode, "base64Encode");
function base64Decode(str) {
  return decodeURIComponent(escape(atob(str)));
}
__name(base64Decode, "base64Decode");
function randomString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
__name(randomString, "randomString");

// src/auth.ts
async function renderLogin(message) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Worker Panel</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        :root {
            --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            --dark-bg: #1a1d29;
            --card-bg: #242730;
        }

        body {
            background: var(--dark-bg);
            color: #e6e6e6;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .login-container {
            width: 100%;
            max-width: 420px;
            padding: 20px;
        }

        .login-card {
            background: var(--card-bg);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            padding: 3rem;
        }

        .login-header {
            text-align: center;
            margin-bottom: 2rem;
        }

        .login-header h1 {
            background: var(--primary-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 700;
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }

        .login-icon {
            width: 80px;
            height: 80px;
            background: var(--primary-gradient);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            margin: 0 auto 1.5rem;
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        }

        .form-control {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #e6e6e6;
            border-radius: 12px;
            padding: 0.875rem 1rem;
            font-size: 1rem;
        }

        .form-control:focus {
            background: rgba(0, 0, 0, 0.4);
            border-color: #667eea;
            color: #e6e6e6;
            box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }

        .btn-primary {
            background: var(--primary-gradient);
            border: none;
            padding: 0.875rem;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1rem;
            width: 100%;
            transition: all 0.3s ease;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        }

        .alert {
            border-radius: 12px;
            border: none;
            margin-bottom: 1.5rem;
        }

        .input-group-text {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #a8b2d1;
            border-right: none;
            border-radius: 12px 0 0 12px;
        }

        .input-group .form-control {
            border-left: none;
            border-radius: 0 12px 12px 0;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <div class="login-icon">
                    <i class="fas fa-lock"></i>
                </div>
                <h1>Worker Panel</h1>
                <p class="text-muted">Enter your password to continue</p>
            </div>

            ${message ? `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> ${message}</div>` : ""}

            <form method="POST" action="/login">
                <div class="mb-4">
                    <div class="input-group">
                        <span class="input-group-text">
                            <i class="fas fa-key"></i>
                        </span>
                        <input type="password" class="form-control" name="password"
                            placeholder="Enter password" required autofocus>
                    </div>
                </div>

                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-sign-in-alt"></i> Login
                </button>
            </form>
        </div>
    </div>
</body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
__name(renderLogin, "renderLogin");
async function handleLogin(request, env) {
  const formData = await request.formData();
  const password = formData.get("password");
  if (!password) {
    return renderLogin("Password is required");
  }
  const storedHash = await env.settings.get("passwordHash");
  const envPassword = env.PASSWORD;
  let isValid = false;
  if (storedHash) {
    isValid = await simpleHashCompare(password, storedHash);
  } else if (envPassword) {
    isValid = password === envPassword;
  } else {
    isValid = true;
  }
  if (!isValid) {
    await new Promise((resolve) => setTimeout(resolve, 1e3));
    return renderLogin("Invalid password");
  }
  const token = randomString(32);
  await env.settings.put("token", token, { expirationTtl: 86400 });
  return new Response(null, {
    status: 302,
    headers: { "Location": `/?token=${token}` }
  });
}
__name(handleLogin, "handleLogin");
async function validateToken(token, env) {
  if (!token)
    return false;
  const storedToken = await env.settings.get("token");
  return token === storedToken;
}
__name(validateToken, "validateToken");
async function requireAuth(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const storedHash = await env.settings.get("passwordHash");
  const envPassword = env.PASSWORD;
  if (!storedHash && !envPassword) {
    return true;
  }
  return await validateToken(token, env);
}
__name(requireAuth, "requireAuth");
async function simpleHashCompare(password, hash) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return computedHash === hash;
}
__name(simpleHashCompare, "simpleHashCompare");

// src/vless.ts
var WS_READY_STATE_OPEN = 1;
var WS_READY_STATE_CLOSING = 2;
async function handleVlessWebSocket(request, userID) {
  const upgradeHeader = request.headers.get("Upgrade");
  if (!upgradeHeader || upgradeHeader !== "websocket") {
    return new Response("Expected Upgrade: websocket", { status: 426 });
  }
  const webSocketPair = new WebSocketPair();
  const [client, webSocket] = Object.values(webSocketPair);
  webSocket.accept();
  let hasIncomingData = false;
  let remoteSocket = null;
  let udpStreamWrite = null;
  webSocket.addEventListener("message", async (event) => {
    hasIncomingData = true;
    try {
      const vlessBuffer = new Uint8Array(event.data);
      if (!remoteSocket) {
        const { addressRemote, portRemote, rawDataIndex, vlessVersion, isUDP } = await parseVlessHeader(vlessBuffer, userID);
        if (!addressRemote || !portRemote) {
          throw new Error("Invalid address or port");
        }
        if (isUDP) {
          const { write } = await handleUDPOutBound(webSocket, vlessVersion, addressRemote, portRemote);
          udpStreamWrite = write;
          udpStreamWrite(vlessBuffer.slice(rawDataIndex));
        } else {
          remoteSocket = await handleTCPOutBound(
            webSocket,
            vlessVersion,
            addressRemote,
            portRemote,
            vlessBuffer.slice(rawDataIndex)
          );
        }
      } else {
        if (remoteSocket?.writable) {
          const writer = remoteSocket.writable.getWriter();
          await writer.write(vlessBuffer);
          writer.releaseLock();
        }
      }
    } catch (error) {
      console.error("VLESS error:", error);
      closeWebSocket(webSocket);
    }
  });
  webSocket.addEventListener("close", () => {
    if (remoteSocket) {
      try {
        remoteSocket.close();
      } catch (e) {
      }
    }
  });
  webSocket.addEventListener("error", () => {
    if (remoteSocket) {
      try {
        remoteSocket.close();
      } catch (e) {
      }
    }
  });
  return new Response(null, {
    status: 101,
    webSocket: client
  });
}
__name(handleVlessWebSocket, "handleVlessWebSocket");
async function parseVlessHeader(vlessBuffer, userID) {
  const version = vlessBuffer[0];
  let isUDP = false;
  const uuidBytes = vlessBuffer.slice(1, 17);
  const uuidString = Array.from(uuidBytes).map((b, i) => {
    const hex = b.toString(16).padStart(2, "0");
    return [4, 6, 8, 10].includes(i) ? "-" + hex : hex;
  }).join("");
  if (uuidString !== userID) {
    throw new Error("Invalid user ID");
  }
  const optLength = vlessBuffer[17];
  const command = vlessBuffer[17 + optLength + 1];
  if (command === 1) {
  } else if (command === 2) {
    isUDP = true;
  } else {
    throw new Error("Unsupported command: " + command);
  }
  const portIndex = 17 + optLength + 2;
  const portRemote = (vlessBuffer[portIndex] << 8) + vlessBuffer[portIndex + 1];
  const addressType = vlessBuffer[portIndex + 2];
  let addressLength = 0;
  let addressValue = "";
  let addressRemote = "";
  switch (addressType) {
    case 1:
      addressLength = 4;
      addressValue = vlessBuffer.slice(portIndex + 3, portIndex + 3 + addressLength).join(".");
      addressRemote = addressValue;
      break;
    case 2:
      addressLength = vlessBuffer[portIndex + 3];
      addressValue = new TextDecoder().decode(
        vlessBuffer.slice(portIndex + 4, portIndex + 4 + addressLength)
      );
      addressRemote = addressValue;
      break;
    case 3:
      addressLength = 16;
      const ipv6Bytes = vlessBuffer.slice(portIndex + 3, portIndex + 3 + addressLength);
      addressValue = Array.from(
        { length: 8 },
        (_, i) => ((ipv6Bytes[i * 2] << 8) + ipv6Bytes[i * 2 + 1]).toString(16)
      ).join(":");
      addressRemote = `[${addressValue}]`;
      break;
    default:
      throw new Error("Invalid address type: " + addressType);
  }
  const rawDataIndex = portIndex + 3 + addressLength;
  return {
    addressRemote,
    portRemote,
    rawDataIndex,
    vlessVersion: version,
    isUDP
  };
}
__name(parseVlessHeader, "parseVlessHeader");
async function handleTCPOutBound(webSocket, vlessResponseHeader, addressRemote, portRemote, rawClientData) {
  const tcpSocket = connect({
    hostname: addressRemote,
    port: portRemote
  });
  const writer = tcpSocket.writable.getWriter();
  await writer.write(new Uint8Array([vlessResponseHeader, 0]));
  if (rawClientData.length > 0) {
    await writer.write(rawClientData);
  }
  writer.releaseLock();
  await tcpSocket.readable.pipeTo(
    new WritableStream({
      async write(chunk) {
        if (webSocket.readyState === WS_READY_STATE_OPEN) {
          webSocket.send(chunk);
        }
      },
      close() {
        closeWebSocket(webSocket);
      },
      abort(reason) {
        console.error("TCP stream aborted:", reason);
        closeWebSocket(webSocket);
      }
    })
  );
  return tcpSocket;
}
__name(handleTCPOutBound, "handleTCPOutBound");
async function handleUDPOutBound(webSocket, vlessResponseHeader, addressRemote, portRemote) {
  const response = await fetch(`https://1.1.1.1/dns-query?name=${addressRemote}&type=A`, {
    headers: { "Accept": "application/dns-json" }
  });
  const dnsResult = await response.json();
  if (dnsResult.Answer && dnsResult.Answer.length > 0) {
    const ip = dnsResult.Answer[0].data;
    const dnsResponse = encodeDNSResponse(ip);
    if (webSocket.readyState === WS_READY_STATE_OPEN) {
      webSocket.send(dnsResponse);
    }
  }
  return {
    write: (chunk) => {
    }
  };
}
__name(handleUDPOutBound, "handleUDPOutBound");
function encodeDNSResponse(ip) {
  const parts = ip.split(".").map(Number);
  return new Uint8Array([0, 0, ...parts]);
}
__name(encodeDNSResponse, "encodeDNSResponse");
function closeWebSocket(webSocket) {
  try {
    if (webSocket.readyState === WS_READY_STATE_OPEN || webSocket.readyState === WS_READY_STATE_CLOSING) {
      webSocket.close();
    }
  } catch (error) {
    console.error("Error closing WebSocket:", error);
  }
}
__name(closeWebSocket, "closeWebSocket");

// src/trojan.ts
var WS_READY_STATE_OPEN2 = 1;
var WS_READY_STATE_CLOSING2 = 2;
async function handleTrojanWebSocket(request, password) {
  const upgradeHeader = request.headers.get("Upgrade");
  if (!upgradeHeader || upgradeHeader !== "websocket") {
    return new Response("Expected Upgrade: websocket", { status: 426 });
  }
  const webSocketPair = new WebSocketPair();
  const [client, webSocket] = Object.values(webSocketPair);
  webSocket.accept();
  let remoteSocket = null;
  webSocket.addEventListener("message", async (event) => {
    try {
      const trojanBuffer = new Uint8Array(event.data);
      if (!remoteSocket) {
        const { addressRemote, portRemote, rawDataIndex } = await parseTrojanHeader(trojanBuffer, password);
        if (!addressRemote || !portRemote) {
          throw new Error("Invalid address or port");
        }
        remoteSocket = await handleTCPOutBound2(
          webSocket,
          addressRemote,
          portRemote,
          trojanBuffer.slice(rawDataIndex)
        );
      } else {
        if (remoteSocket?.writable) {
          const writer = remoteSocket.writable.getWriter();
          await writer.write(trojanBuffer);
          writer.releaseLock();
        }
      }
    } catch (error) {
      console.error("Trojan error:", error);
      closeWebSocket2(webSocket);
    }
  });
  webSocket.addEventListener("close", () => {
    if (remoteSocket) {
      try {
        remoteSocket.close();
      } catch (e) {
      }
    }
  });
  webSocket.addEventListener("error", () => {
    if (remoteSocket) {
      try {
        remoteSocket.close();
      } catch (e) {
      }
    }
  });
  return new Response(null, {
    status: 101,
    webSocket: client
  });
}
__name(handleTrojanWebSocket, "handleTrojanWebSocket");
async function parseTrojanHeader(trojanBuffer, expectedPassword) {
  const passwordHash = await sha224(expectedPassword);
  const receivedPassword = new TextDecoder().decode(trojanBuffer.slice(0, 56));
  if (receivedPassword !== passwordHash) {
    throw new Error("Invalid Trojan password");
  }
  if (trojanBuffer[56] !== 13 || trojanBuffer[57] !== 10) {
    throw new Error("Invalid Trojan header format");
  }
  const command = trojanBuffer[58];
  if (command !== 1) {
    throw new Error("Unsupported Trojan command: " + command);
  }
  const addressType = trojanBuffer[59];
  let addressLength = 0;
  let addressValue = "";
  let addressRemote = "";
  let addressIndex = 60;
  switch (addressType) {
    case 1:
      addressLength = 4;
      addressValue = trojanBuffer.slice(addressIndex, addressIndex + addressLength).join(".");
      addressRemote = addressValue;
      break;
    case 3:
      addressLength = trojanBuffer[addressIndex];
      addressIndex++;
      addressValue = new TextDecoder().decode(
        trojanBuffer.slice(addressIndex, addressIndex + addressLength)
      );
      addressRemote = addressValue;
      break;
    case 4:
      addressLength = 16;
      const ipv6Bytes = trojanBuffer.slice(addressIndex, addressIndex + addressLength);
      addressValue = Array.from(
        { length: 8 },
        (_, i) => ((ipv6Bytes[i * 2] << 8) + ipv6Bytes[i * 2 + 1]).toString(16)
      ).join(":");
      addressRemote = `[${addressValue}]`;
      break;
    default:
      throw new Error("Invalid address type: " + addressType);
  }
  const portIndex = addressIndex + addressLength;
  const portRemote = (trojanBuffer[portIndex] << 8) + trojanBuffer[portIndex + 1];
  const crlfIndex = portIndex + 2;
  if (trojanBuffer[crlfIndex] !== 13 || trojanBuffer[crlfIndex + 1] !== 10) {
    throw new Error("Invalid Trojan header format");
  }
  const rawDataIndex = crlfIndex + 2;
  return {
    addressRemote,
    portRemote,
    rawDataIndex
  };
}
__name(parseTrojanHeader, "parseTrojanHeader");
async function handleTCPOutBound2(webSocket, addressRemote, portRemote, rawClientData) {
  const tcpSocket = connect({
    hostname: addressRemote,
    port: portRemote
  });
  const writer = tcpSocket.writable.getWriter();
  if (rawClientData.length > 0) {
    await writer.write(rawClientData);
  }
  writer.releaseLock();
  await tcpSocket.readable.pipeTo(
    new WritableStream({
      async write(chunk) {
        if (webSocket.readyState === WS_READY_STATE_OPEN2) {
          webSocket.send(chunk);
        }
      },
      close() {
        closeWebSocket2(webSocket);
      },
      abort(reason) {
        console.error("TCP stream aborted:", reason);
        closeWebSocket2(webSocket);
      }
    })
  );
  return tcpSocket;
}
__name(handleTCPOutBound2, "handleTCPOutBound");
function closeWebSocket2(webSocket) {
  try {
    if (webSocket.readyState === WS_READY_STATE_OPEN2 || webSocket.readyState === WS_READY_STATE_CLOSING2) {
      webSocket.close();
    }
  } catch (error) {
    console.error("Error closing WebSocket:", error);
  }
}
__name(closeWebSocket2, "closeWebSocket");

// src/collector.ts
async function collectConfigs(providers, maxConfigs, protocols) {
  const allConfigs = [];
  for (const provider of providers) {
    try {
      const configs = await fetchProviderConfigs(provider);
      const filtered = configs.filter((c) => protocols.includes(c.type));
      allConfigs.push(...filtered);
    } catch (error) {
      console.error(`Error fetching provider ${provider}:`, error);
    }
  }
  const unique = removeDuplicates(allConfigs);
  return unique.slice(0, maxConfigs);
}
__name(collectConfigs, "collectConfigs");
async function fetchProviderConfigs(providerUrl) {
  const response = await fetch(providerUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  if (contentType.includes("yaml") || text.trim().startsWith("proxies:")) {
    return parseYamlConfigs(text);
  } else if (isBase64(text.trim())) {
    return parseBase64Configs(text.trim());
  } else {
    return parseRawConfigs(text);
  }
}
__name(fetchProviderConfigs, "fetchProviderConfigs");
function parseYamlConfigs(yaml) {
  const configs = [];
  const lines = yaml.split("\n");
  let inProxies = false;
  let currentProxy = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("proxies:")) {
      inProxies = true;
      continue;
    }
    if (!inProxies)
      continue;
    if (trimmed.startsWith("- name:") || trimmed.startsWith("-  name:")) {
      if (currentProxy.name) {
        const config = yamlProxyToConfig(currentProxy);
        if (config)
          configs.push(config);
      }
      currentProxy = { name: trimmed.split("name:")[1].trim().replace(/['"]/g, "") };
    } else if (trimmed.includes(":")) {
      const [key, ...valueParts] = trimmed.split(":");
      const value = valueParts.join(":").trim().replace(/['"]/g, "");
      currentProxy[key.trim()] = value;
    }
  }
  if (currentProxy.name) {
    const config = yamlProxyToConfig(currentProxy);
    if (config)
      configs.push(config);
  }
  return configs;
}
__name(parseYamlConfigs, "parseYamlConfigs");
function yamlProxyToConfig(proxy) {
  const type = proxy.type?.toLowerCase();
  if (type === "vless") {
    return {
      type: "vless",
      id: proxy.uuid || "",
      address: proxy.server || "",
      port: parseInt(proxy.port) || 443,
      network: proxy.network || "ws",
      security: proxy.tls ? "tls" : "none",
      sni: proxy.servername || proxy.server,
      fp: proxy["client-fingerprint"],
      alpn: proxy.alpn,
      path: proxy["ws-opts"]?.path || proxy["h2-opts"]?.path || "",
      host: proxy["ws-opts"]?.headers?.Host || proxy["h2-opts"]?.host?.[0] || "",
      serviceName: proxy["grpc-opts"]?.["grpc-service-name"],
      remark: proxy.name || "Unknown"
    };
  } else if (type === "trojan") {
    return {
      type: "trojan",
      password: proxy.password || "",
      address: proxy.server || "",
      port: parseInt(proxy.port) || 443,
      network: proxy.network || "ws",
      security: proxy.tls ? "tls" : "none",
      sni: proxy.servername || proxy.server || proxy.sni,
      fp: proxy["client-fingerprint"],
      alpn: proxy.alpn,
      path: proxy["ws-opts"]?.path || "",
      host: proxy["ws-opts"]?.headers?.Host || "",
      remark: proxy.name || "Unknown"
    };
  } else if (type === "vmess") {
    return {
      type: "vmess",
      id: proxy.uuid || "",
      address: proxy.server || "",
      port: parseInt(proxy.port) || 443,
      network: proxy.network || "ws",
      security: proxy.cipher || "auto",
      alterId: parseInt(proxy.alterId) || 0,
      sni: proxy.servername,
      fp: proxy["client-fingerprint"],
      alpn: proxy.alpn,
      path: proxy["ws-opts"]?.path || "",
      host: proxy["ws-opts"]?.headers?.Host || "",
      remark: proxy.name || "Unknown"
    };
  }
  return null;
}
__name(yamlProxyToConfig, "yamlProxyToConfig");
function parseBase64Configs(base64Text) {
  try {
    const decoded = base64Decode(base64Text);
    return parseRawConfigs(decoded);
  } catch {
    return [];
  }
}
__name(parseBase64Configs, "parseBase64Configs");
function parseRawConfigs(text) {
  const configs = [];
  const lines = text.split("\n").filter((line) => line.trim());
  for (const line of lines) {
    const config = parseProxyUri(line.trim());
    if (config) {
      configs.push(config);
    }
  }
  return configs;
}
__name(parseRawConfigs, "parseRawConfigs");
function parseProxyUri(uri) {
  try {
    if (uri.startsWith("vless://")) {
      return parseVlessUri(uri);
    } else if (uri.startsWith("trojan://")) {
      return parseTrojanUri(uri);
    } else if (uri.startsWith("vmess://")) {
      return parseVmessUri(uri);
    }
  } catch (error) {
    console.error("Error parsing URI:", error);
  }
  return null;
}
__name(parseProxyUri, "parseProxyUri");
function parseVlessUri(uri) {
  const match = uri.match(/^vless:\/\/([^@]+)@([^:]+):(\d+)\?(.+)#(.*)$/);
  if (!match)
    return null;
  const [, id, address, port, query, remark] = match;
  const params = new URLSearchParams(query);
  return {
    type: "vless",
    id,
    address,
    port: parseInt(port),
    network: params.get("type") || "ws",
    security: params.get("security") || "tls",
    sni: params.get("sni") || params.get("host"),
    fp: params.get("fp") || void 0,
    alpn: params.get("alpn") || void 0,
    path: params.get("path") || void 0,
    host: params.get("host") || void 0,
    serviceName: params.get("serviceName") || void 0,
    remark: decodeURIComponent(remark) || "VLESS"
  };
}
__name(parseVlessUri, "parseVlessUri");
function parseTrojanUri(uri) {
  const match = uri.match(/^trojan:\/\/([^@]+)@([^:]+):(\d+)\?(.+)#(.*)$/);
  if (!match)
    return null;
  const [, password, address, port, query, remark] = match;
  const params = new URLSearchParams(query);
  return {
    type: "trojan",
    password,
    address,
    port: parseInt(port),
    network: params.get("type") || "ws",
    security: params.get("security") || "tls",
    sni: params.get("sni") || params.get("host"),
    fp: params.get("fp") || void 0,
    alpn: params.get("alpn") || void 0,
    path: params.get("path") || void 0,
    host: params.get("host") || void 0,
    remark: decodeURIComponent(remark) || "Trojan"
  };
}
__name(parseTrojanUri, "parseTrojanUri");
function parseVmessUri(uri) {
  try {
    const base64Part = uri.replace("vmess://", "");
    const decoded = base64Decode(base64Part);
    const json = JSON.parse(decoded);
    return {
      type: "vmess",
      id: json.id || "",
      address: json.add || "",
      port: parseInt(json.port) || 443,
      network: json.net || "ws",
      security: json.scy || "auto",
      alterId: parseInt(json.aid) || 0,
      sni: json.sni || json.host,
      path: json.path || "/",
      host: json.host || "",
      remark: json.ps || "VMess"
    };
  } catch {
    return null;
  }
}
__name(parseVmessUri, "parseVmessUri");
function removeDuplicates(configs) {
  const seen = /* @__PURE__ */ new Set();
  const unique = [];
  for (const config of configs) {
    const key = `${config.type}:${config.address}:${config.port}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(config);
    }
  }
  return unique;
}
__name(removeDuplicates, "removeDuplicates");
function isBase64(str) {
  try {
    return btoa(atob(str)) === str;
  } catch {
    return false;
  }
}
__name(isBase64, "isBase64");

// src/subscription.ts
function generateBase64Subscription(configs) {
  const uris = configs.map((config) => configToUri(config));
  return base64Encode(uris.join("\n"));
}
__name(generateBase64Subscription, "generateBase64Subscription");
function generateRawSubscription(configs) {
  const uris = configs.map((config) => configToUri(config));
  return uris.join("\n");
}
__name(generateRawSubscription, "generateRawSubscription");
function generateClashSubscription(configs) {
  const clashProxies = configs.map((config) => configToClash(config));
  const yaml = `# Worker Panel - Clash Subscription
# Generated: ${(/* @__PURE__ */ new Date()).toISOString()}

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
${clashProxies.map((p) => yamlStringify(p, 2)).join("\n")}

proxy-groups:
  - name: "Auto Select"
    type: url-test
    proxies:
${clashProxies.map((p) => `      - "${p.name}"`).join("\n")}
    url: 'https://www.gstatic.com/generate_204'
    interval: 300

  - name: "Fallback"
    type: fallback
    proxies:
${clashProxies.map((p) => `      - "${p.name}"`).join("\n")}
    url: 'https://www.gstatic.com/generate_204'
    interval: 300

  - name: "Load Balance"
    type: load-balance
    proxies:
${clashProxies.map((p) => `      - "${p.name}"`).join("\n")}
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
__name(generateClashSubscription, "generateClashSubscription");
function configToUri(config) {
  if (config.type === "vless") {
    return encodeVlessConfig(config);
  } else if (config.type === "trojan") {
    return encodeTrojanConfig(config);
  } else if (config.type === "vmess") {
    return encodeVmessConfig(config);
  }
  return "";
}
__name(configToUri, "configToUri");
function encodeVmessConfig(config) {
  const vmessObj = {
    v: "2",
    ps: config.remark,
    add: config.address,
    port: config.port.toString(),
    id: config.id,
    aid: config.alterId?.toString() || "0",
    net: config.network,
    type: "none",
    host: config.host || "",
    path: config.path || "/",
    tls: config.security === "tls" ? "tls" : "",
    sni: config.sni || "",
    scy: config.security || "auto"
  };
  return "vmess://" + base64Encode(JSON.stringify(vmessObj));
}
__name(encodeVmessConfig, "encodeVmessConfig");
function configToClash(config) {
  const base = {
    name: config.remark,
    type: config.type,
    server: config.address,
    port: config.port,
    tls: config.security === "tls",
    "skip-cert-verify": true
  };
  if (config.sni) {
    base.servername = config.sni;
  }
  if (config.fp) {
    base["client-fingerprint"] = config.fp;
  }
  if (config.type === "vless") {
    base.uuid = config.id;
    base.network = config.network;
    if (config.network === "ws") {
      base["ws-opts"] = {
        path: config.path || "/",
        headers: { Host: config.host || config.address }
      };
    } else if (config.network === "grpc") {
      base["grpc-opts"] = {
        "grpc-service-name": config.serviceName || ""
      };
    } else if (config.network === "h2") {
      base["h2-opts"] = {
        path: config.path || "/",
        host: [config.host || config.address]
      };
    }
  } else if (config.type === "trojan") {
    base.password = config.password;
    base.network = config.network;
    if (config.network === "ws") {
      base["ws-opts"] = {
        path: config.path || "/",
        headers: { Host: config.host || config.address }
      };
    } else if (config.network === "grpc") {
      base["grpc-opts"] = {
        "grpc-service-name": config.serviceName || ""
      };
    }
  } else if (config.type === "vmess") {
    base.uuid = config.id;
    base.alterId = config.alterId || 0;
    base.cipher = config.security || "auto";
    base.network = config.network;
    if (config.network === "ws") {
      base["ws-opts"] = {
        path: config.path || "/",
        headers: { Host: config.host || config.address }
      };
    } else if (config.network === "grpc") {
      base["grpc-opts"] = {
        "grpc-service-name": config.serviceName || ""
      };
    }
  }
  return base;
}
__name(configToClash, "configToClash");
function yamlStringify(obj, indent = 0) {
  const spaces = " ".repeat(indent);
  let result = `${spaces}- `;
  const keys = Object.keys(obj);
  result += `name: "${obj.name}"
`;
  for (const key of keys) {
    if (key === "name")
      continue;
    const value = obj[key];
    if (typeof value === "object" && !Array.isArray(value)) {
      result += `${spaces}  ${key}:
`;
      for (const subKey of Object.keys(value)) {
        const subValue = value[subKey];
        if (typeof subValue === "object") {
          result += `${spaces}    ${subKey}:
`;
          if (Array.isArray(subValue)) {
            for (const item of subValue) {
              result += `${spaces}      - ${item}
`;
            }
          } else {
            for (const k of Object.keys(subValue)) {
              result += `${spaces}      ${k}: ${subValue[k]}
`;
            }
          }
        } else {
          result += `${spaces}    ${subKey}: ${subValue}
`;
        }
      }
    } else if (typeof value === "boolean") {
      result += `${spaces}  ${key}: ${value}
`;
    } else if (typeof value === "number") {
      result += `${spaces}  ${key}: ${value}
`;
    } else {
      result += `${spaces}  ${key}: ${value}
`;
    }
  }
  return result;
}
__name(yamlStringify, "yamlStringify");

// src/worker.ts
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === "/login") {
      if (request.method === "GET") {
        return renderLogin();
      } else if (request.method === "POST") {
        return handleLogin(request, env);
      }
    }
    const isProtected = path === "/" || path.startsWith("/sub") || path.startsWith("/clash") || path.startsWith("/raw") || path === "/editor" || path === "/bestip";
    if (isProtected) {
      const isAuthed = await requireAuth(request, env);
      if (!isAuthed) {
        return new Response(null, {
          status: 302,
          headers: { "Location": "/login" }
        });
      }
    }
    try {
      switch (path) {
        case "/":
          if (request.method === "GET") {
            const token = url.searchParams.get("token");
            return renderPanel(request, env, token || void 0);
          } else if (request.method === "POST") {
            return handlePanelPost(request, env);
          }
          break;
        case "/sub":
          return handleSubscription(request, env, "base64");
        case "/clash":
          return handleSubscription(request, env, "clash");
        case "/raw":
          return handleSubscription(request, env, "raw");
        case "/vless-ws":
          return handleVlessWebSocket(request, await getWorkerUUID(env));
        case "/trojan-ws":
          const uuid = await getWorkerUUID(env);
          return handleTrojanWebSocket(request, uuid);
        case "/editor":
          return renderAddressEditor(env, url.searchParams.get("token"));
        case "/bestip":
          return renderBestIPFinder(url.searchParams.get("token"));
        default:
          if (path === "/editor/save" && request.method === "POST") {
            return handleEditorSave(request, env);
          }
          return new Response("Not Found", { status: 404 });
      }
    } catch (error) {
      console.error("Worker error:", error);
      return new Response("Internal Server Error: " + error.message, { status: 500 });
    }
    return new Response("Method Not Allowed", { status: 405 });
  }
};
async function handleSubscription(request, env, format) {
  const settings = await loadSettings2(env);
  const builtInConfigs = await generateBuiltInConfigs(env, settings);
  let externalConfigs = [];
  if (settings.providers.length > 0) {
    externalConfigs = await collectConfigs(
      settings.providers,
      settings.maxConfigs - builtInConfigs.length,
      settings.protocols
    );
  }
  const personalConfigs = [];
  for (const configUri of settings.personalConfigs) {
    personalConfigs.push({ remark: "Personal", type: "vless" });
  }
  let allConfigs = [...builtInConfigs];
  if (settings.includeOriginal) {
    allConfigs.push(...externalConfigs);
  }
  if (settings.includeMerged) {
  }
  allConfigs.push(...personalConfigs);
  allConfigs = allConfigs.slice(0, settings.maxConfigs);
  let content;
  let contentType;
  switch (format) {
    case "base64":
      content = generateBase64Subscription(allConfigs);
      contentType = "text/plain; charset=utf-8";
      break;
    case "clash":
      content = generateClashSubscription(allConfigs);
      contentType = "text/yaml; charset=utf-8";
      break;
    case "raw":
      content = generateRawSubscription(allConfigs);
      contentType = "text/plain; charset=utf-8";
      break;
  }
  return new Response(content, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="subscription.${format === "clash" ? "yaml" : "txt"}"`
    }
  });
}
__name(handleSubscription, "handleSubscription");
async function generateBuiltInConfigs(env, settings) {
  const configs = [];
  if (!settings.protocols.includes("built-in")) {
    return configs;
  }
  const hostname = "your-worker.workers.dev";
  const addresses = settings.addresses.length > 0 ? settings.addresses : [hostname];
  let index = 1;
  for (const addressStr of addresses) {
    const addressInfo = parseAddress(addressStr);
    if (!addressInfo)
      continue;
    const fingerprint = getRandomItem(settings.fingerprintList);
    const alpn = getRandomItem(settings.alpnList);
    const vlessConfig = await generateVlessConfig(
      addressInfo.address,
      addressInfo.port,
      hostname,
      "/vless-ws?ed=2048",
      `${index++}-VLESS-${addressInfo.remark || addressInfo.address}`
    );
    vlessConfig.fp = fingerprint;
    vlessConfig.alpn = alpn;
    configs.push(vlessConfig);
    const uuid = await getWorkerUUID(env);
    const trojanConfig = await generateTrojanConfig(
      addressInfo.address,
      addressInfo.port,
      hostname,
      uuid,
      "/trojan-ws?ed=2048",
      `${index++}-Trojan-${addressInfo.remark || addressInfo.address}`
    );
    trojanConfig.fp = fingerprint;
    trojanConfig.alpn = alpn;
    configs.push(trojanConfig);
  }
  return configs;
}
__name(generateBuiltInConfigs, "generateBuiltInConfigs");
async function loadSettings2(env) {
  const protocols = await env.settings.get("protocols") || "vless,trojan,built-in";
  const maxConfigs = parseInt(await env.settings.get("maxConfigs") || "200");
  const includeOriginal = await env.settings.get("includeOriginal") !== "false";
  const includeMerged = await env.settings.get("includeMerged") !== "false";
  const cleanDomains = await env.settings.get("cleanDomains") || "";
  const alpnList = await env.settings.get("alpnList") || "h3,h2,http/1.1";
  const fingerprintList = await env.settings.get("fingerprintList") || "chrome,firefox,safari,random";
  const providers = await env.settings.get("providers") || "";
  const personalConfigs = await env.settings.get("personalConfigs") || "";
  const addresses = await env.settings.get("addresses") || "";
  const proxyIP = await env.settings.get("proxyIP") || "";
  const countries = await env.settings.get("countries") || "";
  const enableFragments = await env.settings.get("enableFragments") === "true";
  const blockPorn = await env.settings.get("blockPorn") === "true";
  return {
    protocols: protocols.split(",").map((p) => p.trim()),
    maxConfigs,
    includeOriginal,
    includeMerged,
    cleanDomains: cleanDomains ? cleanDomains.split("\n").filter((d) => d.trim()) : [],
    alpnList: alpnList.split(",").map((a) => a.trim()),
    fingerprintList: fingerprintList.split(",").map((f) => f.trim()),
    providers: providers ? providers.split("\n").filter((p) => p.trim()) : [],
    personalConfigs: personalConfigs ? personalConfigs.split("\n").filter((c) => c.trim()) : [],
    addresses: addresses ? addresses.split("\n").filter((a) => a.trim()) : [],
    proxyIP,
    countries: countries ? countries.split(",").map((c) => c.trim()) : [],
    enableFragments,
    blockPorn
  };
}
__name(loadSettings2, "loadSettings");
async function getWorkerUUID(env) {
  let uuid = await env.settings.get("workerUUID");
  if (!uuid) {
    uuid = generateUUIDv5("worker-panel-" + Date.now());
    await env.settings.put("workerUUID", uuid);
  }
  return uuid;
}
__name(getWorkerUUID, "getWorkerUUID");
function renderAddressEditor(env, token) {
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
                <a href="/${token ? "?token=" + token : ""}" class="btn btn-outline-secondary">
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
    <\/script>
</body>
</html>`;
  return Promise.resolve(new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  }));
}
__name(renderAddressEditor, "renderAddressEditor");
function renderBestIPFinder(token) {
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
                <a href="/${token ? "?token=" + token : ""}" class="btn btn-outline-secondary">
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
    <\/script>
</body>
</html>`;
  return Promise.resolve(new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  }));
}
__name(renderBestIPFinder, "renderBestIPFinder");
async function handleEditorSave(request, env) {
  const formData = await request.formData();
  const addresses = formData.get("addresses");
  await env.settings.put("addresses", addresses);
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(handleEditorSave, "handleEditorSave");
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
