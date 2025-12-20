"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Button, Card, CommandCard } from "@/components";
import { markStepComplete } from "@/lib/wizardSteps";

const QUICK_CHECKS = [
  {
    command: "cc --version",
    description: "Check Claude Code is installed",
  },
  {
    command: "bun --version",
    description: "Check bun is installed",
  },
  {
    command: "which tmux",
    description: "Check tmux is installed",
  },
];

export default function StatusCheckPage() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleContinue = useCallback(() => {
    markStepComplete(9);
    setIsNavigating(true);
    router.push("/wizard/launch-onboarding");
  }, [router]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          ACFS status check
        </h1>
        <p className="text-lg text-muted-foreground">
          Let&apos;s verify everything installed correctly.
        </p>
      </div>

      {/* Doctor command */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Run the doctor command</h2>
        <p className="text-sm text-muted-foreground">
          This checks all installed tools and reports any issues:
        </p>
        <CommandCard
          command="acfs doctor"
          description="Run ACFS health check"
          showCheckbox
          persistKey="acfs-doctor"
        />
      </div>

      {/* Expected output */}
      <Card className="border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 font-medium text-green-800 dark:text-green-200">
            <CheckCircle className="h-5 w-5" />
            Expected output
          </h3>
          <div className="rounded bg-green-100 p-3 font-mono text-xs text-green-800 dark:bg-green-900/50 dark:text-green-200">
            <p>ACFS Doctor - System Health Check</p>
            <p>================================</p>
            <p className="text-green-600">✔ Shell: zsh with oh-my-zsh</p>
            <p className="text-green-600">✔ Languages: bun, uv, rust, go</p>
            <p className="text-green-600">✔ Tools: tmux, ripgrep, lazygit</p>
            <p className="text-green-600">✔ Agents: claude-code, codex</p>
            <p className="mt-2">All checks passed!</p>
          </div>
        </div>
      </Card>

      {/* Quick spot checks */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick spot checks</h2>
        <p className="text-sm text-muted-foreground">
          Try a few commands to verify key tools:
        </p>
        <div className="space-y-3">
          {QUICK_CHECKS.map((check, i) => (
            <CommandCard
              key={i}
              command={check.command}
              description={check.description}
            />
          ))}
        </div>
      </div>

      {/* Troubleshooting */}
      <Card className="p-4">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="font-medium">Something not working?</p>
            <p className="text-sm text-muted-foreground">
              Try running{" "}
              <code className="rounded bg-muted px-1">source ~/.zshrc</code> to
              reload your shell config, then try the doctor again.
            </p>
          </div>
        </div>
      </Card>

      {/* Continue button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleContinue} disabled={isNavigating} size="lg">
          {isNavigating ? "Loading..." : "Everything looks good!"}
        </Button>
      </div>
    </div>
  );
}
