/// <reference lib="deno.ns" />

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
      {
        status: 405,
        headers: corsHeaders,
      },
    );
  }

  try {
    const { code, codeVerifier, redirectUri } = await req.json();

    if (!code || !codeVerifier || !redirectUri) {
      return Response.json(
        {
          error: "Missing OAuth parameters",
          received: {
            hasCode: Boolean(code),
            hasCodeVerifier: Boolean(codeVerifier),
            hasRedirectUri: Boolean(redirectUri),
          },
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const clientId = Deno.env.get("X_CLIENT_ID");

    if (!clientId) {
      return Response.json(
        { error: "X_CLIENT_ID is not configured" },
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }

    const tokenResponse = await fetch(
      "https://api.x.com/2/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          code,
          grant_type: "authorization_code",
          client_id: clientId,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }),
      },
    );

    const tokenText = await tokenResponse.text();

    let tokenData;

    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      tokenData = { raw: tokenText };
    }

    if (!tokenResponse.ok) {
      console.error("X token exchange failed:", {
        status: tokenResponse.status,
        details: tokenData,
      });

      return Response.json(
        {
          error: "X token exchange failed",
          status: tokenResponse.status,
          details: tokenData,
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    if (!tokenData.access_token) {
      return Response.json(
        {
          error: "Access token missing",
          details: tokenData,
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const userResponse = await fetch(
      "https://api.x.com/2/users/me",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/json",
        },
      },
    );

    const userText = await userResponse.text();

    let userData;

    try {
      userData = JSON.parse(userText);
    } catch {
      userData = { raw: userText };
    }

    if (!userResponse.ok) {
      console.error("X user lookup failed:", {
        status: userResponse.status,
        details: userData,
      });

      return Response.json(
        {
          error: "X user lookup failed",
          status: userResponse.status,
          details: userData,
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    return Response.json(
      {
        user: userData.data,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("OAuth callback error:", error);

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