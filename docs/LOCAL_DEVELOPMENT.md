# Local development

Install the pinned dependency graph and start the Vite development server:

    pnpm install
    pnpm dev

The default local URL is http://localhost:5173.

Before opening a pull request, run:

    pnpm install --frozen-lockfile
    pnpm typecheck
    pnpm build

The production-shaped local server is available with pnpm preview after a
successful build.
