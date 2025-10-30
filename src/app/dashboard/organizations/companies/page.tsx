"use client"

import { useEffect, useRef, useState } from "react";
import { Column, DataTable } from "@/components/data-table/data-table";
import { Container } from "@/components/ui/container";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGlobalDialog } from "@/providers/DialogProvider";
import { deleteOrganization, getAllCompanies } from "@/lib/actions/organizations";
import { Organization } from "@/lib/repositories/organizationRepository";
import { Button, ButtonTooltip } from "@/components/ui/button";
import { Edit2, Trash } from "lucide-react";
import AddOrganization from "./blocks/AddOrganization";
import formatDate from "@/lib/utils/date";

export default function OrganizationMaster() {
  const [items, setItems] = useState<Organization[]>([])
  const [reload, setReload] = useState(true);
  const [selected, setSelected] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(false)
  const { showError } = useGlobalDialog();

  const itemsRef = useRef<Organization[]>([]);

  useEffect(() => {
    (async () => {
      setReload(false);
      setLoading(true);
      setItems([]);
      const data = await getAllCompanies();

      if (data.success) {
        setItems(data.result);
      } else {
        showError(data.error || "Failed to load organization", '');
      }

      setLoading(false);
    })();
  }, [reload]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const deleteOrganizationFunc = async (organizationId: number) => {
    confirm(`Are you sure you want to delete this organization? This action cannot be undone. ${organizationId}`);

    try {
      const result = await deleteOrganization(organizationId);
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
  }

  const columns: Column<Organization>[] = [
    {
      id: "org_name",
      header: "Organization Name",
      accessorKey: "org_name",
      sortable: true,
      visible: true,
    },
    {
      id: "contact_person",
      header: "Contact Person",
      accessorKey: "contact_person",
      sortable: true,
      visible: true,
    },
    {
      id: "contact_number",
      header: "Contact Number",
      accessorKey: "contact_number",
      sortable: true,
      visible: true,
    },
    {
      id: "signed_on",
      header: "Signed On",
      accessorKey: "signed_on",
      sortable: true,
      visible: true,
      cell: (row) => (
        <span>{formatDate(row.signed_on)}</span>
      )
    },
    {
      id: "actions",
      header: "Actions",
      accessorKey: "org_id",
      visible: true,
      sortable: false,
      align: 'right',
      cell: (row) => (
        <div className="flex gap-2 justify-end">
          <ButtonTooltip title='Edit Organization' variant="ghost" size="sm" onClick={() => { setForm(true); setSelected(row) }}>
            <Edit2 className="h-4 w-4" />
          </ButtonTooltip>
          <ButtonTooltip title='Delete Organization' variant="ghost" size="sm" onClick={() => deleteOrganizationFunc(row.org_id)}>
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
          <CardTitle>Client Management</CardTitle>
          <CardDescription>Manage all clients and their details</CardDescription>
        </CardHeader>

        <CardHeader>
          {form
            ? <Button variant={'outline'} onClick={() => { setForm(false); setSelected(null) }}>
              Cancel
            </Button>
            : <ButtonTooltip title='Add a new Client' onClick={() => setForm(true)}>
              Add Client
            </ButtonTooltip>}
        </CardHeader>
      </div>
      <CardContent>

        {form
          ? <AddOrganization setForm={() => setForm(false)} setReload={setReload} organizationId={selected?.org_id} />
          : <DataTable
            data={items}
            columns={columns}
            loading={loading}
            setReload={setReload}
          />
        }

      </CardContent>
    </Container>
  )
}