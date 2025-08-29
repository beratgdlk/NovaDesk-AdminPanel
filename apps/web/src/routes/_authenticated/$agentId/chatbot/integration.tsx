import { ConfirmDialog } from "#/components/confirm-dialog";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Switch } from "#/components/ui/switch";
import { AgentUpdatePayloadParsed } from "#backend/modules/agents/types";
import { api } from "#lib/api.ts";
import useAgentStore from "#stores/agent-store.ts";
import { cleanDomain } from "#utils/domain-formatter.ts";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { codeToHtml } from "shiki";
import { toast } from "sonner";

export const Route = createFileRoute(
  "/_authenticated/$agentId/chatbot/integration"
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { agent } = useAgentStore();
  const queryClient = useQueryClient();
  const [newDomain, setNewDomain] = useState<string>("");
  const [highlightedCode, setHighlightedCode] = useState<string>("");
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    useState<boolean>(false);
  const [domainToDelete, setDomainToDelete] = useState<{
    index: number;
    domain: string;
  } | null>(null);

  const { control, handleSubmit, reset, watch } = useForm<AgentUpdatePayloadParsed>({
    defaultValues: {
      ...agent,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "domains",
  });

  const domains = watch("domains") || [];

  const onSubmit = async (data: AgentUpdatePayloadParsed) => {
    if (!agent?.uuid) {
      toast.error("Agent bilgisi bulunamadı");
      return;
    }

    try {
      const response = await api.agents({ uuid: agent.uuid }).put(data as any);
      if (response.data) {
        toast.success("Domain konfigürasyonu güncellendi");
        queryClient.invalidateQueries({ queryKey: ["agent"] });
      } else {
        toast.error("Domain konfigürasyonu güncellenemedi");
      }
    } catch (error) {
      toast.error("Bir hata oluştu");
      console.error("Domain config update error:", error);
    }
  };

  const addDomain = () => {
    const cleanedDomain = cleanDomain(newDomain) as string;

    if (cleanedDomain && domains.length < 3) {
      const domainExists = domains.some(
        (domain) => domain.domain.toLowerCase() === cleanedDomain
      );

      if (!domainExists) {
        append({
          domain: cleanedDomain,
          isEnabled: true,
        });
        setNewDomain("");
      } else {
        toast.error(
          "Bu site hali hazırda kayıtlı lütfen uygulama yöneticisi ile iletişime geçiniz",
          {
            duration: 5000,
          }
        );
      }
    }
  };

  const removeDomain = (index: number) => {
    const domain = domains[index];
    if (domain) {
      setDomainToDelete({ index, domain: domain.domain });
      setIsConfirmDialogOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    if (domainToDelete) {
      remove(domainToDelete.index);
      setIsConfirmDialogOpen(false);
      setDomainToDelete(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsConfirmDialogOpen(open);
    if (!open) {
      setDomainToDelete(null);
    }
  };

  const toggleDomain = (index: number) => {
    const domain = domains[index];
    if (domain) {
      update(index, {
        ...domain,
        isEnabled: !domain.isEnabled,
      });
    }
  };

  const sampleCode = useMemo(
    () => `
<script>
  window.NovaDeskChatbot = {
    siteId: "${agent?.uuid || "your-site-id"}",
    allowedDomains: [${domains
      .filter((d) => d.isEnabled)
      .map((d) => `"${d.domain}"`)
      .join(", ")}],
    // Other configuration options
  };
</script>
<script src="https://cdn.novadesk.dev/chatbot.js"></script>`,
    [agent?.uuid, domains]
  );

  // Syntax highlighting effect
  useEffect(() => {
    const highlightCode = async () => {
      try {
        const highlighted = await codeToHtml(sampleCode.trim(), {
          lang: "html",
          theme: "material-theme-darker",
        });
        setHighlightedCode(highlighted);
      } catch (error) {
        console.error("Syntax highlighting failed:", error);
        setHighlightedCode(`<pre><code>${sampleCode}</code></pre>`);
      }
    };

    highlightCode();
  }, [sampleCode]);

  useEffect(() => {
    if (agent) {
      reset({
        ...agent,
      });
    }
  }, [agent, reset]);

  return (
    <div className="container mx-auto p-6 mt-5">
      <h1 className="text-3xl font-bold mb-6">
        Web Chatbot Entegrasyon Bilgileri
      </h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Alan Adı</CardTitle>
                    <Button
                      onClick={addDomain}
                      disabled={domains.length >= 3}
                      size="sm"
                      variant="outline"
                      type="button"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Alan Adı Ekle
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {domains.length < 3 && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Alan adı girin..."
                          value={newDomain}
                          onChange={(e) => setNewDomain(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && addDomain()}
                        />
                      </div>
                    )}

                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <span className="font-medium">
                            {domains[index]?.domain}
                          </span>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={domains[index]?.isEnabled || false}
                              onCheckedChange={() => toggleDomain(index)}
                            />
                            <Button
                              onClick={() => removeDomain(index)}
                              size="sm"
                              variant="outline"
                              type="button"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <div
                    className="rounded-lg text-sm overflow-x-auto border font-mono"
                    style={{
                      background: "#1a1a1a",
                      padding: "1rem",
                      margin: 0,
                      lineHeight: "1.5",
                    }}
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                  />
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" type="button">
                      Rehber
                    </Button>
                    <Button variant="outline" size="sm" type="button">
                      Kopyala
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="acenteId">Acente ID</Label>
                    <Input
                      id="acenteId"
                      placeholder="Place holder (Read-only)"
                      value={agent?.uuid || ""}
                      className="mt-1"
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Kaydet
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <ConfirmDialog
        open={isConfirmDialogOpen}
        onOpenChange={handleDialogClose}
        handleConfirm={handleConfirmDelete}
        title="Alanı Sil"
        desc={`"${domainToDelete?.domain}" adlı alanı silmek istediğinize emin misiniz?`}
        confirmText="Sil"
        cancelBtnText="İptal"
        destructive={true}
      />
    </div>
  );
}
