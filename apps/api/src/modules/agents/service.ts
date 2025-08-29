import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { Document } from '@langchain/core/documents';
import prisma, { vectorStore } from '@onlyjs/db';
import {
  type Agent,
  type FileLibraryAsset,
  FileLibraryAssetMimeType,
  FileLibraryAssetType,
  Prisma,
} from '@onlyjs/db/client';
import { PrismaClientKnownRequestError } from '@onlyjs/db/client/runtime/library';
import path from 'path';
import { NotFoundException } from '../../utils';
import type { PaginationQuery } from '../../utils/pagination';
import { FileLibraryAssetsService } from '../file-library-assets/service';
import type {
  AgentCreatePayloadParsed,
  AgentRagFileCreatePayload,
  AgentRagFileUpdatePayload,
  AgentUpdatePayloadParsed,
} from './types';
export abstract class AgentsService {
  private static async handlePrismaError(
    error: unknown,
    context: 'find' | 'create' | 'update' | 'delete',
  ) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Acente bulunamadı');
      }
    }
    console.error(`Error in AgentsService.${context}:`, error);
    throw error;
  }

  static async index(query: PaginationQuery & { search?: string }) {
    try {
      const { page = 1, perPage = 20, search } = query;
      const skip = (page - 1) * perPage;

      const where: Prisma.AgentWhereInput = {
        deletedAt: null,
        ...(search && {
          OR: [
            {
              name: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              insurupAgentId: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        }),
      };

      const [data, total] = await Promise.all([
        prisma.agent.findMany({
          where,
          skip,
          take: perPage,
          orderBy: { createdAt: 'desc' },
          include: {
            domains: {
              where: { deletedAt: null },
              orderBy: { createdAt: 'asc' },
            },
          },
        }),
        prisma.agent.count({ where }),
      ]);

      return { data, total };
    } catch (error) {
      throw this.handlePrismaError(error, 'find');
    }
  }

  static async show(uuid: string) {
    try {
      const agent = await prisma.agent.findUnique({
        where: { uuid, deletedAt: null },
        include: {
          domains: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!agent) {
        throw new NotFoundException('Acente bulunamadı');
      }

      return agent;
    } catch (error) {
      throw this.handlePrismaError(error, 'find');
    }
  }

  static async showByDomain(domain: string | Request | URL) {
    if (domain instanceof Request) {
      domain = new URL(domain.url).hostname;
    } else if (domain instanceof URL) {
      domain = domain.hostname;
    }

    try {
      const agent = await prisma.agent.findFirst({
        where: {
          domains: { some: { domain, isEnabled: true, deletedAt: null } },
        },
        include: {
          domains: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!agent) {
        console.error('Agent not found:', { domain });
        throw new NotFoundException('Acente bulunamadı');
      }

      return agent;
    } catch (error) {
      throw this.handlePrismaError(error, 'find');
    }
  }

  static async store(data: AgentCreatePayloadParsed) {
    try {
      const { domains, chatbotConfig, chatbotImageFile, ...agentData } = data;

      return await prisma.$transaction(async (tx) => {
        // Handle chatbot image upload if present
        let updatedChatbotConfig = chatbotConfig;
        let uploadedImageUuid: string | null = null;

        if (chatbotImageFile) {
          const uploadedImage = await FileLibraryAssetsService.store(
            {
              file: chatbotImageFile,
              type: FileLibraryAssetType.AGENT_CHATBOT_IMAGE,
              metadata: {
                ownerAgentUuid: '', // Will be updated after agent creation
                ownerAgentId: 0, // Will be updated after agent creation
              },
            },
            tx,
          );

          uploadedImageUuid = uploadedImage.uuid;

          // Update chatbotConfig with uploaded image path
          updatedChatbotConfig = {
            ...chatbotConfig,
            chatbotImage: uploadedImage.path || '',
          };
        }

        // Create agent
        const agent = await tx.agent.create({
          data: {
            ...agentData,
            chatbotConfig: updatedChatbotConfig,
          },
          include: {
            domains: {
              where: { deletedAt: null },
              orderBy: { createdAt: 'asc' },
            },
          },
        });

        // Update the uploaded image metadata with agent information
        if (uploadedImageUuid) {
          await FileLibraryAssetsService.update(
            uploadedImageUuid,
            {
              metadata: {
                ownerAgentUuid: agent.uuid,
                ownerAgentId: agent.id,
              },
            },
            tx,
          );
        }

        // Create domains if provided
        if (domains && domains.length > 0) {
          for (const domain of domains) {
            // Check if domain already exists (including soft deleted ones)
            const existingDomain = await tx.agentDomain.findFirst({
              where: { domain: domain.domain },
            });

            if (existingDomain) {
              // Transfer domain to new agent and reactivate
              await tx.agentDomain.update({
                where: { id: existingDomain.id },
                data: {
                  agentId: agent.id,
                  agentUuid: agent.uuid,
                  isEnabled: domain.isEnabled,
                  deletedAt: null, // Reactivate if it was soft deleted
                },
              });
            } else {
              // Create new domain
              await tx.agentDomain.create({
                data: {
                  agentId: agent.id,
                  agentUuid: agent.uuid,
                  domain: domain.domain,
                  isEnabled: domain.isEnabled,
                },
              });
            }
          }

          // Fetch updated agent with domains
          return await tx.agent.findUniqueOrThrow({
            where: { id: agent.id },
            include: {
              domains: {
                where: { deletedAt: null },
                orderBy: { createdAt: 'asc' },
              },
            },
          });
        }

        return agent;
      });
    } catch (error) {
      throw this.handlePrismaError(error, 'create');
    }
  }

  static async update(uuid: string, data: AgentUpdatePayloadParsed) {
    try {
      const { domains, chatbotConfig, chatbotImageFile, ...agentData } = data;

      return await prisma.$transaction(async (tx) => {
        // Check if agent exists
        const existingAgent = await tx.agent.findUnique({
          where: { uuid, deletedAt: null },
          include: {
            domains: true,
          },
        });

        if (!existingAgent) {
          throw new NotFoundException('Acente bulunamadı');
        }

        // Handle chatbot image upload if present
        let updatedChatbotConfig = chatbotConfig;

        if (chatbotImageFile) {
          const uploadedImage = await FileLibraryAssetsService.store(
            {
              file: chatbotImageFile,
              type: FileLibraryAssetType.AGENT_CHATBOT_IMAGE,
              metadata: {
                ownerAgentUuid: existingAgent.uuid,
                ownerAgentId: existingAgent.id,
              },
            },
            tx,
          );

          // Update chatbotConfig with uploaded image path
          updatedChatbotConfig = {
            ...chatbotConfig,
            chatbotImage: uploadedImage.path || '',
          };
        }

        // Update agent data
        await tx.agent.update({
          where: { uuid },
          data: {
            ...agentData,
            ...(updatedChatbotConfig && {
              chatbotConfig: updatedChatbotConfig,
            }),
          },
        });

        // Handle domains update if provided
        if (domains) {
          // Get current active domains for this agent
          const currentDomains = existingAgent.domains.filter((d) => !d.deletedAt);
          const currentDomainNames = currentDomains.map((d) => d.domain);

          // Get incoming domain names
          const incomingDomainNames = domains.map((d) => d.domain);

          // Soft delete domains that are not in the incoming list
          const domainsToDelete = currentDomainNames.filter(
            (name) => !incomingDomainNames.includes(name),
          );
          if (domainsToDelete.length > 0) {
            await tx.agentDomain.updateMany({
              where: {
                agentId: existingAgent.id,
                domain: { in: domainsToDelete },
                deletedAt: null,
              },
              data: { deletedAt: new Date() },
            });
          }

          // Update or create/transfer domains
          for (const domain of domains) {
            // Check if domain exists anywhere (including other agents and soft deleted)
            const existingDomain = await tx.agentDomain.findFirst({
              where: { domain: domain.domain },
            });

            if (existingDomain && existingDomain.agentId === existingAgent.id) {
              // Update existing domain for this agent
              await tx.agentDomain.update({
                where: { id: existingDomain.id },
                data: {
                  isEnabled: domain.isEnabled,
                  deletedAt: null, // Reactivate if it was soft deleted
                },
              });
            } else if (existingDomain && existingDomain.agentId !== existingAgent.id) {
              // Transfer domain from another agent to this agent
              await tx.agentDomain.update({
                where: { id: existingDomain.id },
                data: {
                  agentId: existingAgent.id,
                  agentUuid: existingAgent.uuid,
                  isEnabled: domain.isEnabled,
                  deletedAt: null, // Reactivate if it was soft deleted
                },
              });
            } else {
              // Create new domain
              await tx.agentDomain.create({
                data: {
                  agentId: existingAgent.id,
                  agentUuid: existingAgent.uuid,
                  domain: domain.domain,
                  isEnabled: domain.isEnabled,
                },
              });
            }
          }
        }

        // Return updated agent with domains
        return await tx.agent.findUniqueOrThrow({
          where: { uuid },
          include: {
            domains: {
              where: { deletedAt: null },
              orderBy: { createdAt: 'asc' },
            },
          },
        });
      });
    } catch (error) {
      throw this.handlePrismaError(error, 'update');
    }
  }

  static async destroy(uuid: string) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Check if agent exists
        const existingAgent = await tx.agent.findUnique({
          where: { uuid, deletedAt: null },
          include: {
            domains: true,
          },
        });

        if (!existingAgent) {
          throw new NotFoundException('Acente bulunamadı');
        }

        // Soft delete all agent domains
        await tx.agentDomain.updateMany({
          where: { agentId: existingAgent.id, deletedAt: null },
          data: { deletedAt: new Date() },
        });

        // Soft delete agent
        const agent = await tx.agent.update({
          where: { uuid },
          data: { deletedAt: new Date() },
          include: {
            domains: {
              orderBy: { createdAt: 'asc' },
            },
          },
        });

        return agent;
      });
    } catch (error) {
      throw this.handlePrismaError(error, 'delete');
    }
  }

  static async storeRagFile(agentUuid: string, payload: AgentRagFileCreatePayload) {
    try {
      const { file, name } = payload;

      const agent = await prisma.agent.findUnique({
        where: { uuid: agentUuid },
      });

      if (!agent) {
        throw new NotFoundException('Acente bulunamadı');
      }

      const uploadedDocument = await FileLibraryAssetsService.store({
        title: name,
        file,
        type: FileLibraryAssetType.AGENT_RAG_DOCUMENT,
        metadata: {
          ownerAgentUuid: agent.uuid,
          ownerAgentId: agent.id,
        },
      });

      if (uploadedDocument) {
        await this.addRagFileToVectorStore(agent, uploadedDocument);
      }

      return uploadedDocument;
    } catch (error) {
      throw this.handlePrismaError(error, 'create');
    }
  }

  static async indexRagFile(agentUuid: string) {
    try {
      const agent = await prisma.agent.findUnique({
        where: { uuid: agentUuid },
      });

      if (!agent) {
        throw new NotFoundException('Acente bulunamadı');
      }

      const uploadedDocuments = await FileLibraryAssetsService.indexFlat({
        agentId: agent.id,
        type: FileLibraryAssetType.AGENT_RAG_DOCUMENT,
        // @ts-ignore
        orderBy: ['name:asc'],
      });

      return uploadedDocuments;
    } catch (error) {
      throw this.handlePrismaError(error, 'create');
    }
  }

  static async destroyRagFile(agentUuid: string, fileUuid: string) {
    try {
      const agent = await prisma.agent.findUnique({
        where: { uuid: agentUuid },
      });

      if (!agent) {
        throw new NotFoundException('Acente bulunamadı');
      }

      await prisma.agentRagDocument.deleteMany({
        where: {
          fileLibraryAssetUuid: fileUuid,
          agentId: agent.id,
        },
      });

      const file = await FileLibraryAssetsService.destroy(fileUuid);

      if (!file) {
        throw new NotFoundException('Dosya bulunamadı');
      }

      await prisma.agentRagDocument.deleteMany({
        where: {
          fileLibraryAssetUuid: file.uuid,
        },
      });

      return file;
    } catch (error) {
      throw this.handlePrismaError(error, 'delete');
    }
  }

  static async updateRagFile(
    agentUuid: string,
    fileUuid: string,
    payload: AgentRagFileUpdatePayload,
  ) {
    try {
      const agent = await prisma.agent.findUnique({
        where: { uuid: agentUuid },
      });

      if (!agent) {
        throw new NotFoundException('Acente bulunamadı');
      }

      const file = await prisma.$transaction(async (tx) => {
        const file = await FileLibraryAssetsService.update(
          fileUuid,
          {
            isActive: payload.isActive,
            title: payload.name,
          },
          tx,
        );

        if (!file) {
          throw new NotFoundException('Dosya bulunamadı');
        }

        if (payload.isActive !== undefined) {
          await tx.agentRagDocument.updateMany({
            where: {
              fileLibraryAssetUuid: fileUuid,
              agentId: agent.id,
            },
            data: { isActive: payload.isActive },
          });
        }

        return file;
      });
      return file;
    } catch (error) {
      throw this.handlePrismaError(error, 'delete');
    }
  }

  static async addRagFileToVectorStore(agent: Agent, file: FileLibraryAsset) {
    try {
      const storagePath = path.join(process.cwd(), 'public/storage');

      let documents: Document<Record<string, any>>[] = [];
      switch (file.mimeType) {
        case FileLibraryAssetMimeType.DOCUMENT_PDF:
          documents = await new PDFLoader(path.join(storagePath, file.path)).load();
          break;
        case FileLibraryAssetMimeType.DOCUMENT_MSWORD:
          documents = await new DocxLoader(path.join(storagePath, file.path), {
            type: 'doc',
          }).load();
          break;
        case FileLibraryAssetMimeType.DOCUMENT_DOCX:
          documents = await new DocxLoader(path.join(storagePath, file.path)).load();
          break;
        default:
          break;
      }

      await vectorStore.addModels(
        await prisma.$transaction(
          documents.map((document) =>
            prisma.agentRagDocument.create({
              data: {
                agentId: agent.id,
                agentUuid: agent.uuid,
                fileLibraryAssetId: file.id,
                fileLibraryAssetUuid: file.uuid,
                content: document.pageContent,
              },
            }),
          ),
        ),
      );

      return true;
    } catch (error) {
      throw this.handlePrismaError(error, 'delete');
    }
  }
}
