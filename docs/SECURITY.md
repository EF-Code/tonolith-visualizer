# Security boundary

The current application is intentionally read-only.

It must not:

- request or store mnemonics, private keys, wallet files, or signing sessions;
- send TON messages;
- present local emulator state as a live chain state;
- embed provider credentials in client code;
- silently switch from the canonical emulator to an independent implementation.

Future network reads should be public, bounded, and clearly labeled. Any
transaction-signing feature requires a separate threat model and review.
