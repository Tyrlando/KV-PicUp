const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const previewWrapper = document.querySelector(".preview-wrapper");
const zoomInButton = document.getElementById("zoomIn");
const zoomOutButton = document.getElementById("zoomOut");
const resetButton = document.getElementById("reset");
const submitButton = document.getElementById("submit");
const statusText = document.getElementById("status");
const areaInput = document.getElementById("area");
const firstNameInput = document.getElementById("firstName");
const lastNameInput = document.getElementById("lastName");

let cropper = null;

const setStatus = (message, type) => {
  statusText.textContent = message;
  statusText.className = `status ${type || ""}`.trim();
};

const enableSubmitIfReady = () => {
  const namesFilled =
    areaInput.value.trim() &&
    firstNameInput.value.trim() &&
    lastNameInput.value.trim();
  submitButton.disabled = !(cropper && namesFilled);
};

[fileInput, areaInput, firstNameInput, lastNameInput].forEach((input) => {
  input.addEventListener("input", enableSubmitIfReady);
});

fileInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (!file) {
    return;
  }

  if (cropper) {
    cropper.destroy();
  }

  const reader = new FileReader();
  reader.onload = () => {
    preview.src = reader.result;
    previewWrapper.classList.add("active");

    cropper = new Cropper(preview, {
      aspectRatio: 4 / 3,
      viewMode: 1,
      autoCropArea: 1,
      dragMode: "move",
      background: false,
      responsive: true,
    });

    enableSubmitIfReady();
    setStatus("", "");
  };
  reader.readAsDataURL(file);
});

zoomInButton.addEventListener("click", () => {
  if (cropper) {
    cropper.zoom(0.1);
  }
});

zoomOutButton.addEventListener("click", () => {
  if (cropper) {
    cropper.zoom(-0.1);
  }
});

resetButton.addEventListener("click", () => {
  if (cropper) {
    cropper.reset();
  }
});

submitButton.addEventListener("click", async () => {
  if (!cropper) {
    setStatus("Bitte zuerst ein Bild hochladen.", "error");
    return;
  }

  const canvas = cropper.getCroppedCanvas({
    width: 1200,
    height: 900,
    imageSmoothingQuality: "high",
  });

  const imageData = canvas.toDataURL("image/jpeg", 0.9);

  setStatus("Lade hoch...", "");
  submitButton.disabled = true;

  try {
    const response = await fetch("/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        area: areaInput.value,
        firstName: firstNameInput.value,
        lastName: lastNameInput.value,
        imageData,
      }),
    });

    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Upload fehlgeschlagen.");
    }

    const payload = await response.json();
    setStatus(
      `Erfolgreich gespeichert: ${payload.fileName}`,
      "success"
    );
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    enableSubmitIfReady();
  }
});
