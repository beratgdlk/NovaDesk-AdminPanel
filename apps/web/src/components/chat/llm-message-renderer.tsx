import { useLLMOutput } from "@llm-ui/react";
import { jsonBlock } from "@llm-ui/json";
import { Card, CardContent, CardHeader, CardTitle } from "#components/ui/card";
import { Badge } from "#components/ui/badge";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "#components/ui/collapsible";
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Wrench,
    Dot,
    ChevronDown,
    ChevronRight,
    Copy,
} from "lucide-react";
import { toast } from "sonner";

// Kopyalama fonksiyonu
const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard
        .writeText(text)
        .then(() => {
            toast.success(`${label || "İçerik"} kopyalandı!`, {
                duration: 2000,
                style: {
                    fontSize: "14px",
                },
            });
        })
        .catch(() => {
            toast.error("Kopyalama başarısız oldu!", {
                duration: 2000,
                style: {
                    fontSize: "14px",
                },
            });
        });
};

// Tool call için JSON block'u tanımla
const toolCallBlock = jsonBlock({
    type: "tool_call",
    startChar: "【",
    endChar: "】",
    typeKey: "type",
    defaultVisible: false,
});

// Tool result için JSON block'u tanımla
const toolResultBlock = jsonBlock({
    type: "tool_result",
    startChar: "【",
    endChar: "】",
    typeKey: "type",
    defaultVisible: false,
});

