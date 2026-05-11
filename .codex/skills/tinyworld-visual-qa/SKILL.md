---
name: tinyworld-visual-qa
description: Use when visually testing Tiny World Builder UI, camera, ghost opacity, buildings, tile geometry, or frontend polish in the browser.
---

# Tiny World Visual QA

Use the browser route `http://localhost:3000/tiny-world-builder` when available.

Checks:

- Console has no app errors.
- Toolbar shortcuts still work: `0`, `1`-`9`, letter tools, `E`.
- Left-click places only on the editable home board.
- Right-drag and Space+drag pan smoothly.
- Orbit still works with normal left-drag.
- Ghost boards do not become editable.
- The opacity torch is smooth and does not reveal square board seams.
- Vignette and tilt-shift overlays have `pointer-events: none` and stay below UI controls.
- Building details should be believable: manor portico columns stay entry-scale, windows have frames/crossbars, and tall buildings do not stretch entry features unrealistically.

Useful browser probes:

```js
pickTile(window.innerWidth / 2, window.innerHeight / 2)
```

```js
getComputedStyle(document.body, '::before').pointerEvents
getComputedStyle(document.body, '::after').pointerEvents
```
