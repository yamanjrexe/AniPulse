// ============================================================
// AVATAR SERVICE — compress, upload, fetch, reset
// ============================================================
import { api } from './api.js';

// Backend enforces 200KB max for avatars (base64 encoded)
const MAX_AVATAR_KB = 200;
// Covers can be larger
const MAX_COVER_KB = 500;

// ============================================================
// IMAGE COMPRESSION (canvas-based, output JPEG data URL)
// ============================================================
/**
 * Compress an image File → JPEG data URL under maxSizeKB.
 *
 * @param {File|Blob} file
 * @param {number} maxSizeKB   target max size (default 200)
 * @param {number} maxWidth    max output width  (default 400)
 * @param {number} maxHeight   max output height (default 400)
 * @returns {Promise<string>}  data:image/jpeg;base64,...
 */
export function compressImage(file, maxSizeKB = MAX_AVATAR_KB, maxWidth = 400, maxHeight = 400) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file provided'));
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            reject(new Error('Image too large (max 5MB before compression)'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Resize preserving aspect ratio
                let { width, height } = img;
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

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                // White background (PNG transparency → JPEG needs solid bg)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                // Iteratively reduce quality until size fits
                let quality = 0.9;
                let dataUrl = canvas.toDataURL('image/jpeg', quality);
                let attempts = 0;
                const maxAttempts = 15;

                while (dataUrl.length > maxSizeKB * 1024 && quality > 0.2 && attempts < maxAttempts) {
                    quality -= 0.08;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                    attempts++;
                }

                const sizeKB = Math.round(dataUrl.length / 1024);

                if (dataUrl.length > maxSizeKB * 1024) {
                    reject(
                        new Error(
                            `Could not compress below ${maxSizeKB}KB (got ${sizeKB}KB). Try a smaller image.`
                        )
                    );
                    return;
                }

                console.log(
                    `📸 Image compressed: ${sizeKB}KB (${width}×${height}, quality ${quality.toFixed(2)})`
                );
                resolve(dataUrl);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = event.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Compress from an existing base64 data URL (e.g. after cropping).
 */
export function compressDataUrl(dataUrl, maxSizeKB = MAX_AVATAR_KB, maxWidth = 400, maxHeight = 400) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            let quality = 0.9;
            let out = canvas.toDataURL('image/jpeg', quality);
            let attempts = 0;
            while (out.length > maxSizeKB * 1024 && quality > 0.2 && attempts < 15) {
                quality -= 0.08;
                out = canvas.toDataURL('image/jpeg', quality);
                attempts++;
            }

            const sizeKB = Math.round(out.length / 1024);
            if (out.length > maxSizeKB * 1024) {
                reject(new Error(`Could not compress below ${maxSizeKB}KB (got ${sizeKB}KB)`));
                return;
            }
            console.log(`📸 DataURL compressed: ${sizeKB}KB (quality ${quality.toFixed(2)})`);
            resolve(out);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
    });
}

// ============================================================
// UPLOAD / FETCH / DELETE
// ============================================================

/**
 * Upload avatar to cloud.
 * Accepts File, Blob, or base64 data URL. Compresses automatically.
 * Returns { avatarUrl, size, message }
 */
export async function uploadAvatar(fileOrDataUrl) {
    let dataUrl = fileOrDataUrl;

    if (fileOrDataUrl instanceof File || fileOrDataUrl instanceof Blob) {
        dataUrl = await compressImage(fileOrDataUrl);
    } else if (typeof fileOrDataUrl === 'string') {
        if (!fileOrDataUrl.startsWith('data:image/')) {
            throw new Error('Invalid avatar format — must be a data URL or File');
        }
        // Already a data URL — compress if too large
        if (dataUrl.length > MAX_AVATAR_KB * 1024) {
            dataUrl = await compressDataUrl(dataUrl);
        }
    } else {
        throw new Error('Invalid avatar input');
    }

    const sizeKB = Math.round(dataUrl.length / 1024);
    if (dataUrl.length > MAX_AVATAR_KB * 1024) {
        throw new Error(`Avatar too large: ${sizeKB}KB (max ${MAX_AVATAR_KB}KB)`);
    }

    const res = await api.post('/upload/avatar', { avatar: dataUrl });
    return res;
}

/**
 * Upload cover image (wider, larger limit).
 * Returns base64 (covers stay local-only for now).
 */
export async function uploadCover(file) {
    const dataUrl = await compressImage(file, MAX_COVER_KB, 1200, 400);
    return dataUrl;
}

/**
 * Fetch a user's avatar from the cloud.
 */
export async function fetchCloudAvatar(userId) {
    return api.get(`/upload/avatar/${userId}`);
}

/**
 * Delete avatar (resets to default on backend).
 */
export async function deleteCloudAvatar() {
    return api.del('/upload/avatar');
}

/**
 * Generate a default ui-avatars URL for a given name.
 */
export function generateDefaultAvatar(username) {
    const colors = [
        '6366F1', '8B5CF6', 'EC4899', 'F43F5E', 'EF4444',
        'F97316', 'F59E0B', '10B981', '14B8A6', '06B6D4', '3B82F6',
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        username || 'User'
    )}&background=${color}&color=fff&bold=true&length=2&size=200&rounded=true`;
}

/**
 * Update every avatar img element on the page (legacy helper).
 */
export function updateAllAvatars(avatarUrl) {
    const selectors = [
        '.user-avatar',
        '.sidebar-avatar',
        '.profile-preview-avatar',
        '#avatarPreview',
        '.profile-modal-avatar',
        '.leaderboard-avatar',
        '.friend-avatar',
        '.friend-request-avatar',
        '.search-result-avatar',
    ].join(', ');
    document.querySelectorAll(selectors).forEach((img) => {
        if (img) img.src = avatarUrl;
    });
}