# Contributing

Keep changes focused and preserve the local-only trust boundary.

Before committing:

    pnpm install --frozen-lockfile
    pnpm typecheck
    pnpm build

When changing execution presentation, also run the browser smoke path and check
the 320px-to-desktop responsive range. Do not add secrets, wallet material,
provider credentials, or machine-specific absolute paths.

Commit messages should describe one coherent slice of work.
