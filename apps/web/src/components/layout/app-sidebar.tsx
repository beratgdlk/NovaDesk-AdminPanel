import { NavGroup } from "#/components/layout/nav-group";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "#/components/ui/sidebar";
import { ReactNode } from "react";
import { SidebarData } from "./types";

export function AppSidebar({
  sidebarData,
  sidebarHeader,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      {!!sidebarHeader && <SidebarHeader>{sidebarHeader}</SidebarHeader>}
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      {/* <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter> */}
      <SidebarRail />
    </Sidebar>
  );
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  sidebarData: SidebarData;
  sidebarHeader?: ReactNode;
}
