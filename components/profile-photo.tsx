"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Bot, Camera, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useApp } from "./app-provider";

export function ProfilePhoto() {
  const { botToken, profilePhotoUrl, setProfilePhotoUrl } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [fetchedOnce, setFetchedOnce] = useState(false);

  const fetchPhoto = useCallback(async () => {
    if (!botToken) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/telegram/profile-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_token: botToken }),
      });

      if (res.status === 204) {
        setProfilePhotoUrl(null);
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch profile photo");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setProfilePhotoUrl(url);
    } catch {
      setProfilePhotoUrl(null);
    } finally {
      setLoading(false);
      setFetchedOnce(true);
    }
  }, [botToken, setProfilePhotoUrl]);

  useEffect(() => {
    if (botToken && !fetchedOnce) {
      fetchPhoto();
    }
  }, [botToken, fetchedOnce, fetchPhoto]);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!botToken) {
        return;
      }

      setLoading(true);
      try {
        const formData = new FormData();
        formData.append("bot_token", botToken);
        formData.append("photo", file);

        const res = await fetch("/api/telegram/upload-photo", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!data.ok) {
          throw new Error(data.error ?? "Upload failed");
        }

        toast.success("Profile photo updated");
        await fetchPhoto();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to upload photo";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [botToken, fetchPhoto],
  );

  const handleRemove = useCallback(async () => {
    if (!botToken) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/telegram/remove-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_token: botToken }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error ?? "Remove failed");
      }

      setProfilePhotoUrl(null);
      toast.success("Profile photo removed");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to remove photo";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [botToken, setProfilePhotoUrl]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUpload(file);
      }
      e.target.value = "";
    },
    [handleUpload],
  );

  const openFilePicker = useCallback(() => {
    if (!loading) {
      fileInputRef.current?.click();
    }
  }, [loading]);

  return (
    <TooltipProvider>
      <div className="group relative shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={openFilePicker}
              disabled={loading}
              className="relative flex size-16 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-muted transition-colors hover:bg-muted/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none"
            >
              {loading ? (
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              ) : profilePhotoUrl ? (
                <>
                  <Image
                    src={profilePhotoUrl}
                    alt="Bot profile"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="size-6 text-white" />
                  </div>
                </>
              ) : (
                <>
                  <Bot className="size-6 text-muted-foreground" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="size-6 text-white" />
                  </div>
                </>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Change profile photo</TooltipContent>
        </Tooltip>

        {profilePhotoUrl && !loading && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="absolute -right-0.5 -top-0.5 flex size-5 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
              >
                <X className="size-2.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Remove photo</TooltipContent>
          </Tooltip>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </TooltipProvider>
  );
}
