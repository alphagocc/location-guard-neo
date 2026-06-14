# Location Guard Neo

A UserScript that protects your browser geolocation privacy by adding controlled noise or spoofing with fixed/IP-based coordinates. Rewritten from the discontinued [Location Guard](https://github.com/chatziko/location-guard) browser extension (killed by Chrome's MV2 deprecation).

## Features

- **Privacy levels** — add configurable Laplace noise (low/medium/high) for differential privacy guarantees
- **Fixed location** — always report a predefined location, completely independent from your real one
- **IP-based location** — derive coordinates from your public IP address, with automatic cache invalidation on IP change — ideal for proxy/VPN users to prevent geolocation leaks
- **Per-level caching** — noisy/IP positions are cached to avoid generating multiple samples centered on the real location
- **Modern config UI** — React + Vite SPA with light/dark mode, Leaflet maps, and responsive sidebar

## Supported UserScript Managers

- [Tampermonkey](https://www.tampermonkey.net/)
- [Violentmonkey](https://violentmonkey.github.io/)

## Installation

Install from the project site:

```
https://location-guard-neo.eof.moe/dist/location-guard-neo.user.js
```

## Configuration

Open your UserScript manager menu → **Location Guard** → **Configuration**, or visit:

```
https://location-guard-neo.eof.moe/options
```

### Privacy Levels

| Level    | Behavior                                                                     |
| -------- | ---------------------------------------------------------------------------- |
| Fixed    | Returns a preconfigured fixed location (no real geolocation call)            |
| IP-based | Derives location from public IP address (cached 24h, refreshes on IP change) |
| High     | Adds noise with 2000m radius, 60min cache                                    |
| Medium   | Adds noise with 500m radius, 30min cache                                     |
| Low      | Adds noise with 200m radius, 10min cache                                     |
| Real     | No modification, real location passed through                                |

## Building from Source

```bash
git clone https://github.com/Alphagocc/location-guard-neo.git
cd location-guard-neo
pnpm install
pnpm run build
```

The built UserScript will be at `packages/userscripts/dist/location-guard-neo.user.js`.

### Development

```bash
# UserScript (watch mode)
cd packages/userscripts && pnpm run dev

# Config UI (Vite dev server on port 5173)
cd packages/web && pnpm run dev
```

To test locally, point the UserScript at your local dev server:

```bash
cd packages/userscripts
CONFIG_UI_HOST=localhost:5173 CONFIG_UI_ORIGIN=http://localhost:5173 pnpm run build
```

### Build-time Configuration

| Variable           | Default                                        | Description                              |
| ------------------ | ---------------------------------------------- | ---------------------------------------- |
| `CONFIG_UI_HOST`   | `location-guard-neo.pages.dev`                 | Hostname for the configuration UI        |
| `CONFIG_UI_ORIGIN` | `https://${CONFIG_UI_HOST}`                    | Full origin URL for the configuration UI |
| `DIST_BASE_URL`    | `https://unpkg.com/location-guard-neo@latest/dist` | Base URL for UserScript update/download  |

## How It Works

Websites request your location via the browser's Geolocation API. Location Guard Neo intercepts `getCurrentPosition` and `watchPosition`, then either:

1. Returns a fixed position (no real geolocation call)
2. Returns an IP-derived position (via ipinfo.io / ip2location.io / ip-api.com fallback chain)
3. Calls the real API, then adds [Planar Laplace noise](http://arxiv.org/abs/1212.1984) for differential privacy
4. Passes through the real location unmodified

The noise mechanism is based on a 2D Laplace distribution, formally providing a variant of [differential privacy](https://en.wikipedia.org/wiki/Differential_privacy). See the [CCS'13 paper](http://arxiv.org/abs/1212.1984) for details.

## TODO

- [ ] Per-domain configuration — different privacy levels per website

## License

[MIT](./LICENSE)
