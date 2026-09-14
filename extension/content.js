console.log("Morph loaded");

let processing = false;
let currentPfp = null;
let morphOverlay = null;
let currentHandle = null;
let debounceTimer = null;

const overrideCache = new Map();

const RESERVED_PATHS = new Set([
  "home",
  "explore",
  "notifications",
  "messages",
  "i",
  "settings",
  "search",
  "compose",
  "bookmarks",
  "lists",
  "communities",
  "jobs",
]);

async function getSavedGif() {
  const result = await chrome.storage.local.get("morphProfile");
  return result.morphProfile?.gif || null;
}

async function getSavedStaticFrame() {
  const result = await chrome.storage.local.get("morphProfile");
  return result.morphProfile?.staticFrame || null;
}

function getViewedProfileHandle() {
  const path = window.location.pathname
    .replace(/^\/+|\/+$/g, "")
    .split("/")[0]
    .toLowerCase();

  if (!path || RESERVED_PATHS.has(path)) {
    return null;
  }

  return path;
}

async function fetchOverrideForHandle(handle) {
  const normalizedHandle = handle.replace("@", "").trim().toLowerCase();

  if (overrideCache.has(normalizedHandle)) {
    return overrideCache.get(normalizedHandle);
  }

  console.log("Morph: checking Supabase for:", normalizedHandle);

  const { data, error } = await window.supabase
    .from("pfp_overrides")
    .select("pfp_gif_url, static_frame_url")
    .eq("handle", normalizedHandle)
    .maybeSingle();

  if (error) {
    console.error("Morph: Supabase lookup failed:", normalizedHandle, error);
    return null;
  }

  overrideCache.set(normalizedHandle, data);
  return data;
}

async function fetchBannerOverrideForHandle(handle) {
  const normalizedHandle = handle.replace("@", "").trim().toLowerCase();

  const { data, error } = await window.supabase
    .from("pfp_overrides")
    .select("banner_gif_url")
    .eq("handle", normalizedHandle)
    .maybeSingle();

  if (error) {
    console.error("Morph banner lookup failed:", error);
    return null;
  }

  return data?.banner_gif_url || null;
}

function findPfp() {
  const images = [
    ...document.querySelectorAll('img[alt="Opens profile photo"]'),
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

        return bRect.width * bRect.height - aRect.width * aRect.height;
      })[0] || null
  );
}

function getHandleFromAvatar(img) {
  const link = img.closest('a[href^="/"]');

  if (!link) return null;

  const href = link.getAttribute("href");

  if (!href) return null;

  const handle = href
    .replace(/^\/+/, "")
    .split("/")[0]
    .split("?")[0]
    .toLowerCase();

  if (!handle || RESERVED_PATHS.has(handle)) {
    return null;
  }

  return handle;
}

function findTimelineAvatars() {
  return [...document.querySelectorAll("img")]
    .map((img) => {
      const rect = img.getBoundingClientRect();
      const link = img.closest('a[href^="/"]');
      const href = link?.getAttribute("href");

      const handle = href
        ?.replace(/^\/+/, "")
        .split("/")[0]
        .split("?")[0]
        .toLowerCase();

      return { img, handle, rect };
    })
    .filter(({ img, handle, rect }) => {
      return (
        handle &&
        !RESERVED_PATHS.has(handle) &&
        rect.width >= 24 &&
        rect.width <= 80 &&
        rect.height >= 24 &&
        rect.height <= 80 &&
        img.src.includes("pbs.twimg.com/profile_images")
      );
    });
}

const timelineOverlays = new WeakMap();

async function applyTimelineMorph() {
  const avatars = findTimelineAvatars();

  console.log(
    "Morph: timeline avatars found:",
    avatars.map(({ handle, img }) => ({
      handle,
      src: img.src,
    })),
  );

  for (const { img, handle } of avatars) {
    if (timelineOverlays.has(img)) {
      continue;
    }

    const override = await fetchOverrideForHandle(handle);
    const gifUrl = override?.pfp_gif_url;
    const staticFrame = override?.static_frame_url;

    if (!gifUrl || !staticFrame) {
      continue;
    }

    const container =
      img.closest('[data-testid="UserAvatar-Container"]') ||
      img.parentElement?.parentElement ||
      img.parentElement;

    if (!container) continue;

    if (getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }

    const staticImg = document.createElement("img");

    staticImg.src = staticFrame;
    staticImg.alt = "";
    staticImg.setAttribute("aria-hidden", "true");

    Object.assign(staticImg.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      objectFit: "cover",
      borderRadius: "inherit",
      pointerEvents: "none",
      zIndex: "999999",
    });

    staticImg.onload = () => {
      img.style.opacity = "0";
      img.style.pointerEvents = "none";

      container.appendChild(staticImg);
      timelineOverlays.set(img, staticImg);

      console.log(`Morph: own static timeline frame applied for @${handle}`);
    };

    staticImg.onerror = () => {
      console.error(`Morph: static frame failed for @${handle}`);
    };
  }
}

