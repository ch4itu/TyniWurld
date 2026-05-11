---
name: tinyworld-lowpoly-world-prompt
description: Use when editing Tiny World Builder prompts, model-generated worlds, Auto suggestions, or any model behavior that should create coherent low-poly 3D board scenes.
---

# Tiny World Low-Poly World Prompting

The built-in model should act like a compact low-poly diorama designer, not a random tile filler.

Prompt principles:

- Start from a readable scene concept: village, farm, canal, ridge, market, castle, garden, or mixed landmark.
- Use strong silhouettes: tall/short contrast, clustered houses, towers, hills, trees, walls, and clear negative space.
- Make terrain do composition work: paths lead the eye, water creates crossings, dirt groups crops, grass gives breathing room.
- Use adjacency intentionally: house clusters merge, fences connect, bridges belong on water crossings, crops form fields.
- Avoid noise: do not fill all 64 cells; leave open cells and visible paths.
- Use `floors` as variation/intensity, including terrain stacking and object detail.
- Use forced `buildingType` only when a distinct one-cell variant is wanted; otherwise leave houses as `buildingType: null` so cluster logic can work.
- Keep output strictly machine-parseable JSON matching the schema.

For Auto suggestions:

- Return candidate actions, not coordinates.
- Suggestions should be reusable across several placements.
- Include a varied ranked batch: one structural option, one terrain/path option, one nature/detail option, and one intensify/repeat option when useful.
