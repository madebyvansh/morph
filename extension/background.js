const CLIENT_ID = "YXo4Qm1FdTl2MHRIb1pZMVVLMGc6MTpjaQ";
const REDIRECT_URI = chrome.identity.getRedirectURL();
const OAUTH_CALLBACK_URL =
  "https://umluziyrrucfjrdmveag.supabase.co/functions/v1/x-oauth-callback";

const SCOPES = "users.read tweet.read";

function randomString(length = 64) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  return [...randomValues].map((value) => chars[value % chars.length]).join("");
}

async function createCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function startXAuth() {
  const state = randomString(32);
  const codeVerifier = randomString(64);
  const codeChallenge = await createCodeChallenge(codeVerifier);

  await chrome.storage.local.set({
    morphOAuthState: state,
    morphCodeVerifier: codeVerifier,
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;

  const callbackUrl = await chrome.identity.launchWebAuthFlow({
    url: authUrl,
    interactive: true,
  });

  await handleOAuthCallback(callbackUrl);
}

async function handleOAuthCallback(callbackUrl) {
  const url = new URL(callbackUrl);

  const error = url.searchParams.get("error");
  if (error) {
    throw new Error(`X OAuth error: ${error}`);
  }

  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");

  const stored = await chrome.storage.local.get([
    "morphOAuthState",
    "morphCodeVerifier",
  ]);

  if (!returnedState || returnedState !== stored.morphOAuthState) {
    throw new Error("Invalid OAuth state");
  }

  if (!code || !stored.morphCodeVerifier) {
    throw new Error("Missing authorization code or verifier");
  }

  const response = await fetch(OAUTH_CALLBACK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      codeVerifier: stored.morphCodeVerifier,
      redirectUri: REDIRECT_URI,
    }),
  });

  const responseText = await response.text();

  let data;

  try {
    data = JSON.parse(responseText);
  } catch {
    data = { raw: responseText };
  }

  if (!response.ok) {
    console.error(
      "Morph: OAuth callback response:",
      JSON.stringify(
        {
          status: response.status,
          body: data,
          redirectUri: REDIRECT_URI,
        },
        null,
        2,
      ),
    );

    throw new Error(
      data.error ||
        data.message ||
        `OAuth token exchange failed: ${response.status}`,
    );
  }

  await chrome.storage.local.set({
    morphXUser: data.user,
    morphAccessToken: data.access_token,
    morphRefreshToken: data.refresh_token || null,
  });

  await chrome.storage.local.remove(["morphOAuthState", "morphCodeVerifier"]);

  console.log("Morph: X authenticated", data.user);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_X_AUTH") {
    startXAuth().catch((error) => {
      console.error("Morph: X auth failed:", error);
    });
  }
});

console.log("Morph OAuth redirect URI:", REDIRECT_URI);
