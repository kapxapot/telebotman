"use client";

import { useApp } from "./app-provider";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, LogOut } from "lucide-react";

export function BotInfoCard() {
  const { botInfo, disconnect } = useApp();

  if (!botInfo) return null;

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{botInfo.first_name}</h2>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Connected
              </Badge>
            </div>
            <span className="inline-flex items-center gap-1">
              <a
                href={`https://t.me/${botInfo.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 underline-offset-2 hover:underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                @{botInfo.username}
              </a>
              <ExternalLink className="size-4 text-muted-foreground" />
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={disconnect}>
          <LogOut className="size-4" />
          Disconnect
        </Button>
      </CardContent>
    </Card>
  );
}
