import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  History as HistoryIcon, 
  CheckCircle, 
  AlertTriangle,
  ClipboardCheck,
  ChevronRight,
  Download
} from "lucide-react";
import type { Checklist } from "@shared/schema";

const checklistItemNames = {
  parkingBrake: 'Parking Brake',
  fluidLevels: 'Fluid Levels', 
  tires: 'Tire Inflation',
  engineFluids: 'Engine Fluids',
  lights: 'Lights',
  doorsAndSeatbelts: 'Doors/Seatbelts',
  emergencyEquipment: 'Emergency Equip.'
};

export default function History() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState('last30');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Export filters
  const [exportVehicleNumber, setExportVehicleNumber] = useState('');
  const [exportYear, setExportYear] = useState(new Date().getFullYear().toString());
  const [exportMonth, setExportMonth] = useState((new Date().getMonth() + 1).toString());
  const [isExporting, setIsExporting] = useState(false);

  const { data: checklists, isLoading } = useQuery<Checklist[]>({
    queryKey: ["/api/checklists"]
  });

  const goBack = () => {
    setLocation("/dashboard");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getChecklistItems = (checklist: Checklist) => {
    return [
      { name: 'parkingBrake', passed: checklist.parkingBrake },
      { name: 'fluidLevels', passed: checklist.fluidLevels },
      { name: 'tires', passed: checklist.tires },
      { name: 'engineFluids', passed: checklist.engineFluids },
      { name: 'lights', passed: checklist.lights },
      { name: 'doorsAndSeatbelts', passed: checklist.doorsAndSeatbelts },
      { name: 'emergencyEquipment', passed: checklist.emergencyEquipment }
    ];
  };

  const getFailedItems = (checklist: Checklist) => {
    const items = getChecklistItems(checklist);
    return items.filter(item => !item.passed);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const params = new URLSearchParams({
        year: exportYear,
        month: exportMonth,
        format: 'csv'
      });
      
      if (exportVehicleNumber.trim()) {
        params.append('vehicleNumber', exportVehicleNumber.trim());
      }
      
      const response = await fetch(`/api/export/checklists?${params}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or create default
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `checklist_export_${exportYear}_${exportMonth}.csv`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Checklist data has been exported successfully.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export checklist data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Skeleton className="h-10 w-48" />
          </div>
        </header>
        <main className="max-w-4xl mx-auto p-4">
          <Skeleton className="h-20 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Filter checklists based on selected filters
  const filteredChecklists = checklists?.filter(checklist => {
    // Date filter
    const checklistDate = new Date(checklist.submissionDate || '');
    const now = new Date();
    let dateMatch = true;

    switch (dateRange) {
      case 'last7':
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateMatch = checklistDate >= sevenDaysAgo;
        break;
      case 'last30':
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateMatch = checklistDate >= thirtyDaysAgo;
        break;
      case 'last90':
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        dateMatch = checklistDate >= ninetyDaysAgo;
        break;
      default:
        dateMatch = true;
    }

    // Status filter
    let statusMatch = true;
    switch (statusFilter) {
      case 'all_passed':
        statusMatch = checklist.overallStatus === 'all_passed';
        break;
      case 'needs_attention':
        statusMatch = checklist.overallStatus === 'needs_attention';
        break;
      case 'drafts':
        statusMatch = checklist.status === 'draft';
        break;
      default:
        statusMatch = true;
    }

    return dateMatch && statusMatch;
  }) || [];

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
              <h1 className="font-semibold text-foreground">Submission History</h1>
              <p className="text-sm text-muted-foreground">Safety checklist records</p>
            </div>
          </div>
          <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
            <HistoryIcon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-3 sm:p-4 pb-8">
        {/* Filter Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Date Range</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger data-testid="select-date-range">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last7">Last 7 days</SelectItem>
                    <SelectItem value="last30">Last 30 days</SelectItem>
                    <SelectItem value="last90">Last 3 months</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All submissions</SelectItem>
                    <SelectItem value="all_passed">All passed</SelectItem>
                    <SelectItem value="needs_attention">Needs attention</SelectItem>
                    <SelectItem value="drafts">Drafts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end sm:col-span-2 lg:col-span-1">
                <div className="w-full text-center lg:text-left">
                  <p className="text-sm text-muted-foreground">
                    {filteredChecklists.length} record{filteredChecklists.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
                <Download className="h-5 w-5 text-primary mr-2" />
                Export Checklist Data
              </h3>
              <p className="text-sm text-muted-foreground">Export monthly checklist records in CSV format for reporting and analysis.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Vehicle Number (Optional)</label>
                <Input
                  placeholder="e.g., pz333m"
                  value={exportVehicleNumber}
                  onChange={(e) => setExportVehicleNumber(e.target.value)}
                  data-testid="input-export-vehicle"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Year</label>
                <Select value={exportYear} onValueChange={setExportYear}>
                  <SelectTrigger data-testid="select-export-year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Month</label>
                <Select value={exportMonth} onValueChange={setExportMonth}>
                  <SelectTrigger data-testid="select-export-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = i + 1;
                      const monthName = new Date(2025, i, 1).toLocaleDateString('en-US', { month: 'long' });
                      return (
                        <SelectItem key={month} value={month.toString()}>
                          {monthName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="sm:col-span-2 lg:col-span-2">
                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 sm:h-10 text-base sm:text-sm"
                  data-testid="button-export"
                >
                  <Download className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export CSV'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History List */}
        <div className="space-y-4">
          {filteredChecklists.length > 0 ? (
            filteredChecklists.map((checklist) => {
              const failedItems = getFailedItems(checklist);
              const allItems = getChecklistItems(checklist);
              
              return (
                <Card key={checklist.id} className="border border-border overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                          checklist.overallStatus === 'all_passed' 
                            ? 'bg-success/10' 
                            : 'bg-warning/10'
                        }`}>
                          {checklist.overallStatus === 'all_passed' ? (
                            <CheckCircle className="h-6 w-6 sm:h-5 sm:w-5 text-success" />
                          ) : (
                            <AlertTriangle className="h-6 w-6 sm:h-5 sm:w-5 text-warning" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-base sm:text-base" data-testid={`text-date-${checklist.id}`}>
                            {formatDate(checklist.submissionDate || '')}
                          </h3>
                          <p className="text-sm text-muted-foreground" data-testid={`text-vehicle-info-${checklist.id}`}>
                            Vehicle #{checklist.vehicleNumber} • {formatTime(checklist.submissionDate || '')}
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className={`inline-flex items-center px-3 py-2 sm:py-1 rounded-full text-sm sm:text-xs font-medium ${
                          checklist.overallStatus === 'all_passed'
                            ? 'bg-success/10 text-success'
                            : 'bg-warning/10 text-warning'
                        }`} data-testid={`badge-status-${checklist.id}`}>
                          {checklist.overallStatus === 'all_passed' ? 'All Passed' : 'Needs Attention'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                      {allItems.map((item) => (
                        <div key={item.name} className="flex items-center space-x-3 p-2 sm:p-0 rounded-md sm:rounded-none bg-muted/30 sm:bg-transparent">
                          {item.passed ? (
                            <CheckCircle className="h-5 w-5 sm:h-4 sm:w-4 text-success flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 sm:h-4 sm:w-4 text-destructive flex-shrink-0" />
                          )}
                          <span className="text-sm text-foreground">
                            {checklistItemNames[item.name as keyof typeof checklistItemNames]}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {failedItems.length > 0 && (
                      <div className="bg-warning/5 border border-warning/20 rounded-md p-3 mb-4">
                        <p className="text-sm text-warning font-medium">
                          Issues reported: {failedItems.map(item => 
                            checklistItemNames[item.name as keyof typeof checklistItemNames]
                          ).join(', ')}
                        </p>
                      </div>
                    )}

                    {checklist.notes && (
                      <div className="bg-muted/50 border border-border rounded-md p-3 mb-4">
                        <p className="text-sm text-foreground font-medium mb-1">Notes:</p>
                        <p className="text-sm text-muted-foreground">{checklist.notes}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-center sm:justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-primary hover:text-primary/80 h-10 sm:h-8 px-4 sm:px-3 text-base sm:text-sm"
                        data-testid={`button-view-details-${checklist.id}`}
                      >
                        View Details <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No records found</h3>
                <p className="text-muted-foreground mb-4">
                  {checklists?.length === 0 
                    ? "No checklists have been submitted yet"
                    : "No records match your current filters"
                  }
                </p>
                {checklists?.length === 0 && (
                  <Button 
                    onClick={() => setLocation("/checklist")}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-start-first-checklist"
                  >
                    Start Your First Checklist
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}