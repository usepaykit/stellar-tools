"use client";

import { AmbiguityGuard } from "@stellartools/ui";
import { retrieveWebhooks } from "@stellartools/web/actions";
import { DashboardSidebar, DashboardSidebarInset } from "@stellartools/web/components";
import { useOrgQuery } from "@stellartools/web/hooks";
import { useRouter, useSearchParams } from "next/navigation";

export default function WebhookSelectorPage() {
  const { data: webhooks = [], isLoading } = useOrgQuery(["webhooks"], () => retrieveWebhooks());
  const searchParams = useSearchParams();
  const router = useRouter();

  const columns = [
    { accessorKey: "name", header: "WEBHOOK NAME" },
    {
      accessorKey: "url",
      header: "ENDPOINT",
      cell: ({ row }: any) => <code className="text-xs">{row.original.url}</code>,
    },
  ];

  return (
    <DashboardSidebar>
      <DashboardSidebarInset>
        <AmbiguityGuard
          title="Select a webhook endpoint"
          description="You have multiple endpoints. Choose one to view the specific event delivery."
          items={webhooks}
          isLoading={isLoading}
          columns={columns}
          resolveTo={(wh) => `/webhooks/${wh.id}`}
          searchParams={searchParams.toString()}
          pushRoute={(url) => router.push(url)}
        />
      </DashboardSidebarInset>
    </DashboardSidebar>
  );
}
