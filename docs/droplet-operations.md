# AtlasCRE — Droplet Operations Guide

The DigitalOcean droplet hosts the scraper microservice that runs browser automation for ALN and LoopNet. This guide covers everything you need to SSH in, check status, read logs, redeploy code, and troubleshoot.

---

## Access

- **IP**: `134.209.172.184`
- **User**: `root`
- **Port**: `3333` (scraper service)

### SSH in

```bash
ssh root@134.209.172.184
```

You will be prompted for the root password. Ask Nathan for it.

---

## Service Overview

The scraper runs as a **systemd service** named `atlas-scraper`.

| Item | Value |
|---|---|
| Service name | `atlas-scraper` |
| Code location | `/opt/atlas-scraper/` |
| Entry point | `dist/index.js` (compiled from `src/`) |
| Port | `3333` |
| Env vars | `/etc/systemd/system/atlas-scraper.service` |

---

## Common Commands

### Check if the service is running

```bash
systemctl status atlas-scraper
```

Look for `Active: active (running)`. If it says `failed` or `inactive`, the service is down.

### Restart the service

```bash
systemctl restart atlas-scraper
```

Use this after any code change or if the service is behaving unexpectedly.

### Stop / Start

```bash
systemctl stop atlas-scraper
systemctl start atlas-scraper
```

---

## Logs

### Last 50 lines

```bash
journalctl -u atlas-scraper -n 50 --no-pager
```

### Live / tail logs (Ctrl+C to exit)

```bash
journalctl -u atlas-scraper -f
```

### Logs since last boot

```bash
journalctl -u atlas-scraper -b --no-pager
```

---

## Health Check

The scraper exposes a health endpoint. Run this from the droplet or from any machine:

```bash
curl http://134.209.172.184:3333/health
```

Expected response: `{"status":"ok"}` (or similar). If it times out or returns an error, the service is down.

---

## Deploying Code Changes

All scraper source code lives in `scraper-service/` in the GitHub repo. When you push changes there, you need to manually pull and rebuild on the droplet — it does **not** auto-deploy like Vercel.

### Full redeploy workflow

SSH into the droplet, then run these commands:

```bash
cd /opt/atlas-scraper
git pull
npm install
npm run build
systemctl restart atlas-scraper
```

Then verify it came back up:

```bash
systemctl status atlas-scraper
```

### If a URL or file needs to be downloaded to the droplet

**Important**: Always assign long URLs to a variable before using them. Long URLs pasted directly into SSH terminals get line-wrapped and break the command.

```bash
U="https://your-long-url-here"
curl -o /opt/atlas-scraper/somefile.js "$U"
```

---

## Environment Variables

Env vars are stored directly in the systemd service file — **not** in a `.env` file.

### View current env vars

```bash
cat /etc/systemd/system/atlas-scraper.service
```

Look for lines like:
```
Environment=KEY=value
```

### Add or update an env var

Open the service file in nano:

```bash
nano /etc/systemd/system/atlas-scraper.service
```

Add or edit a line in the `[Service]` block:
```
Environment=MY_NEW_KEY=myvalue
```

**Important**: Do not use `export` — just `Environment=KEY=value`.

Save with `Ctrl+O`, exit with `Ctrl+X`, then reload and restart:

```bash
systemctl daemon-reload
systemctl restart atlas-scraper
```

### Current env vars (reference)

| Variable | Purpose |
|---|---|
| `SCRAPER_SECRET` | Shared secret — Next.js app sends this with every scrape request |
| `ALN_USERNAME` | ALN login username |
| `ALN_PASSWORD` | ALN login password |
| `LOOPNET_EMAIL` | LoopNet account email |
| `LOOPNET_PASSWORD` | LoopNet account password |
| `LOOPNET_PROXY_URL` | Decodo residential proxy URL (required for LoopNet) |
| `MAPBOX_TOKEN` | Mapbox geocoding token |

---

## Scraper Routes

The service exposes these POST endpoints (all require `Authorization: Bearer <SCRAPER_SECRET>` header):

| Route | Description |
|---|---|
| `POST /scrape/aln` | Runs ALN browser scraper |
| `POST /scrape/loopnet` | Runs LoopNet browser scraper |
| `POST /scrape/realtor` | Runs Realtor.com scraper (currently blocked) |
| `GET /health` | Health check — no auth required |

The Next.js app calls these automatically when you trigger ingestion from the `/admin` panel.

---

## ALN Session & Geocache

ALN login persists across scraper restarts via a session file:

- **Session file**: `/tmp/aln-session.json`
- **Geocache**: `/opt/atlas-scraper/geocache.json`

If ALN starts failing to scrape, delete the session file to force a fresh login:

```bash
rm /tmp/aln-session.json
systemctl restart atlas-scraper
```

The next ALN scrape will re-authenticate (may require SMS 2FA via the admin panel).

---

## Troubleshooting

| Symptom | What to check |
|---|---|
| Health check times out | `systemctl status atlas-scraper` — is it running? |
| Service fails to start | `journalctl -u atlas-scraper -n 50` — look for the error |
| ALN scrape hangs or fails | Delete `/tmp/aln-session.json`, restart service |
| LoopNet returns no results | Check proxy is set: `cat /etc/systemd/system/atlas-scraper.service \| grep PROXY` |
| Build fails after `npm run build` | Check for TypeScript errors in the output — fix in the repo, push, pull again on droplet |
| Port 3333 not responding | Service may be crashed — restart it, check logs |

---

## File Structure on Droplet

```
/opt/atlas-scraper/
  src/              # TypeScript source (matches repo scraper-service/src/)
  dist/             # Compiled JavaScript — generated by npm run build
  node_modules/
  package.json
  tsconfig.json
  geocache.json     # Mapbox geocoding cache for ALN addresses

/etc/systemd/system/
  atlas-scraper.service   # Systemd unit file — env vars live here

/tmp/
  aln-session.json  # ALN login session (auto-created, auto-deleted on logout)
```

---

## Quick Reference

```bash
# SSH in
ssh root@134.209.172.184

# Check status
systemctl status atlas-scraper

# Live logs
journalctl -u atlas-scraper -f

# Restart
systemctl restart atlas-scraper

# Full redeploy
cd /opt/atlas-scraper && git pull && npm install && npm run build && systemctl restart atlas-scraper

# Health check
curl http://134.209.172.184:3333/health
```
