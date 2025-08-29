import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import type { RunnableConfig } from '@langchain/core/runnables';
import type { Checkpoint, CheckpointMetadata } from '@langchain/langgraph';
import type { ChannelVersions } from '@langchain/langgraph-checkpoint';
import { BaseMessage } from '@langchain/core/messages';
import { Pool } from 'pg';

export class CustomPostgresSaver extends PostgresSaver {
  override async setup(): Promise<void> {
    return await super.setup();
  }

  override async put(
    config: RunnableConfig<Record<string, any>>,
    checkpoint: Checkpoint<string, string>,
    metadata: CheckpointMetadata,
    newVersions: ChannelVersions,
  ): Promise<RunnableConfig<Record<string, any>>> {
    const messages: BaseMessage[] = checkpoint.channel_values.messages as BaseMessage[];

    const lastMessage = messages.at(-1);
    if (lastMessage) {
      lastMessage.additional_kwargs = {
        ...lastMessage.additional_kwargs,
        timestamp: checkpoint.ts,
      };
      messages[messages.length - 1] = lastMessage;
    }
    checkpoint.channel_values.messages = messages;

    return await super.put(config, checkpoint, metadata, newVersions);
  }

  static override fromConnString(connString: string, options?: Partial<any>): CustomPostgresSaver {
    const pool = new Pool({ connectionString: connString });
    return new CustomPostgresSaver(pool, undefined, options);
  }
}
