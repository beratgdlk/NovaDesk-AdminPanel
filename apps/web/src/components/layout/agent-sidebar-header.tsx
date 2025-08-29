import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "#components/ui/sidebar.tsx";
import { useSession } from "#context/session-provider.tsx";
import useAgentStore from "#stores/agent-store.ts";
import { IconBuilding } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function AgentSidebarHeader() {
  const { agent } = useAgentStore();

  const user = useSession();

  return (
    <SidebarMenu>
      {!user.agentUuid && (
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            asChild
          >
            <Link to="/">
              <div className="bg-sidebar-secondary text-sidebar-secondary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <ArrowLeft className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Geri Dön</span>
              </div>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <IconBuilding className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{agent?.name}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