function removeMorph() {
  if (morphOverlay) {
    morphOverlay.remove();
    morphOverlay = null;
  }

  if (currentPfp) {
    currentPfp.style.opacity = "";
    currentPfp.style.pointerEvents = "";
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

  // Set this before the first await to prevent duplicate requests.
  processing = true;

  try {
    const override = await fetchOverrideForHandle(viewedHandle);

    // The user may have navigated while Supabase was loading.
    if (getViewedProfileHandle() !== viewedHandle) {
      return;
    }

    const savedGif = override?.pfp_gif_url || null;

    if (!savedGif) {
      removeMorph();
      console.log(`Morph: no GIF found for @${viewedHandle}`);
      return;
    }

    const container =
      original.closest('[data-testid="UserAvatar-Container"]') ||
      original.parentElement?.parentElement ||
      original.parentElement;

    if (!container) return;

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
      if (getViewedProfileHandle() !== viewedHandle) {
        return;
      }

      if (currentPfp && currentPfp !== original) {
        currentPfp.style.opacity = "";
        currentPfp.style.pointerEvents = "";
      }

      if (morphOverlay) {
        morphOverlay.remove();
      }

      original.style.opacity = "0";
      original.style.pointerEvents = "none";

      container.appendChild(gif);

      morphOverlay = gif;
      currentPfp = original;
      currentHandle = viewedHandle;

      console.log(`Morph: GIF applied for @${viewedHandle}`);
    };

    gif.onerror = () => {
      console.error("Morph: GIF failed to load");
    };
  } finally {
    processing = false;
  }
}

function findExpandedPfp() {
  return (
    [
      ...document.querySelectorAll(
        'img[alt="Image"][src*="pbs.twimg.com/profile_images"]',
      ),
    ].find((img) => {
      const rect = img.getBoundingClientRect();

      return (
        rect.width >= 200 &&
        rect.height >= 200 &&
        rect.width > 0 &&
        rect.height > 0
      );
    }) || null
  );
}

async function applyExpandedMorph() {
  const expandedPfp = findExpandedPfp();

  if (!expandedPfp) return;

  const avatarContainer = expandedPfp.closest(
    '[data-testid^="UserAvatar-Container-"]',
  );

  const testId = avatarContainer?.getAttribute("data-testid");

  let handle = testId?.replace("UserAvatar-Container-", "").toLowerCase();

  // Fallback: get the handle from the currently viewed profile URL
  if (!handle || RESERVED_PATHS.has(handle)) {
    handle = getViewedProfileHandle();
  }

  if (!handle) {
    console.log("Morph: could not detect expanded profile handle");
    return;
  }

  const override = await fetchOverrideForHandle(handle);
  const gifUrl = override?.pfp_gif_url;

  if (!gifUrl) {
    console.log(`Morph: no expanded GIF found for @${handle}`);
    return;
  }

  if (expandedPfp.dataset.morphExpanded === "true") {
    return;
  }

  const container = expandedPfp.parentElement;

  if (!container) return;

  if (getComputedStyle(container).position === "static") {
    container.style.position = "relative";
  }

  const gifImg = document.createElement("img");

  gifImg.src = gifUrl;
  gifImg.alt = "";
  gifImg.setAttribute("aria-hidden", "true");

  Object.assign(gifImg.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: "999999",
  });

  gifImg.onload = () => {
    expandedPfp.style.opacity = "0";
    expandedPfp.style.pointerEvents = "none";

    container.appendChild(gifImg);
    expandedPfp.dataset.morphExpanded = "true";

    console.log(`Morph: expanded GIF applied for @${handle}`);
  };

  gifImg.onerror = () => {
    console.error(`Morph: expanded GIF failed for @${handle}`);
  };
}

let bottomLeftOverlay = null;
let bottomLeftOriginal = null;
let bottomLeftHandle = null;

function findBottomLeftAvatar() {
  return document.querySelector(
    '[data-testid="SideNav_AccountSwitcher_Button"] img',
  );
}

function getBottomLeftHandle() {
  const img = findBottomLeftAvatar();

  if (!img) return null;

  const avatarContainer = img.closest('[data-testid^="UserAvatar-Container-"]');

  const testId = avatarContainer?.getAttribute("data-testid");

  if (!testId) return null;

  return testId.replace("UserAvatar-Container-", "").toLowerCase();
}

