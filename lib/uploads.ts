export const IMAGE_UPLOAD_MAX_BYTES = 3 * 1024 * 1024; // 3MB
export const IMAGE_ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export const IMAGE_VARIANT_WIDTHS = [1600, 1280, 640, 320] as const;
