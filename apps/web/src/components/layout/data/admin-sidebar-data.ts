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
      title: "Genel",
      items: [
        {
          title: "Ana Sayfa",
          url: "/",
          icon: IconLayoutDashboard,
        },
        {
          title: "Acenteler",
          url: "/agents",
          icon: IconHomeShield,
        },
        {
          title: "Domainler",
          url: "/domains",
          icon: IconGlobe,
        },
        {
          title: "Kullanıcılar",
          url: "/users",
          icon: IconUserCog,
        },
        {
          title: "Roller",
          url: "/roles",
          icon: IconShieldLock,
        },
      ],
    },
    {
      title: "Diğer",
      items: [
        {
          title: "Ayarlar",
          icon: IconSettings,
          items: [
            {
              title: "Profil",
              url: "/settings",
              icon: IconUserCog,
            },
            {
              title: "Hesap",
              url: "/settings/account",
              icon: IconTool,
            },
            {
              title: "Görünüm",
              url: "/settings/appearance",
              icon: IconPalette,
            },
            {
              title: "Bildirim",
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
