"use client";

import { useState } from "react";
import { useApp } from "./app-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface FieldErrors {
  bot_token?: string;
  openai_api_key?: string;
}

export function TokenForm() {
  const { connect } = useApp();
  const [token, setToken] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/telegram/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_token: token.trim() }),
      });

      const data = await res.json();

      if (!data.ok) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        } else {
          setError(data.error ?? "Validation failed");
        }
        return;
      }

      connect(token.trim(), openaiKey.trim() || null, data.bot);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Telegram Bot Manager</CardTitle>
          <CardDescription>
            Connect your Telegram bot to manage its metadata, localizations, and
            translations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bot-token">Bot Token</Label>
              <Input
                id="bot-token"
                type="password"
                placeholder="123456789:ABCdefGHI..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                autoFocus
              />
              {fieldErrors.bot_token && (
                <p className="text-destructive text-sm">
                  {fieldErrors.bot_token}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="openai-key">
                OpenAI API Key{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="openai-key"
                type="password"
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
              />
              {fieldErrors.openai_api_key ? (
                <p className="text-destructive text-sm">
                  {fieldErrors.openai_api_key}
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Required only for AI-powered translations.
                </p>
              )}
            </div>

            {error && (
              <p className="text-destructive text-sm">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
