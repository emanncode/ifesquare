# Agent rules — design-first with Pencil

## Pencil + MCP

This project uses [Pencil](https://pencil.dev) for UI design. Design files live in `design/*.pen`.

- Open designs in **VS Code** with the Pencil extension.
- Keep the active `.pen` file open while the agent uses Pencil MCP tools.
- Project MCP configs: `.grok/config.toml`, `.cursor/mcp.json` (and user-level configs from `~/Documents/pencil-agent-kit/setup-agents.sh`).

## Design-first workflow (required)

1. **Design before code** — For new UI, layout changes, or major visual work, the agent must create or update frames in `design/*.pen` first using Pencil MCP tools (`get_editor_state`, `batch_design`, etc.).
2. **User approval gate** — Do not implement UI in application code until the user explicitly approves the Pencil design (e.g. "approved", "looks good", "ship it", "go ahead and build").
3. **Match the approved design** — Implementation should follow approved frames: spacing, hierarchy, colors, copy, and screen structure.
4. **Mid-project agent switches** — The same `design/*.pen` files are the source of truth. Any agent (Grok, Cursor, Claude Code, Copilot, Kiro) should read the current Pencil canvas before changing UI.
5. **After approval** — Implement in the project’s normal stack, then optionally update the `.pen` file if the built UI diverges for good reasons (document why in the PR/commit).

## When Pencil is unavailable

If Pencil MCP is not connected, ask the user to run:

```bash
~/Documents/pencil-agent-kit/setup-agents.sh
```

Then open `design/starter.pen` (or the project design file) in VS Code and restart the agent session.

## Suggested prompts

- "Design the login screen in Pencil using our dark theme — wait for my approval before coding."
- "Read the current Pencil canvas and list what’s already designed."
- "I approve the Student Home frame — implement it in the app."