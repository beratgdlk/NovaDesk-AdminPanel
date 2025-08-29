import { IconLoader } from "@tabler/icons-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "#/components/ui/select";
import { cn } from "#/lib/utils";

interface SelectDropdownProps {
    onValueChange?: (value: string) => void;
    defaultValue: string | undefined;
    placeholder?: string;
    isPending?: boolean;
    items: { label: string; value: string; description?: string }[] | undefined;
    disabled?: boolean;
    className?: string;
    isControlled?: boolean;
}

export function SelectDropdown({
    defaultValue,
    onValueChange,
    isPending,
    items,
    placeholder,
    disabled,
    className = "",
    isControlled = false,
}: SelectDropdownProps) {
    const defaultState = isControlled
        ? { value: defaultValue, onValueChange }
        : { defaultValue, onValueChange };
    return (
        <Select {...defaultState}>
            <SelectTrigger
                disabled={disabled}
                className={cn(className, "[&_.select-description]:hidden")}
            >
                <SelectValue placeholder={placeholder ?? "Select"} />
            </SelectTrigger>
            <SelectContent>
                {isPending ? (
                    <SelectItem disabled value="loading" className="h-14">
                        <div className="flex items-center justify-center gap-2">
                            <IconLoader className="h-5 w-5 animate-spin" />
                            {"  "}
                            Loading...
                        </div>
                    </SelectItem>
                ) : (
                    items?.map(({ label, value, description }) => (
                        <SelectItem key={value} value={value}>
                            <div className="flex flex-col">
                                <span className="font-medium">{label}</span>
                                {description && (
                                    <span className="select-description text-xs text-muted-foreground mt-1 leading-tight">
                                        {description}
                                    </span>
                                )}
                            </div>
                        </SelectItem>
                    ))
                )}
            </SelectContent>
        </Select>
    );
}
