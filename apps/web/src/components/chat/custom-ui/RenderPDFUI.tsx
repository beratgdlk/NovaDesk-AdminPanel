import {
    makeAssistantToolUI,
    type ToolCallMessagePartProps,
} from "@assistant-ui/react";
import { ExternalLink, FileText, Loader2 } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

const PDFRenderer =
    ({ filename }: { filename: string }) =>
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    (props: ToolCallMessagePartProps<any, any>) => {
        const result = props.result as { url: string } | { errors: any };
        const url = (result as any)?.url;

        const isError = props.isError || !!(result as any)?.errors;

        if (isError) {
            return (
                <Card className={"w-full shadow-sm"}>
                    <CardContent className="py-4">
                        <div className="text-center text-muted-foreground">
                            <p className="text-xs text-red-500">
                                PDF yüklenirken bir hata oluştu.
                            </p>
                        </div>
                        <pre className="mt-5 text-xs overflow-x-scroll">
                            <code>{JSON.stringify(result, null, 2)}</code>
                        </pre>
                    </CardContent>
                </Card>
            );
        }

        if (!result || !url) {
            return (
                <Card className="w-full max-w-xs shadow-sm">
                    <CardContent className="pt-4">
                        <div className="text-center text-muted-foreground">
                            <Loader2 className="h-6 w-6 mx-auto mb-2 opacity-50 animate-spin" />
                            <p className="text-xs">PDF yükleniyor...</p>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        try {
            const pdf: PDFInfo = {
                ...result,
                filename,
                url,
                /* size: 1000,
                pages: 1,
                createdAt: "2021-01-01", */
                type: "application/pdf",
                mimeType: "application/pdf",
            };

            /* typeof props.result === "string"
          ? JSON.parse(props.result)
          : props.result; */

            const handleOpenInNewTab = () => {
                if (pdf.url) {
                    window.open(pdf.url, "_blank", "noopener,noreferrer");
                }
            };

            return (
                <Card className="w-full max-w-xs shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <FileText className="h-3 w-3 text-red-600" />
                            PDF
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {/* PDF Preview */}
                        <div
                            className="flex items-center gap-2 p-2 bg-muted/50 rounded cursor-pointer"
                            onClick={url ? handleOpenInNewTab : undefined}
                        >
                            <div className="flex-shrink-0">
                                <FileText className="h-8 w-8 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p
                                    className="font-medium text-xs truncate"
                                    title={pdf.filename}
                                >
                                    {pdf.filename || "document.pdf"}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    {pdf.size && (
                                        <span className="text-xs text-muted-foreground">
                                            {formatFileSize(pdf.size)}
                                        </span>
                                    )}
                                    {pdf.pages && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs h-4 px-1"
                                        >
                                            {pdf.pages}s
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={!url}
                                    className="h-7 w-7 p-0"
                                    title="Yeni sekmede aç"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        } catch (error) {
            console.error("PDF render error:", error);
            return (
                <Card className="w-full max-w-xs">
                    <CardContent className="pt-4">
                        <div className="text-center text-muted-foreground">
                            <FileText className="h-6 w-6 mx-auto mb-2 opacity-50 text-red-600" />
                            <p className="text-xs">PDF yüklenemedi.</p>
                        </div>
                    </CardContent>
                </Card>
            );
        }
    };

const RenderPreInfoPDFUI = makeAssistantToolUI({
    toolName: "mcp__insurup__GetProposalPreInfoDocumentPdf",
    render: (props) =>
        PDFRenderer({ filename: "Teklif Ön Bilgilendirme Formu" })(props),
});

const RenderProposalPDFUI = makeAssistantToolUI({
    toolName: "mcp__insurup__GetProposalPdf",
    render: (props) =>
        PDFRenderer({ filename: "Teklif Formu" })(props),
});

// Dosya boyutunu formatlamak için yardımcı fonksiyon
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

type PDFInfo = {
    filename: string;
    url: string;
    size?: number;
    pages?: number;
    createdAt?: string;
    type?: string;
    mimeType?: string;
};

export { RenderPreInfoPDFUI, RenderProposalPDFUI };
