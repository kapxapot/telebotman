"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ClipboardPaste, Eraser } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { BotCommand } from "@/lib/types";

interface CommandsEditorProps {
  commands: BotCommand[];
  onChange: (commands: BotCommand[]) => void;
  readOnlyCommands?: boolean;
  onSyncFromDefault?: () => void;
  onResetToDefault?: () => void;
}

export function CommandsEditor({
  commands,
  onChange,
  readOnlyCommands = false,
  onSyncFromDefault,
  onResetToDefault,
}: CommandsEditorProps) {
  const pendingFocusRef = useRef(false);
  const lastCommandInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pendingFocusRef.current) {
      pendingFocusRef.current = false;
      lastCommandInputRef.current?.focus();
    }
  }, [commands.length]);

  function addCommand() {
    pendingFocusRef.current = true;
    onChange([...commands, { command: "", description: "" }]);
  }

  function removeCommand(index: number) {
    onChange(commands.filter((_, i) => i !== index));
  }

  function updateCommand(
    index: number,
    field: "command" | "description",
    value: string,
  ) {
    const updated = commands.map((cmd, i) =>
      i === index ? { ...cmd, [field]: value } : cmd,
    );
    onChange(updated);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <h4 className="text-sm font-medium">Commands</h4>
        {onSyncFromDefault && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={onSyncFromDefault}
              >
                <ClipboardPaste className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add missing commands from default</TooltipContent>
          </Tooltip>
        )}
        {onResetToDefault && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 text-destructive hover:text-destructive"
                onClick={onResetToDefault}
              >
                <Eraser className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear all commands (fall back to default)</TooltipContent>
          </Tooltip>
        )}
      </div>

      {commands.length === 0 && (
        <p className="text-muted-foreground text-sm">No commands configured.</p>
      )}

      <div className="space-y-2">
        {commands.map((cmd, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              ref={i === commands.length - 1 ? lastCommandInputRef : undefined}
              placeholder="command"
              value={cmd.command}
              onChange={(e) => updateCommand(i, "command", e.target.value)}
              readOnly={readOnlyCommands}
              className="w-1/3 font-mono text-sm"
            />
            <Input
              placeholder="Description"
              value={cmd.description}
              onChange={(e) => updateCommand(i, "description", e.target.value)}
              className="flex-1"
            />
            {!readOnlyCommands && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeCommand(i)}
                className="shrink-0"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {!readOnlyCommands && (
        <div className="flex justify-end pt-2">
          <Button type="button" variant="outline" size="sm" onClick={addCommand}>
            <Plus className="size-3" />
            Add Command
          </Button>
        </div>
      )}
    </div>
  );
}
