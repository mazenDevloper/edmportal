"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "./ui/button";
import { Play, Pause, Rewind, FastForward } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const WelcomeContent = () => {
  const bgImage = PlaceHolderImages.find(img => img.id === '360-background');

  return (
    <div className="flex h-full flex-col items-center justify-center text-center text-white/90">
      <h3 className="mb-2 text-2xl font-bold text-white">Welcome to Immersion Canvas</h3>
      <p className="max-w-xs text-sm text-white/70">
        This is a spatial computing environment. Add new windows using the controls below.
        Drag windows by their headers to move them around in 3D space.
      </p>
      {bgImage && (
        <div className="mt-4 aspect-video w-4/5 overflow-hidden rounded-lg border border-accent/20">
          <Image
            src={bgImage.imageUrl}
            alt={bgImage.description}
            width={4096}
            height={2048}
            className="h-full w-full object-cover"
            data-ai-hint={bgImage.imageHint}
          />
        </div>
      )}
    </div>
  );
};

export const MusicPlayerContent = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center text-white">
      <div className="mb-4 text-center">
        <p className="text-lg font-semibold">Ambient Flow</p>
        <p className="text-sm text-white/70">Immersion System</p>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
          <Rewind className="size-6" />
        </Button>
        <Button variant="ghost" size="icon" className="h-14 w-14 rounded-full bg-accent/80 text-accent-foreground hover:bg-accent">
          <Play className="size-8" />
        </Button>
        <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
          <FastForward className="size-6" />
        </Button>
      </div>
    </div>
  );
};

export const AIHelperContent = ({ onRunAI }: { onRunAI: (task: string) => void }) => {
    const [task, setTask] = useState("");
    const { toast } = useToast();

    const handleOrganize = () => {
        if (!task.trim()) {
            toast({
                variant: "destructive",
                title: "Task Description Required",
                description: "Please describe your current task before organizing.",
            });
            return;
        }
        onRunAI(task);
    }
    
    return (
        <div className="flex h-full flex-col justify-between p-4 text-white">
            <div>
                <h3 className="text-lg font-semibold text-white">AI Spatial Assistant</h3>
                <p className="mt-1 text-sm text-white/70">
                    Describe your current task, and the AI will suggest an optimal layout for your windows.
                </p>
            </div>
            <div className="flex flex-col gap-3">
                <textarea
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    placeholder="e.g., 'Writing code and referencing documentation...'"
                    className="w-full rounded-md border-accent/30 bg-background/50 p-2 text-sm text-white placeholder-white/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50"
                    rows={3}
                />
                <Button onClick={handleOrganize} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    Organize Workspace
                </Button>
            </div>
        </div>
    );
};
