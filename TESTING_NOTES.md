# SciCalc — Testing Notes

A short, living log of what was tested, when, and the result. Updated by Bikash
Talukder with each QA pass. Future agents/devs should read this first before
making changes.

---

## 2026-08-27 — Performance & UX pass

**Stack under test:** React 19 + Vite 6 + Tailwind v4, framer-motion 12.

### Engine correctness (`npm test`)
- 50 / 50 cases pass — `src/engine/engine.test.js`.
- Coverage: arithmetic, precedence, parens, unary minus, power, factorial,
  percent (additive / subtractive / standalone), implicit multiplication,
  trig in DEG/RAD, inverse trig, ln/log/sqrt, scientific notation parsing,
  formatting edge cases (tiny / huge / float noise / zero), error paths
  (divide-by-zero, unbalanced parens, trailing operator, negative factorial,
  asin domain, tan pole), `safeEvaluate` shape, empty input.

### Build (`npm run build`)
- Clean build, 385 ms.
- `dist/index.html` 1.46 kB · `dist/assets/index-*.css` 40.68 kB ·
  `dist/assets/index-*.js` 226.99 kB (gzip 70.81 kB).

### Reported user bug — `.` key felt slow
**Root cause (not the engine):** the math engine itself runs in microseconds.
The lag came from React re-rendering all 30 keypad buttons + the Display card
on every keystroke because:
1. `useCalculator` returned a new object literal each render (unstable identity).
2. `Key` had no `React.memo`, and `onPress={() => …}` was a fresh arrow each
   render.
3. Live preview `safeEvaluate` ran at the same priority as the keystroke paint.

**Fix shipped in this pass:**
- `useCalculator`: return wrapped in `useMemo` (stable identity).
- Preview: `useDeferredValue(input)` defers the parse/eval to a lower priority.
- `Keypad` + `Key`: extracted handler refs via `useKeyActions(calc)`,
  wrapped both in `React.memo`. Each button now skips re-render unless its own
  visible props change.
- `Display`: `memo` + `handleCopy` in `useCallback`.
- `HistoryList`: `memo` so typing doesn't repaint the history.

### 2026-08-27 — Senior audit + 3D buttons + hook split

**Stack under test:** React 19 + Vite 6 + Tailwind v4 + framer-motion 12.

### Engine correctness (`npm test`)
- 50 / 50 cases still pass after the hook split (`useExpression` /
  `useHistory` / `useKeyboardShortcuts` / `useLocalStorageState`). The
  tokenizer, parser and evaluator modules are unchanged.

### Build (`npm run build`)
- Clean build, ~600 ms.
- `dist/index.html` 1.46 kB · `dist/assets/index-*.css` 46.49 kB ·
  `dist/assets/index-*.js` 364.16 kB (gzip 115.08 kB).

### Headless diagnostic (`scripts/diagnose.mjs`)
- `Title`, `#root children === 1`, no console errors, no pageerrors.
- The split hook bundle loads cleanly.

### Senior audit — what was actually wrong
- **Dead code:** `previewRef` in the old hook was set but never read.
  Stale inline SVGs duplicated between `App.jsx` and `InstallBanner.jsx`.
  Unused Tailwind tokens (`accent-100/200`, `paper-200`, `bg-grain`).
  Unused `angleMode`/`toggleAngle` wiring on `useCalculator`.
- **Weak logic / bugs:**
  - `useCalculator` re-bundled `state` and `actions` on every keystroke,
    invalidating every memo in the keypad.
  - The keypad used `() => a.op('+')` inline arrows — fresh identity on
    every render, defeating `React.memo`.
  - `useKeyboardShortcuts` re-bound the listener every state change
    because it closed over `calc` directly.
  - `Icon.jsx` had a `DeleteIcon` that's actually a backspace glyph;
    renamed `BackspaceIcon`.
- **Perf:**
  - Removed framer-motion's per-key `motion.button` and `stagger` in
    favour of CSS `:active` transform + layered box-shadow. 3D-feel
    without per-press JS work.
  - Hook split keeps individual callback identities stable across input.
  - Keypad now reads `actions` and `angleMode` through refs so its
    handler map is computed once and never re-creates per render.
