# CodeTHD

CodeTHD is a browser-based coding workspace. The project is currently a static GitHub Pages site with Supabase-backed accounts/projects and an optional server-side execution service.

## Current workspace features

- HTML, CSS, and JavaScript editor with an isolated iframe preview.
- Dedicated language editor at `language.html?lang=Python` (the language cards already link to this route).
- Local autosave, manual save, copy, and source-file download.
- CodeMirror syntax highlighting for languages for which a CodeMirror mode exists; unsupported names remain editable as plain text.
- Authenticated execution through a Supabase Edge Function and a separately hosted Judge0 instance. This feature is **not active** until the operator completes the deployment steps below.
- Supabase-backed user accounts, projects, and community pages remain part of the existing project.

## Local / static hosting

The front end is static. It can be hosted from the repository root using GitHub Pages:

1. Open **Settings → Pages** in this repository.
2. Select **Deploy from a branch**, choose `main`, and select `/ (root)`.
3. Save. GitHub Pages publishes the site at the repository's Pages URL.

For production, use a custom domain and configure HTTPS. Keep JavaScript, CSS, and images compressed and cacheable. Do not place private keys in browser files.

## Configure multi-language execution

The editor supports syntax highlighting and file editing independently of execution. Compiled/interpreted languages require a managed sandbox. CodeTHD uses a Supabase Edge Function as an authenticated gateway to a **self-hosted Judge0** deployment.

### 1. Apply the database update

Run the full `supabase-schema.sql` in the Supabase SQL Editor for the project configured in `codethd-config.js`. This includes the atomic daily execution quota function. Review the SQL before applying it to a production database.

### 2. Deploy the Edge Function

Install the Supabase CLI, sign in, link this project, and deploy:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy execute-code
```

The function verifies the Supabase user session, limits source and stdin size, enforces a per-account daily quota/cooldown, and never returns the Judge0 API key to the browser.

### 3. Configure server-side secrets

Set these values using the Supabase Dashboard's Edge Function secrets page or the CLI. Never add them to `codethd-config.js`, HTML, JavaScript, or GitHub Pages.

- `JUDGE0_URL`: private HTTPS base URL for your self-hosted Judge0 API.
- `JUDGE0_API_KEY`: optional Judge0 API token if your deployment requires one.
- `JUDGE0_LANGUAGE_IDS`: JSON object mapping CodeTHD runtime names to language IDs reported by **your installed Judge0 version**. Example shape only: `{"python": 123, "javascript": 456}`. Do not copy these example numbers; retrieve the IDs from your server's `/languages` endpoint.
- `ALLOWED_ORIGIN`: production website origin, for example `https://yasinaa2026-hash.github.io` (origin only, without the repository path).

Supabase supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to hosted Edge Functions. If you set them manually for local testing, keep the service-role key in the server/secret store only.

### 4. Harden the execution host before exposing it

Do not expose an unprotected code runner. Operate Judge0 on infrastructure you control, use its documented sandbox configuration, disable outbound network access, keep CPU/memory/process/time limits strict, apply OS-level container isolation, monitor abuse, and restrict access to the API from the Edge Function where possible. The Edge Function also requests `enable_network: false`, but the host must be configured and verified to enforce isolation.

Start with a small set of runtimes, test each one, and only then add its ID to `JUDGE0_LANGUAGE_IDS`. A language appearing in the editor list does not mean that compiler/runtime is installed.

## Important current limits

- The editor is not a full cloud IDE yet. Multi-file workspaces, team collaboration, Git sync, public project hosting, AI assistance, and production-grade project deployment are separate features that still need implementation and review.
- Server execution is unavailable until the Edge Function, quota SQL, and private Judge0 server are deployed and tested.
- The CodeMirror mode list is not identical to the language catalogue. Some languages may show plain text until an appropriate mode is added.
- The main live preview is sandboxed. JavaScript in the main HTML/CSS/JS editor is run only when the user explicitly presses **Run** or uses Ctrl/⌘+Enter; edits do not execute it automatically.

## Development

A GitHub Actions workflow checks JavaScript syntax and the Supabase Edge Function TypeScript. Changes should be made on a feature branch and reviewed before merging into `main`.
