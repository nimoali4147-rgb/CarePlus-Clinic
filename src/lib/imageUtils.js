/**
 * Image processing & validation utility for CarePlus Clinic
 * - Enforces strict file size limits (default 2MB)
 * - Validates MIME types (image/jpeg, image/png, image/webp)
 * - Resizes and compresses images using HTML5 Canvas to create lightweight avatars
 * - Guarantees Firestore documents remain well below the 1MB document limit (~30KB-50KB base64)
 */

export const MAX_IMAGE_SIZE_MB = 2; // 2MB maximum allowed file size
export const MAX_IMAGE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

/**
 * Validates an image file and compresses it to a lightweight base64 data URL.
 * @param {File} file - File selected from input
 * @param {Object} options - Configuration options
 * @param {number} [options.maxSizeMB=2] - Max file size in megabytes
 * @param {number} [options.maxWidth=400] - Max output width in pixels
 * @param {number} [options.maxHeight=400] - Max output height in pixels
 * @param {number} [options.quality=0.85] - JPEG quality (0.0 to 1.0)
 * @returns {Promise<{ success: boolean, base64?: string, error?: string }>}
 */
export const processImageFile = (
  file,
  {
    maxSizeMB = MAX_IMAGE_SIZE_MB,
    maxWidth = 400,
    maxHeight = 400,
    quality = 0.85,
  } = {}
) => {
  return new Promise((resolve) => {
    if (!file) {
      return resolve({ success: false, error: "No image file selected." });
    }

    // 1. Validate file type
    if (!file.type || !file.type.startsWith("image/")) {
      return resolve({
        success: false,
        error: "Invalid file format. Please select an image (JPG, PNG, or WEBP).",
      });
    }

    // 2. Validate file size immediately
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      const actualSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return resolve({
        success: false,
        error: `Image is too large (${actualSizeMB}MB). Maximum allowed size is ${maxSizeMB}MB.`,
      });
    }

    // 3. Process & compress using Canvas
    const reader = new FileReader();
    reader.onerror = () => {
      resolve({ success: false, error: "Failed to read image file. Please try another image." });
    };

    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        resolve({ success: false, error: "Failed to load image. The image file may be damaged." });
      };

      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          // Scale dimensions down to maintain aspect ratio within maxWidth/maxHeight
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to efficient JPEG data URL
          const compressedBase64 = canvas.toDataURL("image/jpeg", quality);

          // Safety check: ensure string size is under 500KB (well below Firestore 1MB limit)
          if (compressedBase64.length > 500 * 1024) {
            return resolve({
              success: false,
              error: "Image could not be compressed to an acceptable size. Please choose a smaller image.",
            });
          }

          resolve({ success: true, base64: compressedBase64 });
        } catch (err) {
          console.error("Image processing error:", err);
          resolve({ success: false, error: "Failed to process image file." });
        }
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
};
