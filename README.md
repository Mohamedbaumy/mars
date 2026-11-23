# إحنا على المريخ: الموقع

3D city of the channel's residents. Each commenter gets a dome with their name, @handle and flag.

- Data: `src/residents.ts` is the single source. Add new residents there after each episode, then `npm run build`.
- Build: `npm run build` → `docs/app.js` (GitHub Pages serves `docs/`).
- Local: `npm run dev` → http://127.0.0.1:7060
- Deep link to a dome: `/#@handle`
