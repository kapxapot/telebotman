"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { BotCommand } from "@/lib/types";

interface CommandsEditorProps {
  commands: BotCommand[];
  onChange: (commands: BotCommand[]) => void;
  readOnlyCommands?: boolean;
}

export function CommandsEditor({
  commands,
  onChange,
  readOnlyCommands = false,
}: CommandsEditorProps) {
  function addCommand() {
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Commands</h4>
        {!readOnlyCommands && (
          <Button type="button" variant="outline" size="sm" onClick={addCommand}>
            <Plus className="size-3" />
            Add Command
          </Button>
        )}
      </div>

      {commands.length === 0 && (
        <p className="text-muted-foreground text-sm">No commands configured.</p>
      )}

      <div className="space-y-2">
        {commands.map((cmd, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
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
    </div>
  );
}
