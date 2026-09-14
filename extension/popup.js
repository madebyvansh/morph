const gifInput = document.querySelector("#gifInput");
const gifPreview = document.querySelector("#gifPreview");
const staticPreview = document.querySelector("#staticPreview");
const animatedEmpty = document.querySelector("#animatedEmpty");
const staticEmpty = document.querySelector("#staticEmpty");
const fileName = document.querySelector("#fileName");
const status = document.querySelector("#status");
const message = document.querySelector("#message");
const saveButton = document.querySelector("#saveButton");
const removeButton = document.querySelector("#removeButton");

const connectButton = document.querySelector("#connect-x");
const authStatus = document.querySelector("#auth-status");

const bannerGifInput = document.querySelector("#bannerGifInput");
const bannerPreview = document.querySelector("#bannerPreview");
const bannerEmpty = document.querySelector("#bannerEmpty");
const bannerFileName = document.querySelector("#bannerFileName");

let selectedGif = null;
let selectedStaticFrame = null;
let selectedBannerGif = null;

const UPLOAD_GIF_URL =
  "https://umluziyrrucfjrdmveag.supabase.co/functions/v1/upload-gif";

function updateSaveButton() {
  saveButton.disabled =
    !selectedGif && !selectedBannerGif && !selectedStaticFrame;
}

// Profile GIF selection
gifInput.addEventListener("change", async () => {
  const file = gifInput.files?.[0];

  if (!file) return;

  if (file.type !== "image/gif") {
    showMessage("Please choose a GIF file.");
    gifInput.value = "";
    return;
  }

  selectedGif = file;

  const gifUrl = URL.createObjectURL(file);

  gifPreview.src = gifUrl;
  gifPreview.hidden = false;
  animatedEmpty.hidden = true;
  fileName.textContent = file.name;

  try {
    selectedStaticFrame = await extractFirstFrame(file);

    const staticUrl = URL.createObjectURL(selectedStaticFrame);

    staticPreview.src = staticUrl;
    staticPreview.hidden = false;
    staticEmpty.hidden = true;

    removeButton.disabled = false;
    status.textContent = "Ready";

    showMessage("Profile GIF loaded successfully.");
  } catch (error) {
    console.error("Morph: frame extraction failed:", error);
    showMessage("Could not extract the first frame.");
  }

  updateSaveButton();
});

// Banner GIF selection
bannerGifInput.addEventListener("change", () => {
  const file = bannerGifInput.files?.[0];

  if (!file) return;

  if (file.type !== "image/gif") {
    showMessage("Please select a GIF file.");
    bannerGifInput.value = "";
    return;
  }

  selectedBannerGif = file;

  bannerPreview.src = URL.createObjectURL(file);
  bannerPreview.hidden = false;
  bannerEmpty.hidden = true;
  bannerFileName.textContent = file.name;

  showMessage("Banner GIF loaded.");
  updateSaveButton();
});

// Save profile and/or banner
saveButton.addEventListener("click", async () => {
  if (!selectedGif && !selectedBannerGif) {
    showMessage("Please select a PFP GIF or Banner GIF.");
    return;
  }

  const { morphXUser } = await chrome.storage.local.get("morphXUser");

  if (!morphXUser?.id || !morphXUser?.username) {
    showMessage("Please connect your X account first.");
    return;
  }

  saveButton.disabled = true;
  status.textContent = "Uploading...";
  showMessage("Uploading your GIFs...");

  try {
    const gifDataUrl = selectedGif ? await fileToDataUrl(selectedGif) : null;

    const bannerGifDataUrl = selectedBannerGif
      ? await fileToDataUrl(selectedBannerGif)
      : null;

    const response = await fetch(UPLOAD_GIF_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: String(morphXUser.id),
        handle: morphXUser.username,
        gifDataUrl,
        bannerGifDataUrl,
        staticFrameDataUrl: selectedStaticFrame
          ? await fileToDataUrl(selectedStaticFrame)
          : null,
      }),
    });

    const data = await response.json();

    console.log("Morph upload result:", data);

    if (!response.ok) {
      throw new Error(data.error || "Upload failed");
    }

    const oldResult = await chrome.storage.local.get("morphProfile");
    const oldProfile = oldResult.morphProfile || {};

    await chrome.storage.local.set({
      morphProfile: {
        ...oldProfile,

        gif: data.pfpGifUrl || data.gifUrl || oldProfile.gif || null,

        bannerGif: data.bannerGifUrl || oldProfile.bannerGif || null,

        staticFrame: selectedStaticFrame
          ? await fileToDataUrl(selectedStaticFrame)
          : oldProfile.staticFrame || null,

        fileName: selectedGif?.name || oldProfile.fileName || null,

        userId: morphXUser.id,

        handle: morphXUser.username.toLowerCase(),
      },
    });

    status.textContent = "Saved";
    showMessage("Your Morph profile was updated.");
  } catch (error) {
    console.error("Morph: GIF upload failed:", error);

    status.textContent = "Error";
    showMessage(error.message || "Could not upload GIF.");
  } finally {
    updateSaveButton();
  }
});

// Remove saved profile data
removeButton.addEventListener("click", async () => {
  await chrome.storage.local.remove("morphProfile");

  selectedGif = null;
  selectedStaticFrame = null;
  selectedBannerGif = null;

  gifInput.value = "";
  bannerGifInput.value = "";

  gifPreview.hidden = true;
  staticPreview.hidden = true;
  bannerPreview.hidden = true;

  animatedEmpty.hidden = false;
  staticEmpty.hidden = false;
  bannerEmpty.hidden = false;

  fileName.textContent = "No file selected";
  bannerFileName.textContent = "No file selected";

  status.textContent = "Not set";
  saveButton.disabled = true;
  removeButton.disabled = true;

  showMessage("Profile removed.");
});

// Connect X
if (connectButton) {
  connectButton.addEventListener("click", () => {
    connectButton.disabled = true;
    connectButton.textContent = "Connecting...";

    chrome.runtime.sendMessage({ type: "START_X_AUTH" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Morph: Connect X failed:",
          chrome.runtime.lastError.message,
        );

        connectButton.disabled = false;
        connectButton.textContent = "Connect X";

        showMessage("Could not start X authentication.");
      }
    });
  });
}

// Update authentication status
async function updateAuthStatus() {
  if (!authStatus || !connectButton) return;

  const { morphXUser } = await chrome.storage.local.get("morphXUser");

  if (morphXUser?.username) {
    authStatus.textContent = `Connected as @${morphXUser.username}`;
    connectButton.textContent = "Connected";
    connectButton.disabled = true;
  } else {
    authStatus.textContent = "Not connected";
    connectButton.textContent = "Connect X";
    connectButton.disabled = false;
  }
}

// Extract first frame from GIF
async function extractFirstFrame(file) {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(imageUrl);

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);

    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Could not create static frame."));
          return;
        }

        resolve(
          new File([blob], "morph-static.png", {
            type: "image/png",
          }),
        );
      }, "image/png");
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

// Load image
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

// Convert file to data URL
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

// Show popup message
function showMessage(text) {
  if (message) {
    message.textContent = text;
  }
}

updateAuthStatus();
