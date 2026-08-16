# Deployment

The project is a static Vite site and is configured for Vercel with:

- install command: pnpm install --frozen-lockfile;
- build command: pnpm build;
- output directory: dist/.

Connect the main branch to a dedicated Vercel project. Pull requests should
use preview deployments. Do not add wallet secrets, RPC credentials, or private
keys to Vercel environment variables for the current read-only surface.

A deployment proves that the site was built and served. It does not prove a
TON contract deployment or a testnet state.
