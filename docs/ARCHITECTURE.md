# Architecture

The visualizer is a static Vite application with three layers:

1. lib/ selects the canonical program and contains display-only formatting.
2. components/ owns React state, controls, and presentation.
3. tonolith/browser supplies the ISA, emulator, ROM, and commitment functions.

The browser entrypoint is deliberately separate from the Node package entrypoint.
It excludes the filesystem-backed assembler loader while preserving the same
in-memory assembler and emulator implementation.

There is no application server, database, wallet session, or transaction relay.
