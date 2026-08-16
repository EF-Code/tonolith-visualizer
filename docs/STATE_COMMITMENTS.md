# State commitments

The current core hash is derived by the canonical Tonolith emulator from the
architectural state cell. The initial hash is calculated from a fresh state.

The static commitment shown by the visualizer is derived from the canonical
Fibonacci ROM root and the ISA/schema namespace. It is a local display of the
same commitment inputs used by the Tonolith reference implementation.

A displayed hash is not a signature or a transaction identifier. In testnet
mode, the UI separately shows the contract-emitted hash recorded in the
snapshot and the emulator reconstruction used for comparison. Agreement is an
internal consistency check over captured evidence, not a proof of current TON
consensus state or production readiness.
