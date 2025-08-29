import { Button } from "#/components/ui/button";
import { type ConversationListItem } from "#backend/modules/chat/types";
import { formatDate } from "#lib/utils.ts";
import { IconEye } from "@tabler/icons-react";
import { Link, useParams } from "@tanstack/react-router";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";

const colHelper = createColumnHelper<ConversationListItem>();

export const conversationColumns = [
  colHelper.accessor("title", {
    header: "Başlık",
    cell: ({ row }) => (
      <div
        className="font-medium text-foreground max-w-xs truncate"
        title={row.original.title}
      >
        {row.original.title}
      </div>
    ),
  }),

  colHelper.accessor("lastMessage", {
    header: "Son Mesaj",
    cell: ({ row }) => (
      <div
        className="text-sm text-muted-foreground max-w-md truncate"
        title={row.original.lastMessage}
      >
        {row.original.lastMessage || "-"}
      </div>
    ),
  }),

  colHelper.accessor("createdAt", {
    header: "Oluşturulma Tarihi",
    cell: ({ row }) => {
      return (
        <div className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt, "dd.MM.yyyy HH:mm")}
        </div>
      );
    },
  }),

  colHelper.accessor("updatedAt", {
    header: "Güncellenme Tarihi",
    cell: ({ row }) => {
      return (
        <div className="text-sm text-muted-foreground">
          {formatDate(row.original.updatedAt, "dd.MM.yyyy HH:mm")}
        </div>
      );
    },
  }),

  colHelper.display({
    id: "actions",
    header: "İşlemler",
    cell: (info) => {
      const conversation = info.row.original;
      return <ConversationActions conversation={conversation} />;
    },
  }),
] as ColumnDef<ConversationListItem>[];

interface ConversationActionsProps {
  conversation: ConversationListItem;
}

function ConversationActions({ conversation }: ConversationActionsProps) {
  const params = useParams({ from: "/_authenticated/$agentId/conversations/" });
  const agentId = params.agentId;

  return (
    <div className="flex items-center gap-1">
      {/* View Button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        title="Görüntüle"
        asChild
      >
        <Link
          to="/$agentId/conversations/$id"
          params={{
            agentId: agentId,
            id: conversation.conversationId,
          }}
        >
          <IconEye className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
