"use client";

import { AppProvider, useApp } from "@/components/app-provider";
import { TokenForm } from "@/components/token-form";
import { BotInfoCard } from "@/components/bot-info-card";
import { LanguageTabs } from "@/components/language-tabs";
import { Footer } from "@/components/footer";
import Image from "next/image";

function AppContent() {
  const { botInfo } = useApp();

  if (!botInfo) {
    return <TokenForm />;
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col p-4">
      <div className="space-y-4">
        <div className="flex items-center">
          <Image src="/logo-head.png" alt="Logo" width={64} height={64} />
          <h1 className="text-xl font-medium">
            Telegram Bot Manager
          </h1>
        </div>
        <BotInfoCard />
        <LanguageTabs />
      </div>
      <div className="mt-auto">
        <Footer />
      </div>
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
