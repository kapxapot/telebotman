"use client";

import { useState } from "react";
import { useApp } from "./app-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Languages, Loader2 } from "lucide-react";
import { ISO_639_1_LANGUAGES, getLanguageName, getCountryCode } from "@/lib/languages";
import type { BotMetadata } from "@/lib/types";
import { toast } from "sonner";

interface TranslateDialogProps {
  currentLang: string;
  onApply: (metadata: BotMetadata) => void;
}

export function TranslateDialog({
  currentLang,
  onApply,
}: TranslateDialogProps) {
  const { openaiKey, defaultMetadata, configuredLanguages, languageMetadata } =
    useApp();
  const [open, setOpen] = useState(false);
  const [sourceLang, setSourceLang] = useState("default");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<BotMetadata | null>(null);

  if (!openaiKey) return null;

  const sourceOptions = [
    { value: "default", label: "Default", country: null as string | null },
    ...configuredLanguages.map((code) => ({
      value: code,
      label: getLanguageName(code),
      country: getCountryCode(code),
    })),
  ];

  async function handleTranslate() {
    setLoading(true);
    setPreview(null);

    try {
      const sourceMetadata =
        sourceLang === "default"
          ? defaultMetadata
          : languageMetadata[sourceLang];

      if (!sourceMetadata) {
        toast.error("Source language metadata not loaded");
        return;
      }

      const sourceLabel =
        sourceLang === "default" ? "English" : getLanguageName(sourceLang);
      const targetLabel = getLanguageName(currentLang);

      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openai_api_key: openaiKey,
          source_lang: sourceLabel,
          target_lang: targetLabel,
          metadata: sourceMetadata,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        toast.error(data.error ?? "Translation failed");
        return;
      }

      setPreview(data.metadata);
    } catch {
      toast.error("Network error during translation");
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (preview) {
      onApply(preview);
      setOpen(false);
      setPreview(null);
      toast.success("Translation applied to form");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Languages className="size-4" />
          Translate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>AI Translation</DialogTitle>
          <DialogDescription>
            Translate metadata from a source language to{" "}
            {getCountryCode(currentLang) && (
              <span className={`fi fi-${getCountryCode(currentLang)!.toLowerCase()} mx-1`} />
            )}
            {getLanguageName(currentLang)}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Source Language</Label>
            <Select value={sourceLang} onValueChange={setSourceLang}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sourceOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.country && (
                      <span className={`fi fi-${opt.country.toLowerCase()} mr-1.5`} />
                    )}
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleTranslate}
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Translate
          </Button>

          {preview && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Preview</h4>
                <div className="bg-muted space-y-2 rounded-md p-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    {preview.name}
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Short Description:
                    </span>{" "}
                    {preview.short_description}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Description:</span>{" "}
                    {preview.description}
                  </div>
                  {preview.commands.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Commands:</span>
                      <ul className="ml-4 mt-1 list-disc">
                        {preview.commands.map((c, i) => (
                          <li key={i}>
                            <code>/{c.command}</code> &mdash; {c.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <Button onClick={handleApply} className="w-full">
                  Apply Translation
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