function removeBottomLeftMorph() {
  if (bottomLeftOverlay) {
    bottomLeftOverlay.remove();
    bottomLeftOverlay = null;
  }

  if (bottomLeftOriginal) {
    bottomLeftOriginal.style.opacity = "";
    bottomLeftOriginal.style.pointerEvents = "";
    bottomLeftOriginal = null;
  }

  bottomLeftHandle = null;
}

async function applyBottomLeftMorph() {
  const img = findBottomLeftAvatar();
  const handle = getBottomLeftHandle();

  if (!img || !handle) {
    removeBottomLeftMorph();
    return;
  }

  // Account has not changed.
  if (
    bottomLeftOverlay &&
    bottomLeftOriginal === img &&
    bottomLeftHandle === handle
  ) {
    return;
  }

  // Remove the previous account's overlay first.
  removeBottomLeftMorph();

  // Check whether THIS account has a Morph GIF.
  const override = await fetchOverrideForHandle(handle);
  const gifUrl = override?.pfp_gif_url;

  // No Morph GIF for this account: show the original X avatar.
  if (!gifUrl) {
    console.log(`Morph: no bottom-left GIF for @${handle}`);
    return;
  }

  const staticFrame = override?.static_frame_url;
  if (!staticFrame) {
    console.log(`Morph: no static frame for @${handle}`);
    return;
  }

  const container = img.parentElement;

  if (!container) return;

  if (getComputedStyle(container).position === "static") {
    container.style.position = "relative";
  }

  const staticImg = document.createElement("img");

  staticImg.src = staticFrame;
  staticImg.alt = "";
  staticImg.setAttribute("aria-hidden", "true");

  Object.assign(staticImg.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: "999999",
  });

  staticImg.onload = () => {
    // Prevent an old account's image from being applied after switching.
    if (getBottomLeftHandle() !== handle) {
      return;
    }

    img.style.opacity = "0";
    img.style.pointerEvents = "none";

    container.appendChild(staticImg);

    bottomLeftOverlay = staticImg;
    bottomLeftOriginal = img;
    bottomLeftHandle = handle;

    console.log(`Morph: bottom-left static frame applied for @${handle}`);
  };

  staticImg.onerror = () => {
    console.error("Morph: bottom-left static frame failed to load");
  };
}

const accountSwitcherOverlays = new WeakMap();

