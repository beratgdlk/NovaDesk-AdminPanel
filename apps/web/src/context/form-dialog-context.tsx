import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { createContext, ReactNode, useContext, useState } from "react";

interface FormDialogState {
  isOpen: boolean;
  title: string;
  content: ReactNode;
  maxWidth?: string;
}

interface FormDialogContextType {
  openFormDialog: (config: {
    title: string;
    content: ReactNode;
    maxWidth?: string;
  }) => void;
  closeFormDialog: () => void;
  isOpen: boolean;
}

const FormDialogContext = createContext<FormDialogContextType | undefined>(undefined);

interface FormDialogProviderProps {
  children: ReactNode;
}

export function FormDialogProvider({ children }: FormDialogProviderProps) {
  const [dialogState, setDialogState] = useState<FormDialogState>({
    isOpen: false,
    title: "",
    content: null,
    maxWidth: "sm:max-w-[425px]",
  });

  const openFormDialog = (config: {
    title: string;
    content: ReactNode;
    maxWidth?: string;
  }) => {
    setDialogState({
      isOpen: true,
      title: config.title,
      content: config.content,
      maxWidth: config.maxWidth || "sm:max-w-[425px]",
    });
  };

  const closeFormDialog = () => {
    setDialogState(prev => ({
      ...prev,
      isOpen: false,
    }));
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeFormDialog();
    }
  };

  return (
    <FormDialogContext.Provider
      value={{
        openFormDialog,
        closeFormDialog,
        isOpen: dialogState.isOpen,
      }}
    >
      {children}
      
      <Dialog open={dialogState.isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className={dialogState.maxWidth}>
          <DialogHeader>
            <DialogTitle>{dialogState.title}</DialogTitle>
          </DialogHeader>
          {dialogState.content}
        </DialogContent>
      </Dialog>
    </FormDialogContext.Provider>
  );
}

export function useFormDialog() {
  const context = useContext(FormDialogContext);
  if (!context) {
    throw new Error("useFormDialog must be used within a FormDialogProvider");
  }
  return context;
} 