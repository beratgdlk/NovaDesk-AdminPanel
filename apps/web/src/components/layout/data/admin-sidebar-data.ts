import {
    IconBrowserCheck,
    IconGlobe,
    IconHomeShield,
    IconLayoutDashboard,
    IconNotification,
    IconPalette,
    IconSettings,
    IconShieldLock,
    IconTool,
    IconUserCog
} from "@tabler/icons-react";
import { Command } from "lucide-react";
import { type SidebarData } from "../types";

export const adminSidebarData: SidebarData = {
  user: {
    name: "satnaing",
    email: "satnaingdev@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Shadcn Admin",
      logo: Command,
      plan: "Vite + ShadcnUI",
    },
  ],
  navGroups: [
    {
      title: "sidebar.general",
      items: [
        {
          title: "sidebar.home",
          url: "/",
          icon: IconLayoutDashboard,
        },
        {
          title: "sidebar.agents",
          url: "/agents",
          icon: IconHomeShield,
        },
        {
          title: "sidebar.domains",
          url: "/domains",
          icon: IconGlobe,
        },
        {
          title: "sidebar.users",
          url: "/users",
          icon: IconUserCog,
        },
        {
          title: "sidebar.roles",
          url: "/roles",
          icon: IconShieldLock,
        },
      ],
    },
    {
      title: "sidebar.others",
      items: [
        {
          title: "sidebar.settings",
          icon: IconSettings,
          items: [
            {
              title: "sidebar.profile",
              url: "/settings",
              icon: IconUserCog,
            },
            {
              title: "sidebar.account",
              url: "/settings/account",
              icon: IconTool,
            },
            {
              title: "sidebar.appearance",
              url: "/settings/appearance",
              icon: IconPalette,
            },
            {
              title: "sidebar.notifications",
              url: "/settings/notifications",
              icon: IconNotification,
            },
            {
              title: "Display",
              url: "/settings/display",
              icon: IconBrowserCheck,
            },
          ],
        },
      ],
    },
  ],
};
