import {
  IconBrain,
  IconBrandWhatsapp,
  IconBrowserCheck,
  IconLayoutDashboard,
  IconMessages,
  IconNotification,
  IconPalette,
  IconSettings,
  IconTool,
  IconUserCog,
} from "@tabler/icons-react";
import { Command } from "lucide-react";
import { type SidebarData } from "../types";

export const agentSidebarData: SidebarData = {
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
          url: "/$agentId",
          icon: IconLayoutDashboard,
        },
        {
          title: "Bilgi Yönetimi",
          url: "/$agentId/agent-management",
          icon: IconBrain,
        },
        {
          title: "Whatsapp",
          url: "/$agentId/whatsapp",
          icon: IconBrandWhatsapp,
        },
        {
          title: "Web Chatbot",
          icon: IconMessages,
          items: [
            {
              title: "Yönetim",
              url: "/$agentId/chatbot",
              icon: IconSettings,
            },
            {
              title: "Entegrasyon",
              url: "/$agentId/chatbot/integration",
              icon: IconSettings,
            },
          ],
        },
        {
          title: "Konuşmalar",
          url: "/$agentId/conversations",
          icon: IconMessages,
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
