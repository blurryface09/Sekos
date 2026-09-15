import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "node:crypto";

export function storageConfigured(): boolean {
  return Boolean(
    process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY,
  );
}

function client(): S3Client {
  return new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
  });
}

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);

/**
 * Hands the browser a short lived URL it can PUT straight to, so photos never
 * pass through the server.
 */
export async function presignUpload(options: {
  spaceId: string;
  planId: string;
  contentType: string;
}): Promise<{ uploadUrl: string; key: string; url: string }> {
  if (!ALLOWED.has(options.contentType)) {
    throw new Error("That file type is not an image we can store.");
  }

  const extension = options.contentType.split("/")[1].replace("jpeg", "jpg");
  const key = `spaces/${options.spaceId}/plans/${options.planId}/${randomBytes(12).toString("hex")}.${extension}`;

  const uploadUrl = await getSignedUrl(
    client(),
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: options.contentType,
    }),
    { expiresIn: 300 },
  );

  const base = (process.env.S3_PUBLIC_URL ?? "").replace(/\/$/, "");
  return { uploadUrl, key, url: `${base}/${key}` };
}
