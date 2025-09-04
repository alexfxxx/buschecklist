import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertChecklistSchema, type InsertChecklist } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLocation } from "wouter";
import { 
  ArrowLeft, 
  ClipboardCheck, 
  Bus, 
  Shield, 
  Hand,
  Droplets,
  Car,
  Fuel,
  Lightbulb,
  DoorOpen,
  Flame,
  Save,
  CheckCircle
} from "lucide-react";

const checklistItems = [
  {
    id: 'parkingBrake',
    title: 'Parking Brake Functioning',
    description: 'Verify parking brake engages and releases properly',
    icon: Hand
  },
  {
    id: 'fluidLevels',
    title: 'Fluid Level Check',
    description: 'Check brake fluid, power steering, and windshield washer fluid levels',
    icon: Droplets
  },
  {
    id: 'tires',
    title: 'Tires Proper Inflation',
    description: 'Check all tires for proper inflation and visible damage',
    icon: Car
  },
  {
    id: 'engineFluids',
    title: 'Engine Oil and Coolant Level Check',
    description: 'Verify engine oil and coolant levels are within acceptable range',
    icon: Fuel
  },
  {
    id: 'lights',
    title: 'Electrical Lights Working',
    description: 'Test headlights, tail lights, brake lights, turn signals, and hazard lights',
    icon: Lightbulb
  },
  {
    id: 'doorsAndSeatbelts',
    title: 'Seatbelts and All Doors Working',
    description: 'Check seatbelt functionality and door operation (opening, closing, locking)',
    icon: DoorOpen
  },
  {
    id: 'emergencyEquipment',
    title: 'Extinguisher/First-Aid Box',
    description: 'Verify fire extinguisher and first-aid kit are present and accessible',
    icon: Flame
  }
];

