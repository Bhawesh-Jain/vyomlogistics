"use client"

import { useEffect, useRef, useState } from "react";
import { Column, DataTable } from "@/components/data-table/data-table";
import { Container } from "@/components/ui/container";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGlobalDialog } from "@/providers/DialogProvider";
import { getAllEmployees } from "@/lib/actions/employee";
import { Button, ButtonTooltip } from "@/components/ui/button";
import { Edit2, Trash } from "lucide-react";
import AddEmployee from "./blocks/AddEmployee";
import formatDate from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import { Employee } from "@/lib/repositories/employeeRepository";
import { MoneyHelper } from "@/lib/helpers/money-helper";

export default function EmployeeMaster() {
  const [items, setItems] = useState<Employee[]>([])
  const [reload, setReload] = useState(true);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(false)
  const { showError } = useGlobalDialog();

  const itemsRef = useRef<Employee[]>([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      setReload(false);
      setLoading(true);
      setItems([]);
      const data = await getAllEmployees();

      if (data.success) {
        setItems(data.result || []);
      } else {
        showError(data.error || "Failed to load employees", '');
      }

      setLoading(false);
    };

    fetchEmployees();
  }, [reload]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const columns: Column<Employee>[] = [
    {
      id: "employee_id",
      header: "ID",
      accessorKey: "employee_id",
      sortable: true,
      visible: true,
    },
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      sortable: true,
      visible: true,
    },
    {
      id: "company_name",
      header: "Company",
      accessorKey: "company_name",
      sortable: true,
      visible: true,
    },
    {
      id: "role_name",
      header: "Role",
      accessorKey: "role_name",
      sortable: true,
      visible: true,
    },
    {
      id: "phone",
      header: "Phone",
      accessorKey: "phone",
      sortable: true,
      visible: true,
    },
    {
      id: "email",
      header: "Email",
      accessorKey: "email",
      sortable: true,
      visible: true,
    },
    {
      id: "joining_date",
      header: "Joining Date",
      accessorKey: "joining_date",
      sortable: true,
      visible: true,
      cell: (row) => (
        <span>{formatDate(row.joining_date)}</span>
      )
    },
    {
      id: "salary",
      header: "Salary",
      accessorKey: "salary",
      sortable: true,
      visible: true,
      cell: (row) => (
        <span>{MoneyHelper.formatRupees(row.salary)}</span>
      )
    },
    {
      id: "advance",
      header: "Adavance",
      accessorKey: "advance",
      sortable: true,
      visible: true,
      cell: (row) => (
        <span>{MoneyHelper.formatRupees(row.advance)}</span>
      )
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      sortable: true,
      visible: true,
      cell: (row) => (
        <Badge variant={row.status == 0 ? 'destructive' : 'default'}>
          {row.status == 0 ? 'Inactive' : 'Active'}
        </Badge>
      )
    },
    {
      id: "actions",
      header: "Actions",
      accessorKey: "employee_id",
      visible: true,
      sortable: false,
      align: 'right',
      cell: (row) => (
        <div className="flex gap-2 justify-end">
          <ButtonTooltip 
            title='Edit Employee' 
            variant="ghost" 
            size="sm" 
            onClick={() => { 
              setForm(true); 
              setSelected(row) 
            }}
          >
            <Edit2 className="h-4 w-4" />
          </ButtonTooltip>
        </div>
      ),
    },
  ];

  return (
    <Container>
      <div className="flex justify-between items-center">
        <CardHeader>
          <CardTitle>Employee Management</CardTitle>
          <CardDescription>Manage all employees and their details</CardDescription>
        </CardHeader>

        <CardHeader>
          {form
            ? <Button variant={'outline'} onClick={() => { 
                setForm(false); 
                setSelected(null) 
              }}>
              Cancel
            </Button>
            : <ButtonTooltip 
                title='Add a new employee' 
                onClick={() => setForm(true)}
              >
                Add Employee
              </ButtonTooltip>}
        </CardHeader>
      </div>
      <CardContent>
        {form
          ? <AddEmployee 
              setForm={() => { 
                setForm(false); 
                setSelected(null); 
              }} 
              setReload={setReload} 
              employeeId={selected?.employee_id} 
            />
          : <DataTable
              data={items}
              columns={columns}
              loading={loading}
              setReload={setReload}
            />
        }
      </CardContent>
    </Container>
  );
}