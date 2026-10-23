import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

export const storageEnabled = Boolean(env.CLOUDINARY_URL);

cloudinary.config({ secure: true });

function avatarId(userId: string) {
  return `nodex/avatars/${userId}`;
}

export function uploadAvatar(userId: string, image: Buffer) {
  return new Promise<string>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          public_id: avatarId(userId),
          overwrite: true,
          invalidate: true,
          resource_type: "image",
          format: "webp",
          transformation: [{ width: 256, height: 256, crop: "fill", gravity: "face" }],
          timeout: 15_000,
        },
        (err, result) => {
          if (err || !result) return reject(new Error(err?.message ?? "Cloudinary no ha respondido"));
          resolve(result.secure_url);
        },
      )
      .end(image);
  });
}

export async function deleteAvatar(userId: string) {
  await cloudinary.uploader.destroy(avatarId(userId), { invalidate: true });
}
