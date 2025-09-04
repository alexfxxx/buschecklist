import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Bus, 
  ClipboardCheck,
  History,
  ArrowLeft
} from "lucide-react";

export default function Home() {
  const handleBackToLanding = () => {
    window.location.href = "/";
  };

  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
              <Bus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Safety Dashboard</h1>
              <p className="text-sm text-muted-foreground">{today}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToLanding}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-back-to-landing"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 pb-8">
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/checklist">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-8 text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardCheck className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">New Safety Checklist</h2>
                <p className="text-muted-foreground">Complete your daily pre-travel safety inspection</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/history">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-8 text-center">
                <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="h-8 w-8 text-secondary-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">View History</h2>
                <p className="text-muted-foreground">Review past safety checklist submissions</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Information Card */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Bus Safety Inspection</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Vehicle Inspection Items:</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Parking Brake Functioning</li>
                  <li>• Fluid Level Check</li>
                  <li>• Tire Proper Inflation</li>
                  <li>• Engine Oil and Coolant</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Safety Equipment:</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Electrical Lights Working</li>
                  <li>• Seatbelts and Doors</li>
                  <li>• Fire Extinguisher</li>
                  <li>• First-Aid Box</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}