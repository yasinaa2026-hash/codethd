import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8"
};

const allowedLanguages = new Set([
  "python", "javascript", "typescript", "java", "c", "cpp", "csharp",
  "go", "rust", "php", "ruby", "kotlin", "swift", "dart", "r", "perl",
  "lua", "bash", "powershell", "haskell", "elixir", "erlang", "clojure",
  "scala", "fsharp", "fortran", "cobol", "julia", "nim", "crystal", "zig",
  "d", "ocaml", "prolog", "scheme", "commonlisp", "groovy", "objectivec",
  "assembly", "solidity"
]);

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function decodeJudge0(value: string | null | undefined) {
  if (!value) return "";
  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function safeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const origin = request.headers.get("origin");
  const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";
  if (origin && allowedOrigin !== "*" && origin !== allowedOrigin) {
    return jsonResponse({ error: "Origin is not allowed." }, 403);
  }

  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    return jsonResponse({ error: "Please sign in before running code." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const judge0Url = (Deno.env.get("JUDGE0_URL") || "").replace(/\/$/, "");
  const judge0Key = Deno.env.get("JUDGE0_API_KEY") || "";
  const languageMapRaw = Deno.env.get("JUDGE0_LANGUAGE_IDS") || "{}";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Server authentication is not configured." }, 503);
  }
  if (!judge0Url) {
    return jsonResponse({ error: "The CodeTHD execution engine has not been configured yet." }, 503);
  }

  let body: { language?: unknown; code?: unknown; stdin?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON." }, 400);
  }

  const language = safeString(body.language).toLowerCase();
  const code = safeString(body.code);
  const stdin = safeString(body.stdin);

  if (!allowedLanguages.has(language)) {
    return jsonResponse({ error: "This language is not enabled for execution." }, 400);
  }
  if (!code.trim()) {
    return jsonResponse({ error: "Write some code before running it." }, 400);
  }
  if (new TextEncoder().encode(code).byteLength > 24000) {
    return jsonResponse({ error: "Code is too large. Maximum size is 24 KB." }, 413);
  }
  if (new TextEncoder().encode(stdin).byteLength > 4000) {
    return jsonResponse({ error: "Input is too large. Maximum size is 4 KB." }, 413);
  }

  let languageIds: Record<string, number>;
  try {
    languageIds = JSON.parse(languageMapRaw);
  } catch {
    return jsonResponse({ error: "JUDGE0_LANGUAGE_IDS must be valid JSON." }, 503);
  }
  const languageId = languageIds[language];
  if (!Number.isInteger(languageId) || languageId <= 0) {
    return jsonResponse({ error: "A runtime for " + language + " has not been enabled by the administrator." }, 400);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: userData, error: authError } = await userClient.auth.getUser();
  if (authError || !userData.user) {
    return jsonResponse({ error: "Your session is invalid or has expired. Please sign in again." }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: permitted, error: quotaError } = await adminClient.rpc(
    "consume_codethd_execution",
    {
      p_user_id: userData.user.id,
      p_daily_limit: 25,
      p_cooldown_seconds: 3
    }
  );
  if (quotaError) {
    console.error("Execution quota check failed:", quotaError.message);
    return jsonResponse({ error: "Execution quota is not configured. Apply the latest CodeTHD database schema." }, 503);
  }
  if (permitted !== true) {
    return jsonResponse({ error: "Execution limit reached. Wait a few seconds or try again tomorrow." }, 429);
  }

  let judgeResponse: Response;
  try {
    judgeResponse = await fetch(judge0Url + "/submissions?base64_encoded=true&wait=false", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(judge0Key ? { "X-Auth-Token": judge0Key } : {})
      },
      body: JSON.stringify({
        source_code: encodeBase64(code),
        stdin: encodeBase64(stdin),
        language_id: languageId,
        cpu_time_limit: 2,
        cpu_extra_time: 1,
        wall_time_limit: 5,
        memory_limit: 128000,
        enable_network: false
      }),
      signal: AbortSignal.timeout(10000)
    });
  } catch (error) {
    console.error("Judge0 submit failed:", error);
    return jsonResponse({ error: "The execution engine could not be reached." }, 502);
  }

  if (!judgeResponse.ok) {
    console.error("Judge0 returned status:", judgeResponse.status);
    return jsonResponse({ error: "The execution engine rejected the request. Check its language configuration." }, 502);
  }

  let submission: Record<string, unknown>;
  try {
    submission = await judgeResponse.json();
  } catch {
    return jsonResponse({ error: "The execution engine returned an invalid response." }, 502);
  }

  let token = safeString(submission.token);
  if (!token) {
    return jsonResponse({ error: "The execution engine did not provide a job token." }, 502);
  }

  const deadline = Date.now() + 18000;
  let finalResult = submission;
  while (Date.now() < deadline) {
    const status = (finalResult.status as { id?: number } | undefined)?.id;
    if (typeof status === "number" && status >= 3) break;
    await new Promise((resolve) => setTimeout(resolve, 450));
    let poll: Response;
    try {
      poll = await fetch(
        judge0Url + "/submissions/" + encodeURIComponent(token) + "?base64_encoded=true",
        {
          headers: judge0Key ? { "X-Auth-Token": judge0Key } : {},
          signal: AbortSignal.timeout(7000)
        }
      );
    } catch {
      return jsonResponse({ error: "Timed out while waiting for the execution result." }, 504);
    }
    if (!poll.ok) return jsonResponse({ error: "Could not retrieve the execution result." }, 502);
    try {
      finalResult = await poll.json();
    } catch {
      return jsonResponse({ error: "The execution engine returned an invalid result." }, 502);
    }
  }

  const finalStatus = finalResult.status as { id?: number; description?: string } | undefined;
  if (!finalStatus || (typeof finalStatus.id === "number" && finalStatus.id < 3)) {
    return jsonResponse({ error: "The execution timed out. Try a smaller program." }, 504);
  }

  return jsonResponse({
    language,
    status: finalStatus.description || "finished",
    stdout: decodeJudge0(finalResult.stdout as string | null),
    stderr: decodeJudge0(finalResult.stderr as string | null),
    compile_output: decodeJudge0(finalResult.compile_output as string | null),
    message: decodeJudge0(finalResult.message as string | null),
    exit_code: typeof finalResult.exit_code === "number" ? finalResult.exit_code : null,
    time: finalResult.time ?? null,
    memory: finalResult.memory ?? null
  });
});