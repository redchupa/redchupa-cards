# 🇰🇷 Redchupa Cards

> A Lovelace card collection for Korean Home Assistant users.
> KEPCO progressive-tier · transit arrivals · pharmacy / disaster alerts · AI alert timeline · family location · 3D floorplan wrapper.

[![License][license-shield]](LICENSE)

> 🌐 한국어: [README.md](README.md)

[![Open your Home Assistant instance and open a repository inside the HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=redchupa&repository=redchupa-cards&category=plugin)

This bundle gives Korean Home Assistant users a one-shot HACS install for the cards they almost always need: KEPCO progressive tier, real-time transit, night-time pharmacies + disaster alerts, AI snapshot timelines, family location, and a 3D floorplan viewer for `floor3d-toolkit` users.

## 💡 Why this exists

Korean-targeted HA integrations like [`kr_component_kit`](https://github.com/redchupa/kr_component_kit) expose plenty of useful sensors — but visualizing them is left as a YAML exercise for each user. Showing KEPCO usage on a progressive-tier scale, sorting pharmacies by distance, building an AI-snapshot timeline — these patterns get re-invented every time. This repo ships them as reusable, drop-in cards.

## 📋 Cards in v1

All cards are pure client-side renderers. Zero outbound network calls — every data point comes from the user's Home Assistant WebSocket.

### ⚡ `kepco-progress-card` — KEPCO Progressive Tier
- Visualizes this month's usage on the standard 200 / 400 kWh tier boundaries.
- Consumes the `sensor.kepco_*` entities from `kr_component_kit`.
- Estimated bill is shown when available.

### 🚌 `transit-card` — Public Transit Arrivals
- Real-time bus / subway arrivals for any number of saved stops.
- Consumes `sensor.transit_*` from `kr_component_kit`.
- Multi-stop support with optional per-row name override.

### 💊 `pharmacy-emergency-card` — Pharmacies & Disaster Alerts
- Open-now pharmacies sorted by distance.
- Disaster / safety / weather alerts in the same panel.
- Tolerant of varied attribute names (`pharmacies` / `list` / `nearby`, `name` / `dutyName`, etc.) so it adapts to whatever shape your integration emits.

### 🤖 `ai-alert-timeline-card` — AI Alert Timeline
- True scrollback over the last N hours via `history/history_during_period`.
- 60-second TTL cache shared across instances on the same dashboard.
- Refetches only when a watched entity actually changes — no timer polling.
- Optional snapshot thumbnails (`snapshot_url` attribute) and confidence badges.

### 👨‍👩‍👧 `family-location-card` — Family Location
- Unified roster of `person.*`, `device_tracker.*`, and vehicle GPS sensors.
- State translated to *Home / Away / Zone name*; raw GPS coordinates are intentionally **not** displayed.
- Battery level and last-seen relative time shown per row.

### 🏠 `floor3d-wrapper-card` — 3D Floorplan
- Renders `.glb` floorplans (typically produced by [`floor3d-toolkit`](https://github.com/redchupa/floor3d-toolkit)) using Google's `<model-viewer>` web component.
- The viewer library lives in a **lazily-loaded chunk** (~275 KB gzip) — users who don't add this card never pay the cost.
- Configurable height, camera orbit, and auto-rotate.

---

## 📦 Installation

> ⚠️ This bundle is **not yet on HACS default**. Install through HACS Custom Repository.
> Build artifacts (`dist/*.js`) are **not committed to git** — they live on GitHub Releases, and HACS downloads them automatically.

### HACS Custom Repository

1. HACS → top-right menu (⋮) → **Custom repositories**
2. URL: `https://github.com/redchupa/redchupa-cards`
3. Category: **Lovelace**
4. After adding, install **Redchupa Cards** from HACS
5. Restart Home Assistant (or hard-refresh the dashboard)

### Adding a card

In the dashboard editor pick **Add card → Manual** and paste, for example:

```yaml
type: custom:kepco-progress-card
entity: sensor.your_kepco_progress
```

…or pick the card from the picker — every card ships a GUI editor.

Full configuration examples live in [`examples/`](examples/), including [`examples/full-dashboard.yaml`](examples/full-dashboard.yaml), a single-view sample that combines five cards into one "Korean household dashboard".

---

## 🛠️ Development

```bash
# Install deps
npm install

# One-shot build
npm run build

# Watch mode for local iteration
npm run watch

# Type-check only
npm run lint
```

Build output is a multi-chunk ES bundle under `dist/`:
- `redchupa-cards.js` — main entry (target: < 300 KB gzip; currently 15 KB)
- `redchupa-cards-model-viewer.js` — heavy chunk for `floor3d-wrapper-card`, lazy-loaded
- `redchupa-cards-*-editor.js` — per-card GUI editor chunks (~0.4 KB each)

### Running cards against a local HA

1. Copy `.env.example` to `.env.local` and fill in your **dev** HA URL & token.
2. Symlink or copy `dist/redchupa-cards.js` (and the sibling `dist/redchupa-cards-*.js` chunks) into your dev HA's `config/www/` directory.
3. Register `/local/redchupa-cards.js` as a **module** resource in *Dashboards → Resources*.
4. Run `npm run watch` and edit card YAML against the dev instance.

> ⚠️ Never put your production HA URL or long-lived token in `.env`. Use a separate dev HA instance.

### Release procedure (maintainers only)

`dist/` stays gitignored. End users receive build artifacts via **GitHub Releases**, attached automatically by [`.github/workflows/release.yml`](.github/workflows/release.yml) when a `v*` tag is pushed.

```bash
# 1. Make sure main is green
git status

# 2. Bump package.json version + commit
npm version patch       # or minor / major

# 3. Push the tag → release workflow fires
git push origin main --follow-tags
```

The workflow builds in a clean container, gates the main-bundle size, runs the secret-leak scan, then `gh release create`s a release with every produced `*.js` attached. HACS Custom Repository installs pull from these assets.

---

## 🔒 Privacy & Security

- **No outbound network calls.** Every card renders from data the user's HA already has. The bundle never reaches an external service.
- **No API keys required.** There is no place in this repo for one.
- **GPS coordinates are intentionally hidden** in `family-location-card` — only state (home / zone / away), battery, and last-seen are shown.
- The `.glb` URL in `floor3d-wrapper-card` is fetched directly by the browser from your HA instance (e.g. `/local/floor3d/home.glb`); the model data never relays through any external host.

---

## 💝 Support

If this bundle has been useful, please consider buying me a coffee 🙏

<table>
  <tr>
    <td align="center">
      <b>Toss (KR)</b><br>
      <img src="https://raw.githubusercontent.com/redchupa/ha-app-dhlottery/main/images/toss-donation.png" width="200">
    </td>
    <td align="center">
      <b>PayPal</b><br>
      <img src="https://raw.githubusercontent.com/redchupa/ha-app-dhlottery/main/images/paypal-donation.png" width="200">
    </td>
  </tr>
</table>

---

## 🙋 Support / Discussion

- **Issues**: https://github.com/redchupa/redchupa-cards/issues
- **Discussions**: https://github.com/redchupa/redchupa-cards/discussions

## 📄 License

MIT License — see [LICENSE](LICENSE).

## 🤝 Related projects

- [`kr_component_kit`](https://github.com/redchupa/kr_component_kit) — the Korean integration these cards consume.
- [`floor3d-toolkit`](https://github.com/redchupa/floor3d-toolkit) — Sweet Home 3D → HA `.glb` floorplan pipeline that feeds `floor3d-wrapper-card`.

---

<!-- shields -->
[license-shield]: https://img.shields.io/github/license/redchupa/redchupa-cards.svg
