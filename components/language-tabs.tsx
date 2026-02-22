"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "./app-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MetadataEditor } from "./metadata-editor";
import { LanguageFlag } from "./language-flag";
import { ISO_639_1_LANGUAGES, getLanguageName } from "@/lib/languages";
import type { Language } from "@/lib/languages";

const LanguageRow = memo(function LanguageRow({
  lang,
  selected,
  onSelect,
}: {
  lang: Language;
  selected: boolean;
  onSelect: (code: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(lang.code)}
      className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
        selected ? "bg-accent" : "hover:bg-accent/50"
      }`}
    >
      <LanguageFlag code={lang.code} />
      {lang.name}
      <span className="text-muted-foreground">({lang.code})</span>
    </button>
  );
});

export function LanguageTabs() {
  const {
    botToken,
    configuredLanguages,
    setConfiguredLanguages,
    setDefaultMetadata,
    setLanguageMetadata,
    defaultMetadata,
    setIsProbing,
    setProbeProgress,
    addLanguage,
    isProbing,
    probeProgress,
  } = useApp();

  const [activeTab, setActiveTab] = useState("default");
  const prevLanguagesRef = useRef(configuredLanguages);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [prefillFromDefault, setPrefillFromDefault] = useState(false);

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
              setProbeProgress((prev) =>
                prev && prev.checked >= event.checked
                  ? prev
                  : { checked: event.checked, total: event.total },
              );
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

  useEffect(() => {
    const allTabs = ["default", ...configuredLanguages];
    if (!allTabs.includes(activeTab)) {
      const prevAll = ["default", ...prevLanguagesRef.current];
      const oldIndex = prevAll.indexOf(activeTab);
      const fallback = oldIndex > 0 ? prevAll[oldIndex - 1] : "default";
      setActiveTab(allTabs.includes(fallback) ? fallback : "default");
    }
    prevLanguagesRef.current = configuredLanguages;
  }, [configuredLanguages, activeTab]);

  const availableLanguages = useMemo(
    () => ISO_639_1_LANGUAGES.filter((l) => !configuredLanguages.includes(l.code)),
    [configuredLanguages],
  );

  const query = search.toLowerCase().trim();
  const filteredLanguages = useMemo(
    () =>
      query
        ? availableLanguages.filter(
            (l) =>
              l.name.toLowerCase().includes(query) ||
              l.code.toLowerCase().includes(query),
          )
        : availableLanguages,
    [availableLanguages, query],
  );

  function handleConfirmAdd() {
    if (!selectedCode) return;
    addLanguage(selectedCode);
    if (prefillFromDefault && defaultMetadata) {
      setLanguageMetadata(selectedCode, {
        name: defaultMetadata.name,
        description: defaultMetadata.description,
        short_description: defaultMetadata.short_description,
        commands: defaultMetadata.commands.map((c) => ({ ...c })),
      });
    }
    setActiveTab(selectedCode);
    setAddDialogOpen(false);
    setSearch("");
    setSelectedCode(null);
    setPrefillFromDefault(false);
  }

  const handleRowSelect = useCallback((code: string) => {
    setSelectedCode(code);
  }, []);

  const progressPercent =
    probeProgress && probeProgress.total > 0
      ? Math.round((probeProgress.checked / probeProgress.total) * 100)
      : 0;

  const progressHue = Math.round((progressPercent / 100) * 130);

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
              className="h-full rounded-full"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: `hsl(${progressHue}, 80%, 45%)`,
              }}
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
                <LanguageFlag code={code} />
                {getLanguageName(code)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) { setSearch(""); setSelectedCode(null); setPrefillFromDefault(false); } }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={isProbing} className="shrink-0">
              {isProbing ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Plus className="size-3" />
              )}
              Add Language
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Language</DialogTitle>
              <DialogDescription>
                Search and select a language to add.
              </DialogDescription>
            </DialogHeader>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-3 size-4" />
              <Input
                placeholder="Search languages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            <div className="max-h-64 overflow-y-auto rounded-md border">
              {filteredLanguages.length === 0 ? (
                <p className="text-muted-foreground p-3 text-center text-sm">
                  No languages found.
                </p>
              ) : (
                filteredLanguages.map((lang) => (
                  <LanguageRow
                    key={lang.code}
                    lang={lang}
                    selected={selectedCode === lang.code}
                    onSelect={handleRowSelect}
                  />
                ))
              )}
            </div>
            {defaultMetadata && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="prefill-default"
                  checked={prefillFromDefault}
                  onCheckedChange={(v) => setPrefillFromDefault(v === true)}
                />
                <Label htmlFor="prefill-default" className="text-sm font-normal cursor-pointer">
                  Prefill with default metadata
                </Label>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleConfirmAdd} disabled={!selectedCode}>
                <Plus className="size-4" />
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-2">
        <TabsContent value="default" forceMount className={activeTab !== "default" ? "hidden" : ""}>
          <MetadataEditor languageCode={null} />
        </TabsContent>
        {configuredLanguages.map((code) => (
          <TabsContent key={code} value={code} forceMount className={activeTab !== code ? "hidden" : ""}>
            <MetadataEditor languageCode={code} />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
