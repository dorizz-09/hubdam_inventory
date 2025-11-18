import {
  barracks,
  pics,
  admins,
  inventory,
  members,
  type Barrack,
  type Pic,
  type Admin,
  type InventoryItem,
  type Member,
  type InsertBarrack,
  type InsertPic,
  type InsertAdmin,
  type InsertInventory,
  type InsertMember,
  type BarrackDetail,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Barracks
  getAllBarracks(): Promise<Barrack[]>;
  getBarrackById(id: number): Promise<BarrackDetail | undefined>;
  createBarrack(barrack: InsertBarrack): Promise<Barrack>;
  updateBarrack(id: number, barrack: Partial<InsertBarrack>): Promise<Barrack | undefined>;
  deleteBarrack(id: number): Promise<void>;
  resetBarrackVerification(id: number): Promise<void>;
  
  // PICs
  getAllPics(): Promise<Pic[]>;
  getPicById(id: number): Promise<Pic | undefined>;
  getPicByUsername(username: string): Promise<Pic | undefined>;
  createPic(pic: InsertPic & { passwordHash: string }): Promise<Pic>;
  
  // Admins
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin & { passwordHash: string }): Promise<Admin>;
  
  // Inventory
  getAllInventory(): Promise<InventoryItem[]>;
  getInventoryByBarrackId(barackId: number): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventory): Promise<InventoryItem>;
  updateInventoryItem(id: number, item: Partial<InsertInventory>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: number): Promise<void>;
  
  // Members
  getAllMembers(): Promise<Member[]>;
  getMembersByBarrackId(barackId: number): Promise<Member[]>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: number, member: Partial<InsertMember>): Promise<Member | undefined>;
  deleteMember(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Barracks
  async getAllBarracks(): Promise<Barrack[]> {
    const result = await db.query.barracks.findMany({
      with: {
        pic: true,
      },
    });
    return result as any;
  }

  async getBarrackById(id: number): Promise<BarrackDetail | undefined> {
    const result = await db.query.barracks.findFirst({
      where: eq(barracks.id, id),
      with: {
        pic: true,
        inventory: true,
        members: true,
      },
    });
    return result as any;
  }

  async createBarrack(barrack: InsertBarrack): Promise<Barrack> {
    const [result] = await db.insert(barracks).values(barrack).returning();
    return result;
  }

  async updateBarrack(id: number, barrack: Partial<InsertBarrack> & { verified?: boolean }): Promise<Barrack | undefined> {
    // Only reset verification if this is an admin edit (verified not explicitly set)
    const updateData = barrack.verified !== undefined 
      ? barrack 
      : { ...barrack, verified: false };
    
    const [result] = await db
      .update(barracks)
      .set(updateData)
      .where(eq(barracks.id, id))
      .returning();
    return result;
  }

  async deleteBarrack(id: number): Promise<void> {
    await db.delete(barracks).where(eq(barracks.id, id));
  }

  async resetBarrackVerification(id: number): Promise<void> {
    await db.update(barracks).set({ verified: false }).where(eq(barracks.id, id));
  }

  // PICs
  async getAllPics(): Promise<Pic[]> {
    return await db.select().from(pics);
  }

  async getPicById(id: number): Promise<Pic | undefined> {
    const [result] = await db.select().from(pics).where(eq(pics.id, id));
    return result;
  }

  async getPicByUsername(username: string): Promise<Pic | undefined> {
    const [result] = await db.select().from(pics).where(eq(pics.username, username));
    return result;
  }

  async createPic(pic: InsertPic & { passwordHash: string }): Promise<Pic> {
    const [result] = await db.insert(pics).values(pic).returning();
    return result;
  }

  // Admins
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [result] = await db.select().from(admins).where(eq(admins.username, username));
    return result;
  }

  async createAdmin(admin: InsertAdmin & { passwordHash: string }): Promise<Admin> {
    const [result] = await db.insert(admins).values(admin).returning();
    return result;
  }

  // Inventory
  async getAllInventory(): Promise<InventoryItem[]> {
    return await db.select().from(inventory);
  }

  async getInventoryByBarrackId(barackId: number): Promise<InventoryItem[]> {
    return await db.select().from(inventory).where(eq(inventory.barackId, barackId));
  }

  async createInventoryItem(item: InsertInventory): Promise<InventoryItem> {
    const [result] = await db.insert(inventory).values(item).returning();
    return result;
  }

  async updateInventoryItem(id: number, item: Partial<InsertInventory>): Promise<InventoryItem | undefined> {
    const [result] = await db.update(inventory).set(item).where(eq(inventory.id, id)).returning();
    
    if (result && item.barackId) {
      await this.resetBarrackVerification(item.barackId);
    } else if (result) {
      const inventoryItem = await db.select().from(inventory).where(eq(inventory.id, id));
      if (inventoryItem[0]) {
        await this.resetBarrackVerification(inventoryItem[0].barackId);
      }
    }
    
    return result;
  }

  async deleteInventoryItem(id: number): Promise<void> {
    const [item] = await db.select().from(inventory).where(eq(inventory.id, id));
    if (item) {
      await this.resetBarrackVerification(item.barackId);
    }
    await db.delete(inventory).where(eq(inventory.id, id));
  }

  // Members
  async getAllMembers(): Promise<Member[]> {
    return await db.select().from(members);
  }

  async getMembersByBarrackId(barackId: number): Promise<Member[]> {
    return await db.select().from(members).where(eq(members.barackId, barackId));
  }

  async createMember(member: InsertMember): Promise<Member> {
    const [result] = await db.insert(members).values(member).returning();
    return result;
  }

  async updateMember(id: number, member: Partial<InsertMember>): Promise<Member | undefined> {
    const [result] = await db.update(members).set(member).where(eq(members.id, id)).returning();
    
    if (result && member.barackId) {
      await this.resetBarrackVerification(member.barackId);
    } else if (result) {
      const memberRecord = await db.select().from(members).where(eq(members.id, id));
      if (memberRecord[0]) {
        await this.resetBarrackVerification(memberRecord[0].barackId);
      }
    }
    
    return result;
  }

  async deleteMember(id: number): Promise<void> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    if (member) {
      await this.resetBarrackVerification(member.barackId);
    }
    await db.delete(members).where(eq(members.id, id));
  }
}

export const storage = new DatabaseStorage();
