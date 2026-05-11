---
name: tinyworld-opacity-torch
description: Use when changing ghost boards, multiplayer preview boards, panning, opacity falloff, vignette, tilt-shift, or any visibility behavior around the active Tiny World board.
---

# Tiny World Opacity Torch

Mental model:

- Every user has one 8x8 board.
- The central editable board remains the only board that can be built on.
- Surrounding boards simulate other users in local mode and must stay non-editable.
- Visibility is a continuous opacity torch, not board snapping.

Opacity rules:

- Treat all rendered boards as ghost by default.
- A smooth 8x8 opacity torch centered on camera `target.x/z` raises anything inside that square to full opacity, regardless of which board owns it.
- Outside the torch, feather back down over `VIEW_EDGE_FADE_TILES`, then fade out farther with `GHOST_OUTER_FADE_TILES`.
- Floor-level tiles should be lower opacity than objects in ghost/faded areas.
- Do not initialize new ghost boards at a visible default opacity; initialize each child from `opacityAtWorldPosition(...)` immediately.
- Keep opacity transitions eased through `tickOpacityTransitions(dt)`.

Interaction rules:

- Left-click edits only the central home board through `pickTile`.
- Ghost board meshes must not set `userData.gx/gz`.
- Right-drag pans. Space+drag pans. Left-drag orbits.

Validation:

- Panning should not create square board-shaped opacity pops.
- Far preloaded board tiles should initialize with opacity `0`.
- `pickTile()` over a ghost board should return `null`.
