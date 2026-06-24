import { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
}

export default function FadeIn({ 
  children, 
  className = "",
}: FadeInProps) {
  
  return (
    <div className={`${className} animate-fade-in-up`.trim()}>
      {children}
    </div>
  );
}
