"use client";

import { useApp } from "./app-provider";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

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
            <p className="text-muted-foreground text-sm">@{botInfo.username}</p>
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
