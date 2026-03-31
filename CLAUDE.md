# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Start production:** `npm start` (runs `node index.js`)
- **Start development:** `npm run dev` (runs `nodemon index.js` — auto-reloads on file changes)
- **Access app:** http://localhost:8080 (or `PORT` env var)

## Architecture

This is a Node.js/Express web app designed to run on a Raspberry Pi as an on-stage lyrics/setlist display, controlled by 3 physical foot-switch buttons.

### Server ([index.js](index.js))

- Express on port 8080 with Pug templates and Showdown Markdown
- Scans both local `setlist-*/` directories and USB drives (via `drivelist` + `glob`) for `setlist.json` manifests
- Persists the selected setlist via `node-persist`
- Custom Showdown extensions transform `~refrain~...~/refrain~` and `~bridge~...~/bridge~` tags into colored `<span>` elements, and insert `<br>` after each lyric line

### Routes

| Route | Purpose |
|-------|---------|
| `GET /` | Setlist view — lists all songs in selected setlist |
| `GET /:filename` | Song view — renders a `.md` lyrics file as HTML |
| `GET /settings` | Settings view — select active setlist |
| `POST /settings` | Save selected setlist to persistent storage |

### Frontend Button System ([views/layout.pug](views/layout.pug))

All pages share a 3-button footer (left/middle/right). Keyboard keycodes are configurable via env vars (`KEYCODE_LEFT`, `KEYCODE_MIDDLE`, `KEYCODE_RIGHT`). Each button supports:
- **Short press** (< 1.6s): navigate up/down, select, scroll
- **Long press** (≥ 1.6s): go to settings, jump to prev/next song

Page-specific logic is injected via Pug `block scripts` and uses `window.shortPressAction` / `window.longPressAction` callbacks.

### Data Format

**Setlist manifest** (`setlist-*/setlist.json`):
```json
{ "name": "Display Name", "songs": [{ "name": "Song Title", "filename": "song-file.md" }] }
```

**Song lyrics** (`setlist-*/*.md`): Standard Markdown with custom tags:
- `~refrain~...~/refrain~` — colored refrain block
- `~bridge~...~/bridge~` — colored bridge block

### Environment Variables (`.env`)

```
PORT=8080
FONT_SIZE=30px
REFRAIN_COLOR=yellow
BRIDGE_COLOR=orange
HIGHLIGHT_COLOR=yellow
KEYCODE_LEFT=37
KEYCODE_MIDDLE=40
KEYCODE_RIGHT=39
```

## Raspberry Pi Deployment

Auto-start via cron (`@reboot node /usr/src/raspberry-text-monitor/index.js &`), display rotated via `xrandr`, Chromium launched in kiosk mode pointing to localhost:8080.
