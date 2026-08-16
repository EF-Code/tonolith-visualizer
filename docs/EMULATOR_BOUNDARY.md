# Emulator boundary

The visualizer calls the TypeScript reference emulator directly. It does not
copy instruction semantics into UI code.

The following claims are local claims:

- a displayed step was produced by the pinned emulator package;
- the displayed output sequence matches that emulator's Fibonacci program;
- the displayed state hash was calculated from the same architectural state.

These claims do not establish contract execution, testnet inclusion, finality,
fees, keeper behavior, or production readiness. Any future chain view must label
those facts independently and link to real transaction evidence.
