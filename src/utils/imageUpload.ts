/**
 * Utility for handling user avatar file uploads with client-side compression.
 * Resizes large photos to max 400x400 to maintain crisp avatar fidelity
 * while keeping localStorage size under 30-60KB.
 */

export interface ProcessedImage {
  dataUrl: string;
  fileName: string;
  fileSizeKb: number;
}

export function processAvatarImage(file: File): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error("No file selected"));
    }

    if (!file.type.startsWith("image/")) {
      return reject(new Error("Please upload a valid image file (PNG, JPG, WEBP, or SVG)"));
    }

    // SVG handling - keep as clean vector
    if (file.type === "image/svg+xml") {
      if (file.size > 1024 * 1024) {
        return reject(new Error("SVG file is too large (max 1MB)"));
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve({
          dataUrl,
          fileName: file.name,
          fileSizeKb: Math.round(dataUrl.length / 1024),
        });
      };
      reader.onerror = () => reject(new Error("Failed to read SVG file"));
      reader.readAsDataURL(file);
      return;
    }

    // Raster images - resize with Canvas
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const maxDim = 400; // Optimal for avatars across mobile & desktop
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return reject(new Error("Canvas rendering context not available"));
      }

      // Smooth scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // Try WEBP first, fallback to JPEG
      let dataUrl = "";
      try {
        dataUrl = canvas.toDataURL("image/webp", 0.88);
      } catch {
        dataUrl = canvas.toDataURL("image/jpeg", 0.88);
      }

      resolve({
        dataUrl,
        fileName: file.name,
        fileSizeKb: Math.round(dataUrl.length / 1024),
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to decode image. Please try a different file."));
    };

    img.src = objectUrl;
  });
}
