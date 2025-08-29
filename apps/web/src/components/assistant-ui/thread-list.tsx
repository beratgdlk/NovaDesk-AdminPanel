import type { FC } from "react";
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
} from "@assistant-ui/react";
import { ArchiveIcon, PlusIcon } from "lucide-react";

import { Button } from "#/components/ui/button";
import { TooltipIconButton } from "#/components/assistant-ui/tooltip-icon-button";

export const ThreadList: FC = () => {
  return (
    <ThreadListPrimitive.Root className="flex flex-col items-stretch gap-1.5 h-full">
      <ThreadListNew />
      <ThreadListItems />
    </ThreadListPrimitive.Root>
  );
};

const ThreadListNew: FC = () => {
  return (
    <ThreadListPrimitive.New asChild>
      <Button 
        className="data-[active]:bg-muted hover:bg-muted flex items-center justify-start gap-2 rounded-lg px-3 py-2 text-start w-full mb-2" 
        variant="ghost"
        onClick={() => console.log('New thread button clicked')}
      >
        <PlusIcon size={16} />
        Yeni Konuşma  
      </Button>
    </ThreadListPrimitive.New>
  );
};

const ThreadListItems: FC = () => {
  return (
    <div className="flex-1 overflow-y-auto">
      <ThreadListPrimitive.Items components={{ ThreadListItem }} />
    </div>
  );
};

const ThreadListItem: FC = () => {
  return (
    <ThreadListItemPrimitive.Root className="data-[active]:bg-muted hover:bg-muted focus-visible:bg-muted focus-visible:ring-ring flex items-center gap-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 mb-1">
      <ThreadListItemPrimitive.Trigger className="flex-grow px-3 py-2 text-start">
        <ThreadListItemTitle />
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemArchive />
    </ThreadListItemPrimitive.Root>
  );
};

const ThreadListItemTitle: FC = () => {
  return (
    <p className="text-sm truncate">
      <ThreadListItemPrimitive.Title fallback="Yeni Konuşma" />
    </p>
  );
};

const ThreadListItemArchive: FC = () => {
  return (
    <ThreadListItemPrimitive.Archive asChild>
      <TooltipIconButton
        className="hover:text-primary text-foreground ml-auto mr-3 size-4 p-0"
        variant="ghost"
        tooltip="Konuşmayı arşivle"
      >
        <ArchiveIcon size={16} />
      </TooltipIconButton>
    </ThreadListItemPrimitive.Archive>
  );
};
