# Emulator boundary

The visualizer calls the TypeScript reference emulator directly. It does not
copy instruction semantics into UI code. Both the local mode and the historical
testnet replay use the same pinned emulator package.

The following claims are local claims:

- a displayed step was produced by the pinned emulator package;
- the displayed output sequence matches that emulator's Fibonacci program;
- the displayed state hash was calculated from the same architectural state.

The testnet mode adds a separate, checked-in chain-evidence layer. Its chain
claims are limited to the captured public account history and linked explorer
transactions. Matching a recorded contract hash against the emulator proves
that the snapshot is internally consistent; it does not establish live current
state, consensus finality beyond the source's account history, keeper behavior
outside the captured run, or production readiness.
