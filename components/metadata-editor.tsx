"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "./app-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Info, Loader2, Save, Trash2, ClipboardPaste } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CommandsEditor } from "./commands-editor";
import { TranslateDialog } from "./translate-dialog";
import { getLanguageName } from "@/lib/languages";
import { LanguageFlag } from "./language-flag";
import type { BotMetadata, BotCommand } from "@/lib/types";
import { toast } from "sonner";

function SyncFromDefaultButton({ onClick }: { onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={onClick}
        >
          <ClipboardPaste className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Copy from default</TooltipContent>
    </Tooltip>
  );
}

interface MetadataEditorProps {
  languageCode: string | null;
}

export function MetadataEditor({ languageCode }: MetadataEditorProps) {
  const {
    botToken,
    defaultMetadata,
    languageMetadata,
    setDefaultMetadata,
    setLanguageMetadata,
    removeLanguage,
  } = useApp();

  const isDefault = languageCode === null;
  const cachedMeta = isDefault
    ? defaultMetadata
    : languageMetadata[languageCode];

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [commands, setCommands] = useState<BotCommand[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const populateForm = useCallback((meta: BotMetadata) => {
    setName(meta.name);
    setDescription(meta.description);
    setShortDescription(meta.short_description);
    setCommands(meta.commands.map((c) => ({ ...c })));
  }, []);

  useEffect(() => {
    if (cachedMeta) {
      populateForm(cachedMeta);
      return;
    }

    if (!botToken) return;

    setFetching(true);
    fetch("/api/telegram/metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bot_token: botToken,
        language_code: languageCode ?? undefined,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.metadata) {
          const meta = data.metadata as BotMetadata;
          if (isDefault) {
            setDefaultMetadata(meta);
          } else {
            setLanguageMetadata(languageCode, meta);
          }
          populateForm(meta);
        }
      })
      .finally(() => setFetching(false));
  }, [
    botToken,
    languageCode,
    isDefault,
    cachedMeta,
    populateForm,
    setDefaultMetadata,
    setLanguageMetadata,
  ]);

  async function handleSave() {
    if (!botToken) return;
    setLoading(true);

    try {
      const metadata: BotMetadata = {
        name,
        description,
        short_description: shortDescription,
        commands,
      };

      const res = await fetch("/api/telegram/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bot_token: botToken,
          metadata,
          language_code: languageCode ?? undefined,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        if (isDefault) setDefaultMetadata(metadata);
        else setLanguageMetadata(languageCode, metadata);
        toast.success("Metadata saved successfully");
      } else {
        const failedFields =
          data.results
            ?.filter((r: { ok: boolean }) => !r.ok)
            .map((r: { field: string }) => r.field)
            .join(", ") ?? "unknown";
        toast.error(`Failed to save: ${failedFields}`);
      }
    } catch {
      toast.error("Network error while saving");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!botToken || !languageCode) return;
    setDeleting(true);

    try {
      const res = await fetch("/api/telegram/delete-localization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bot_token: botToken,
          language_code: languageCode,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        removeLanguage(languageCode);
        toast.success(
          `Localization for ${getLanguageName(languageCode)} deleted`,
        );
      } else {
        toast.error("Failed to delete localization");
      }
    } catch {
      toast.error("Network error while deleting");
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  }

  function handleTranslationApply(meta: BotMetadata) {
    populateForm(meta);
  }

  if (fetching) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
          <span className="text-muted-foreground ml-2">
            Loading metadata...
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        {!isDefault && languageCode && (
          <div className="flex justify-end gap-2">
            {defaultMetadata && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  populateForm(defaultMetadata);
                  toast.success("All fields copied from default");
                }}
              >
                <ClipboardPaste className="size-4" />
                Copy All from Default
              </Button>
            )}
            <TranslateDialog
              currentLang={languageCode}
              onApply={handleTranslationApply}
            />
          </div>
        )}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Label htmlFor={`name-${languageCode}`}>Name</Label>
              {!isDefault && defaultMetadata && (
                <SyncFromDefaultButton onClick={() => setName(defaultMetadata.name)} />
              )}
            </div>
            <span className="text-muted-foreground text-xs">
              {name.length}/64
            </span>
          </div>
          <Input
            id={`name-${languageCode}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={64}
            placeholder="Bot name"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Label htmlFor={`short-desc-${languageCode}`}>
                Short Description
              </Label>
              {!isDefault && defaultMetadata && (
                <SyncFromDefaultButton onClick={() => setShortDescription(defaultMetadata.short_description)} />
              )}
            </div>
            <span className="text-muted-foreground text-xs">
              {shortDescription.length}/120
            </span>
          </div>
          <Textarea
            id={`short-desc-${languageCode}`}
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            maxLength={120}
            placeholder="Brief description shown in bot profile"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Label htmlFor={`desc-${languageCode}`}>Description</Label>
              {!isDefault && defaultMetadata && (
                <SyncFromDefaultButton onClick={() => setDescription(defaultMetadata.description)} />
              )}
            </div>
            <span className="text-muted-foreground text-xs">
              {description.length}/512
            </span>
          </div>
          <Textarea
            id={`desc-${languageCode}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={512}
            placeholder="Full description shown when starting the bot"
            rows={4}
          />
        </div>

        <CommandsEditor
          commands={commands}
          onChange={setCommands}
          onSyncFromDefault={!isDefault && defaultMetadata ? () => {
            const defaultCmds = defaultMetadata.commands;
            const existingNames = new Set(commands.map((c) => c.command));
            const missing = defaultCmds.filter((c) => !existingNames.has(c.command));
            if (missing.length === 0) {
              toast.info("All default commands already present");
              return;
            }
            setCommands([...commands, ...missing.map((c) => ({ ...c }))]);
            toast.success(`Added ${missing.length} missing command${missing.length > 1 ? "s" : ""}`);
          } : undefined}
        />

        {!isDefault && (
          <div className="flex items-center gap-2 text-sm pt-2">
            <div className="flex w-full items-center gap-2 rounded-md bg-muted p-2.5 py-2">
              <Info className="size-5 shrink-0 text-blue-500" />
              <span>
                Empty settings fall back to the default metadata values.
              </span>
            </div>
          </div>
        )}

        <div className="pt-4 flex items-center justify-between">
          <div>
            {!isDefault && (
              <Dialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
              >
                <DialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm">
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Localization</DialogTitle>
                    <DialogDescription>
                      This will remove all localized metadata for
                      <span className="inline-flex items-center ml-1.5 gap-1.5">
                        <LanguageFlag code={languageCode ?? ""} />
                        <strong>{getLanguageName(languageCode)}</strong>
                      </span>
                      . This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDeleteConfirmOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
