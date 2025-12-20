"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Check } from "lucide-react";
import { Button, Card, CommandCard } from "@/components";
import { markStepComplete } from "@/lib/wizardSteps";
import { getVPSIP } from "@/lib/userPreferences";

export default function ReconnectUbuntuPage() {
  const router = useRouter();
  const [vpsIP, setVpsIP] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const storedIP = getVPSIP();
    if (!storedIP) {
      router.push("/wizard/create-vps");
      return;
    }
    setVpsIP(storedIP);
  }, [router]);

  const handleContinue = useCallback(() => {
    markStepComplete(8);
    setIsNavigating(true);
    router.push("/wizard/status-check");
  }, [router]);

  const handleSkip = useCallback(() => {
    markStepComplete(8);
    setIsNavigating(true);
    router.push("/wizard/status-check");
  }, [router]);

  if (!vpsIP) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sshCommand = `ssh -i ~/.ssh/acfs_ed25519 ubuntu@${vpsIP}`;
  const sshCommandWindows = `ssh -i $HOME\\.ssh\\acfs_ed25519 ubuntu@${vpsIP}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Reconnect as ubuntu
        </h1>
        <p className="text-lg text-muted-foreground">
          If you ran the installer as root, reconnect as the ubuntu user to get
          the full shell experience.
        </p>
      </div>

      {/* Already ubuntu? */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Check className="mt-0.5 h-5 w-5 text-green-500" />
          <div>
            <p className="font-medium">Already connected as ubuntu?</p>
            <p className="text-sm text-muted-foreground">
              If your prompt shows <code>ubuntu@</code>, you can skip this step.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleSkip}
            >
              Skip, I&apos;m already ubuntu
            </Button>
          </div>
        </div>
      </Card>

      {/* Reconnect steps */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">If you connected as root:</h2>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            1. Type <code className="rounded bg-muted px-1">exit</code> to close
            the current session
          </p>
          <CommandCard command="exit" description="Close root session" />
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            2. Reconnect as ubuntu:
          </p>
          <CommandCard
            command={sshCommand}
            windowsCommand={sshCommandWindows}
            description="Reconnect as ubuntu user"
            showCheckbox
            persistKey="reconnect-ubuntu"
          />
        </div>
      </div>

      {/* Verification */}
      <Card className="border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
        <div className="space-y-2">
          <h3 className="font-medium text-green-800 dark:text-green-200">
            You&apos;ll know it worked when:
          </h3>
          <ul className="space-y-1 text-sm text-green-700 dark:text-green-300">
            <li>
              • Your prompt shows <code>ubuntu@</code> (not <code>root@</code>)
            </li>
            <li>• You see the colorful powerlevel10k prompt</li>
            <li>• The shell feels more responsive</li>
          </ul>
        </div>
      </Card>

      {/* Continue button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleContinue} disabled={isNavigating} size="lg">
          {isNavigating ? "Loading..." : "I'm connected as ubuntu"}
        </Button>
      </div>
    </div>
  );
}
