"use client";

import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { DashboardSidebarInset } from '@/components/dashboard/app-sidebar-inset';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Copy,
  CheckCircle2,
  Clock,
  XCircle,
  Edit,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Wallet Address type definition
type WalletAddress = {
  id: string;
  address: string;
  memo?: string;
};

// Customer type definition
type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  walletAddresses: WalletAddress[];
  createdAt: Date;
  businessName?: string;
};

// Payment type definition
type Payment = {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: "succeeded" | "pending" | "failed";
  date: Date;
  transactionHash?: string;
};


// Mock customer data - in real app, fetch by ID
const getCustomerById = (id: string): Customer | null => {
  const customers: Customer[] = [
    {
      id: "1",
      name: "Manan Trivedi",
      email: "manan@bricxlabs.com",
      phone: "+1 234-567-8900",
      walletAddresses: [
        {
          id: "wallet_1_1",
          address: "GABCDEFGHIJKLMNOPQRSTUVWXYZ12345678901234567890",
          memo: "Primary wallet",
        },
        {
          id: "wallet_1_2",
          address: "G9876543210ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
          memo: "Secondary wallet",
        },
      ],
      createdAt: new Date("2024-12-18T14:56:00"),
    },
    {
      id: "2",
      name: "Kevin Isaac",
      email: "aravind@zephony.com",
      phone: "+1 234-567-8901",
      walletAddresses: [
        {
          id: "wallet_2_1",
          address: "GZYXWVUTSRQPONMLKJIHGFEDCBA98765432109876543210",
          memo: "Main account",
        },
        {
          id: "wallet_2_2",
          address: "G1234567890ZYXWVUTSRQPONMLKJIHGFEDCBA9876543210",
          memo: "Backup account",
        },
      ],
      createdAt: new Date("2024-12-18T12:46:00"),
    },
    {
      id: "3",
      name: "Dilara Cossette",
      email: "dilara@fip.agency",
      phone: "+1 234-567-8902",
      walletAddresses: [
        {
          id: "wallet_3_1",
          address: "G1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
          memo: "Primary",
        },
        {
          id: "wallet_3_2",
          address: "GABCDEFGHIJKLMNOPQRSTUVWXYZ98765432109876543210",
          memo: "Secondary",
        },
      ],
      createdAt: new Date("2024-12-18T08:04:00"),
    },
    {
      id: "4",
      name: "Rhys McCormack",
      email: "rhysmccormack.business@gmail.com",
      phone: "+1 234-567-8903",
      walletAddresses: [
        {
          id: "wallet_4_1",
          address: "G9876543210ZYXWVUTSRQPONMLKJIHGFEDCBA9876543210",
          memo: "Business wallet",
        },
        {
          id: "wallet_4_2",
          address: "GABCD1234567890EFGHIJKLMNOPQRSTUVWXYZ1234567890",
          memo: "Personal wallet",
        },
      ],
      createdAt: new Date("2024-12-18T06:48:00"),
    },
    {
      id: "5",
      name: "Sebastian Galvez",
      email: "Alejandro@leadrsglobal.com",
      phone: "+1 234-567-8904",
      walletAddresses: [
        {
          id: "wallet_5_1",
          address: "GABCD1234567890EFGHIJKLMNOPQRSTUVWXYZ1234567890",
          memo: "Primary",
        },
        {
          id: "wallet_5_2",
          address: "GZYXWVUTSRQPONMLKJIHGFEDCBA12345678901234567890",
          memo: "Secondary",
        },
      ],
      createdAt: new Date("2024-12-18T05:25:00"),
    },
  ];
  return customers.find((c) => c.id === id) || null;
};

// Mock payments data
const getPaymentsByCustomerId = (_customerId: string): Payment[] => {
  return [
    {
      id: "pay_1",
      amount: 3.0,
      currency: "USD",
      description: "tx_3SfRwtSF0MtsiMvy1KvFb53g",
      status: "succeeded",
      date: new Date("2024-12-18T02:38:00"),
      transactionHash: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
    },
    {
      id: "pay_2",
      amount: 150.0,
      currency: "USD",
      description: "Monthly subscription payment",
      status: "succeeded",
      date: new Date("2024-12-15T10:20:00"),
      transactionHash: "b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7",
    },
    {
      id: "pay_3",
      amount: 50.0,
      currency: "USD",
      description: "One-time payment",
      status: "pending",
      date: new Date("2024-12-17T14:15:00"),
    },
  ];
};

