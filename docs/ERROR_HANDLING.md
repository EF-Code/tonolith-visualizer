# Local execution failures

The step operation stops automatic execution when the reference emulator
throws. The UI displays the error in an alert region and pauses the run loop.

A failure does not mutate the displayed state because the emulator returns a
new state only after a successful instruction. Reset creates a fresh canonical
state and clears the local trace and error message.

Errors in this surface are local diagnostics. They should not be translated
into contract failure claims without a matching on-chain transaction.
