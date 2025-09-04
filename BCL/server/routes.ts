import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChecklistSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple dashboard data endpoint
  app.get('/api/dashboard', async (req, res) => {
    try {
      // Get current month's checklists
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const monthlyChecklists = await storage.getChecklistsInDateRange(startOfMonth, endOfMonth);
      
      // Get recent submissions
      const recentSubmissions = await storage.getAllChecklists(5);
      
      // Calculate stats
      const monthlyCount = monthlyChecklists.length;
      const daysInMonth = endOfMonth.getDate();
      const complianceRate = Math.round((monthlyCount / daysInMonth) * 100);
      
      res.json({
        monthlyCount,
        daysInMonth,
        complianceRate,
        recentSubmissions
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Create checklist
  app.post('/api/checklists', async (req, res) => {
    try {
      const validatedData = insertChecklistSchema.parse(req.body);
      
      // Check if vehicle already has a checklist for today
      const existingChecklist = await storage.getTodayChecklistByVehicle(validatedData.vehicleNumber);
      
      if (existingChecklist) {
        return res.status(409).json({ 
          message: "Duplicate submission not allowed", 
          error: "A checklist for this vehicle has already been submitted today. Only one checklist per vehicle per day is allowed."
        });
      }
      
      // Calculate overall status based on inspection results
      const allPassed = validatedData.parkingBrake && 
                       validatedData.fluidLevels && 
                       validatedData.tires && 
                       validatedData.engineFluids && 
                       validatedData.lights && 
                       validatedData.doorsAndSeatbelts && 
                       validatedData.emergencyEquipment;
      
      const checklistWithStatus = {
        ...validatedData,
        overallStatus: allPassed ? 'all_passed' : 'needs_attention'
      };
      
      const checklist = await storage.createChecklist(checklistWithStatus);
      res.json(checklist);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating checklist:", error);
      res.status(500).json({ message: "Failed to create checklist" });
    }
  });

  // Get all checklists
  app.get('/api/checklists', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const checklists = await storage.getAllChecklists(limit);
      res.json(checklists);
    } catch (error) {
      console.error("Error fetching checklists:", error);
      res.status(500).json({ message: "Failed to fetch checklists" });
    }
  });

  // Get specific checklist
  app.get('/api/checklists/:id', async (req, res) => {
    try {
      const checklist = await storage.getChecklistById(req.params.id);
      
      if (!checklist) {
        return res.status(404).json({ message: "Checklist not found" });
      }
      
      res.json(checklist);
    } catch (error) {
      console.error("Error fetching checklist:", error);
      res.status(500).json({ message: "Failed to fetch checklist" });
    }
  });

  // Update checklist (for drafts)
  app.patch('/api/checklists/:id', async (req, res) => {
    try {
      const checklistId = req.params.id;
      
      // Verify checklist exists
      const existingChecklist = await storage.getChecklistById(checklistId);
      if (!existingChecklist) {
        return res.status(404).json({ message: "Checklist not found" });
      }
      
      const validatedData = insertChecklistSchema.partial().parse(req.body);
      const updatedChecklist = await storage.updateChecklist(checklistId, validatedData);
      
      res.json(updatedChecklist);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating checklist:", error);
      res.status(500).json({ message: "Failed to update checklist" });
    }
  });

  // Check if vehicle has today's checklist
  app.get('/api/vehicle/:vehicleNumber/today', async (req, res) => {
    try {
      const vehicleNumber = req.params.vehicleNumber;
      const todayChecklist = await storage.getTodayChecklistByVehicle(vehicleNumber);
      
      res.json({
        hasChecklist: !!todayChecklist,
        checklist: todayChecklist
      });
    } catch (error) {
      console.error("Error checking today's checklist:", error);
      res.status(500).json({ message: "Failed to check today's checklist" });
    }
  });

  // Export checklists with filters
  app.get('/api/export/checklists', async (req, res) => {
    try {
      const { vehicleNumber, year, month, format = 'csv' } = req.query;
      
      // Validate parameters
      if (!year || !month) {
        return res.status(400).json({ message: "Year and month are required" });
      }
      
      const yearNum = parseInt(year as string);
      const monthNum = parseInt(month as string);
      
      if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ message: "Invalid year or month" });
      }
      
      // Get start and end dates for the month
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
      
      // Get filtered checklists
      let checklists = await storage.getChecklistsInDateRange(startDate, endDate);
      
      // Filter by vehicle number if provided
      if (vehicleNumber) {
        checklists = checklists.filter(c => c.vehicleNumber === vehicleNumber);
      }
      
      if (format === 'csv') {
        // Generate CSV content
        const csvHeaders = [
          'Date',
          'Vehicle Number',
          'Parking Brake',
          'Fluid Levels',
          'Tires',
          'Engine Fluids',
          'Lights',
          'Doors/Seatbelts',
          'Emergency Equipment',
          'Overall Status',
          'Notes',
          'Status'
        ];
        
        const csvRows = checklists.map(checklist => [
          new Date(checklist.submissionDate).toLocaleDateString(),
          checklist.vehicleNumber,
          checklist.parkingBrake ? 'PASS' : 'FAIL',
          checklist.fluidLevels ? 'PASS' : 'FAIL',
          checklist.tires ? 'PASS' : 'FAIL',
          checklist.engineFluids ? 'PASS' : 'FAIL',
          checklist.lights ? 'PASS' : 'FAIL',
          checklist.doorsAndSeatbelts ? 'PASS' : 'FAIL',
          checklist.emergencyEquipment ? 'PASS' : 'FAIL',
          checklist.overallStatus === 'all_passed' ? 'ALL PASSED' : 'NEEDS ATTENTION',
          checklist.notes || '',
          checklist.status.toUpperCase()
        ]);
        
        const csvContent = [
          csvHeaders.join(','),
          ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        const monthName = new Date(yearNum, monthNum - 1, 1).toLocaleDateString('en-US', { month: 'long' });
        const filename = vehicleNumber 
          ? `checklist_${vehicleNumber}_${monthName}_${yearNum}.csv`
          : `checklist_all_vehicles_${monthName}_${yearNum}.csv`;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvContent);
      } else {
        // Return JSON format
        res.json(checklists);
      }
    } catch (error) {
      console.error("Error exporting checklists:", error);
      res.status(500).json({ message: "Failed to export checklists" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
