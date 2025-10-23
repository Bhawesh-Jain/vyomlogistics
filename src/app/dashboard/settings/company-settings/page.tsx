"use client"

import { useEffect, useRef, useState } from "react";
import { Column, DataTable } from "@/components/data-table/data-table";
import { Container } from "@/components/ui/container";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGlobalDialog } from "@/providers/DialogProvider";
import { Badge } from "@/components/ui/badge";
import formatDate from "@/lib/utils/date";
import { MoneyHelper } from "@/lib/helpers/money-helper";
import { getAllCompanies } from "@/lib/actions/settings";
import { Company } from "@/lib/repositories/companyRepository";

export default function CompanyMaster() {
  const [items, setItems] = useState<Company[]>([])
  const [reload, setReload] = useState(true);
  const [loading, setLoading] = useState(true);
  const { showError } = useGlobalDialog();

  const itemsRef = useRef<Company[]>([]);

  useEffect(() => {
    (async () => {
      setReload(false);
      setLoading(true);

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
          {/* <Button variant="ghost" size="sm" onClick={() => deleteTrainer(row.id)}>
            <Trash className="h-4 w-4 text-destructive" />
          </Button> */}
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
          {/* <AddTrainer setReload={setReload} item={null} /> */}
        </CardHeader>
      </div>
      <CardContent>
        <DataTable
          data={items}
          columns={columns}
          loading={loading}
          setReload={setReload}
        />
      </CardContent>
    </Container>
  )
}