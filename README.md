# Worker Panel

> Advanced VLESS & Trojan Proxy Configuration Manager for Cloudflare Workers

A unified, feature-rich Cloudflare Workers application that combines the best of proxy configuration management with a modern, intuitive web interface. Generate, manage, and distribute VLESS and Trojan proxy configurations with ease.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)

## Features

### Core Functionality
- ✅ **Dual Protocol Support**: Built-in VLESS and Trojan protocol handlers
- ✅ **Config Aggregation**: Collect and merge configs from multiple providers
- ✅ **Multiple Subscription Formats**: Base64, Clash, and Raw text exports
- ✅ **WebSocket Tunneling**: Full VLESS and Trojan over WebSocket support
- ✅ **Smart Config Distribution**: Automatic load balancing across providers

### Modern Web Panel
- 🎨 **Beautiful UI**: Bootstrap 5-based dark theme with smooth animations
- 🔒 **Password Protection**: Optional authentication with secure token sessions
- ⚙️ **Rich Configuration**: Protocol selection, ALPN, fingerprints, and more
- 📝 **Address Editor**: Online editor for managing proxy addresses
- 🚀 **Best IP Finder**: Test and rank Cloudflare IPs by speed
- 📱 **Responsive Design**: Works perfectly on mobile and desktop

