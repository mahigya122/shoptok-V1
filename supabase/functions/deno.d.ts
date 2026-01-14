// Minimal Deno type shims for Supabase Edge Functions.
//
// These functions run on Deno (not Node). If you use the VS Code Deno extension,
// you'll get full types automatically. This file prevents TypeScript from
// erroring on the global `Deno` symbol when editing in a TS/Node workspace.

declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
  }

  /**
   * Deno.serve(handler) is supported in Supabase Edge Functions runtime.
   * We keep the types loose here to avoid mismatches across Deno versions.
   */
  function serve(
    handler: (request: Request) => Response | Promise<Response>,
    options?: unknown
  ): unknown;
}
