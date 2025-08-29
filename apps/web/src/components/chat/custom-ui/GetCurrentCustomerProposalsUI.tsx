import { makeAssistantToolUI } from "@assistant-ui/react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    Calendar,
    DollarSign,
    FileText,
    Target,
    TrendingUp,
    User,
} from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { ScrollArea } from "#/components/ui/scroll-area";
import { Separator } from "#/components/ui/separator";

const GetCurrentCustomerProposalsUI = makeAssistantToolUI({
    toolName: "mcp__insurup__GetCurrentCustomerProposals",
    render: (props) => {
        try {
            const result = (
                typeof props.result === "string"
                    ? JSON.parse(props.result)
                    : props.result
            ) as CustomerProposals;

            const formatDate = (dateString: string) => {
                return format(new Date(dateString), "d MMM yyyy", {
                    locale: tr,
                });
            };

            const formatCurrency = (amount: number) => {
                return new Intl.NumberFormat("tr-TR", {
                    style: "currency",
                    currency: "TRY",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                }).format(amount);
            };

            const getStateColor = (state: string) => {
                switch (state.toLowerCase()) {
                    case "active":
                    case "aktif":
                        return "bg-green-100 text-green-800";
                    case "pending":
                    case "beklemede":
                        return "bg-yellow-100 text-yellow-800";
                    case "expired":
                    case "süresi dolmuş":
                        return "bg-red-100 text-red-800";
                    default:
                        return "bg-gray-100 text-gray-800";
                }
            };

            const proposals = result.data.proposals.items;

            return (
                <Card className="w-full max-w-lg shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-lg">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Müşteri Teklifleri
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                {result.data.proposals.totalCount} teklif
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-96 px-4">
                            <div className="space-y-3 pb-4">
                                {proposals.map((proposal, index) => (
                                    <div key={proposal.id}>
                                        <div className="space-y-2">
                                            {/* Başlık ve Durum */}
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">
                                                        {proposal.productBranch}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {
                                                            proposal.insuredCustomerName
                                                        }
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs ${getStateColor(proposal.state)}`}
                                                >
                                                    {proposal.state}
                                                </Badge>
                                            </div>

                                            {/* Fiyat Aralığı */}
                                            <div className="flex items-center gap-3 text-xs">
                                                <div className="flex items-center gap-1">
                                                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-muted-foreground">
                                                        Fiyat:
                                                    </span>
                                                    <span className="font-medium">
                                                        {formatCurrency(
                                                            proposal.lowestPremium
                                                        )}{" "}
                                                        -{" "}
                                                        {formatCurrency(
                                                            proposal.highestPremium
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Başarı Oranı ve Ürün Sayısı */}
                                            <div className="flex items-center gap-4 text-xs">
                                                <div className="flex items-center gap-1">
                                                    <Target className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-muted-foreground">
                                                        Başarı:
                                                    </span>
                                                    <span className="font-medium">
                                                        %{proposal.successRate}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-muted-foreground">
                                                        Ürün:
                                                    </span>
                                                    <span className="font-medium">
                                                        {
                                                            proposal.succeedProductsCount
                                                        }
                                                        /
                                                        {proposal.productsCount}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Tarih ve Oluşturan */}
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>
                                                        {formatDate(
                                                            proposal.createdAt
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    <span>
                                                        {
                                                            proposal
                                                                .agentUserCreatedBy
                                                                .name
                                                        }
                                                    </span>
                                                </div>
                                            </div>

                                            {/* TCKN */}
                                            <div className="text-xs text-muted-foreground font-mono">
                                                TCKN:{" "}
                                                {
                                                    proposal.insuredCustomerIdentity
                                                }
                                            </div>
                                        </div>

                                        {index < proposals.length - 1 && (
                                            <Separator className="mt-3" />
                                        )}
                                    </div>
                                ))}

                                {proposals.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">
                                            Henüz teklif bulunmuyor.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            );
        } catch (error) {
            return (
                <Card className="w-full max-w-lg">
                    <CardContent className="pt-6">
                        <div className="text-center text-muted-foreground">
                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Teklif bilgisi alınamadı.</p>
                        </div>
                    </CardContent>
                </Card>
            );
        }
    },
});

type CustomerProposals = {
    data: {
        proposals: {
            totalCount: number;
            items: {
                id: string;
                productBranch: string;
                insuredCustomerName: string;
                insuredCustomerIdentity: string;
                insuredCustomerType: string;
                state: string;
                highestPremium: number;
                lowestPremium: number;
                successRate: number;
                productsCount: number;
                succeedProductsCount: number;
                createdAt: string;
                agentUserCreatedBy: { name: string };
            }[];
        };
    };
};

export { GetCurrentCustomerProposalsUI };
