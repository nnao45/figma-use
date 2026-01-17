# Contributing

## Setup

```bash
git clone https://github.com/dannote/figma-use
cd figma-use
bun install
bun run build
```

## Development

```bash
bun run dev              # Run proxy in dev mode
bun test                 # Run tests (requires Figma with plugin open)
```

## Adding a Command

1. Create `packages/cli/src/commands/my-command.ts`
2. Export from `packages/cli/src/commands/index.ts`
3. Add handler in `packages/plugin/src/main.ts`
4. Add test in `packages/cli/tests/commands.test.ts`

See [AGENTS.md](AGENTS.md) for code examples.

## Pull Requests

- One feature per PR
- Add tests for new commands
- Run `bun test` before submitting