function findAccountSwitcherAvatars() {
  return [
    ...document.querySelectorAll(
      'div[style*="background-image"][style*="pbs.twimg.com/profile_images"]',
    ),
  ]
    .map((backgroundDiv) => {
      const imageUrl = backgroundDiv.style.backgroundImage
        .replace(/^url\(["']?/, "")
        .replace(/["']?\)$/, "");

      const avatarContainer = backgroundDiv.closest(
        '[data-testid^="UserAvatar-Container-"]',
      );

      const testId = avatarContainer?.getAttribute("data-testid");

      const handle = testId?.replace("UserAvatar-Container-", "").toLowerCase();

      return {
        backgroundDiv,
        avatarContainer,
        handle,
        imageUrl,
      };
    })
    .filter(({ backgroundDiv, handle }) => {
      const rect = backgroundDiv.getBoundingClientRect();

      return (
        handle &&
        !RESERVED_PATHS.has(handle) &&
        rect.width > 0 &&
        rect.height > 0 &&
        !accountSwitcherOverlays.has(backgroundDiv)
      );
    });
}

async function applyAccountSwitcherMorph() {
  const avatars = findAccountSwitcherAvatars();

  for (const { backgroundDiv, avatarContainer, handle } of avatars) {
    const override = await fetchOverrideForHandle(handle);

    const staticFrame = override?.static_frame_url;

    if (!staticFrame) {
      console.log(`Morph: no static frame found for @${handle}`);
      continue;
    }

    const container = avatarContainer || backgroundDiv.parentElement;

    if (!container) continue;

    if (getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }

    const overlay = document.createElement("img");

    overlay.src = staticFrame;
    overlay.alt = "";
    overlay.setAttribute("aria-hidden", "true");

    Object.assign(overlay.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      objectFit: "cover",
      borderRadius: "50%",
      pointerEvents: "none",
      zIndex: "999999",
    });

    overlay.onload = () => {
      if (!document.contains(backgroundDiv)) {
        overlay.remove();
        return;
      }

      backgroundDiv.style.opacity = "0";
      container.appendChild(overlay);
      accountSwitcherOverlays.set(backgroundDiv, overlay);

      console.log(
        `Morph: animated account switcher PFP applied for @${handle}`,
      );
    };

    overlay.onerror = () => {
      console.error(`Morph: account switcher GIF failed for @${handle}`);
    };
  }
}

let profileBannerOverlay = null;
let profileBannerOriginal = null;
let profileBannerHandle = null;

function removeProfileBannerMorph() {
  if (profileBannerOverlay) {
    profileBannerOverlay.remove();
    profileBannerOverlay = null;
  }

  if (profileBannerOriginal) {
    profileBannerOriginal.style.visibility = "";
    profileBannerOriginal = null;
  }

  profileBannerHandle = null;
}

async function applyProfileBannerMorph(handle) {
  if (!handle) {
    removeProfileBannerMorph();
    return;
  }

  const bannerImg = document.querySelector('img[src*="profile_banners"]');

  if (!bannerImg) return;

  const bannerGifUrl = await fetchBannerOverrideForHandle(handle);

  if (getViewedProfileHandle() !== handle) {
    return;
  }

  if (!bannerGifUrl) {
    removeProfileBannerMorph();
    return;
  }

  if (
    profileBannerOverlay &&
    profileBannerOriginal === bannerImg &&
    profileBannerHandle === handle
  ) {
    return;
  }

  removeProfileBannerMorph();

  const container = bannerImg.parentElement;

  if (!container) return;

  if (getComputedStyle(container).position === "static") {
    container.style.position = "relative";
  }

  const overlay = document.createElement("img");

  overlay.src = bannerGifUrl;
  overlay.alt = "";
  overlay.draggable = false;
  overlay.setAttribute("aria-hidden", "true");

  Object.assign(overlay.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    pointerEvents: "none",
    zIndex: "2",
  });

  overlay.onload = () => {
    if (getViewedProfileHandle() !== handle) {
      overlay.remove();
      return;
    }

    bannerImg.style.visibility = "hidden";
    container.appendChild(overlay);

    profileBannerOverlay = overlay;
    profileBannerOriginal = bannerImg;
    profileBannerHandle = handle;

    console.log(`Morph: banner applied for @${handle}`);
  };

  overlay.onerror = () => {
    console.error("Morph: banner GIF failed to load");
    overlay.remove();
  };
}

function findSearchAvatars() {
  return [
    ...document.querySelectorAll('img[src*="pbs.twimg.com/profile_images"]'),
  ]
    .map((img) => {
      const container =
        img.closest('[data-testid="typeaheadResult"]') ||
        img.closest('[role="option"]') ||
        img.parentElement?.parentElement?.parentElement;

      const text = container?.innerText || "";

      const handleMatch = text.match(/@([A-Za-z0-9_]{1,15})/);

      return {
        img,
        handle: handleMatch?.[1]?.toLowerCase() || null,
      };
    })
    .filter(({ img, handle }) => {
      const rect = img.getBoundingClientRect();

      return (
        handle &&
        !RESERVED_PATHS.has(handle) &&
        rect.width > 0 &&
        rect.height > 0
      );
    });
}

async function applySearchMorph() {
  const avatars = findSearchAvatars();

  for (const { img, handle } of avatars) {
    if (img.dataset.morphSearchApplied === "true") {
      continue;
    }

    const override = await fetchOverrideForHandle(handle);

    const gifUrl = override?.pfp_gif_url;
    const staticFrame = override?.static_frame_url;

    if (!gifUrl || !staticFrame) {
      continue;
    }

    const container = img.parentElement;

    if (!container) continue;

    if (getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }

    const staticImg = document.createElement("img");

    staticImg.src = staticFrame;
    staticImg.alt = "";
    staticImg.setAttribute("aria-hidden", "true");

    Object.assign(staticImg.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      objectFit: "cover",
      borderRadius: "50%",
      pointerEvents: "none",
      zIndex: "999999",
    });

    staticImg.onload = () => {
      img.style.opacity = "0";
      img.style.pointerEvents = "none";

      container.appendChild(staticImg);
      img.dataset.morphSearchApplied = "true";

      console.log(`Morph: search static frame applied for @${handle}`);
    };
  }
}

const observer = new MutationObserver(() => {
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    applyMorph();
    applySearchMorph();
    applyTimelineMorph();
    applyExpandedMorph();
    applyBottomLeftMorph();
    applyAccountSwitcherMorph();
    applyProfileBannerMorph(getViewedProfileHandle());
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

applyMorph();
applySearchMorph();
applyTimelineMorph();
applyExpandedMorph();
applyBottomLeftMorph();
applyAccountSwitcherMorph();
applyProfileBannerMorph(getViewedProfileHandle());
