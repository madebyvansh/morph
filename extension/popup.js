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

let selectedGif = null;
let selectedStaticFrame = null;

gifInput.addEventListener("change", async () => {
  const file = gifInput.files?.[0];

  if (!file) return;

  if (file.type !== "image/gif") {
    showMessage("Please choose a GIF file.");
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

    saveButton.disabled = false;
    removeButton.disabled = false;
    status.textContent = "Ready";

    showMessage("GIF loaded successfully.");
  } catch (error) {
    console.error(error);
    showMessage("Could not extract the first frame.");
  }
});

saveButton.addEventListener("click", async () => {
  if (!selectedGif || !selectedStaticFrame) return;

  const gifData = await fileToDataUrl(selectedGif);
  const staticData = await fileToDataUrl(selectedStaticFrame);

  await chrome.storage.local.set({
    morphProfile: {
      gif: gifData,
      staticFrame: staticData,
      fileName: selectedGif.name,
    },
  });

  status.textContent = "Saved";
  showMessage("Your Morph profile was saved.");
});

removeButton.addEventListener("click", async () => {
  await chrome.storage.local.remove("morphProfile");

  selectedGif = null;
  selectedStaticFrame = null;

  gifInput.value = "";
  gifPreview.hidden = true;
  staticPreview.hidden = true;

  animatedEmpty.hidden = false;
  staticEmpty.hidden = false;

  fileName.textContent = "No file selected";
  status.textContent = "Not set";

  saveButton.disabled = true;
  removeButton.disabled = true;

  showMessage("Profile removed.");
});

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
        if (blob) {
          resolve(
            new File([blob], "morph-static.png", {
              type: "image/png",
            })
          );
        } else {
          reject(new Error("Could not create static frame."));
        }
      }, "image/png");
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

function showMessage(text) {
  message.textContent = text;
}

console.log("Supabase client:", window.supabase);