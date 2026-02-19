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
    addLanguage,
    isProbing,
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
    try {
      const probeRes = await fetch("/api/telegram/probe-languages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_token: botToken }),
      });
      const probeData = await probeRes.json();
      if (probeData.ok) {
        setConfiguredLanguages(probeData.configuredLanguages);
      }
    } finally {
      setIsProbing(false);
    }
  }, [botToken, setDefaultMetadata, setConfiguredLanguages, setIsProbing]);

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

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
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
