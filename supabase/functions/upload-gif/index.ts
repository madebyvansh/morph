/// <reference lib="deno.ns" />

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return Response.json(
      { error: "Method not allowed" },
      { status: 405, headers: corsHeaders },
    );
  }

  try {
    const { userId, handle, gifDataUrl } = await req.json();

    if (!userId || !handle || !gifDataUrl) {
      return Response.json(
        { error: "Missing userId, handle, or gifDataUrl" },
        { status: 400, headers: corsHeaders },
      );
    }

    if (!/^data:image\/gif;base64,/i.test(gifDataUrl)) {
      return Response.json(
        { error: "Only GIF data URLs are allowed" },
        { status: 400, headers: corsHeaders },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log(
      "Service role key available:",
      Boolean(serviceRoleKey),
    );

    if (!supabaseUrl || !serviceRoleKey) {
      return Response.json(
        { error: "Supabase server configuration missing" },
        { status: 500, headers: corsHeaders },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const base64 = gifDataUrl.split(",")[1];
    const binary = Uint8Array.from(atob(base64), (char) =>
      char.charCodeAt(0),
    );

    const filePath = `${userId}/profile.gif`;

    const { error: uploadError } = await supabase.storage
      .from("pfp-gifs")
      .upload(filePath, binary, {
        contentType: "image/gif",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload failed:", uploadError);

      return Response.json(
        { error: "Storage upload failed", details: uploadError.message },
        { status: 500, headers: corsHeaders },
      );
    }

    const gifUrl =
      `${supabaseUrl}/storage/v1/object/public/pfp-gifs/${filePath}`;

    const { error: rowError } = await supabase
      .from("pfp_overrides")
      .upsert(
        {
          user_id: String(userId),
          handle: handle.toLowerCase(),
          pfp_gif_url: gifUrl,
          is_verified: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (rowError) {
      console.error("Database update failed:", rowError);

      return Response.json(
        { error: "Database update failed", details: rowError.message },
        { status: 500, headers: corsHeaders },
      );
    }

    return Response.json(
      {
        success: true,
        gifUrl,
        handle: handle.toLowerCase(),
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("Upload function error:", error);

    return Response.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
});