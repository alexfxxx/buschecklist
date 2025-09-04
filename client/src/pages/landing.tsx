import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bus, Shield, ClipboardCheck } from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [, setLocation] = useLocation();

  const handleStartChecklist = () => {
    if (vehicleNumber.trim()) {
      // Store vehicle number in sessionStorage for use in checklist
      sessionStorage.setItem("vehicleNumber", vehicleNumber.trim());
      setLocation("/checklist");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/10 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-sm sm:max-w-md">
        <Card className="shadow-lg border border-border">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <div className="bg-primary/10 w-20 h-20 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bus className="h-10 w-10 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Bus Safety Portal</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">Daily Pre-Travel Safety Checklist</p>
            </div>
            
            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <div className="flex items-center space-x-3 text-sm sm:text-sm">
                <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">Comprehensive vehicle inspection</span>
              </div>
              <div className="flex items-center space-x-3 text-sm sm:text-sm">
                <ClipboardCheck className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">Digital record keeping</span>
              </div>
              <div className="flex items-center space-x-3 text-sm sm:text-sm">
                <Bus className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">Daily compliance tracking</span>
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              <div>
                <Label htmlFor="vehicle-number" className="text-base sm:text-sm font-medium text-foreground">
                  Vehicle Number
                </Label>
                <Input
                  id="vehicle-number"
                  type="text"
                  placeholder="Enter your vehicle number"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="mt-2 h-12 sm:h-10 text-lg sm:text-base"
                  data-testid="input-vehicle-number"
                />
              </div>
            </div>
            
            <Button 
              onClick={handleStartChecklist}
              disabled={!vehicleNumber.trim()}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 h-14 sm:h-10 text-lg sm:text-base font-medium"
              data-testid="button-start-checklist"
            >
              Start Safety Checklist
            </Button>
            
            <div className="mt-6 text-center">
              <p className="text-xs sm:text-xs text-muted-foreground">
                Complete your daily pre-travel safety inspection
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
