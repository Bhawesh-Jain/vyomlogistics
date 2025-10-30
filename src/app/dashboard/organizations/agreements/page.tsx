"use client"

import { useEffect, useRef, useState } from "react";
import { Column, DataTable } from "@/components/data-table/data-table";
import { Container } from "@/components/ui/container";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGlobalDialog } from "@/providers/DialogProvider";
import { deleteAgreement, getAllAgreements } from "@/lib/actions/organizations";
import { Agreement } from "@/lib/repositories/organizationRepository";
import { Button, ButtonTooltip } from "@/components/ui/button";
import { Edit2, Trash } from "lucide-react";
import AddAgreement from "./blocks/AddItem";
import formatDate from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";

export default function AgreementMaster() {
  const [items, setItems] = useState<Agreement[]>([])
  const [reload, setReload] = useState(true);
  const [selected, setSelected] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(false)
  const { showError } = useGlobalDialog();

  const itemsRef = useRef<Agreement[]>([]);

  useEffect(() => {
    (async () => {
      setReload(false);
      setLoading(true);
      setItems([]);
      const data = await getAllAgreements();

      if (data.success) {
        setItems(data.result);
      } else {
        showError(data.error || "Failed to load agreement", '');
      }

      setLoading(false);
    })();
  }, [reload]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const deleteAgreementFunc = async (agreementId: number) => {
    confirm(`Are you sure you want to delete this agreement? This action cannot be undone. ${agreementId}`);

    try {
      const result = await deleteAgreement(agreementId);
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

  const columns: Column<Agreement>[] = [
    {
      id: "org_name",
      header: "Organization Name",
      accessorKey: "org_name",
      sortable: true,
      visible: true,
    },
    {
      id: "start_date",
      header: "Start Date",
      accessorKey: "start_date",
      sortable: true,
      visible: true,
      cell: (row) => (
        <span>{formatDate(row.start_date)}</span>
      )
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
      id: "status",
      header: "Status",
      accessorKey: "status",
      sortable: true,
      visible: true,
      cell: (row) => (
        <Badge variant={row.status == 0 ? 'secondary' : 'default'}>{row.status == 0 ? 'Deactived' : 'Active'}</Badge>
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
          <ButtonTooltip title='Edit Agreement' variant="ghost" size="sm" onClick={() => { setForm(true); setSelected(row) }}>
            <Edit2 className="h-4 w-4" />
          </ButtonTooltip>
          {row.status == 1 && <ButtonTooltip title='Delete Agreement' variant="ghost" size="sm" onClick={() => deleteAgreementFunc(row.agreement_id)}>
            <Trash className="h-4 w-4 text-destructive" />
          </ButtonTooltip>}
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
              Add Agreement
            </ButtonTooltip>}
        </CardHeader>
      </div>
      <CardContent>

        {form
          ? <AddAgreement setForm={() => { setForm(false); setSelected(null); }} setReload={setReload} agreementId={selected?.agreement_id} />
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