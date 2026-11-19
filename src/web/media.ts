// Photos, videos and voice messages: shrunk and encrypted on this phone, then uploaded as
// scrambled bytes to the private "media" bucket (see supabase/migrations/0007_media.sql).
// The file's key travels only inside the end-to-end encrypted chat message.
import { newKey, openBytes, randomBytes, sealBytes, toBase64Url } from "../core/lib/crypto";
import { MEDIA_MAX_BYTES, MEDIA_MIMES, type MediaRef } from "../core/lib/link";
import { getLocal, markInGallery, notInGallery, putLocal } from "./mediaStore";
import { supabase } from "./supabase";

const BUCKET = "media";
const MAX_SIDE = 1600;

export class MediaError extends Error {}

export const mediaAvailable = () => supabase() !== null;

const baseMime = (t: string) => t.split(";")[0].trim().toLowerCase();

async function canvasFrom(src: CanvasImageSource, w: number, h: number, max: number): Promise<HTMLCanvasElement> {
  const scale = Math.min(1, max / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w * scale));
  c.height = Math.max(1, Math.round(h * scale));
  c.getContext("2d")!.drawImage(src, 0, 0, c.width, c.height);
  return c;
}
const tinyPreview = async (src: CanvasImageSource, w: number, h: number) => (await canvasFrom(src, w, h, 24)).toDataURL("image/jpeg", 0.5);
const toBlob = (c: HTMLCanvasElement, type: string, q: number) => new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new MediaError("Couldn’t read that photo."))), type, q));

export type Prepared = { bytes: Uint8Array; ref: Omit<MediaRef, "path" | "key" | "size"> };

/** Photos: turned the right way up, at most 1600 px, saved as JPEG (GIFs stay as they are). */
export async function preparePhoto(file: File): Promise<Prepared> {
  const mime = baseMime(file.type);
  if (!MEDIA_MIMES.image.includes(mime) && !mime.startsWith("image/")) throw new MediaError("That isn’t a photo this app can send.");
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => {
    throw new MediaError("Couldn’t read that photo.");
  });
  const thumb = await tinyPreview(bmp, bmp.width, bmp.height);
  if (mime === "image/gif" && file.size <= MEDIA_MAX_BYTES) {
    return { bytes: new Uint8Array(await file.arrayBuffer()), ref: { type: "image", mime, w: bmp.width, h: bmp.height, thumb } };
  }
  const c = await canvasFrom(bmp, bmp.width, bmp.height, MAX_SIDE);
  const blob = await toBlob(c, "image/jpeg", 0.82);
  return { bytes: new Uint8Array(await blob.arrayBuffer()), ref: { type: "image", mime: "image/jpeg", w: c.width, h: c.height, thumb } };
}

/** Videos: sent as they are (max 50 MB), with a first-frame preview when the phone can make one. */
export async function prepareVideo(file: File): Promise<Prepared> {
  const mime = baseMime(file.type) || "video/mp4";
  if (!MEDIA_MIMES.video.includes(mime)) throw new MediaError("This video format can’t be sent. Try an MP4.");
  if (file.size > MEDIA_MAX_BYTES) throw new MediaError(`That video is ${(file.size / 1048576).toFixed(0)} MB — the limit is 50 MB. Try a shorter one.`);
  const meta = await new Promise<{ w?: number; h?: number; dur?: number; thumb?: string }>((res) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    const done = (x: { w?: number; h?: number; dur?: number; thumb?: string }) => {
      URL.revokeObjectURL(url);
      res(x);
    };
    const timer = setTimeout(() => done({}), 4000);
    v.muted = true;
    v.preload = "metadata";
    v.onloadeddata = () => {
      v.currentTime = Math.min(0.1, v.duration || 0);
    };
    v.onseeked = async () => {
      clearTimeout(timer);
      try {
        done({ w: v.videoWidth || undefined, h: v.videoHeight || undefined, dur: Number.isFinite(v.duration) ? Math.round(v.duration) : undefined, thumb: await tinyPreview(v, v.videoWidth, v.videoHeight) });
      } catch {
        done({ dur: Number.isFinite(v.duration) ? Math.round(v.duration) : undefined });
      }
    };
    v.onerror = () => {
      clearTimeout(timer);
      done({});
    };
    v.src = url;
  });
  return { bytes: new Uint8Array(await file.arrayBuffer()), ref: { type: "video", mime, ...meta } };
}

