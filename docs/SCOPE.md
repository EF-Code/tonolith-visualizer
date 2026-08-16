# Product scope

Tonolith Visualizer is a browser-based laboratory for observing the Tonolith v1
reference machine. It makes deterministic execution legible without changing
the contract, emulator, ROM, or state-commitment rules.

The first release focuses on:

- one canonical Fibonacci program;
- one-instruction stepping and bounded automatic execution;
- decoded ROM, registers, RAM, flags, output events, and state hashes;
- responsive, read-only presentation suitable for a public demonstration.

It does not submit transactions, connect wallets, or claim that browser execution
is proof of a live TON transaction.
