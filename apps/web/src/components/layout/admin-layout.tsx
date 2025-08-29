import SkipToMain from "#/components/skip-to-main";
import { SidebarProvider } from "#/components/ui/sidebar";
import { SearchProvider } from "#/context/search-context";
import { cn } from "#/lib/utils";
import { LanguageSwitch } from "#components/language-switch.tsx";
import { ProfileDropdown } from "#components/profile-dropdown.tsx";
import { Search } from "#components/search.tsx";
import { ThemeSwitch } from "#components/theme-switch.tsx";
import { Outlet } from "@tanstack/react-router";
import Cookies from "js-cookie";
import { AppSidebar } from "./app-sidebar";
import { adminSidebarData } from "./data/admin-sidebar-data";
import { Header } from "./header";

interface Props {
  children?: React.ReactNode;
}

export function AdminLayout({ children }: Props) {
  const defaultOpen = Cookies.get("sidebar_state") !== "false";
  return (
    <SearchProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <SkipToMain />
        <AppSidebar sidebarData={adminSidebarData} />

        <div
          id="content"
          className={cn(
            "ml-auto w-full max-w-full",
            "peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]",
            "peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]",
            "sm:transition-[width] sm:duration-200 sm:ease-linear",
            "flex h-svh flex-col",
            "group-data-[scroll-locked=1]/body:h-full",
            "has-[main.fixed-main]:group-data-[scroll-locked=1]/body:h-svh"
          )}
        >
          <Header>
            <Search />
            <div className="ml-auto flex items-center space-x-4">
              <LanguageSwitch />
              <ThemeSwitch />
              <ProfileDropdown />
            </div>
          </Header>
          {children ? children : <Outlet />}
        </div>
      </SidebarProvider>
    </SearchProvider>
  );
}