export default function Checklist() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [completedItems, setCompletedItems] = useState(0);
  const [vehicleNumber, setVehicleNumber] = useState("");

  const form = useForm<InsertChecklist>({
    resolver: zodResolver(insertChecklistSchema),
    defaultValues: {
      vehicleNumber: '',
      parkingBrake: undefined,
      fluidLevels: undefined,
      tires: undefined,
      engineFluids: undefined,
      lights: undefined,
      doorsAndSeatbelts: undefined,
      emergencyEquipment: undefined,
      notes: '',
      status: 'completed'
    }
  });

  // Check for today's checklist for this vehicle
  const { data: todayChecklistData, isLoading: checkingTodayChecklist } = useQuery({
    queryKey: ["/api/vehicle", vehicleNumber, "today"],
    enabled: !!vehicleNumber,
  });

  // Redirect to landing if no vehicle number
  useEffect(() => {
    const storedVehicleNumber = sessionStorage.getItem("vehicleNumber");
    if (!storedVehicleNumber) {
      setLocation("/");
      return;
    }
    setVehicleNumber(storedVehicleNumber);
    form.setValue("vehicleNumber", storedVehicleNumber);
  }, [setLocation, form]);

  // Check if checklist already exists for today
  useEffect(() => {
    if (todayChecklistData?.hasChecklist) {
      toast({
        title: "Checklist Already Submitted",
        description: "This vehicle has already completed today's safety checklist. You can view it in the history section.",
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [todayChecklistData, toast, setLocation]);

  // Watch form values to update progress
  const watchedValues = form.watch();
  useEffect(() => {
    const booleanFields = ['parkingBrake', 'fluidLevels', 'tires', 'engineFluids', 'lights', 'doorsAndSeatbelts', 'emergencyEquipment'];
    const completed = booleanFields.filter(field => watchedValues[field as keyof InsertChecklist] !== undefined).length;
    setCompletedItems(completed);
  }, [watchedValues]);

  const createChecklistMutation = useMutation({
    mutationFn: async (data: InsertChecklist) => {
      return await apiRequest("POST", "/api/checklists", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists"] });
      toast({
        title: "Success",
        description: "Checklist submitted successfully!",
      });
      setLocation("/success");
    },
    onError: (error) => {
      console.error("Submission error:", error);
      
      // Check if it's a duplicate submission error
      if (error.message.includes("409") || error.message.includes("Duplicate submission")) {
        toast({
          title: "Already Submitted",
          description: "This vehicle has already submitted a checklist today. Only one checklist per vehicle per day is allowed.",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation("/dashboard");
        }, 2000);
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to submit checklist. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: async (data: InsertChecklist) => {
      return await apiRequest("POST", "/api/checklists", { ...data, status: 'draft' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists"] });
      toast({
        title: "Draft Saved",
        description: "Your checklist has been saved as a draft.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertChecklist) => {
    console.log("Form submission data:", data);
    
    // Check if all required fields are filled
    const requiredFields = ['parkingBrake', 'fluidLevels', 'tires', 'engineFluids', 'lights', 'doorsAndSeatbelts', 'emergencyEquipment'];
    const missingFields = requiredFields.filter(field => data[field as keyof InsertChecklist] === undefined);
    
    if (missingFields.length > 0) {
      toast({
        title: "Please complete all inspections",
        description: `Missing: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }
    
    createChecklistMutation.mutate(data);
  };

  const onSaveDraft = () => {
    const data = form.getValues();
    saveDraftMutation.mutate({ ...data, status: 'draft' });
  };

  const goBack = () => {
    setLocation("/");
  };

  // Show loading while checking for existing submission
  if (checkingTodayChecklist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking submission status...</p>
        </div>
      </div>
    );
  }

  const progressPercentage = Math.round((completedItems / 7) * 100);
  const currentDateTime = new Date().toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">Pre-Travel Safety Checklist</h1>
              <p className="text-sm text-muted-foreground">{currentDateTime}</p>
            </div>
          </div>
          <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
            <ClipboardCheck className="h-5 w-5 text-primary" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-3 sm:p-4 pb-8">
        {/* Progress Indicator */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Progress</span>
              <span className="text-sm text-muted-foreground" data-testid="text-progress">
                {completedItems}/7 completed
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progressPercentage}%` }}
                data-testid="progress-bar"
              />
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Vehicle Information */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <Bus className="h-5 w-5 text-primary mr-2" />
                  Vehicle Information
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="vehicleNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter vehicle number" 
                            {...field} 
                            data-testid="input-vehicle-number"
                            readOnly
                            className="bg-muted"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Safety Inspection Items */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center">
                  <Shield className="h-5 w-5 text-primary mr-2" />
                  Vehicle Inspection Checklist
                </h2>
                
                <div className="space-y-6">
                  {checklistItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Card key={item.id} className="border border-border">
                        <CardContent className="p-4 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-3">
                            <div className="flex-1 text-center sm:text-left mb-3 sm:mb-0">
                              <h3 className="font-medium text-foreground mb-2 sm:mb-1 text-base">{item.title}</h3>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                            <Icon className="h-6 w-6 sm:h-5 sm:w-5 text-muted-foreground mx-auto sm:mx-0 sm:mt-1" />
                          </div>
                          <FormField
                            control={form.control}
                            name={item.id as keyof InsertChecklist}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={(value) => field.onChange(value === 'true')}
                                    value={field.value === undefined ? undefined : field.value.toString()}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                                  >
                                    <div className="flex items-center space-x-3 p-4 sm:p-3 border border-border rounded-md cursor-pointer hover:bg-accent transition-colors min-h-[3rem] sm:min-h-0">
                                      <RadioGroupItem 
                                        value="true" 
                                        id={`${item.id}-pass`}
                                        data-testid={`radio-${item.id}-pass`}
                                        className="w-5 h-5 sm:w-4 sm:h-4"
                                      />
                                      <label 
                                        htmlFor={`${item.id}-pass`}
                                        className="text-base sm:text-sm font-medium text-foreground cursor-pointer flex-1"
                                      >
                                        ✓ Pass
                                      </label>
                                      <CheckCircle className="h-5 w-5 sm:h-4 sm:w-4 text-success" />
                                    </div>
                                    <div className="flex items-center space-x-3 p-4 sm:p-3 border border-border rounded-md cursor-pointer hover:bg-accent transition-colors min-h-[3rem] sm:min-h-0">
                                      <RadioGroupItem 
                                        value="false" 
                                        id={`${item.id}-fail`}
                                        data-testid={`radio-${item.id}-fail`}
                                        className="w-5 h-5 sm:w-4 sm:h-4"
                                      />
                                      <label 
                                        htmlFor={`${item.id}-fail`}
                                        className="text-base sm:text-sm font-medium text-foreground cursor-pointer flex-1"
                                      >
                                        ✗ Fail
                                      </label>
                                      <CheckCircle className="h-5 w-5 sm:h-4 sm:w-4 text-destructive" />
                                    </div>
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Additional Notes */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-foreground mb-3 flex items-center">
                  <ClipboardCheck className="h-5 w-5 text-primary mr-2" />
                  Additional Notes (Optional)
                </h3>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any additional observations or concerns..."
                          className="resize-none"
                          rows={4}
                          {...field}
                          data-testid="textarea-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Actions */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
                  <Button 
                    type="button" 
                    variant="secondary"
                    className="flex-1 h-12 sm:h-10 text-base sm:text-sm"
                    onClick={onSaveDraft}
                    disabled={saveDraftMutation.isPending}
                    data-testid="button-save-draft"
                  >
                    <Save className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                    {saveDraftMutation.isPending ? 'Saving...' : 'Save as Draft'}
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-14 sm:h-10 text-lg sm:text-sm font-medium"
                    disabled={createChecklistMutation.isPending}
                    data-testid="button-submit"
                  >
                    <CheckCircle className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                    {createChecklistMutation.isPending ? 'Submitting...' : 'Submit Checklist'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-4 sm:mt-3 text-center">
                  By submitting, you confirm all inspections have been completed accurately
                </p>
              </CardContent>
            </Card>
          </form>
        </Form>
      </main>
    </div>
  );
}
