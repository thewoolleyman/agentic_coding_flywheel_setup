"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Apple, Monitor } from "lucide-react";
import { Card } from "@/components";
import { cn } from "@/lib/utils";
import { markStepComplete } from "@/lib/wizardSteps";
import {
  getUserOS,
  setUserOS,
  detectOS,
  type OperatingSystem,
} from "@/lib/userPreferences";

interface OSCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

function OSCard({ icon, title, description, selected, onClick }: OSCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer p-6 transition-all hover:border-primary/50 hover:shadow-md",
        selected && "border-primary bg-primary/5 ring-2 ring-primary"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-pressed={selected}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl",
            selected ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  );
}

export default function OSSelectionPage() {
  const router = useRouter();
  const [selectedOS, setSelectedOS] = useState<OperatingSystem | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Load stored OS on mount
  useEffect(() => {
    const stored = getUserOS();
    if (stored) {
      setSelectedOS(stored);
    } else {
      // Auto-detect if not previously selected
      const detected = detectOS();
      if (detected) {
        setSelectedOS(detected);
      }
    }
  }, []);

  const handleSelectOS = useCallback(
    (os: OperatingSystem) => {
      setSelectedOS(os);
      setUserOS(os);
      markStepComplete(1);
      setIsNavigating(true);

      // Navigate to next step after brief delay for visual feedback
      setTimeout(() => {
        router.push("/wizard/install-terminal");
      }, 300);
    },
    [router]
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          What computer are you using?
        </h1>
        <p className="text-lg text-muted-foreground">
          This helps us show you the right commands and instructions.
        </p>
      </div>

      {/* OS Options */}
      <div className="grid gap-4 sm:grid-cols-2">
        <OSCard
          icon={<Apple className="h-7 w-7" />}
          title="Mac"
          description="macOS, MacBook, iMac, Mac Mini, Mac Studio"
          selected={selectedOS === "mac"}
          onClick={() => handleSelectOS("mac")}
        />
        <OSCard
          icon={<Monitor className="h-7 w-7" />}
          title="Windows"
          description="Windows 10, Windows 11"
          selected={selectedOS === "windows"}
          onClick={() => handleSelectOS("windows")}
        />
      </div>

      {/* Navigation hint */}
      {isNavigating && (
        <p className="text-center text-sm text-muted-foreground animate-pulse">
          Loading next step...
        </p>
      )}
    </div>
  );
}
