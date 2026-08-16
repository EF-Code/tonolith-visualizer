# Validation gates

A visualizer change is ready for review when:

- the frozen pnpm install succeeds;
- TypeScript typechecking succeeds;
- the Vite production build succeeds;
- the checked-in testnet snapshot rebuilds all 97 accepted advances and agrees
  with the canonical emulator;
- the canonical Fibonacci trace still emits 1, 1, 2, 3, 5, 8, 13;
- a step changes the current hash and reset restores the initial hash;
- the default testnet replay opens at the completed run and can be reset,
  scrubbed, and advanced transaction by transaction;
- keyboard stepping works without changing form controls;
- the layout has no horizontal overflow at the supported 320px lower bound;
- browser console and page errors are absent during the smoke path.

These gates validate the browser application and the captured evidence. They do
not replace Tonolith contract tests, a fresh chain query, or mainnet/production
verification.
