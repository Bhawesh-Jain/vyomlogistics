"use client"

import { useEffect, useRef, useState } from "react";
import { Column, DataTable } from "@/components/data-table/data-table";
import { Container } from "@/components/ui/container";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGlobalDialog } from "@/providers/DialogProvider";
import { deleteLicense, getAllLicenses } from "@/lib/actions/organizations";
import { License } from "@/lib/repositories/organizationRepository";
import { Button, ButtonTooltip } from "@/components/ui/button";
import { Edit2, Trash } from "lucide-react";
import AddLicense from "./blocks/AddItem";
import formatDate from "@/lib/utils/date";

export default function LicenseMaster() {
  const [items, setItems] = useState<License[]>([])
  const [reload, setReload] = useState(true);
  const [selected, setSelected] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(false)
  const { showError } = useGlobalDialog();

  const itemsRef = useRef<License[]>([]);

  useEffect(() => {
    (async () => {
      setReload(false);
      setLoading(true);
      setItems([]);
      const data = await getAllLicenses();

      if (data.success) {
        setItems(data.result);
      } else {
        showError(data.error || "Failed to load license", '');
      }

      setLoading(false);
    })();
  }, [reload]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const deleteLicenseFunc = async (licenseId: number) => {
    confirm(`Are you sure you want to delete this license? This action cannot be undone. ${licenseId}`);

    try {
      const result = await deleteLicense(licenseId);
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

  const columns: Column<License>[] = [
    {
      id: "org_name",
      header: "Organization Name",
      accessorKey: "org_name",
      sortable: true,
      visible: true,
    },
    {
      id: "business_type",
      header: "Business Type",
      accessorKey: "business_type",
      sortable: true,
      visible: true,
    },
    {
      id: "licence_no",
      header: "License Number",
      accessorKey: "licence_no",
      sortable: true,
      visible: true,
    },
    {
      id: "valid_upto",
      header: "Valid Upto",
      accessorKey: "valid_upto",
      sortable: true,
      visible: true,
      cell: (row) => (
        <span>{formatDate(row.valid_upto)}</span>
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
          <ButtonTooltip title='Edit License' variant="ghost" size="sm" onClick={() => { setForm(true); setSelected(row) }}>
            <Edit2 className="h-4 w-4" />
          </ButtonTooltip>
          <ButtonTooltip title='Delete License' variant="ghost" size="sm" onClick={() => deleteLicenseFunc(row.org_id)}>
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
          ? <AddLicense setForm={() => setForm(false)} setReload={setReload} licenseId={selected?.license_id} />
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