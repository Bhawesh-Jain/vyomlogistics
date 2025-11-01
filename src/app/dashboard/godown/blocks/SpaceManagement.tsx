"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getAllSpaces, allocateSpace } from "@/lib/actions/warehouse";
import { useGlobalDialog } from "@/providers/DialogProvider";
import { MapPin, Users, Calendar, DollarSign, Square, Plus, Building2, Clock } from "lucide-react";
import { SpaceAllocation } from "@/lib/repositories/warehouseRepository";
import { useToast } from "@/hooks/use-toast";
import AllocateSpaceDialog from "./AllocateSpaceDialog";

export default function SpaceManagement({ godownId }: { godownId: number }) {
  const [spaces, setSpaces] = useState<SpaceAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllocateDialog, setShowAllocateDialog] = useState(false);
  const { showError } = useGlobalDialog();
  const { toast } = useToast();

  useEffect(() => {
    loadSpaces();
  }, [godownId]);

  const loadSpaces = async () => {
    setLoading(true);
    const data = await getAllSpaces(godownId);
    
    if (data.success) {
      setSpaces(data.result);
    } else {
      showError(data.error || "Failed to load spaces", '');
    }
    setLoading(false);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'expired': return 'destructive';
      case 'upcoming': return 'secondary';
      case 'terminated': return 'outline';
      default: return 'outline';
    }
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage < 50) return "bg-green-500";
    if (percentage < 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handleAllocateSuccess = () => {
    setShowAllocateDialog(false);
    loadSpaces();
    toast({
      title: "Success",
      description: "Space allocated successfully!",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <div className="text-muted-foreground">Loading spaces...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Space Allocations</h2>
              <p className="text-muted-foreground">
                Manage space allocations and monitor utilization for this godown
              </p>
            </div>
            <Button onClick={() => setShowAllocateDialog(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Allocate Space
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Square className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {spaces.reduce((sum, space) => Number(sum) + Number(space.allocated_area), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Allocated</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {new Set(spaces.map(space => space.allocated_to_org_id)).size}
                </div>
                <div className="text-sm text-muted-foreground">Active Companies</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {spaces.reduce((sum, space) => Number(sum) + Number(space.monthly_rent), 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Monthly Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {spaces.filter(space => space.status === 'active').length}
                </div>
                <div className="text-sm text-muted-foreground">Active Allocations</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Space Allocations List */}
      <div className="grid gap-4">
        {spaces.map((space) => (
          <Card key={space.allocation_id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Square className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{space.space_name}</h3>
                    <p className="text-sm text-muted-foreground">Code: {space.space_code}</p>
                  </div>
                  <Badge variant={getStatusVariant(space.status)}>
                    {space.status.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{space.company_name}</div>
                      <div className="text-xs text-muted-foreground">Company</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Square className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{space.allocated_area} {space.capacity_unit}</div>
                      <div className="text-xs text-muted-foreground">Allocated Area</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{space.currency} {space.monthly_rent?.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Monthly Rent</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{new Date(space.allocation_end_date).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">Valid Until</div>
                    </div>
                  </div>
                </div>

                {space.agreement_id && (
                  <div className="text-sm text-muted-foreground">
                    Agreement: {`#${space.agreement_id}`}
                  </div>
                )}
              </div>

              <div className="ml-6 text-right min-w-[120px]">
                <div className="text-sm font-medium mb-2">Utilization</div>
                <Progress 
                  value={(space.utilized_area / space.allocated_area) * 100} 
                  className={`w-24 h-2 ${getUtilizationColor((space.utilized_area / space.allocated_area) * 100)}`}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {space.utilized_area} / {space.allocated_area} {space.capacity_unit}
                </div>
                <div className="text-sm font-medium mt-2">
                  {((space.utilized_area / space.allocated_area) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </Card>
        ))}

        {spaces.length === 0 && (
          <Card className="p-12 text-center">
            <Square className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Space Allocations</h3>
            <p className="text-muted-foreground mb-6">
              This godown doesn&lsquo;t have any space allocations yet.
            </p>
            <Button onClick={() => setShowAllocateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Allocate Your First Space
            </Button>
          </Card>
        )}
      </div>

      {/* Allocate Space Dialog */}
      <AllocateSpaceDialog
        open={showAllocateDialog}
        onOpenChange={setShowAllocateDialog}
        godownId={godownId}
        onSuccess={handleAllocateSuccess}
      />
    </div>
  );
}