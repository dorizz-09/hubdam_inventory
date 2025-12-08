import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { insertBarrackSchema, insertInventorySchema, insertMemberSchema, insertPicSchema, insertAdminSchema, loginSchema } from "@shared/schema";
import multer from "multer";
import * as path from "path";
import { ensureUploadsDir, getUploadsDir, generatePhotoFilename, getPublicUrl, deletePhoto, servePhoto } from "./localFileStorage";

const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key-change-in-production";

ensureUploadsDir();

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getUploadsDir());
  },
  filename: (req, file, cb) => {
    const safeFilename = generatePhotoFilename(file.originalname);
    cb(null, safeFilename);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."));
    }
  },
});

function verifyAdminToken(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("Unauthorized");
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string };
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).send("Invalid token");
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/barracks", async (req, res) => {
    try {
      const barracks = await storage.getAllBarracks();
      res.json(barracks);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/barracks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const barrack = await storage.getBarrackById(id);
      if (!barrack) {
        return res.status(404).send("Barrack not found");
      }
      res.json(barrack);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/barracks/:id/verify", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { username, password } = loginSchema.parse(req.body);

      console.log(`[VERIFY] Barrack ID: ${id}, Username: ${username}`);

      const barrack = await storage.getBarrackById(id);
      if (!barrack) {
        console.log(`[VERIFY] Barrack ${id} not found`);
        return res.status(404).send("Barrack not found");
      }

      console.log(`[VERIFY] Barrack found, PIC ID: ${barrack.picId}, Has PIC: ${!!barrack.pic}`);

      if (!barrack.pic) {
        console.log(`[VERIFY] No PIC assigned to barrack ${id}`);
        return res.status(400).send("No PIC assigned to this barrack");
      }

      const pic = await storage.getPicByUsername(username);
      console.log(`[VERIFY] PIC lookup result: ${pic ? `Found PIC ID ${pic.id}` : 'Not found'}`);
      
      if (!pic) {
        console.log(`[VERIFY] PIC ${username} not found`);
        return res.status(401).send("Invalid credentials or unauthorized PIC");
      }

      if (pic.id !== barrack.picId) {
        console.log(`[VERIFY] PIC mismatch - PIC ID: ${pic.id}, Barrack PIC ID: ${barrack.picId}`);
        return res.status(401).send("Invalid credentials or unauthorized PIC");
      }

      const isValid = await bcrypt.compare(password, pic.passwordHash);
      console.log(`[VERIFY] Password valid: ${isValid}`);
      
      if (!isValid) {
        console.log(`[VERIFY] Invalid password for ${username}`);
        return res.status(401).send("Invalid credentials");
      }

      await storage.updateBarrack(id, { verified: true });
      console.log(`[VERIFY] Barrack ${id} verified successfully`);
      res.json({ success: true });
    } catch (error: any) {
      console.error(`[VERIFY] Error:`, error);
      if (error instanceof z.ZodError) {
        return res.status(400).send(error.errors[0].message);
      }
      res.status(500).send(error.message);
    }
  });

  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);

      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        return res.status(401).send("Invalid credentials");
      }

      const isValid = await bcrypt.compare(password, admin.passwordHash);
      if (!isValid) {
        return res.status(401).send("Invalid credentials");
      }

      const token = jwt.sign({ username: admin.username }, JWT_SECRET, { expiresIn: "24h" });
      res.json({ token, username: admin.username });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).send(error.errors[0].message);
      }
      res.status(500).send(error.message);
    }
  });

  app.post("/api/barracks", verifyAdminToken, async (req, res) => {
    try {
      const data = insertBarrackSchema.parse(req.body);
      const { picName, picPassword, ...rest } = data;
      
      let barrackData: { name: string; location: string; photoUrl?: string | null; picId?: number | null } = {
        name: rest.name,
        location: rest.location,
        photoUrl: rest.photoUrl,
      };
      
      let picId: number | null = null;
      if (picName && picName.trim()) {
        let pic = await storage.getPicByUsername(picName);
        
        if (pic) {
          if (picPassword && picPassword.trim()) {
            const passwordHash = await bcrypt.hash(picPassword, 10);
            pic = await storage.updatePic(pic.id, { passwordHash });
          }
        } else {
          if (picPassword && picPassword.trim()) {
            const passwordHash = await bcrypt.hash(picPassword, 10);
            pic = await storage.createPic({
              username: picName,
              name: picName,
              passwordHash,
              rank: null,
            });
          }
        }
        
        if (pic) {
          picId = pic.id;
        }
      }
      
      barrackData.picId = picId;
      const barrack = await storage.createBarrack(barrackData);
      res.json(barrack);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).send(error.errors[0].message);
      }
      res.status(500).send(error.message);
    }
  });

  app.put("/api/barracks/:id", verifyAdminToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertBarrackSchema.partial().parse(req.body);
      const { picName, picPassword, ...rest } = data;
      
      const existingBarrack = await storage.getBarrackById(id);
      
      const barrackData: { name?: string; location?: string; photoUrl?: string | null; picId?: number | null } = {};
      
      if ('name' in req.body) {
        barrackData.name = rest.name;
      }
      if ('location' in req.body) {
        barrackData.location = rest.location;
      }
      
      if ('photoUrl' in req.body) {
        barrackData.photoUrl = rest.photoUrl;
        
        if (existingBarrack && existingBarrack.photoUrl && rest.photoUrl !== existingBarrack.photoUrl) {
          if (existingBarrack.photoUrl.startsWith("/uploads/")) {
            deletePhoto(existingBarrack.photoUrl);
          }
        }
      }
      
      let picId: number | null = null;
      if (picName && picName.trim()) {
        let pic = await storage.getPicByUsername(picName);
        
        if (pic) {
          if (picPassword && picPassword.trim()) {
            const passwordHash = await bcrypt.hash(picPassword, 10);
            pic = await storage.updatePic(pic.id, { passwordHash });
          }
        } else {
          if (picPassword && picPassword.trim()) {
            const passwordHash = await bcrypt.hash(picPassword, 10);
            pic = await storage.createPic({
              username: picName,
              name: picName,
              passwordHash,
              rank: null,
            });
          }
        }
        
        if (pic) {
          picId = pic.id;
        }
      }
      
      if ('picName' in req.body) {
        barrackData.picId = picId;
      }
      
      const barrack = await storage.updateBarrack(id, barrackData);
      if (!barrack) {
        return res.status(404).send("Barrack not found");
      }
      res.json(barrack);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).send(error.errors[0].message);
      }
      res.status(500).send(error.message);
    }
  });

  app.delete("/api/barracks/:id", verifyAdminToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const barrack = await storage.getBarrackById(id);
      if (barrack && barrack.photoUrl && barrack.photoUrl.startsWith("/uploads/")) {
        deletePhoto(barrack.photoUrl);
      }
      
      await storage.deleteBarrack(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/pics", async (req, res) => {
    try {
      const pics = await storage.getAllPics();
      res.json(pics);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/pics", verifyAdminToken, async (req, res) => {
    try {
      const data = insertPicSchema.parse(req.body);
      const passwordHash = await bcrypt.hash(data.password, 10);
      const { password, ...picData } = data;
      const pic = await storage.createPic({ ...picData, passwordHash });
      res.json(pic);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).send(error.errors[0].message);
      }
      res.status(500).send(error.message);
    }
  });

  app.get("/api/inventory", async (req, res) => {
    try {
      const inventory = await storage.getAllInventory();
      res.json(inventory);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/inventory", verifyAdminToken, async (req, res) => {
    try {
      const data = insertInventorySchema.parse(req.body);
      const item = await storage.createInventoryItem(data);
      res.json(item);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).send(error.errors[0].message);
      }
      res.status(500).send(error.message);
    }
  });

  app.put("/api/inventory/:id", verifyAdminToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertInventorySchema.partial().parse(req.body);
      const item = await storage.updateInventoryItem(id, data);
      if (!item) {
        return res.status(404).send("Inventory item not found");
      }
      res.json(item);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).send(error.errors[0].message);
      }
      res.status(500).send(error.message);
    }
  });

  app.delete("/api/inventory/:id", verifyAdminToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteInventoryItem(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/members", async (req, res) => {
    try {
      const members = await storage.getAllMembers();
      res.json(members);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/members", verifyAdminToken, async (req, res) => {
    try {
      const data = insertMemberSchema.parse(req.body);
      const member = await storage.createMember(data);
      res.json(member);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).send(error.errors[0].message);
      }
      res.status(500).send(error.message);
    }
  });

  app.put("/api/members/:id", verifyAdminToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertMemberSchema.partial().parse(req.body);
      const member = await storage.updateMember(id, data);
      if (!member) {
        return res.status(404).send("Member not found");
      }
      res.json(member);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).send(error.errors[0].message);
      }
      res.status(500).send(error.message);
    }
  });

  app.delete("/api/members/:id", verifyAdminToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMember(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/uploads/:filename", (req, res) => {
    const filename = req.params.filename;
    
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ error: "Invalid filename" });
    }
    
    servePhoto(filename, res);
  });

  app.post("/api/barracks/photo-upload", verifyAdminToken, upload.single("photo"), (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const publicUrl = getPublicUrl(req.file.filename);
      res.json({ photoUrl: publicUrl });
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      res.status(500).json({ error: error.message || "Failed to upload photo" });
    }
  });

  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File too large. Maximum size is 10MB." });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err.message && err.message.includes("Invalid file type")) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  });

  const httpServer = createServer(app);

  return httpServer;
}
