import { AboutUsModal } from "#/components/dialog/about-us-modal";
import { PromptMessageModal } from "#/components/dialog/prompt-message-modal";
import { VoiceToneModal } from "#/components/dialog/voice-tone-modal";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { AgentRagDocuments } from "#components/agent-rag-documents.tsx";
import { createFileRoute } from "@tanstack/react-router";
import { List } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute(
  "/_authenticated/$agentId/agent-management"
)({
  component: RouteComponent,
});

interface GuidelineProps {
  id: number;
  name: string;
}

enum GuidelineType {
  VoiceTone = "Ses ve Tonlama",
  Message = "Başlangıç Mesajı",
  AboutUs = "Hakkımızda",
}

const guidelines = [
  { id: 1, name: "Ses ve Tonlama" },
  { id: 2, name: "Başlangıç Mesajı" },
  { id: 3, name: "Hakkımızda" },
];

function RouteComponent() {
  const { agentId } = Route.useParams();
  // Modal states
  const [isVoiceToneModalOpen, setIsVoiceToneModalOpen] =
    useState<boolean>(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState<boolean>(false);
  const [isAboutUsModalOpen, setIsAboutUsModalOpen] = useState<boolean>(false);

  const openGuidelineModal = (guideline: GuidelineProps) => {
    if (guideline.name === GuidelineType.VoiceTone) {
      setIsVoiceToneModalOpen(true);
    } else if (guideline.name === GuidelineType.Message) {
      setIsMessageModalOpen(true);
    } else if (guideline.name === GuidelineType.AboutUs) {
      setIsAboutUsModalOpen(true);
    } else {
      console.log("Modal for:", guideline.name, "not implemented yet");
    }
  };

  const closeVoiceToneModal = () => {
    setIsVoiceToneModalOpen(false);
  };

  const closeMessageModal = () => {
    setIsMessageModalOpen(false);
  };

  const closeAboutUsModal = () => {
    setIsAboutUsModalOpen(false);
  };

  return (
    <div className="container mx-auto p-6 mt-5">
      <h1 className="text-3xl font-bold mb-6">Bilgi Yönetimi</h1>

      <div className="grid grid-cols-1 gap-6">
        <AgentRagDocuments agentUuid={agentId} />
        <Card>
          <CardHeader>
            <CardTitle>Yönergeler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {guidelines.map((guideline) => (
                <div
                  key={guideline.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <span className="font-medium">{guideline.name}</span>
                  <Button
                    onClick={() => openGuidelineModal(guideline)}
                    size="sm"
                    variant="outline"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <VoiceToneModal
        isOpen={isVoiceToneModalOpen}
        onClose={closeVoiceToneModal}
        title="Ses ve Tonlama"
      />

      <PromptMessageModal
        isOpen={isMessageModalOpen}
        onClose={closeMessageModal}
        title="Başlangıç Mesajı"
      />

      <AboutUsModal
        isOpen={isAboutUsModalOpen}
        onClose={closeAboutUsModal}
        title="Hakkımızda"
      />
    </div>
  );
}
