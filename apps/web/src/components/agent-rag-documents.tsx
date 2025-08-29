import {
    AgentRagFileShowResponse,
    AgentRagFileUpdatePayload,
} from "#backend/types.ts";
import { useFormDialog } from "#context/form-dialog-context";
import { api } from "#lib/api.ts";
import { getAsset } from "#lib/asset.ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "./confirm-dialog";
import { AgentRagFileCreateForm } from "./form/agent-rag-file-create-form";
import { AgentRagFileUpdateForm } from "./form/agent-rag-file-update-form";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Switch } from "./ui/switch";

function AgentRagDocuments({ agentUuid }: { agentUuid: string }) {
  const queryClient = useQueryClient();
  const { openFormDialog, closeFormDialog } = useFormDialog();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] =
    useState<AgentRagFileShowResponse | null>(null);

  const { data: documentsResponse, isLoading } = useQuery({
    queryKey: ["agent-rag-documents"],
    queryFn: () => api.agents({ uuid: agentUuid }).documents.get(),
  });

  const deleteDocument = useMutation({
    mutationFn: (documentUuid: string) =>
      api.agents({ uuid: agentUuid }).documents({ documentUuid }).delete(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-rag-documents"] });
      toast.success("Döküman başarıyla silindi");
      handleDialogClose();
    },
    onError: () => {
      toast.error("Döküman silinirken bir hata oluştu");
    },
  });

  const updateDocument = useMutation({
    mutationFn: (payload: AgentRagFileUpdatePayload & { uuid: string }) =>
      api
        .agents({ uuid: agentUuid })
        .documents({ documentUuid: payload.uuid })
        .patch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-rag-documents"] });
      toast.success("Döküman başarıyla güncellendi");
      handleDialogClose();
    },
    onError: () => {
      toast.error("Döküman güncellenirken bir hata oluştu");
    },
  });

  const addDocument = () => {
    openFormDialog({
      title: "Döküman Ekle",
      content: (
        <AgentRagFileCreateForm
          agentUuid={agentUuid}
          onSuccess={closeFormDialog}
        />
      ),
      maxWidth: "sm:max-w-[500px]",
    });
  };

  const editDocument = (document: AgentRagFileShowResponse) => {
    openFormDialog({
      title: "Döküman Düzenle",
      content: (
        <AgentRagFileUpdateForm
          agentUuid={agentUuid}
          document={document}
          onSuccess={closeFormDialog}
        />
      ),
      maxWidth: "sm:max-w-[425px]",
    });
  };

  const handleDeleteClick = (document: AgentRagFileShowResponse) => {
    setDocumentToDelete(document);
    setIsConfirmDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsConfirmDialogOpen(false);
    setDocumentToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (documentToDelete) {
      deleteDocument.mutate(documentToDelete.uuid);
    }
  };

  const documents = Array.isArray(documentsResponse?.data)
    ? documentsResponse.data
    : [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dökümanlar</CardTitle>
            </div>
            <Button onClick={addDocument} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Döküman Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {documents.map((document: AgentRagFileShowResponse) => (
              <div
                key={document.uuid}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <span className="font-medium">
                  {document.title || document.name}
                </span>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={document.isActive}
                    onCheckedChange={() => {
                      updateDocument.mutate({
                        uuid: document.uuid,
                        isActive: !document.isActive,
                      });
                    }}
                  />

                  <Button
                    onClick={() => editDocument(document)}
                    size="sm"
                    variant="outline"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <Button
                    onClick={() => handleDeleteClick(document)}
                    size="sm"
                    variant="outline"
                    disabled={deleteDocument.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={getAsset(document.path)} target="_blank">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
            {documents.length === 0 && !isLoading && (
              <div className="text-center py-6 text-muted-foreground">
                Henüz döküman eklenmemiş
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={isConfirmDialogOpen}
        onOpenChange={handleDialogClose}
        handleConfirm={handleConfirmDelete}
        title="Dökümanı Sil"
        desc={`"${documentToDelete?.name}" adlı dökümanı silmek istediğinize emin misiniz?`}
        confirmText={deleteDocument.isPending ? "Siliniyor..." : "Sil"}
        cancelBtnText="İptal"
        destructive={true}
        isLoading={deleteDocument.isPending}
      />
    </>
  );
}

export { AgentRagDocuments };
