import {
  users,
  checklists,
  type User,
  type UpsertUser,
  type Checklist,
  type InsertChecklist,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // Checklist operations
  createChecklist(checklist: InsertChecklist): Promise<Checklist>;
  getAllChecklists(limit?: number): Promise<Checklist[]>;
  getChecklistById(id: string): Promise<Checklist | undefined>;
  getTodayChecklistByVehicle(vehicleNumber: string): Promise<Checklist | undefined>;
  getChecklistsInDateRange(startDate: Date, endDate: Date): Promise<Checklist[]>;
  updateChecklist(id: string, checklist: Partial<InsertChecklist>): Promise<Checklist>;
}

export class DatabaseStorage implements IStorage {
  // Checklist operations
  async createChecklist(checklistData: InsertChecklist): Promise<Checklist> {
    // Determine overall status based on inspection results
    const hasFailures = !checklistData.parkingBrake || 
                       !checklistData.fluidLevels ||
                       !checklistData.tires ||
                       !checklistData.engineFluids ||
                       !checklistData.lights ||
                       !checklistData.doorsAndSeatbelts ||
                       !checklistData.emergencyEquipment;
    
    const overallStatus = hasFailures ? "needs_attention" : "all_passed";

    const [checklist] = await db
      .insert(checklists)
      .values({
        ...checklistData,
        overallStatus,
      })
      .returning();
    return checklist;
  }

  async getAllChecklists(limit = 50): Promise<Checklist[]> {
    return await db
      .select()
      .from(checklists)
      .orderBy(desc(checklists.submissionDate))
      .limit(limit);
  }

  async getChecklistById(id: string): Promise<Checklist | undefined> {
    const [checklist] = await db
      .select()
      .from(checklists)
      .where(eq(checklists.id, id));
    return checklist;
  }

  async getTodayChecklistByVehicle(vehicleNumber: string): Promise<Checklist | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [checklist] = await db
      .select()
      .from(checklists)
      .where(
        and(
          eq(checklists.vehicleNumber, vehicleNumber),
          gte(checklists.submissionDate, today),
          lte(checklists.submissionDate, tomorrow)
        )
      )
      .orderBy(desc(checklists.submissionDate));
    return checklist;
  }

  async getChecklistsInDateRange(startDate: Date, endDate: Date): Promise<Checklist[]> {
    return await db
      .select()
      .from(checklists)
      .where(
        and(
          gte(checklists.submissionDate, startDate),
          lte(checklists.submissionDate, endDate)
        )
      )
      .orderBy(desc(checklists.submissionDate));
  }

  async updateChecklist(id: string, checklistData: Partial<InsertChecklist>): Promise<Checklist> {
    // Recalculate overall status if inspection items are being updated
    let updateData: any = { ...checklistData };
    
    if (checklistData.parkingBrake !== undefined ||
        checklistData.fluidLevels !== undefined ||
        checklistData.tires !== undefined ||
        checklistData.engineFluids !== undefined ||
        checklistData.lights !== undefined ||
        checklistData.doorsAndSeatbelts !== undefined ||
        checklistData.emergencyEquipment !== undefined) {
      
      // Get current checklist to merge with updates
      const current = await this.getChecklistById(id);
      if (current) {
        const merged = { ...current, ...checklistData };
        const hasFailures = !merged.parkingBrake || 
                           !merged.fluidLevels ||
                           !merged.tires ||
                           !merged.engineFluids ||
                           !merged.lights ||
                           !merged.doorsAndSeatbelts ||
                           !merged.emergencyEquipment;
        
        updateData.overallStatus = hasFailures ? "needs_attention" : "all_passed";
      }
    }

    const [checklist] = await db
      .update(checklists)
      .set(updateData)
      .where(eq(checklists.id, id))
      .returning();
    return checklist;
  }
}

export const storage = new DatabaseStorage();
