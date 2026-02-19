"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "./app-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2 } from "lucide-react";
import { MetadataEditor } from "./metadata-editor";
import { ISO_639_1_LANGUAGES, getLanguageName } from "@/lib/languages";

export function LanguageTabs() {
  const {
    botToken,
    configuredLanguages,
    setConfiguredLanguages,
    setDefaultMetadata,
    setIsProbing,
    setProbeProgress,
    addLanguage,
    isProbing,
    probeProgress,
  } = useApp();

  const [activeTab, setActiveTab] = useState("default");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("");

  const fetchInitialData = useCallback(async () => {
    if (!botToken) return;

    try {
      const metaRes = await fetch("/api/telegram/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_token: botToken }),
      });
      const metaData = await metaRes.json();
      if (metaData.ok) {
        setDefaultMetadata(metaData.metadata);
      }
    } catch {
      // handled by MetadataEditor's own fetch
    }

    setIsProbing(true);
    setProbeProgress(null);
    try {
      const res = await fetch("/api/telegram/probe-languages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_token: botToken }),
      });

      if (!res.ok || !res.body) {
        setIsProbing(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.type === "progress") {
              setProbeProgress({
                checked: event.checked,
                total: event.total,
              });
            } else if (event.type === "done") {
              setConfiguredLanguages(event.configuredLanguages);
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } finally {
      setIsProbing(false);
      setProbeProgress(null);
    }
  }, [
    botToken,
    setDefaultMetadata,
    setConfiguredLanguages,
    setIsProbing,
    setProbeProgress,
  ]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const availableLanguages = ISO_639_1_LANGUAGES.filter(
    (l) => !configuredLanguages.includes(l.code),
  );

  function handleAddLanguage() {
    if (selectedLang) {
      addLanguage(selectedLang);
      setActiveTab(selectedLang);
      setAddDialogOpen(false);
      setSelectedLang("");
    }
  }

  const progressPercent =
    probeProgress && probeProgress.total > 0
      ? Math.round((probeProgress.checked / probeProgress.total) * 100)
      : 0;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      {isProbing && probeProgress && (
        <div className="mb-4 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Scanning languages...
            </span>
            <span className="tabular-nums font-medium">
              {probeProgress.checked} / {probeProgress.total}
            </span>
          </div>
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 items-center gap-4">
        <div className="hide-scrollbar min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
          <TabsList className="inline-flex w-max">
            <TabsTrigger value="default">Default</TabsTrigger>
            {configuredLanguages.map((code) => (
              <TabsTrigger key={code} value={code}>
                {getLanguageName(code)}
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 py-0">
                  {code}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={isProbing} className="shrink-0">
              {isProbing ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Plus className="mr-1 h-3 w-3" />
              )}
              Add Language
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Language</DialogTitle>
              <DialogDescription>
                Select a language to add a new localization.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={selectedLang} onValueChange={setSelectedLang}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name} ({lang.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddLanguage}
                disabled={!selectedLang}
                className="w-full"
              >
                Add
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4">
        <TabsContent value="default">
          <MetadataEditor languageCode={null} />
        </TabsContent>
        {configuredLanguages.map((code) => (
          <TabsContent key={code} value={code}>
            <MetadataEditor languageCode={code} />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