// Status badge component
const StatusBadge = ({ status }: { status: Payment["status"] }) => {
  const variants = {
    succeeded: {
      className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      icon: CheckCircle2,
      label: "Succeeded",
    },
    pending: {
      className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
      icon: Clock,
      label: "Pending",
    },
    failed: {
      className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
      icon: XCircle,
      label: "Failed",
    },
  };

  const variant = variants[status];
  const Icon = variant.icon;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 border", variant.className)}
    >
      <Icon className="h-3 w-3" />
      {variant.label}
    </Badge>
  );
};

// Copy button component
const CopyButton = ({ text, label }: { text: string; label?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center justify-center rounded-md hover:bg-muted p-1 transition-colors"
      aria-label={label || "Copy to clipboard"}
    >
      {copied ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
};

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params?.id as string;
  const customer = getCustomerById(customerId);
  const payments = getPaymentsByCustomerId(customerId);
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [hiddenWallets, setHiddenWallets] = useState<Set<string>>(new Set());

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPayments(new Set(payments.map((p) => p.id)));
    } else {
      setSelectedPayments(new Set());
    }
  };

  const handleSelectPayment = (paymentId: string, checked: boolean) => {
    const newSelected = new Set(selectedPayments);
    if (checked) {
      newSelected.add(paymentId);
    } else {
      newSelected.delete(paymentId);
    }
    setSelectedPayments(newSelected);
  };

  const handleToggleWalletVisibility = (walletId: string) => {
    const newHidden = new Set(hiddenWallets);
    if (newHidden.has(walletId)) {
      newHidden.delete(walletId);
    } else {
      newHidden.add(walletId);
    }
    setHiddenWallets(newHidden);
  };

  const isAllSelected = payments.length > 0 && selectedPayments.size === payments.length;

  if (!customer) {
    return (
      <div className="w-full">
        <DashboardSidebar>
          <DashboardSidebarInset>
            <div className="flex flex-col gap-6 p-6">
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-2">Customer not found</h1>
                <p className="text-muted-foreground mb-4">
                  The customer you&apos;re looking for doesn&apos;t exist.
                </p>
                <Button onClick={() => router.push("/dashboard/customers")}>
                  Back to Customers
                </Button>
              </div>
            </div>
          </DashboardSidebarInset>
        </DashboardSidebar>
      </div>
    );
  }

  const totalSpent = payments
    .filter((p) => p.status === "succeeded")
    .reduce((sum, p) => sum + p.amount, 0);

  const isNewCustomer = 
    new Date().getTime() - customer.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="w-full">
      <DashboardSidebar>
        <DashboardSidebarInset>
          <div className="flex flex-col gap-6 p-4 sm:p-6">
            {/* Breadcrumbs */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard/customers">Customers</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage>{customer.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Header Section */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold">{customer.name}</h1>
                    {isNewCustomer && (
                      <Badge variant="secondary" className="text-xs">
                        New customer
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm sm:text-base">{customer.email}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Button variant="outline" className="gap-2 shadow-none w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Create payment</span>
                    <span className="sm:hidden">Payment</span>
                  </Button>
                  <Button variant="outline" className="gap-2 shadow-none w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Create invoice</span>
                    <span className="sm:hidden">Invoice</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="shadow-none w-full sm:w-auto">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit customer</DropdownMenuItem>
                      <DropdownMenuItem>View transactions</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Delete customer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Payments Section */}
                <div className="space-y-3">
                  <h3 className="text-lg sm:text-xl font-semibold">Payments</h3>
                    {payments.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-muted-foreground mb-4">
                          This customer doesn&apos;t have any chargeable payment sources on file. Add a source or payment method to create a new payment.
                        </p>
                      </div>
                    ) : (
                      <>
                      <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                              <TableHead className="w-[50px]">
                                <Checkbox
                                  checked={isAllSelected}
                                  onCheckedChange={handleSelectAll}
                                  aria-label="Select all"
                                  className="translate-y-[2px]"
                                />
                              </TableHead>
                              <TableHead className="font-semibold">Amount</TableHead>
                              <TableHead className="font-semibold hidden sm:table-cell">Description</TableHead>
                              <TableHead className="font-semibold">Status</TableHead>
                              <TableHead className="font-semibold hidden md:table-cell">Date</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {payments.map((payment) => (
                                <TableRow key={payment.id}>
                                  <TableCell>
                                  <Checkbox
                                    checked={selectedPayments.has(payment.id)}
                                    onCheckedChange={(checked) =>
                                      handleSelectPayment(payment.id, !!checked)
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                    aria-label="Select row"
                                    className="translate-y-[2px]"
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        {new Intl.NumberFormat("en-US", {
                                          style: "currency",
                                          currency: 'xlm',
                                        }).format(payment.amount)}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell">
                                    <span className="text-muted-foreground font-mono text-sm">
                                      {payment.description}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <StatusBadge status={payment.status} />
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell">
                                    <div className="text-muted-foreground">
                                      {payment.date.toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })}{" "}
                                      {payment.date.toLocaleTimeString("en-US", {
                                        hour: "numeric",
                                        minute: "2-digit",
                                        hour12: true,
                                      })}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex justify-end">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className="size-8"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                            }}
                                          >
                                            <MoreHorizontal className="size-4" />
                                            <span className="sr-only">Open menu</span>
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              console.log("Refund payment:", payment.id);
                                            }}
                                          >
                                            Refund payment
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              console.log("Send receipt:", payment.id);
                                            }}
                                          >
                                            Send receipt
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              navigator.clipboard.writeText(payment.id);
                                            }}
                                          >
                                            Copy payment ID
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuLabel>Connections</DropdownMenuLabel>
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              console.log("View payment details:", payment.id);
                                            }}
                                          >
                                            View payment details
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                      <div className="mt-4 text-sm text-primary px-4 sm:px-0">
                          {payments.length} result{payments.length !== 1 ? "s" : ""}
                        </div>
                      </>
                    )}
                </div>

                {/* Wallet Address Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg sm:text-xl font-semibold">Wallet Address</h3>
                    <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">Add wallet address</span>
                    </Button>
                  </div>
                  {customer.walletAddresses && customer.walletAddresses.length > 0 ? (
                    <div className="space-y-3">
                      {customer.walletAddresses.map((wallet) => {
                        const isHidden = hiddenWallets.has(wallet.id);
                        return (
                          <div
                            key={wallet.id}
                            className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border bg-muted/50"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Image
                                src="/images/integrations/stellar-official.png"
                                alt="Stellar"
                                width={20}
                                height={20}
                                className="h-5 w-5 object-contain shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-mono text-xs sm:text-sm break-all">
                                  {isHidden ? "•".repeat(20) : wallet.address}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {wallet.memo || "memo"}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 sm:self-center">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="h-8 w-8"
                                onClick={() => handleToggleWalletVisibility(wallet.id)}
                                aria-label={isHidden ? "Show wallet address" : "Hide wallet address"}
                              >
                                {isHidden ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </Button>
                              <CopyButton text={wallet.address} label="Copy wallet address" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">No wallet address</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                {/* Insights Section */}
                <div className="space-y-3 mb-8">
                  <h3 className="text-lg sm:text-xl font-semibold">Insights</h3>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <div>
                          <div className="text-base font-bold">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(totalSpent)}
                          </div>
                          <div className="text-sm text-muted-foreground">Total spent</div>
                        </div>
                      </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                    <h3 className="text-lg sm:text-xl font-semibold">Details</h3>
                      <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit details</span>
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-muted-foreground mb-1">
                            Customer ID
                          </div>
                          <div className="font-mono text-sm break-all">
                            cus_{customer.id}
                          </div>
                        </div>
                        <CopyButton text={`cus_${customer.id}`} label="Copy customer ID" />
                      </div>

                      <Separator />

                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-muted-foreground mb-1">
                            Customer since
                          </div>
                          <div className="text-sm">
                            {customer.createdAt.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>

                      <Separator />

                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-muted-foreground mb-1">
                            Billing email
                          </div>
                          <div className="text-sm break-all">{customer.email}</div>
                        </div>
                        <CopyButton text={customer.email} label="Copy email" />
                      </div>

                      <Separator />

    <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Business name
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {customer.businessName || "-"}
                        </div>
                      </div>
                    </div>
                  <div className="pt-2">
                    <button className="text-sm text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors">
                      Show more
                    </button>
                  </div>
                </div>

                {/* Metadata Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                    <h3 className="text-lg sm:text-xl font-semibold">Metadata</h3>
                      <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit metadata</span>
                      </Button>
                    </div>
                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-6 flex items-center justify-center min-h-[120px] transition-colors hover:border-muted-foreground/30">
                    <div className="text-center space-y-1">
                      <div className="text-sm text-muted-foreground font-medium">
                        No metadata
                      </div>
                      <p className="text-xs text-muted-foreground/70">
                        Add custom metadata to track additional information
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DashboardSidebarInset>
      </DashboardSidebar>
    </div>
  );
}