- **Refactor:**
  - `useCalculator` (304 lines) → 4 focused hooks (`useLocalStorageState`,
    `useHistory`, `useExpression`, `useKeyboardShortcuts`) + a thin
    `useCalculator` (60 lines) that composes them.
  - `App.jsx` split into subcomponents (`AmbientBlobs`, `ThemeToggle`,
    `ModeSwitch`, `OfflineBanner`) for readability.
  - `Key.jsx` rewritten as a pure-CSS 3D key (no JS animation).

### Visual / UX
- **3D buttons.** Each variant (`digit` / `fn` / `op` / `equals` /
  `danger` / `ghost`) has a layered box-shadow that defines the bevel
  and a `:active` translate that flattens it on press. Top-edge
  highlight gives the impression of a light source. The feel is
  consistent across the keypad — same bevel language, different hues.
- **No motion budget wasted on every key press.** The springy key
  motion is gone; what remains is the layout-animated mode pill and
  the theme toggle (where motion earns its keep).
- **`prefers-reduced-motion`** still respected by framer-motion and the
  global CSS rule.

### Known limitations (still)
- PWA install prompt on iOS Safari requires the Share sheet
  (`scripts/diagnose.mjs` and `scripts/offline-test.mjs` can't simulate
  that — manual).
- Service worker offline flow exercised only by `scripts/offline-test.mjs`
  (Puppeteer).

### Reported user bug — dot → operator still lagged
**Root cause:** `useDeferredValue` keeps returning the *previous* value while
new input arrives. When the user typed `.` then `+` quickly, `preview` was
clobbered between renders and the keypad tree still invalidated. The hook
also returned a single object containing both state and action refs, so any
state change (even unrelated ones) replaced every consumer's `calc` identity.

**Fix shipped in this pass:**
- `useCalculator` now exposes **two references**: a stable `actions` bundle
  (memoized with `useCallback` deps so its identity only flips when a real
  callback identity changes) and a `state` bundle. Consumers can subscribe to
  exactly what they need.
- `preview` is now debounced via a 120 ms `useEffect` timer instead of
  `useDeferredValue` — rapid dot/operator sequences never queue stale previews
  and the Display only repaints once after typing pauses.
- `Keypad` accepts `actions` + `angleMode` separately so its `useKeyActions`
  only invalidates when those specific refs change. The 30 button tree stays
  put during normal typing.
- `App.jsx` updated to read `calc.actions.*` everywhere.

### Other small fixes shipped
- `App.jsx`: theme init + `localStorage.setItem` wrapped in try/catch for
  private-mode / SSR safety; `navigator.onLine` guarded for SSR.
- `App.jsx`: `*` and `x` keyboard shortcuts now `preventDefault` (Firefox
  Find-as-you-type would otherwise steal them).
- `App.jsx`: keyboard `useEffect` deps now include `calc.angleMode` so the
  `d` DEG/RAD toggle can't go stale.
- `HistoryDrawer.jsx`: `w-84` (not a default Tailwind class) → `w-80`.

### UI / aesthetic refresh (this pass)
- Palette shifted from generic violet/cyan to a **rose → amber → teal** sunset
  gradient that reads modern and warm in both light and dark.
- New ambient blobs (animated, framer-motion).
- Display card springs in, keypad staggers in on mount, each key press has a
  90 ms scale tap. Theme toggle flips the gradient palette smoothly.
- All animations honour `prefers-reduced-motion`.

### Manual smoke (browser)
- [ ] Dev server loads at `http://localhost:5173/` with no console errors.
- [ ] Cold load → tap `7`, `.`, `5`, `+`, `2`, `=` → display shows `9.5`.
- [ ] Tap `.` immediately after `=` → new number starts with `0.`.
- [ ] Toggle DEG ↔ RAD: `sin(30) =` → `0.5` (DEG) vs `sin(30) =` → `-0.988`
      (RAD). Confirms angle mode persistence + correct trig.
- [ ] History persists across reload (IndexedDB).
- [ ] Offline: toggle DevTools "Offline" → banner shows, app still works.
- [ ] Keyboard: type `2+2=`, press `h` → history opens, `Esc` closes.
- [ ] Light theme: text contrast ≥ 4.5:1 on every state.

### Known limitations / not yet tested
- PWA install prompt on iOS Safari requires Share-sheet handoff (manual).
- Service worker offline flow is exercised via `scripts/offline-test.mjs`
  (Puppeteer). Run locally before each release:
  `node scripts/offline-test.mjs http://localhost:4199/`.
