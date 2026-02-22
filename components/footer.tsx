import { Github } from "lucide-react";
import { Copyright } from "./copyright";
import { XIcon } from "./x-icon";

export function Footer() {
  return (
    <footer className="pt-8 text-center text-sm text-muted-foreground space-y-2">
      <p>
        <Copyright baseYear={2026} name="Telegram Bot Manager" />
      </p>
      <p className="flex items-center justify-center gap-2">
        <span>Created by Sergey Atroshchenko</span>
        <a
          href="https://github.com/kapxapot"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground/60 hover:text-primary transition-colors"
          aria-label="GitHub"
        >
          <Github className="size-4" />
        </a>
        <a
          href="https://x.com/kapxapot"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground/60 hover:text-primary transition-colors"
          aria-label="X (Twitter)"
        >
          <XIcon className="size-4" />
        </a>
      </p>
    </footer>
  );
}
