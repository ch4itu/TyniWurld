# AGENTS.md

Guidance for AI coding agents working in this repo. Read this before touching
`tiny-world-builder.html`.

## Project shape

- One file: `tiny-world-builder.html`. Inline CSS in `<style>`, inline JS in a
  single `<script>` block at the bottom. Three.js **r128** loaded from cdnjs.
- No build, no bundler, no package manager, no tests. Edit the HTML, reload
  the browser. That's the whole loop.
- `tiny-world-builder BACKUP.html` is a manual snapshot. Don't auto-update it.

## Repo-local skills

- Local skills live in `.codex/skills/*/SKILL.md`. Read the relevant skill before
  changing the matching system.
- When a change creates a durable pattern, update the related skill in the
  same turn. If there is no related skill, create a new concise one.
- Current skill routing:
  - `.codex/skills/tinyworld-single-file` — repo workflow and single-file constraints.
  - `.codex/skills/tinyworld-auto-batching` — Auto palette inference/cache behavior.
  - `.codex/skills/tinyworld-opacity-torch` — ghost boards, panning, opacity torch.
  - `.codex/skills/tinyworld-tile-variation` — repeat-click levels and terrain/object variation.
  - `.codex/skills/tinyworld-visual-qa` — browser checks and visual QA.
  - `.codex/skills/tinyworld-render-performance` — post-processing, renderer, shadows, and GPU budget.
  - `.codex/skills/tinyworld-lowpoly-world-prompt` — model prompting for coherent low-poly worlds.

## House style

- Vanilla ES6+, no semicolons would be wrong here — **this file uses
  semicolons**, follow the existing style.
- 2-space indent, trailing commas where present, single quotes for strings.
- Section comments are `// -------- name --------` and they matter — keep
  related code grouped under them. If you add a new system, give it its own
  section header.
- Boring obvious code over clever. The whole app is ~1600 LoC; keep it that
  way.

## Mental model

Two parallel data structures:

```
world[x][z]                  // intent  — { terrain, terrainFloors, kind, floors }
cellMeshes['x,z']            // render — { tile: Group, object: Group|null }
```

Mutate via **`setCell(x, z, opts)`**. It:

1. updates `world[x][z]`,
2. rebuilds the tile mesh if terrain / terrainFloors changed (or `forceTile` is set),
3. rebuilds the object mesh,
4. re-renders adjacency-sensitive neighbors (fences, house clusters).

Never write to `world[x][z]` directly outside of init — go through `setCell`,
or you will desync intent from rendering.

## Adding a new object kind

1. Add a factory: `function makeWidget(...)` returning a `THREE.Group`.
2. Add a tool entry to `TOOLS` (id, label, kind, color, optional
   `terrainOverride`).
3. Handle the `kind` in `renderCellObject` — call your factory, set
   `userData.kind`, push a drop-in animation if appropriate.
4. If the kind needs adjacency awareness, write a `getXxxNeighbors(x, z)`
   helper and re-render neighbors inside `setCell` (mirror the fence/house
   pattern at the bottom of `setCell`).
5. If the kind animates per-frame, add a branch inside the `for (const key in
   cellMeshes)` loop in `animate()` and **respect `obj.userData.landing`** so
   it doesn't fight the drop-in.

## Adding a new terrain

1. Add a material to `M`.
2. Add a tool entry with `terrain: 'name'`.
3. Handle the name inside `makeTile(terrain)` — pick `topMat` and any decals
   (flecks, scuffs, ripples).

## Three.js gotchas in this codebase

- **r128** is pinned. `MeshLambertMaterial`, `ExtrudeGeometry`, and the
  shadow setup all assume r128 semantics. Do not bump the version casually —
  shadows and material color spaces have changed in newer releases.
- Materials in `M.*` are **shared** across many meshes. Don't mutate
  `M.foo.color` in place; clone first.
- `disposeGroup(group)` disposes geometries but **not** materials, because
  materials are shared. Per-particle smoke clones its material and disposes
  on death — follow that pattern if you ever need a unique material per
  instance.
- Cameras: there are two (`orthoCam`, `persCam`) and `camera` is a reference
  swapped by `togglePerspective()`. `updateCamera()` writes to both.

## Performance budget

- Grid is `8x8 = 64` cells. Per-frame allocation is fine at this scale.
- If you scale the grid, the mesh-rebuild-on-neighbor-change pattern will
  start to matter — consider batching updates inside `setCell`.

## Things to avoid

- Don't pull in npm packages or a bundler. The single-file constraint is the
  point.
- Don't rename `world` / `cellMeshes` / `setCell` — they're the public
  contract of the data layer.
- Don't remove the `userData.landing` checks. They prevent animations from
  fighting the drop-in queue.
- Don't "clean up" comments without asking.
- Don't touch `tiny-world-builder BACKUP.html`.

## Quick checks before declaring done

- [ ] Page loads with no console errors.
- [ ] Tool keyboard shortcuts (`1`–`9`, `E`) still work.
- [ ] `R` resets to the preset village; `C` clears to grass with the
      staggered drop-in.
- [ ] Perspective ⇄ ortho still toggles cleanly.
- [ ] Placing/erasing a fence updates its neighbors' geometry.
- [ ] Clusters of houses still render as L/T/+/square where appropriate.
- [ ] Smoke spawns from house chimneys after they finish landing.
