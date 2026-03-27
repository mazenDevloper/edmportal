"use client";

import { cn } from "@/lib/utils";
import type { LucideProps } from "lucide-react";
import { Plus, Sparkles, X, Music, Info } from "lucide-react";

type IconProps = LucideProps & {
  wrapperClassName?: string;
};

const IconWrapper = ({
  children,
  className,
  wrapperClassName,
}: {
  children: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
}) => (
  <div
    className={cn(
      "flex items-center justify-center rounded-full bg-accent/10 p-2 backdrop-blur-sm transition-colors duration-300 hover:bg-accent/20",
      wrapperClassName
    )}
  >
    {children}
  </div>
);

const GlassIcon = (IconComponent: React.ComponentType<LucideProps>) => {
  const Component = ({ className, wrapperClassName, ...props }: IconProps) => (
    <IconWrapper wrapperClassName={wrapperClassName}>
      <IconComponent
        className={cn("size-5 text-accent drop-shadow-[0_0_5px_hsl(var(--accent))]", className)}
        strokeWidth={2}
        {...props}
      />
    </IconWrapper>
  );
  Component.displayName = `GlassIcon(${IconComponent.displayName || IconComponent.name})`;
  return Component;
};


export const GlassPlusIcon = GlassIcon(Plus);
export const GlassSparklesIcon = GlassIcon(Sparkles);
export const GlassXIcon = GlassIcon(X);
export const GlassMusicIcon = GlassIcon(Music);
export const GlassInfoIcon = GlassIcon(Info);
