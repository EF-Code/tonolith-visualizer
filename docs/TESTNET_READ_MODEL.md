# Testnet read model

The visualizer ships a read-only historical snapshot of the earlier Tonolith
Fibonacci run. The snapshot is stored in `data/fibonacci-testnet.json` and is
rendered by the default `TESTNET RUN` mode. It includes:

- the deployed Tonolith contract address and deployment transaction;
- code, initial data, state-init, ROM, and final state commitments;
- all 97 accepted transaction identifiers and explorer links;
- observed account-history timestamps, fees, input values, and balance;
- decoded `CpuAdvanced` and `CpuOutput` event data;
- the final Fibonacci output sequence and halted state.

The generator at `scripts/generate-testnet-run.mjs` reads the public TON Center
testnet account history and validates the bounded trace before writing the
snapshot. The browser then reconstructs each selected state with the canonical
emulator and checks that its hash and output metadata agree with the recorded
contract events.

The UI labels this as a historical snapshot because it does not make live RPC
requests. Each chain fact retains its source URL or observation timestamp, and
chain values are shown separately from local emulator values. No wallet is
needed to render the evidence.

This snapshot proves a specific testnet run only. It does not prove current
account state after the capture time, mainnet execution, production readiness,
or that the browser itself is an independent verifier of TON consensus.
