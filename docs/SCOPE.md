# Product scope

Tonolith Visualizer is a browser-based laboratory for observing the Tonolith v1
reference machine. It makes deterministic execution legible without changing
the contract, emulator, ROM, or state-commitment rules.

The current release focuses on:

- one canonical Fibonacci program;
- replaying the recorded 97-transaction Fibonacci testnet run;
- one-instruction stepping and bounded replay controls;
- decoded ROM, registers, RAM, flags, output events, and state hashes;
- deployment commitments, transaction links, and observed chain metadata;
- responsive, read-only presentation suitable for a public demonstration;
- a separate local emulator mode for unconnected experimentation.

The testnet view is a historical snapshot, not a live RPC feed. It does not
submit transactions or connect wallets. Browser reconstruction proves agreement
with the checked-in evidence and the pinned emulator; it does not establish
mainnet readiness or replace independent chain verification.
