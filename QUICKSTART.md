# Quick Start Guide

Get your Worker Panel up and running in 5 minutes!

## Step 1: Install Dependencies

```bash
cd worker-panel
npm install
```

## Step 2: Create Cloudflare KV Namespace

```bash
# Login to Cloudflare
wrangler login

# Create KV namespace
wrangler kv:namespace create "settings"
```

You'll see output like:
```
{ binding = "settings", id = "abc123def456..." }
```

## Step 3: Update Configuration

Edit `wrangler.toml` and replace `YOUR_KV_NAMESPACE_ID` with the ID from Step 2:

```toml
[[kv_namespaces]]
binding = "settings"
id = "abc123def456..."  # Your actual ID here
```

## Step 4: (Optional) Set Password

```bash
wrangler secret put PASSWORD
# Enter your password when prompted
```

## Step 5: Deploy!

```bash
npm run deploy
```

You'll see:
```
Published worker-panel (X.XX sec)
  https://worker-panel.YOUR-SUBDOMAIN.workers.dev
```

## Step 6: Access Your Panel

1. Visit the URL from Step 5
2. Login with your password (or any password if not set)
3. Configure your settings
4. Copy your subscription links!

## What's Next?

### Configure Protocols
- ✅ Enable VLESS, Trojan, or both
- ✅ Add external provider URLs
- ✅ Set up your address pool

### Get Subscription Links
```
Base64: https://your-worker.workers.dev/sub?token=TOKEN
Clash:  https://your-worker.workers.dev/clash?token=TOKEN
Raw:    https://your-worker.workers.dev/raw?token=TOKEN
```

### Advanced Features
- 🔧 Use the Address Editor to manage IPs
- 🚀 Find optimal IPs with Best IP Finder
- 🎯 Configure fingerprints and ALPN
- 🌍 Set country filters

## Troubleshooting

**Can't login?**
- If no password set, any password works
- Set password: `wrangler secret put PASSWORD`

**No configs generated?**
- Add addresses in Address Pool section
- Or add provider URLs
- Check protocols are enabled

**Need help?**
- Check full README.md
- Review Cloudflare Workers docs
- Open an issue on GitHub

## Development Mode

Want to test locally first?

```bash
npm run dev
# Visit http://localhost:8787
```

---

**That's it! You're ready to go! 🚀**
