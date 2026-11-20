# WPU Cloudflare binding inventory and deployment gate

## Confirmed from production screenshots and smoke tests (2026-11-20)
- Worker: `world-pickleball-union`
- Git branch: `main`
- Cloudflare build: `npm run build`
- Cloudflare deploy: `npx wrangler deploy`
- Root: `/`
- Compatibility date: `2026-11-18`
- Compatibility flags: `global_fetch_strictly_public`, `nodejs_compat`
- Present in active Worker: Images binding, R2 bucket binding, service binding
- **Absent in active Worker:** D1 binding `WPU_DB`
- D1 database name: `wpu-supporters`
- D1 database ID: `f245a594-0932-41b9-b255-aeaa1300b639`
- Smoke test: HTTP 503, `binding_missing`, `contextPresent=true`, `contextEnvPresent=true`, `contextBindingPresent=false`

## Required full configuration before editing
The production screenshots truncate the names and do not expose the deployed Worker entrypoint or assets configuration. **Do not invent these values.**

Export or copy the **effective configuration** used by the currently functioning Cloudflare deployment. Confirm all of:
- `main` Worker entrypoint (generated Next.js/OpenNext Worker entrypoint)
- `assets` directory, binding and asset configuration
- `compatibility_date`, all `compatibility_flags`
- Images binding variable name
- R2 bucket binding variable name **and bucket name**
- service binding variable name **and service name**
- any other generated or hidden bindings, including `ASSETS` and cache bindings
- D1 binding `WPU_DB` to database `wpu-supporters` with ID above

Only after obtaining these should a complete `wrangler.jsonc` be committed. The checked-in config must preserve every pre-existing binding and include `d1_databases: [{binding: "WPU_DB", database_name: "wpu-supporters", database_id: "f245a594-0932-41b9-b255-aeaa1300b639"}]`.

## Release gate
- Build and lint pass in GitHub Actions.
- Cloudflare production version reports `WPU_DB` under Bindings **after** Git deployment.
- Production smoke test returns 200 and no error.
- A pending test pledge persists in D1 and is not published before verification.
- Automated approval stays disabled until verified checks, abuse protection and audit are operational.

## Security
Never commit API tokens or secret values. Do not replace production Worker configuration with an incomplete template.
