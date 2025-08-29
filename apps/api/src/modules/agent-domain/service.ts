import prisma from "@onlyjs/db";
import { Prisma } from "@onlyjs/db/client";
import { PrismaClientKnownRequestError } from "@onlyjs/db/client/runtime/library";
import { NotFoundException } from "../../utils";
import type { PaginationQuery } from "../../utils/pagination";

export abstract class AgentDomainService {
  private static async handlePrismaError(
    error: unknown,
    context: "find" | "delete"
  ) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new NotFoundException("Acente domaini bulunamadı");
      }
    }
    console.error(`Error in AgentDomainService.${context}:`, error);
    throw error;
  }

  static async index(
    query: PaginationQuery & {
      search?: string;
      agentUuid?: string;
      isEnabled?: boolean;
    }
  ) {
    try {
      const { page = 1, perPage = 20, search, agentUuid, isEnabled } = query;
      const skip = (page - 1) * perPage;

      const where: Prisma.AgentDomainWhereInput = {
        deletedAt: null,
        ...(agentUuid && { agentUuid }),
        ...(typeof isEnabled === "boolean" && { isEnabled }),
        ...(search && {
          OR: [
            {
              domain: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              agent: {
                name: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            },
          ],
        }),
      };

      const [data, total] = await Promise.all([
        prisma.agentDomain.findMany({
          where,
          skip,
          take: perPage,
          orderBy: { createdAt: "desc" },
          include: {
            agent: {
              select: {
                uuid: true,
                name: true,
                insurupAgentId: true,
              },
            },
          },
        }),
        prisma.agentDomain.count({ where }),
      ]);

      return { data, total };
    } catch (error) {
      throw this.handlePrismaError(error, "find");
    }
  }

  static async destroy(uuid: string) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Check if agent domain exists
        const existingAgentDomain = await tx.agentDomain.findUnique({
          where: { uuid, deletedAt: null },
          include: {
            agent: {
              select: {
                uuid: true,
                name: true,
                insurupAgentId: true,
              },
            },
          },
        });

        if (!existingAgentDomain) {
          throw new NotFoundException("Acente domaini bulunamadı");
        }

        // Soft delete agent domain
        const agentDomain = await tx.agentDomain.update({
          where: { uuid },
          data: { deletedAt: new Date() },
          include: {
            agent: {
              select: {
                uuid: true,
                name: true,
                insurupAgentId: true,
              },
            },
          },
        });

        return agentDomain;
      });
    } catch (error) {
      throw this.handlePrismaError(error, "delete");
    }
  }
}
