"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { spatialSound } from "@/lib/spatial-sound";

interface Card3DTiltProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glowColor?: "blue" | "gold" | "cyan" | "emerald" | "purple" | "none";
}

export function Card3DTilt({
  children,
  className,
  intensity = 15,
  glowColor = "blue",
  ...props
}: Card3DTiltProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -intensity;
    const rotY = ((x - centerX) / centerX) * intensity;
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(() => {
      if (cardRef.current) {
        cardRef.current.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
        cardRef.current.style.transition = "transform 0.1s ease-out";
      }
      if (glareRef.current) {
        glareRef.current.style.opacity = "0.6";
        glareRef.current.style.background = `radial-gradient(400px circle at ${glareX.toFixed(1)}% ${glareY.toFixed(1)}%, rgba(255, 255, 255, 0.4), transparent 60%)`;
      }
    });
  };

  const handleMouseEnter = () => {
    spatialSound.playHover();
  };

  const handleMouseLeave = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (cardRef.current) {
      cardRef.current.style.transform = "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
      cardRef.current.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
    }
    if (glareRef.current) {
      glareRef.current.style.opacity = "0";
    }
  };

  const glowStyles = {
    blue: "hover:shadow-glow-blue border-blue-200/60 dark:border-blue-500/30",
    gold: "hover:shadow-glow-gold border-amber-200/60 dark:border-amber-500/30",
    cyan: "hover:shadow-glow-cyan border-cyan-200/60 dark:border-cyan-500/30",
    emerald: "hover:shadow-glow-emerald border-emerald-200/60 dark:border-emerald-500/30",
    purple: "hover:shadow-glow-purple border-purple-200/60 dark:border-purple-500/30",
    none: "border-slate-200/60 dark:border-slate-700/60",
  }[glowColor];

  return (
    <div
      style={{ perspective: "1000px" }}
      className="inline-block w-full"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
          transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-white/80 p-5 backdrop-blur-xl transition-all duration-300 dark:bg-slate-900/80 shadow-md",
          glowStyles,
          className
        )}
        {...props}
      >
        {/* Dynamic Specular Glare */}
        <div
          ref={glareRef}
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300"
          style={{ willChange: "opacity, background" }}
        />
        <div style={{ transform: "translateZ(20px)" }} className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