export async function prepareVoice(blob: Blob, seconds: number): Promise<Prepared> {
  const mime = baseMime(blob.type) || "audio/webm";
  if (!MEDIA_MIMES.audio.includes(mime)) throw new MediaError("This phone recorded a format that can’t be sent.");
  return { bytes: new Uint8Array(await blob.arrayBuffer()), ref: { type: "audio", mime, dur: Math.max(1, Math.round(seconds)) } };
}

/** Encrypt and upload. Returns the reference to put in the chat message. */
export async function uploadMedia(p: Prepared): Promise<MediaRef> {
  const sb = supabase();
  if (!sb) throw new MediaError("Photos and voice messages need the app’s accounts.");
  if (p.bytes.length > MEDIA_MAX_BYTES) throw new MediaError("That file is over 50 MB.");
  const key = newKey();
  const path = toBase64Url(randomBytes(24));
  const sealed = sealBytes(key, p.bytes);
  const { error } = await sb.storage.from(BUCKET).upload(path, new Blob([sealed as BlobPart], { type: "application/octet-stream" }), { contentType: "application/octet-stream", upsert: false });
  if (error) throw new MediaError(/policy|row-level|security/i.test(error.message) ? "Upload refused — is the 0007 setup done, and are you signed in?" : "Couldn’t upload. Check the internet and try again.");
  // Keep my own copy on this phone (it came from here, so it's already in my gallery).
  await putLocal({ path, blob: new Blob([p.bytes as BlobPart], { type: p.ref.mime }), mime: p.ref.mime, at: Date.now(), from: 0, inGallery: true }).catch(() => {});
  return { ...p.ref, path, key, size: p.bytes.length };
}

const cache = new Map<string, string>();

/**
 * A local URL for showing the file. Like Signal: first time, download + decrypt + keep it on
 * this phone, then delete the server copy (for files my partner sent). After that it's offline.
 */
export async function mediaUrl(ref: MediaRef, from: 0 | 1 = 1, at = 0): Promise<string> {
  const hit = cache.get(ref.path);
  if (hit) return hit;
  const local = await getLocal(ref.path).catch(() => null);
  if (local) {
    const url = URL.createObjectURL(local.blob);
    cache.set(ref.path, url);
    return url;
  }
  const sb = supabase();
  if (!sb) throw new MediaError("Not available.");
  const { data, error } = await sb.storage.from(BUCKET).download(ref.path);
  if (error || !data) throw new MediaError(/not.?found|404|400/i.test(error?.message ?? "") ? "expired" : "Couldn’t load.");
  let plain: Uint8Array;
  try {
    plain = openBytes(ref.key, new Uint8Array(await data.arrayBuffer()));
  } catch {
    throw new MediaError("This file was changed or damaged.");
  }
  const blob = new Blob([plain as BlobPart], { type: ref.mime });
  let kept = false;
  try {
    await putLocal({ path: ref.path, blob, mime: ref.mime, at: at || Date.now(), from, inGallery: from === 0 });
    kept = true;
  } catch {
    // phone storage full or blocked: keep the server copy so it can be fetched again
  }
  if (kept && from === 1) deleteMedia(ref.path).catch(() => {});
  const url = URL.createObjectURL(blob);
  cache.set(ref.path, url);
  return url;
}

/** A file name like ZweiHerzen_2026-11-19_14-05-09.jpg */
const fileName = (mime: string, at: number) => {
  const d = new Date(at);
  const p = (n: number) => String(n).padStart(2, "0");
  const ext = mime.split("/")[1].replace("quicktime", "mov").replace("jpeg", "jpg");
  return `ZweiHerzen_${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}.${ext}`;
};

/** Save received photos and videos to the phone (Gallery / Google Photos → Download). Must run from a tap. */
export async function saveToGallery(): Promise<number> {
  const items = await notInGallery();
  for (const f of items) {
    const url = URL.createObjectURL(f.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName(f.mime, f.at);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
    await new Promise((r) => setTimeout(r, 350)); // browsers need a little gap between downloads
  }
  await markInGallery(items.map((f) => f.path));
  return items.length;
}

export const galleryFileName = fileName;

export async function deleteMedia(path: string) {
  await supabase()?.storage.from(BUCKET).remove([path]);
}

export const mediaLabel = (m: Pick<MediaRef, "type">) => (m.type === "image" ? "📷 Photo" : m.type === "video" ? "🎥 Video" : "🎤 Voice message");
export const clock = (sec?: number) => (sec === undefined ? "" : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`);
