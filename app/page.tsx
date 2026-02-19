"use client";

import { AppProvider, useApp } from "@/components/app-provider";
import { TokenForm } from "@/components/token-form";
import { BotInfoCard } from "@/components/bot-info-card";
import { LanguageTabs } from "@/components/language-tabs";

function AppContent() {
  const { botInfo } = useApp();

  if (!botInfo) {
    return <TokenForm />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 py-8">
      <BotInfoCard />
      <LanguageTabs />
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
