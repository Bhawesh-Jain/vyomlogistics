"use client"

import { useEffect, useRef, useState } from "react";
import { Column, DataTable } from "@/components/data-table/data-table";
import { Container } from "@/components/ui/container";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGlobalDialog } from "@/providers/DialogProvider";
import { deleteCompany, getAllCompanies } from "@/lib/actions/settings";
import { Company } from "@/lib/repositories/companyRepository";
import { Button, ButtonTooltip } from "@/components/ui/button";
import { Edit2, Trash } from "lucide-react";
import AddCompany from "./blocks/AddCompany";

export default function CompanyMaster() {
  const [items, setItems] = useState<Company[]>([])
  const [reload, setReload] = useState(true);
  const [selected, setSelected] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(false)
  const { showError } = useGlobalDialog();

  const itemsRef = useRef<Company[]>([]);

  useEffect(() => {
    (async () => {
      setReload(false);
      setLoading(true);
      setItems([]);
      const data = await getAllCompanies();

      if (data.success) {
        setItems(data.result);
      } else {
        showError(data.error || "Failed to load company", '');
      }

      setLoading(false);
    })();
  }, [reload]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const deleteCompanyFunc = async (companyId: number) => {
    confirm(`Are you sure you want to delete this company? This action cannot be undone. ${companyId}`);

    try {
      const result = await deleteCompany(companyId);
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

  const columns: Column<Company>[] = [
    {
      id: "company_name",
      header: "Company Name",
      accessorKey: "company_name",
      sortable: true,
      visible: true,
    },
    {
      id: "abbr",
      header: "Type",
      accessorKey: "abbr",
      sortable: true,
      visible: true,
    },
    {
      id: "actions",
      header: "Actions",
      accessorKey: "company_id",
      visible: true,
      sortable: false,
      align: 'right',
      cell: (row) => (
        <div className="flex gap-2 justify-end">
          <ButtonTooltip title='Edit Company' variant="ghost" size="sm" onClick={() => { setForm(true); setSelected(row) }}>
            <Edit2 className="h-4 w-4" />
          </ButtonTooltip>
          <ButtonTooltip title='Delete Company' variant="ghost" size="sm" onClick={() => deleteCompanyFunc(row.company_id)}>
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
          <CardTitle>Trainer Management</CardTitle>
          <CardDescription>Manage all trainers and their details</CardDescription>
        </CardHeader>

        <CardHeader>
          {form
            ? <Button variant={'outline'} onClick={() => { setForm(false); setSelected(null) }}>
              Cancel
            </Button>
            : <ButtonTooltip title='Add a new Company' onClick={() => setForm(true)}>
              Add Company
            </ButtonTooltip>}
        </CardHeader>
      </div>
      <CardContent>

        {form
          ? <AddCompany setForm={() => setForm(false)} setReload={setReload} companyId={selected?.company_id} />
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