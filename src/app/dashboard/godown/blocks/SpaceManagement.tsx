"use client"

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button, ButtonTooltip } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useGlobalDialog } from "@/providers/DialogProvider";
import { Users, Calendar, DollarSign, Square, Plus, Building2, Clock, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AllocateSpaceDialog from "./AllocateSpaceDialog";
import { GodownSpaceAllocation } from "@/lib/repositories/warehouseRepository";
import { getAllSpaces } from "@/lib/actions/warehouse";
import { getCurrencySymbol, getStatusName } from "@/lib/utils";
import { MoneyHelper } from "@/lib/helpers/money-helper";
import formatDate from "@/lib/utils/date";
import { Container } from "@/components/ui/container";

export default function SpaceManagement({ godownId, capacityUnit, totalArea }: { godownId: number, capacityUnit: string, totalArea: number }) {
  const [spaces, setSpaces] = useState<GodownSpaceAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllocateDialog, setShowAllocateDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSpaces();
  }, [godownId]);

  const loadSpaces = async () => {
    setLoading(true);
    const data = await getAllSpaces(godownId);

    if (data.success) {
      setSpaces(data.result);
    }
    setLoading(false);
  };

  const getStatusVariant = (status: number) => {
    switch (status) {
      case 1: return 'default';
      case -1: return 'destructive';
      case 0: return 'secondary';
      case 0: return 'outline';
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
          <div className="flex flex-col lg:flex-row justify-between items-start gap-3">
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Square className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {spaces.reduce((sum, space) => Number(sum) + Number(space.space_allocated), 0)}
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
                  {new Set(spaces.map(space => space.org_id)).size}
                </div>
                <div className="text-sm text-muted-foreground">Active Companies</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                <span className="w-4 h-4">{getCurrencySymbol('INR')}</span>
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
                  {spaces.filter(space => space.status === 1).length}
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
            <div className="flex flex-col lg:flex-row gap-3 items-start justify-between">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Square className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold text-lg">{space.org_name}</span>
                  </div>
                  <Badge variant={getStatusVariant(space.status)}>
                    {getStatusName(String(space.status))}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{space.contact_person}</div>
                      <div className="text-xs text-muted-foreground">Contact Person</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Square className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{space.space_allocated} {capacityUnit}</div>
                      <div className="text-xs text-muted-foreground">Allocated Area</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{MoneyHelper.formatRupees(space.monthly_rent)}</div>
                      <div className="text-xs text-muted-foreground">Monthly Rent</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{formatDate(space.created_on)}</div>
                      <div className="text-xs text-muted-foreground">Allocated On</div>
                    </div>
                  </div>
                </div>

                {space.valid_upto && (
                  <div className="text-sm text-muted-foreground">
                    Agreement Valid Upto: {formatDate(space.valid_upto)}
                  </div>
                )}
              </div>

              <div className="lg:ml-6 w-full lg:w-1/5 flex flex-row items-center gap-4">

                <div className="flex-1">
                  <div className="text-sm font-medium mb-2">Utilization</div>

                  <Progress
                    value={(space.space_allocated / totalArea) * 100}
                    className={`w-full h-2 ${getUtilizationColor(
                      (space.space_allocated / totalArea) * 100
                    )}`}
                  />

                  <div className="text-xs text-muted-foreground mt-1">
                    {space.space_allocated} / {totalArea} {capacityUnit}
                  </div>

                  <div className="text-sm font-medium mt-2">
                    {((space.space_allocated / totalArea) * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="flex md:justify-end">
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
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