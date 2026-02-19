"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "./app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Trash2 } from "lucide-react";
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
import type { BotMetadata, BotCommand } from "@/lib/types";
import { toast } from "sonner";

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
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          <span className="text-muted-foreground ml-2">
            Loading metadata...
          </span>
        </CardContent>
      </Card>
    );
  }

  const label = isDefault
    ? "Default"
    : `${getLanguageName(languageCode)} (${languageCode})`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{label}</CardTitle>
          <div className="flex items-center gap-2">
            {!isDefault && languageCode && (
              <TranslateDialog
                currentLang={languageCode}
                onApply={handleTranslationApply}
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={`name-${languageCode}`}>Name</Label>
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
            <Label htmlFor={`short-desc-${languageCode}`}>
              Short Description
            </Label>
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
            <Label htmlFor={`desc-${languageCode}`}>Description</Label>
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

        <Separator />

        <CommandsEditor
          commands={commands}
          onChange={setCommands}
          readOnlyCommands={!isDefault}
        />

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            {!isDefault && (
              <Dialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
              >
                <DialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Localization
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Localization</DialogTitle>
                    <DialogDescription>
                      This will remove all localized metadata for{" "}
                      {getLanguageName(languageCode)} ({languageCode}). This
                      action cannot be undone.
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
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
