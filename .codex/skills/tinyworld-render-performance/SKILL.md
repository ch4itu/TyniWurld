---
name: tinyworld-render-performance
description: Use when changing Tiny World Builder renderer setup, post-processing, shadows, smoke, ghost board render cost, frame loop, or GPU performance.
---

# Tiny World Render Performance

Keep post-processing lightweight.

Current renderer contract:

- Single full-screen post pass only: scene render target, then shader to screen.
- No EffectComposer dependency or bundler.
- Cap DPR; do not return to uncapped `devicePixelRatio`.
- Main WebGL context uses `antialias: false`; the post shader handles mild smoothing.
- Use `WebGLMultisampleRenderTarget` when WebGL2 is available to avoid jagged post-processed edges.
- Default color grade should stay neutral: saturation 1, contrast 1, warmth 0, mild vignette only.
- Render settings are user-adjustable and persisted in `localStorage` under `tinyworld:render:*`.
- Scene/screen controls must keep working with post-processing disabled: resolution, shadow quality, lighting, visible distance, visible size, clouds, tilt-shift blur/focus, and ghost opacity.
- Visible size is the fully opaque torch square in tile-width units; default is 8x8 and the control may expand it up to 20x20. Do not subtract half a tile from this radius, or the board edge starts fading inside the requested size.
- Ghost opacity 100% means the ghost-strength control itself is maxed, not that the visible-size boundary expands. Outside the visible-size square must still be visibly weaker than the fully rendered center.
- Post-processing-only controls are shader uniforms: brightness, saturation, contrast, vignette, and warmth.
- Shadow maps should stay modest unless a visual defect proves otherwise.
- Ghost boards should not cast shadows, and usually should not receive shadows either.
- Smoke particles must be capped and must not cast/receive shadows.

Validation:

- Run the inline script syntax check.
- Open `http://localhost:3000/tiny-world-builder`.
- Confirm `renderer.getPixelRatio()` is at or below the cap.
- Confirm post target dimensions match canvas size times DPR and samples are enabled on WebGL2.
- Confirm no console errors after reload.
