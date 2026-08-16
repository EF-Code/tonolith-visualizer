# Tonolith Visualizer

An interactive, read-only laboratory for the Tonolith v1 4-bit processor.

The default view replays the earlier Tonolith Fibonacci deployment on TON
testnet, one accepted transaction at a time. The machine state is rebuilt in
the browser from the pinned TypeScript reference emulator and checked against
the state hashes and CPU events recorded by the contract. A separate local
emulator mode is available for experimenting with the same program without
chain data.

Project guides live in the docs/ directory: scope, architecture, trust boundary,
local development, validation, deployment, accessibility, security, visual QA,
release, and the testnet read model.

## Local development

```sh
pnpm install
pnpm dev
```

Open `http://localhost:5173`.

```sh
pnpm typecheck
pnpm build
pnpm preview
```

## Architecture boundary

- `tonolith` is pinned to the Tonolith reference repository commit used by the
  visualizer. The UI does not reimplement ISA execution.
- Browser code imports the package's `tonolith/browser` entrypoint, which keeps
  the Node-only file assembler out of the client bundle. A small Buffer
  compatibility shim is used because the canonical TON cell hash implementation
  exposes Node's Buffer API.
- The testnet view is a checked-in, read-only snapshot of the historical
  Fibonacci run. It does not query a wallet, submit transactions, or pretend to
  be a live RPC dashboard.
- The local emulator remains available as a separate mode and is never labeled
  as chain execution.
- Private keys, mnemonics, and wallet files are not part of this project.

## Refreshing the historical snapshot

The snapshot is generated from the public TON testnet account history. To
refresh it deliberately, run:

```sh
pnpm snapshot:testnet
```

The generator validates the 97 accepted advances, the seven output events, and
the final emulator hash before writing `data/fibonacci-testnet.json`. A refresh
should be reviewed as new chain evidence and committed separately from UI work.