### Advanced Features
- 🔐 **Fragment Support**: DPI bypass with configurable packet fragmentation
- 🌍 **Country Filtering**: Restrict configs to specific geographic regions
- 🎯 **Custom Fingerprints**: TLS fingerprint randomization
- 📊 **Provider Management**: Add unlimited external config sources
- 💾 **KV Storage**: Persistent settings using Cloudflare KV
- 🔄 **Auto-Configuration**: Generate configs from address pools

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) 18 or later
- [Cloudflare Account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### Installation

1. **Clone the repository**
   ```bash
   cd worker-panel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create KV Namespace**
   ```bash
   wrangler kv:namespace create "settings"
   ```

   Copy the `id` from the output and update `wrangler.toml`:
   ```toml
   [[kv_namespaces]]
   binding = "settings"
   id = "YOUR_KV_NAMESPACE_ID"
   ```

4. **Configure Environment (Optional)**
   ```bash
   # Set a default password
   wrangler secret put PASSWORD
   ```

5. **Deploy to Cloudflare Workers**
   ```bash
   npm run deploy
   ```

6. **Access your panel**
   ```
   https://worker-panel.YOUR_SUBDOMAIN.workers.dev/
   ```

## Configuration

### Environment Variables

You can set these via `wrangler secret put <NAME>` or in the Cloudflare dashboard:

| Variable | Description | Default |
|----------|-------------|---------|
| `PASSWORD` | Master password for panel access | None (optional) |

### Panel Settings

All settings are configurable through the web interface at `/`:

#### Protocol Configuration
- **Protocols**: VLESS, VMess, Trojan, Built-in (VLESS+Trojan)
- **Built-in configs**: Generated directly by the worker

#### General Settings
- **Max Configurations**: Maximum number of configs to include (min: 50)
- **Proxy IP**: Custom proxy IP for tunneling
- **Include Original**: Include external provider configs as-is
- **Include Merged**: Tunnel external configs through worker
- **Enable Fragments**: DPI bypass using packet fragmentation
- **Block Adult Content**: Force built-in protocols only for sensitive domains

#### Advanced Settings
- **ALPN List**: Application-Layer Protocol Negotiation values
  - Default: `h3, h2, http/1.1`
- **Fingerprint List**: TLS client fingerprints
  - Default: `chrome, firefox, safari, edge, random`
- **Clean Domains**: Domains used for SNI masquerading
- **Allowed Countries**: Filter configs by country codes (e.g., `US, GB, DE`)

#### Configuration Sources
- **Providers**: External URLs providing proxy configs
  - Supports: YAML, Base64, Raw text formats
- **Personal Configs**: Your custom proxy URIs
- **Address Pool**: Local addresses for built-in config generation
  - Format: `domain.com`, `ip:port#remark`, `[ipv6]:port#remark`

## Usage

### Subscription Links

After deploying, access your subscription links:

```
# Base64 Subscription (v2rayN, v2rayNG, etc.)
https://your-worker.workers.dev/sub?token=YOUR_TOKEN

# Clash Subscription
https://your-worker.workers.dev/clash?token=YOUR_TOKEN

# Raw Text Subscription
https://your-worker.workers.dev/raw?token=YOUR_TOKEN
```

### Address Editor

Manage your address pool online at `/editor`:
- Add/remove proxy addresses
- Format: One address per line
- Supports: domains, IP:port, IPv6
- Auto-saves to Cloudflare KV

### Best IP Finder

Find the fastest Cloudflare IPs at `/bestip`:
- Scans Cloudflare IP ranges
- Tests connection speed
- Ranks by latency
- Export optimized IP list

## Architecture

### Project Structure

```
worker-panel/
├── src/
│   ├── worker.ts          # Main entry point and routing
│   ├── panel.ts           # Web panel UI and handlers
│   ├── auth.ts            # Authentication system
│   ├── vless.ts           # VLESS protocol handler
│   ├── trojan.ts          # Trojan protocol handler
│   ├── helpers.ts         # Utility functions
│   ├── collector.ts       # Config aggregation
│   ├── subscription.ts    # Subscription format generators
│   ├── interfaces.ts      # TypeScript interfaces
│   └── constants.ts       # Default values and constants
├── wrangler.toml          # Cloudflare Workers config
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies
└── README.md              # This file
```

### Data Flow

```
User Request → Worker Router
    ├── / (GET)          → Panel UI
    ├── / (POST)         → Save Settings
    ├── /login           → Authentication
    ├── /sub             → Generate Base64 subscription
    ├── /clash           → Generate Clash YAML
    ├── /raw             → Generate raw text
    ├── /vless-ws        → VLESS WebSocket handler
    ├── /trojan-ws       → Trojan WebSocket handler
    ├── /editor          → Address editor UI
    └── /bestip          → IP speed tester

Settings Storage → Cloudflare KV
    ├── protocols, maxConfigs, providers, etc.
    ├── addresses, personalConfigs
    ├── passwordHash, token
    └── workerUUID
```

## Development

### Local Development

```bash
# Start development server
npm run dev

# Access at http://localhost:8787
```

### Build for Production

```bash
# Dry-run deployment (check for errors)
npm run build

# Deploy to production
npm run deploy
```

### TypeScript Support

Full TypeScript support with Cloudflare Workers types:
- Type-safe configuration
- IntelliSense in VS Code
- Compile-time error checking

## Security Best Practices

1. **Always set a strong password**
   ```bash
   wrangler secret put PASSWORD
   ```

2. **Use custom domains with HTTPS**
   - Configure in Cloudflare dashboard
   - Avoid using `*.workers.dev` in production

3. **Rotate authentication tokens**
   - Tokens expire after 24 hours
   - Log out and log back in regularly

4. **Limit provider sources**
   - Only add trusted provider URLs
   - Verify config sources regularly

5. **Keep dependencies updated**
   ```bash
   npm update
   ```

## Troubleshooting

### Common Issues

**Error: "KV namespace not found"**
- Solution: Create KV namespace and update `wrangler.toml`
  ```bash
  wrangler kv:namespace create "settings"
  ```

**Error: "Invalid UUID format"**
- Solution: Worker UUID is auto-generated on first run. Clear KV if corrupted:
  ```bash
  wrangler kv:key delete --namespace-id=YOUR_ID "workerUUID"
  ```

**Panel shows "Password required" but I didn't set one**
- Solution: Access `/login` and enter any password (if PASSWORD not set)
- Or set a password: `wrangler secret put PASSWORD`

**Subscription contains no configs**
- Check provider URLs are accessible
- Verify protocols are enabled in settings
- Check maxConfigs is > 0

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

This project combines and improves upon:
- [epeius](https://github.com/...) - Trojan proxy worker
- [v2ray-worker](https://github.com/vfarid/v2ray-worker) - VLESS/VMess worker

Special thanks to the Cloudflare Workers community!

## Support

- 🐛 **Report bugs**: [GitHub Issues](https://github.com/your-repo/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- 📖 **Documentation**: [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)

---

**Made with ❤️ for the open internet**
