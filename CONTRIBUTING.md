# Contributing

Keep changes focused and preserve the read-only trust boundary between the
historical testnet snapshot and the local emulator.

Before committing:

    pnpm install --frozen-lockfile
    pnpm typecheck
    pnpm build

When changing the chain evidence, also run:

    pnpm snapshot:testnet

When changing execution presentation, also run the browser smoke path and check
the 320px-to-desktop responsive range. Do not add secrets, wallet material,
provider credentials, or machine-specific absolute paths.

Commit messages should describe one coherent slice of work.
