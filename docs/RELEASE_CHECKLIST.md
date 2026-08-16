# Release checklist

1. Review the diff and staged file list.
2. Scan for credentials and machine-specific paths.
3. Run the frozen install.
4. Run typecheck and the production build.
5. Regenerate or validate the reviewed testnet snapshot when chain evidence
   changes.
6. Run the browser smoke path against both dev and preview servers.
7. Confirm the Fibonacci sequence and state-hash reset behavior in both modes.
8. Confirm testnet facts remain separately labeled and linked to evidence.
9. Push the intended branch and verify local/origin parity.
10. Record any unresolved chain or hosting gates in the release notes.
