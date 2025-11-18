import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { insertBarrackSchema, insertInventorySchema, insertMemberSchema, insertPicSchema, insertAdminSchema, loginSchema } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key-change-in-production";

// Middleware to verify admin JWT token
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
  // Public Routes - Barracks
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

  // PIC Verification
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

      // Update verification status
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

  // Admin Authentication
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

  // Admin Routes - Barracks
  app.post("/api/barracks", verifyAdminToken, async (req, res) => {
    try {
      const data = insertBarrackSchema.parse(req.body);
      
      // Normalize photo URL if it's from object storage
      if (data.photoUrl) {
        const objectStorageService = new ObjectStorageService();
        data.photoUrl = objectStorageService.normalizeBarrackPhotoPath(data.photoUrl);
      }
      
      const barrack = await storage.createBarrack(data);
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
      
      // Normalize photo URL if it's from object storage
      if (data.photoUrl) {
        const objectStorageService = new ObjectStorageService();
        data.photoUrl = objectStorageService.normalizeBarrackPhotoPath(data.photoUrl);
      }
      
      const barrack = await storage.updateBarrack(id, data);
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
      await storage.deleteBarrack(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // PICs
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

  // Inventory
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

  // Members
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

  // Admin creation endpoint removed for security - use database seeding for admin creation

  // Object Storage Routes - Serve public objects (barrack photos)
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get upload URL for barrack photo
  app.post("/api/barracks/photo-upload-url", verifyAdminToken, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getBarrackPhotoUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Error getting upload URL:", error);
      res.status(500).send(error.message);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
