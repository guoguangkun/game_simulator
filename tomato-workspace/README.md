# Tomato Focus Timer

Lightweight H5 timer inspired by the Pomodoro Technique. It lets you:

- ✅ Choose between 15- or 30-minute focus intervals
- ▶️ Start / stop a countdown with smooth controls
- 🔔 Enable/disable reminder sound after each session
- 🗓️ Keep a rolling session log that persists locally

## Getting started

1. Open `workspace/dist/index.html` in any modern browser.
2. Choose a preset interval or enter a custom duration (even 1 minute), toggle reminders, and press **Start**.
3. After each countdown completes, the entry is added to the session log.
4. Click **Clear log** to reset your history.

## Files

- `index.html` — Minimal structure, timer controls, session log.
- `css/style.css` — Glassmorphic styling with button/gradient animations.
- `js/tomato.js` — Timer logic, persistence, and history rendering.

## Persistence

Settings (interval + reminder toggle) and session history are stored in `localStorage`, so your preferences survive page reloads. The timer plays a soft wind-chime alert when the countdown finishes, and you can toggle gentle background music from the controls.
