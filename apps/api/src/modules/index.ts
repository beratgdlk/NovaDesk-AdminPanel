import Elysia from "elysia";
import { agentDomainController } from "./agent-domain";
import { agentsController } from "./agents";
import { authenticationController, rolesController } from "./auth";
import { chatController } from "./chat";
import { fileLibraryAssetsController } from "./file-library-assets";
import { locationsController } from "./locations";
import { postsController } from "./posts";
import { systemAdministrationController } from "./system-administration";
import { usersController } from "./users";
import { whatsappController } from "./whatsapp";

const app = new Elysia()
  .use(systemAdministrationController)
  .use(usersController)
  .use(authenticationController)
  .use(rolesController)
  .use(postsController)
  .use(agentsController)
  .use(locationsController)
  .use(fileLibraryAssetsController)
  .use(chatController)
  .use(agentDomainController)
  .use(whatsappController)
  .get(
    "/",
    () => ({
      message: "Hello Elysia",
    }),
    {
      detail: {
        summary: "Hello World",
      },
    }
  );

export const swaggerTags: { name: string; description: string }[] = [
  {
    name: "System Administration",
    description: "System Administration endpoints",
  },
  { name: "Audit Logs", description: "Audit Logs endpoints" },
  { name: "User", description: "User endpoints" },
  { name: "Auth", description: "Auth endpoints" },
  { name: "Role", description: "Role endpoints" },
  { name: "Post", description: "Post endpoints" },
  { name: "Agent", description: "Agent endpoints" },
  { name: "Agent Domain", description: "Agent Domain endpoints" },
  { name: "Country", description: "Country endpoints" },
  { name: "State", description: "State endpoints" },
  { name: "City", description: "City endpoints" },
  { name: "Region", description: "Region endpoints" },
  { name: "Subregion", description: "Subregion endpoints" },
  { name: "File Library Assets", description: "File Library Assets endpoints" },
  { name: "Chat", description: "AI Chat Assistant endpoints" },
];

export default app;
