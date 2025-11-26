"use client"

import { useEffect, useRef, useState } from "react";
import { Column, DataTable } from "@/components/data-table/data-table";
import { Container } from "@/components/ui/container";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGlobalDialog } from "@/providers/DialogProvider";
import { Button, ButtonTooltip } from "@/components/ui/button";
import { Edit2, Trash, Warehouse, MapPin, DollarSign, PieChart, Square, Users } from "lucide-react";
import AddGodown from "./blocks/AddItem";
import SpaceManagement from "./blocks/SpaceManagement";
import { Godown } from "@/lib/repositories/warehouseRepository";
import { getAllGodowns, deleteGodown } from "@/lib/actions/warehouse";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrencySymbol } from "@/lib/utils";
import { MoneyHelper } from "@/lib/helpers/money-helper";

export default function WarehouseManagement() {
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [reload, setReload] = useState(true);
  const [selected, setSelected] = useState<Godown | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(false);
  const [activeTab, setActiveTab] = useState("godowns");
  const [selectedGodown, setSelectedGodown] = useState<Godown | null>(null);
  const { showError } = useGlobalDialog();

  const godownsRef = useRef<Godown[]>([]);

  useEffect(() => {
    (async () => {
      setReload(false);
      setLoading(true);
      setGodowns([]);
      const data = await getAllGodowns();

      if (data.success) {
        setGodowns(data.result);
      } else {
        showError(data.error || "Failed to load godowns", '');
      }

      setLoading(false);
    })();
  }, [reload]);

  useEffect(() => {
    godownsRef.current = godowns;
  }, [godowns]);

  const deleteGodownFunc = async (godownId: number) => {
    if (!confirm(`Are you sure you want to delete this godown? This action cannot be undone.`)) return;

    try {
      const result = await deleteGodown(godownId);
      setLoading(true);
      if (!result.success) {
        showError("Request Failed!", result.error);
      } else {
        setLoading(false);
        setReload(true);
      }
    } catch (error: any) {
      setLoading(false);
      showError("Request Failed!", error?.message || error.toString());
    }
  };

  const handleManageSpaces = (godown: Godown) => {
    setSelectedGodown(godown);
    setActiveTab("spaces");
  };

  const getUtilizationPercentage = (godown: Godown) => {
    if (!godown.total_capacity || godown.total_capacity == 0) return 0;
    const utilized = Number(godown.total_space_allocated);
    return (utilized / Number(godown.total_capacity)) * 100;
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage < 50) return "bg-green-500";
    if (percentage < 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  const columns: Column<Godown>[] = [
    {
      id: "godown_name",
      header: "Godown Name",
      accessorKey: "godown_name",
      sortable: true,
      visible: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Warehouse className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{row.godown_name}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {row.location}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "capacity",
      header: "Capacity Utilization",
      accessorKey: "total_capacity",
      sortable: true,
      visible: true,
      cell: (row) => (
        <div className="text-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="text-muted-foreground">Utilization</span>
            <span className="font-medium">{getUtilizationPercentage(row).toFixed(1)}%</span>
          </div>
          <Progress 
            value={getUtilizationPercentage(row)} 
            className={`h-2 ${getUtilizationColor(getUtilizationPercentage(row))}`}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Used: {Number(row.total_space_allocated)} {row.capacity_unit}</span>
            <span>Total: {Number(row.total_capacity)} {row.capacity_unit}</span>
          </div>
        </div>
      ),
    },
    {
      id: "financial",
      header: "Financial",
      accessorKey: "monthly_rent",
      sortable: true,
      visible: true,
      cell: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{MoneyHelper.formatRupees(row.monthly_rent)} / month</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Rent for entire godown
          </div>
        </div>
      ),
    },
    {
      id: "allocations",
      header: "Allocations",
      accessorKey: "organization_count",
      sortable: true,
      visible: true,
      cell: (row) => (
        <div className="space-y-1">
          <Badge variant={row.organization_count > 0 ? "default" : "secondary"}>
            <Users className="h-3 w-3 mr-1" />
            {row.organization_count} organizations
          </Badge>
          <div className="text-xs text-muted-foreground">
            Active allocations
          </div>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "is_active",
      sortable: true,
      visible: true,
      cell: (row) => (
        <Badge variant={row.is_active ? "default" : "destructive"}>
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      accessorKey: "godown_id",
      visible: true,
      sortable: false,
      align: 'right',
      cell: (row) => (
        <div className="flex gap-2 justify-end">
          <ButtonTooltip title='Manage Spaces' variant="ghost" size="sm" onClick={() => handleManageSpaces(row)}>
            <Square className="h-4 w-4" />
          </ButtonTooltip>
          <ButtonTooltip title='Edit Godown' variant="ghost" size="sm" onClick={() => { setForm(true); setSelected(row) }}>
            <Edit2 className="h-4 w-4" />
          </ButtonTooltip>
          <ButtonTooltip title='Delete Godown' variant="ghost" size="sm" onClick={() => deleteGodownFunc(row.godown_id)}>
            <Trash className="h-4 w-4 text-destructive" />
          </ButtonTooltip>
        </div>
      ),
    },
  ];

  return (
    <Container>
      <div className="flex justify-between items-center">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-6 w-6" />
            Warehouse Management
          </CardTitle>
          <CardDescription>
            {activeTab === "godowns" 
              ? "Manage godowns, space allocation, and rental costs" 
              : `Managing spaces for ${selectedGodown?.godown_name}`}
          </CardDescription>
        </CardHeader>

        <CardHeader>
          {activeTab === "godowns" ? (
            form ? (
              <Button variant={'outline'} onClick={() => { setForm(false); setSelected(null) }}>
                Cancel
              </Button>
            ) : (
              <ButtonTooltip title='Add a new Godown' onClick={() => setForm(true)}>
                Add Godown
              </ButtonTooltip>
            )
          ) : (
            <Button variant={'outline'} onClick={() => { setActiveTab("godowns"); setSelectedGodown(null); }}>
              ← Back to Godowns
            </Button>
          )}
        </CardHeader>
      </div>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="godowns" className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Godowns
            </TabsTrigger>
            <TabsTrigger 
              value="spaces" 
              className="flex items-center gap-2"
              disabled={!selectedGodown}
            >
              <Square className="h-4 w-4" />
              Space Management
              {selectedGodown && (
                <Badge variant="secondary" className="ml-1">
                  {selectedGodown.godown_name}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="godowns" className="space-y-4">
            {form ? (
              <AddGodown setForm={() => setForm(false)} setReload={setReload} godownId={selected?.godown_id} />
            ) : (
              <DataTable
                data={godowns}
                columns={columns}
                loading={loading}
                setReload={setReload}
              />
            )}
          </TabsContent>

          <TabsContent value="spaces">
            {selectedGodown && (
              <SpaceManagement godownId={selectedGodown.godown_id} capacityUnit={selectedGodown.capacity_unit} totalArea={selectedGodown.total_capacity} />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Container>
  );
}