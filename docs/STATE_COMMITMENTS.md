# State commitments

The current core hash is derived by the canonical Tonolith emulator from the
architectural state cell. The initial hash is calculated from a fresh state.

The static commitment shown by the visualizer is derived from the canonical
Fibonacci ROM root and the ISA/schema namespace. It is a local display of the
same commitment inputs used by the Tonolith reference implementation.

A displayed hash is not a signature, a transaction identifier, or proof that
a contract state exists on TON. Chain evidence requires a separate read model.
