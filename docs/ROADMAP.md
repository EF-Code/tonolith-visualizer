# Roadmap

## Near term

- keep the testnet snapshot deterministic and easy to audit;
- keep the local emulator surface separate and easy to inspect;
- add richer instruction and memory explanations;
- preserve keyboard and narrow-screen usability;
- keep build, bundle, and credential checks in CI.

## Later

- add optional live read-only refresh with explicit freshness and provider
  labeling;
- add more recorded runs and keeper/stale-state views only when each run has
  independently reviewed evidence;
- add a comparison view for emulator, snapshot, and live account state.

Wallet signing and transaction submission are outside the current roadmap until
there is a separate threat model and product decision.
