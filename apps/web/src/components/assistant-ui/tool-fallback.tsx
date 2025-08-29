import type { ToolCallContentPartComponent } from "@assistant-ui/react";
import { CheckIcon, ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";

export const ToolFallback: ToolCallContentPartComponent = ({
    toolName,
    args,
    argsText: argsTextOriginal,
    result,
    isError,
}) => {
    let argsText = argsTextOriginal;
    if (args) {
        try {
            const prettyArgsText = JSON.stringify(args, null, 2);

            argsText = prettyArgsText;
        } catch (e) {}
    }
    const [isCollapsed, setIsCollapsed] = useState(true);

    return (
        <div className="mb-4 flex w-full flex-col gap-3 rounded-lg border py-3">
            <div className="flex items-center gap-2 px-4">
                <CheckIcon className="size-4" />
                <p className="text-sm w-full">
                    Used tool: <b className="truncate max-w-full">{toolName}</b>
                </p>
                <div className="flex-grow" />
                <Button onClick={() => setIsCollapsed(!isCollapsed)}>
                    {isCollapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
                </Button>
            </div>
            {!isCollapsed && (
                <div className="flex flex-col gap-2 border-t pt-2">
                    <div className="px-4">
                        <p className="font-semibold">Arguments:</p>
                        <pre className="whitespace-pre-wrap">{argsText}</pre>
                    </div>
                    {result !== undefined && (
                        <div className="border-t border-dashed px-4 pt-2">
                            <p
                                className={
                                    "font-semibold" +
                                    (isError
                                        ? " text-red-500"
                                        : " text-green-500")
                                }
                            >
                                {isError ? "Error" : "Result"}:
                            </p>
                            <pre className="whitespace-pre-wrap">
                                {typeof result === "string"
                                    ? result
                                    : JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
