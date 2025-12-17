
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { ArrowUpDown } from "lucide-react";


// 1. Define your data shape
type Transaction = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "email",
    // Example of enabling sorting logic in the column definition
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </button>
      );
    },
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
];

// 3. Mock Data
const data: Transaction[] = [
  { id: "728ed52f", amount: 100, status: "pending", email: "m@example.com" },
  {
    id: "489e1d42",
    amount: 125,
    status: "processing",
    email: "example@gmail.com",
  },
  { id: "123a4d45", amount: 50, status: "success", email: "user@yahoo.com" },
  // ... more data
];

export default function TransactionsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Transactions</h1>

      <DataTable
        columns={columns}
        data={data}
        enableBulkSelect={true}
        actions={[
          {
            label: "View",
            onClick: (row) => {
              console.log("View", row.id);
            },
          },
          {
            label: "Edit",
            onClick: (row) => {
              console.log("Edit", row.id);
            },
          },
          {
            label: "Delete",
            onClick: (row) => {
              console.log("Delete", row.id);
            },
            variant: "destructive",
          },
        ]}
        onRowClick={(row) => {
          console.log("Clicked", row.id);
        }}
      />
    </div>
  );
}
