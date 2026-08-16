# Validation gates

A visualizer change is ready for review when:

- the frozen pnpm install succeeds;
- TypeScript typechecking succeeds;
- the Vite production build succeeds;
- the canonical Fibonacci trace still emits 1, 1, 2, 3, 5, 8, 13;
- a step changes the current hash and reset restores the initial hash;
- keyboard stepping works without changing form controls;
- the layout has no horizontal overflow at the supported 320px lower bound;
- browser console and page errors are absent during the smoke path.

These gates validate the local application. They do not replace Tonolith contract
tests or real testnet verification.
