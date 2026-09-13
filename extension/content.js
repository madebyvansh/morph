console.log("Morph loaded");

let processing = false;
let currentPfp = null;
let morphOverlay = null;
let currentHandle = null;

const overrideCache = new Map();

async function getSavedGif() {
  const result = await chrome.storage.local.get("morphProfile");
  return result.morphProfile?.gif || null;
}

function getViewedProfileHandle() {
  const path = window.location.pathname
    .replace(/^\/+|\/+$/g, "")
    .split("/")[0]
    .toLowerCase();

  return path || null;
}

async function fetchOverrideForHandle(handle) {
  const normalizedHandle = handle.toLowerCase();

  if (overrideCache.has(normalizedHandle)) {
    return overrideCache.get(normalizedHandle);
  }

  const { data, error } = await window.supabase
    .from("pfp_overrides")
    .select("pfp_gif_url")
    .eq("handle", normalizedHandle)
    .maybeSingle();

  if (error) {
    console.error("Morph: Supabase lookup failed", error);
    return null;
  }

  overrideCache.set(normalizedHandle, data);

  return data;
}

function findPfp() {
  const images = [
    ...document.querySelectorAll(
      'img[alt="Opens profile photo"]'
    ),
  ];

  return (
    images
      .filter((img) => {
        const rect = img.getBoundingClientRect();

        return (
          rect.width >= 100 &&
          rect.height >= 100 &&
          rect.width > 0 &&
          rect.height > 0
        );
      })
      .sort((a, b) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();

        return (
          bRect.width * bRect.height -
          aRect.width * aRect.height
        );
      })[0] || null
  );
}

function removeMorph() {
  if (morphOverlay) {
    morphOverlay.remove();
    morphOverlay = null;
  }

  if (currentPfp) {
    currentPfp.style.opacity = "";
    currentPfp = null;
  }

  currentHandle = null;
}

async function applyMorph() {
  if (processing) return;

  const viewedHandle = getViewedProfileHandle();

  if (!viewedHandle) {
    removeMorph();
    return;
  }

  const original = findPfp();

  if (!original) return;

  if (
    original === currentPfp &&
    morphOverlay &&
    currentHandle === viewedHandle
  ) {
    return;
  }

  const override = await fetchOverrideForHandle(viewedHandle);
  const savedGif = override?.pfp_gif_url || null;

  if (!savedGif) {
    if (currentHandle === viewedHandle) return;

    removeMorph();

    console.log(`Morph: no GIF found for @${viewedHandle}`);
    return;
  }

  processing = true;

  const container =
    original.closest('[data-testid="UserAvatar-Container"]') ||
    original.parentElement?.parentElement ||
    original.parentElement;

  if (!container) {
    processing = false;
    return;
  }

  const gif = document.createElement("img");

  gif.src = savedGif;
  gif.alt = "";
  gif.setAttribute("aria-hidden", "true");

  Object.assign(gif.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "cover",
    borderRadius: "inherit",
    pointerEvents: "none",
    zIndex: "999999",
  });

  if (getComputedStyle(container).position === "static") {
    container.style.position = "relative";
  }

  gif.onload = () => {
    if (currentPfp && currentPfp !== original) {
      currentPfp.style.opacity = "";
    }

    if (morphOverlay) {
      morphOverlay.remove();
    }

    original.style.opacity = "0";
    container.appendChild(gif);

    morphOverlay = gif;
    currentPfp = original;
    currentHandle = viewedHandle;
    processing = false;

    console.log(`Morph: GIF applied for @${viewedHandle}`);
  };

  gif.onerror = () => {
    processing = false;
    console.error("Morph: GIF failed to load");
  };
}

const observer = new MutationObserver(() => {
  applyMorph();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

applyMorph();