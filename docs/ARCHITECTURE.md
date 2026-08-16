# Architecture

The visualizer is a static Vite application with four layers:

1. `data/` stores the reviewed historical TON testnet snapshot.
2. `lib/` selects the canonical program, rebuilds replay states, and contains
   display-only formatting.
3. `components/` owns React state, replay controls, and presentation.
4. `tonolith/browser` supplies the ISA, emulator, ROM, and commitment functions.

The browser entrypoint is deliberately separate from the Node package entrypoint.
It excludes the filesystem-backed assembler loader while preserving the same
in-memory assembler and emulator implementation.

The testnet mode is static and read-only: it does not use an application server,
database, wallet session, live RPC query, or transaction relay. The generator
script is a deliberate maintenance operation outside the browser bundle.
