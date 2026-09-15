import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { getSafeRedirectPath } from "@/lib/auth/urls";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ConfirmationType = Extract<EmailOtpType, "email" | "signup">;

function getConfirmationType(value: string | null): ConfirmationType | null {
  return value === "email" || value === "signup" ? value : null;
}

function noStoreRedirect(url: URL) {
  const response = NextResponse.redirect(url);

  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate, max-age=0",
  );
  response.headers.set("Expires", "0");
  response.headers.set("Pragma", "no-cache");

  return response;
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = getConfirmationType(request.nextUrl.searchParams.get("type"));
  const code = request.nextUrl.searchParams.get("code");
  const flowId = request.nextUrl.searchParams.get("sb_flow_id");
  const nextPath = getSafeRedirectPath(
    request.nextUrl.searchParams.get("next"),
  );
  const supabase = await createClient();
  let isConfirmed = false;

  try {
    if (tokenHash && tokenHash.length <= 4096 && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });

      isConfirmed = !error;
    } else if (code && code.length <= 4096) {
      const options =
        flowId && flowId.length <= 256 ? { flowId } : undefined;
      const { error } = await supabase.auth.exchangeCodeForSession(
        code,
        options,
      );

      isConfirmed = !error;
    }
  } catch {
    isConfirmed = false;
  }

  if (isConfirmed) {
    return noStoreRedirect(new URL(nextPath, request.nextUrl.origin));
  }

  return noStoreRedirect(
    new URL("/auth/confirmation-error", request.nextUrl.origin),
  );
}
