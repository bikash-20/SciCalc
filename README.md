# SciCalc — Scientific Calculator https://sci-calc-eta.vercel.app/
<img width="1312" height="871" alt="image" src="https://github.com/user-attachments/assets/af4ff525-b6f1-4564-980a-a5147f328c58" />

A beautiful, modern scientific & basic calculator built with **React + Vite + Tailwind CSS v4**.
100% frontend — no backend, no API keys. Deploys to Vercel in minutes.

## Features

###  Math engine
- Hand-written tokenizer → recursive-descent parser → evaluator (**no `eval()`**, no math library)
- Proper operator precedence, parentheses, right-associative power (`2^3^2 = 512`)
- Implicit multiplication: `2π`, `3(4+1)`, `(1+2)(3+4)`
- Scientific notation parsing (`1.5e-7`) so history results can be reused
- Phone-style percent: `200+10% → 220`, `200×10% → 20`
- Friendly errors: *"Can't divide by zero"*, *"Out of domain (−1…1)"*, unbalanced parens…

###  Calculator
- **Basic mode**: classic 4-column pad
- **Scientific mode**: `sin cos tan` (+ inverses via **2nd**), `ln log √ x² xʸ n! π e % ±`
- **DEG / RAD** toggle (persisted)
- Live result preview while you type; tap `=` to commit
- Expression-aware backspace (removes whole tokens like `asin(`)
- History drawer — restore any past expression (persisted, last 50)
- Full keyboard support + copy-result-to-clipboard

###  Design
- Dark-first glassmorphism UI with ambient gradient blobs
- Light/dark theme toggle (persisted), Space Grotesk + Inter typography
- Tabular numerals for a rock-steady display, springy key-press micro-interactions
- Accessible: ≥44 px touch targets, `aria-label`s on every key, focus rings,
  `aria-live` result announcements, reduced-motion support, SVG icons only

###  PWA
- **Installable** — "Add to Home Screen" on iOS, one-tap install button on Chrome/Edge
- **Offline-ready** — service worker caches the app shell, assets, and fonts
- Maskable app icons, standalone display, safe-area aware on notched devices

## Auto-deploy (vercel.json)

`vercel.json` pins the framework preset (**Vite**), build command, and output directory,
adds immutable caching for hashed `/assets/*`, no-cache for `sw.js`/HTML, SPA rewrites,
and standard security headers. Connect the GitHub repo once at
[vercel.com/new](https://vercel.com/new) — every push to `main` deploys automatically.

## Keyboard shortcuts

| Keys | Action |
|---|---|
| `0–9` `.` | digits |
| `+ - * / ^ % ! ( )` | operators |
| `Enter` or `=` | equals |
| `Backspace` | delete token |
| `Esc` / `Delete` | all clear |
| `s c t r l g` | sin( cos( tan( √ ln( log( |
| `p` | π · `d` DEG/RAD · `h` history |

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 45-case engine test suite
npm run build    # production build -> dist/
```

## Deploy to Vercel

1. **Push to GitHub**
   ```bash
   cd scientific-calculator
   git init && git add . && git commit -m "SciCalc initial release"
   git branch -M main
   git remote add origin https://github.com/<you>/scientific-calculator.git
   git push -u origin main
   ```
2. **Import on Vercel** → [vercel.com/new](https://vercel.com/new)
   - Pick the repo — Vercel auto-detects **Vite** (build `npm run build`, output `dist`)
   - Click **Deploy**. Done ✅ every push to `main` redeploys automatically.

No environment variables needed.

## Project structure

```
src/
├── engine/          # pure math core (no React)
│   ├── tokenizer.js #   glyphs -> tokens
│   ├── parser.js    #   tokens -> AST (recursive descent)
│   ├── evaluate.js  #   AST -> number, formatting, safe wrapper
│   └── engine.test.js
├── hooks/
│   └── useCalculator.js  # state machine: input, preview, history, persistence
├── components/
│   ├── Display.jsx  Keypad.jsx  Key.jsx  HistoryDrawer.jsx  Icons.jsx
├── App.jsx          # layout, theme, keyboard bindings
└── index.css        # Tailwind v4 design tokens (@theme)
```

## Author

**Bikash Talukder** · [github.com/bikash-20](https://github.com/bikash-20)

## License

MIT — build something great with it.
