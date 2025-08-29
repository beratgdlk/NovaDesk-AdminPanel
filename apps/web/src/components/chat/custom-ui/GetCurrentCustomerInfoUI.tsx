import { makeAssistantToolUI } from "@assistant-ui/react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Briefcase, Calendar, Mail, MapPin, Phone, User } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

const GetCurrentCustomerInfoUI = makeAssistantToolUI({
    toolName: "mcp__insurup__GetCurrentCustomerInfo",
    render: (props) => {
        // Guard clause - result henüz hazır değilse loading state göster
        if (!props.result) {
            return (
                <Card className="w-full max-w-md shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-center text-muted-foreground">
                            <User className="h-8 w-8 mx-auto mb-2 opacity-50 animate-pulse" />
                            <p>Müşteri bilgisi yükleniyor...</p>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        try {
            const result = typeof props.result === "string" 
                ? JSON.parse(props.result)
                : props.result;

            const formatDate = (dateString: string) => {
                return format(new Date(dateString), "d MMMM yyyy", {
                    locale: tr,
                });
            };

            const formatPhone = (phone: CustomerInfo["primaryPhoneNumber"]) => {
                if (!phone) return null;
                return `+${phone.countryCode} ${phone.areaCode} ${phone.numberWithoutAreaCode}`;
            };

            return (
                <Card className="w-full max-w-md  shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <User className="h-4 w-4" />
                            Müşteri Bilgileri
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {/* Ana Bilgiler */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-sm">
                                        {result.fullName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        TCKN: {result.identityNumber}
                                    </p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                    {result.gender}
                                </Badge>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(result.birthDate)}</span>
                                {result.maritalStatus && (
                                    <>
                                        <span>•</span>
                                        <span>{result.maritalStatus}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* İletişim */}
                        <div className="space-y-1 pt-2 border-t">
                            {result.primaryPhoneNumber && (
                                <div className="flex items-center gap-2 text-xs">
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                    <span>
                                        {formatPhone(result.primaryPhoneNumber)}
                                    </span>
                                </div>
                            )}
                            {result.primaryEmail && (
                                <div className="flex items-center gap-2 text-xs">
                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                    <span>{result.primaryEmail}</span>
                                </div>
                            )}
                            {(result.city || result.district) && (
                                <div className="flex items-center gap-2 text-xs">
                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                    <span>
                                        {result.district?.text &&
                                            `${result.district.text}, `}
                                        {result.city?.text}
                                    </span>
                                </div>
                            )}
                            {result.job && (
                                <div className="flex items-center gap-2 text-xs">
                                    <Briefcase className="h-3 w-3 text-muted-foreground" />
                                    <span>{result.job}</span>
                                </div>
                            )}
                        </div>

                        {/* Alt Bilgi */}
                        {result.createdBy && (
                            <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground">
                                    {result.createdBy.name} tarafından{" "}
                                    {formatDate(result.createdAt)} tarihinde
                                    oluşturuldu
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            );
        } catch (error) {
            console.error(error);
            return (
                <Card className="w-full max-w-md mx-auto">
                    <CardContent className="pt-6">
                        <div className="text-center text-muted-foreground">
                            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Müşteri bilgisi alınamadı.</p>
                        </div>
                    </CardContent>
                </Card>
            );
        }
    },
});

type CustomerInfo = {
    $type: "individual";
    fullName: string;
    identityNumber: number;
    birthDate: string;
    gender: string;
    educationStatus: null;
    nationality: null;
    maritalStatus: string;
    job: null;
    id: string;
    type: string;
    primaryEmail: null;
    primaryPhoneNumber: {
        number: string;
        countryCode: number;
        areaCode: string;
        numberWithoutAreaCode: string;
    };
    city: {
        value: string;
        text: string;
    };
    district: {
        value: string;
        text: string;
    };
    createdAt: string;
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
    representedBy: null;
};

export { GetCurrentCustomerInfoUI };
