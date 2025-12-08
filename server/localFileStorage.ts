import { Response } from "express";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export function ensureUploadsDir(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export function getUploadsDir(): string {
  return UPLOADS_DIR;
}

export function generatePhotoFilename(originalName: string): string {
  const ext = path.extname(originalName) || ".jpg";
  return `${randomUUID()}${ext}`;
}

export function getPhotoPath(filename: string): string {
  return path.join(UPLOADS_DIR, filename);
}

export function getPublicUrl(filename: string): string {
  return `/uploads/${filename}`;
}

export function deletePhoto(photoUrl: string): boolean {
  if (!photoUrl) return false;
  
  const filename = photoUrl.replace("/uploads/", "");
  if (!filename || filename.includes("..")) return false;
  
  const filePath = path.join(UPLOADS_DIR, filename);
  
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (error) {
    console.error("Error deleting photo:", error);
  }
  
  return false;
}

export function servePhoto(filename: string, res: Response): void {
  const filePath = path.join(UPLOADS_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  
  const contentType = mimeTypes[ext] || "application/octet-stream";
  const stat = fs.statSync(filePath);
  
  res.set({
    "Content-Type": contentType,
    "Content-Length": stat.size,
    "Cache-Control": "public, max-age=3600",
  });
  
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}
