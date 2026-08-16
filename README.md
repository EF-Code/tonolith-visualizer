# Tonolith Visualizer

An interactive, read-only laboratory for the Tonolith v1 4-bit processor.

The first slice runs the canonical Fibonacci program in the same TypeScript
reference emulator used by the Tonolith repository. It exposes the program
counter, decoded instruction, accumulator, flags, registers, RAM window,
output events, and state hashes while the program executes one instruction at
a time.

Project guides live in the docs/ directory: scope, architecture, trust boundary,
local development, validation, deployment, accessibility, security, visual QA,
release, and the future testnet read model.

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
- The current surface is local emulation only. It does not connect a wallet or
  submit transactions.
- A future testnet view will be read-only first and will label chain evidence
  separately from local emulator output.
- Private keys, mnemonics, and wallet files are not part of this project.
