---
name: tinyworld-single-file
description: Use when editing the Tiny World Builder repo, especially tiny-world-builder.html, to preserve the single-file Three.js r128 app structure and local edit/reload workflow.
---

# Tiny World Single-File Workflow

Work only in `tiny-world-builder.html` unless the user explicitly asks for repo metadata or skills.

Core rules:

- Keep the app single-file: inline CSS, inline JS, no bundler, no packages.
- Do not touch `tiny-world-builder BACKUP.html`.
- Preserve style: 2-space indent, semicolons, single-quoted strings, section comments like `// -------- tools --------`.
- Mutate board state through `setCell(x, z, opts)`, not direct `world[x][z]` writes outside initialization.
- Keep Three.js pinned to r128.
- Shared materials in `M.*` must not be mutated per instance; clone first for unique opacity/material behavior and dispose cloned materials in `disposeGroup`.

Validation:

- Run `perl -0ne 'print $1 if m#<script>\s*(.*?)\s*</script>#s' tiny-world-builder.html | node --check`.
- Prefer browser validation at `http://localhost:3000/tiny-world-builder`.
- Check console errors after visual/UI changes.
