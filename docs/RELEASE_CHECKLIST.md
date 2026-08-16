# Release checklist

1. Review the diff and staged file list.
2. Scan for credentials and machine-specific paths.
3. Run the frozen install.
4. Run typecheck and the production build.
5. Run the browser smoke path against both dev and preview servers.
6. Confirm the Fibonacci sequence and state-hash reset behavior.
7. Confirm the README still says local-only where appropriate.
8. Push the intended branch and verify local/origin parity.
9. Record any unresolved chain or hosting gates in the release notes.