// Kompakt tool component'i - collapsible format
const ToolCompactComponent = ({
    tool,
    isOpen,
    onToggle,
}: {
    tool: {
        id: string;
        name: string;
        arguments?: any;
        result?: any;
        status: "executing" | "completed" | "failed" | "error";
        type: string;
        hasArguments?: boolean;
        error?: string;
    };
    isOpen: boolean;
    onToggle: (isOpen: boolean) => void;
}) => {
    const getStatusIcon = () => {
        switch (tool.status) {
            case "executing":
                return <Clock className="w-3 h-3 text-blue-500 animate-spin" />;
            case "completed":
                return <CheckCircle className="w-3 h-3 text-green-500" />;
            case "error":
            case "failed":
                return <AlertCircle className="w-3 h-3 text-red-500" />;
            default:
                return <Wrench className="w-3 h-3 text-gray-500" />;
        }
    };

    const getStatusColor = () => {
        switch (tool.status) {
            case "executing":
                return "border-blue-200 bg-blue-50";
            case "completed":
                return "border-green-200 bg-green-50";
            case "error":
            case "failed":
                return "border-red-200 bg-red-50";
            default:
                return "border-gray-200 bg-gray-50";
        }
    };

    const getStatusText = () => {
        switch (tool.status) {
            case "executing":
                return "Çalışıyor...";
            case "completed":
                return "Tamamlandı";
            case "error":
                return "Hata";
            case "failed":
                return "Başarısız";
            default:
                return "Bilinmeyen";
        }
    };

    return (
        <Collapsible open={isOpen} onOpenChange={onToggle}>
            <CollapsibleTrigger className="w-full">
                <div
                    className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${getStatusColor()} hover:bg-opacity-80`}
                >
                    <div className="flex items-center gap-2">
                        {getStatusIcon()}
                        <span className="text-sm font-medium">
                            {tool.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                            {getStatusText()}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                        {tool.hasArguments && (
                            <Badge variant="secondary" className="text-xs">
                                Args
                            </Badge>
                        )}
                        {tool.result && (
                            <Badge variant="secondary" className="text-xs">
                                Result
                            </Badge>
                        )}
                        {isOpen ? (
                            <ChevronDown className="w-4 h-4" />
                        ) : (
                            <ChevronRight className="w-4 h-4" />
                        )}
                    </div>
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="mt-2 space-y-3">
                    {/* Arguments */}
                    {tool.arguments &&
                        Object.keys(tool.arguments).length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="text-sm font-medium">
                                        Arguments
                                    </h4>
                                    <button
                                        onClick={() =>
                                            copyToClipboard(
                                                JSON.stringify(
                                                    tool.arguments,
                                                    null,
                                                    2
                                                ),
                                                "Arguments"
                                            )
                                        }
                                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                                    >
                                        <Copy className="w-3 h-3 text-gray-500" />
                                    </button>
                                </div>
                                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                                    {JSON.stringify(tool.arguments, null, 2)}
                                </pre>
                            </div>
                        )}

                    {/* Result */}
                    {tool.result && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-sm font-medium">Result</h4>
                                <button
                                    onClick={() =>
                                        copyToClipboard(
                                            typeof tool.result === "string"
                                                ? tool.result
                                                : JSON.stringify(
                                                      tool.result,
                                                      null,
                                                      2
                                                  ),
                                            "Result"
                                        )
                                    }
                                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                                >
                                    <Copy className="w-3 h-3 text-gray-500" />
                                </button>
                            </div>
                            <div className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                                {typeof tool.result === "string" ? (
                                    <p className="whitespace-pre-wrap">
                                        {tool.result}
                                    </p>
                                ) : (
                                    <pre>
                                        {JSON.stringify(tool.result, null, 2)}
                                    </pre>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {tool.error && (
                        <div>
                            <h4 className="text-sm font-medium text-red-600 mb-2">
                                Error
                            </h4>
                            <div className="bg-red-50 border border-red-200 p-3 rounded text-xs">
                                <p className="text-red-800 whitespace-pre-wrap">
                                    {tool.error}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

// Unified tool component - hem call hem result'ı tek yerde göster
const ToolUnifiedComponent = ({
    tool,
    isOpen,
    onToggle,
}: {
    tool: {
        id: string;
        name: string;
        arguments?: any;
        result?: any;
        status: "executing" | "completed" | "failed" | "error";
        type: string;
        hasArguments?: boolean;
        error?: string;
    };
    isOpen: boolean;
    onToggle: (isOpen: boolean) => void;
}) => {
    const getStatusIcon = () => {
        switch (tool.status) {
            case "executing":
                return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
            case "completed":
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case "error":
            case "failed":
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Wrench className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = () => {
        switch (tool.status) {
            case "executing":
                return "border-blue-200 bg-blue-50";
            case "completed":
                return "border-green-200 bg-green-50";
            case "error":
            case "failed":
                return "border-red-200 bg-red-50";
            default:
                return "border-gray-200 bg-gray-50";
        }
    };

    const getStatusBadge = () => {
        switch (tool.status) {
            case "executing":
                return (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        Çalışıyor...
                    </Badge>
                );
            case "completed":
                return (
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                        Tamamlandı
                    </Badge>
                );
            case "error":
            case "failed":
                return (
                    <Badge variant="outline" className="bg-red-100 text-red-800">
                        {tool.status === "error" ? "Hata" : "Başarısız"}
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="bg-gray-100 text-gray-800">
                        Bilinmeyen
                    </Badge>
                );
        }
    };

    return (
        <Card className={`my-2 ${getStatusColor()}`}>
            <Collapsible open={isOpen} onOpenChange={onToggle}>
                <CollapsibleTrigger className="w-full">
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {getStatusIcon()}
                                <span>
                                    {tool.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {getStatusBadge()}
                                {isOpen ? (
                                    <ChevronDown className="w-4 h-4" />
                                ) : (
                                    <ChevronRight className="w-4 h-4" />
                                )}
                            </div>
                        </CardTitle>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="py-0 pb-3">
                        <div className="space-y-4">
                            {/* Tool Call Section */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Wrench className="w-4 h-4 text-gray-500" />
                                    <h4 className="text-sm font-medium">
                                        Tool Call
                                    </h4>
                                </div>
                                <div className="text-xs text-gray-600 space-y-2">
                                    <div>
                                        <strong>ID:</strong> {tool.id}
                                    </div>
                                    <div>
                                        <strong>Type:</strong> {tool.type}
                                    </div>
                                    {tool.arguments &&
                                        Object.keys(tool.arguments).length >
                                            0 && (
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <strong>Arguments:</strong>
                                                    <button
                                                        onClick={() =>
                                                            copyToClipboard(
                                                                JSON.stringify(
                                                                    tool.arguments,
                                                                    null,
                                                                    2
                                                                ),
                                                                "Arguments"
                                                            )
                                                        }
                                                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                                                    >
                                                        <Copy className="w-3 h-3 text-gray-500" />
                                                    </button>
                                                </div>
                                                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                                                    {JSON.stringify(
                                                        tool.arguments,
                                                        null,
                                                        2
                                                    )}
                                                </pre>
                                            </div>
                                        )}
                                </div>
                            </div>

                            {/* Tool Result Section */}
                            {tool.result && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <h4 className="text-sm font-medium">
                                            Tool Result
                                        </h4>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        <div className="flex items-center gap-2 mb-1">
                                            <strong>Result:</strong>
                                            <button
                                                onClick={() =>
                                                    copyToClipboard(
                                                        typeof tool.result ===
                                                            "string"
                                                            ? tool.result
                                                            : JSON.stringify(
                                                                  tool.result,
                                                                  null,
                                                                  2
                                                              ),
                                                        "Result"
                                                    )
                                                }
                                                className="p-1 rounded hover:bg-gray-100 transition-colors"
                                            >
                                                <Copy className="w-3 h-3 text-gray-500" />
                                            </button>
                                        </div>
                                        <div className="bg-green-100 p-2 rounded text-xs overflow-x-auto">
                                            {typeof tool.result === "string" ? (
                                                <p className="whitespace-pre-wrap">
                                                    {tool.result}
                                                </p>
                                            ) : (
                                                <pre>
                                                    {JSON.stringify(
                                                        tool.result,
                                                        null,
                                                        2
                                                    )}
                                                </pre>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Error Section */}
                            {tool.error && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                        <h4 className="text-sm font-medium text-red-600">
                                            Error
                                        </h4>
                                    </div>
                                    <div className="bg-red-50 border border-red-200 p-2 rounded text-xs">
                                        <p className="text-red-800 whitespace-pre-wrap">
                                            {tool.error}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
};

interface LLMMessageRendererProps {
    content: string;
    isStreaming?: boolean;
    toolCalls?: Array<{
        id: string;
        name: string;
        arguments: any;
        type: string;
        status?: string;
        hasArguments?: boolean;
        error?: string;
    }>;
    toolResults?: Array<{
        id: string;
        name: string;
        result: any;
        status: string;
        arguments?: any;
        error?: string;
    }>;
    compactTools?: boolean; // Kompakt tool görünümü için
    toolCollapseStates?: Record<string, boolean>;
    onToolCollapseChange?: (toolId: string, isOpen: boolean) => void;
}

export function LLMMessageRenderer({
    content,
    isStreaming = false,
    // showLoadingDots prop'unu kaldır
    toolCalls = [],
    toolResults = [],
    compactTools = false,
    toolCollapseStates = {},
    onToolCollapseChange,
}: LLMMessageRendererProps) {
    // Basit conditional rendering - content boşsa loading dots göster
    const shouldShowLoadingDots = !content || content.trim() === "";

    // Early return if no content and no tool calls/results and no loading dots
    if (!content && !shouldShowLoadingDots && !isStreaming && toolCalls.length === 0 && toolResults.length === 0) {
        return null;
    }

    // Fallback block - dokümantasyona göre doğru format
    const fallbackBlock = {
        component: ({ blockMatch }: { blockMatch: any }) => {
            const text = blockMatch.output || blockMatch.visibleText || "";
            
            // Basit markdown formatlanması
            const formatMarkdown = (text: string) => {
                return text
                    .split('\n')
                    .map((line, index) => {
                        // Headers
                        if (line.startsWith('# ')) {
                            return <h1 key={index} className="text-xl font-bold mb-2">{line.substring(2)}</h1>;
                        }
                        if (line.startsWith('## ')) {
                            return <h2 key={index} className="text-lg font-semibold mb-2">{line.substring(3)}</h2>;
                        }
                        if (line.startsWith('### ')) {
                            return <h3 key={index} className="text-md font-medium mb-1">{line.substring(4)}</h3>;
                        }
                        
                        // Code blocks
                        if (line.startsWith('```')) {
                            return <pre key={index} className="bg-gray-100 p-2 rounded text-sm overflow-x-auto whitespace-pre-wrap">{line}</pre>;
                        }
                        
                        // Lists
                        if (line.startsWith('- ')) {
                            return <li key={index} className="ml-4 list-disc">{line.substring(2)}</li>;
                        }
                        
                        // Bold ve italic formatting
                        const formatInlineElements = (text: string) => {
                            // Bold **text**
                            if (text.includes('**')) {
                                const parts = text.split('**');
                                return parts.map((part, i) => 
                                    i % 2 === 0 ? part : <strong key={i}>{part}</strong>
                                );
                            }
                            
                            // Italic *text*
                            if (text.includes('*')) {
                                const parts = text.split('*');
                                return parts.map((part, i) => 
                                    i % 2 === 0 ? part : <em key={i}>{part}</em>
                                );
                            }
                            
                            return text;
                        };
                        
                        // Normal paragraph
                        return line.trim() ? (
                            <p key={index} className="mb-1 whitespace-pre-wrap">
                                {formatInlineElements(line)}
                            </p>
                        ) : (
                            <br key={index} />
                        );
                    });
            };
            
            return (
                <div className="prose prose-sm max-w-none">
                    {formatMarkdown(text)}
                </div>
            );
        },
        
        // Dokümantasyona göre lookBack fonksiyonu
        lookBack: ({ output, isComplete, visibleTextLengthTarget, isStreamFinished }: {
            output: string;
            isComplete: boolean;
            visibleTextLengthTarget: number;
            isStreamFinished: boolean;
        }) => {
            return {
                output: output,
                visibleText: output.length > visibleTextLengthTarget 
                    ? output.substring(0, visibleTextLengthTarget - 4) + "..."
                    : output
            };
        }
    };

    // useLLMOutput hook'unu doğru şekilde kullan
    const { blockMatches } = useLLMOutput({
        llmOutput: content,
        blocks: [
            toolCallBlock,
            toolResultBlock,
        ],
        fallbackBlock,
        isStreamFinished: !isStreaming,
    });

    // Tool call'ları ve result'ları birleştir ve tekilleştir
    const mergedTools = new Map<
        string,
        {
            id: string;
            name: string;
            arguments?: any;
            result?: any;
            status: "executing" | "completed" | "failed" | "error";
            type: string;
            hasArguments?: boolean;
            error?: string;
        }
    >();

    // Tool call'ları ekle
    toolCalls.forEach((toolCall) => {
        const status = toolCall.status === "completed" 
            ? "completed" 
            : toolCall.status === "error" 
                ? "error" 
                : "executing";
        
        mergedTools.set(toolCall.id, {
            id: toolCall.id,
            name: toolCall.name,
            arguments: toolCall.arguments,
            status,
            type: toolCall.type || "function",
            hasArguments: toolCall.hasArguments,
            error: toolCall.error,
        });
    });

    // Tool result'ları merge et
    toolResults.forEach((toolResult) => {
        const existing = mergedTools.get(toolResult.id);
        if (existing) {
            existing.result = toolResult.result;
            existing.status = toolResult.status === "completed" 
                ? "completed" 
                : toolResult.status === "error" 
                    ? "error" 
                    : "failed";
            // Tool result'tan gelen arguments'ları da merge et
            if (toolResult.arguments) {
                existing.arguments = toolResult.arguments;
            }
            // Error bilgisini merge et
            if (toolResult.error) {
                existing.error = toolResult.error;
            }
        } else {
            // Sadece result varsa yeni entry oluştur
            const status = toolResult.status === "completed" 
                ? "completed" 
                : toolResult.status === "error" 
                    ? "error" 
                    : "failed";
            
            mergedTools.set(toolResult.id, {
                id: toolResult.id,
                name: toolResult.name,
                result: toolResult.result,
                status,
                type: "function",
                arguments: toolResult.arguments || {},
                error: toolResult.error,
            });
        }
    });

    const toolsArray = Array.from(mergedTools.values());

    return (
        <div className="space-y-2">
            {/* Tool calls/results'ı tekilleştirilmiş halde göster */}
            {toolsArray.map((tool) =>
                compactTools ? (
                    <ToolCompactComponent 
                        key={tool.id} 
                        tool={tool} 
                        isOpen={toolCollapseStates[tool.id] || false}
                        onToggle={(isOpen) => onToolCollapseChange?.(tool.id, isOpen)}
                    />
                ) : (
                    <ToolUnifiedComponent 
                        key={tool.id} 
                        tool={tool} 
                        isOpen={toolCollapseStates[tool.id] || false}
                        onToggle={(isOpen) => onToolCollapseChange?.(tool.id, isOpen)}
                    />
                )
            )}

            {/* Ana content'i basit conditional rendering ile göster */}
            {shouldShowLoadingDots ? (
                <div className="flex -space-x-2.5">
                    <Dot className="h-5 w-5 animate-typing-dot-bounce" />
                    <Dot className="h-5 w-5 animate-typing-dot-bounce [animation-delay:90ms]" />
                    <Dot className="h-5 w-5 animate-typing-dot-bounce [animation-delay:180ms]" />
                </div>
            ) : (
                <div>
                    {blockMatches.map((blockMatch, index) => {
                        const BlockComponent = blockMatch.block.component;
                        return (
                            <BlockComponent key={index} blockMatch={blockMatch} />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
