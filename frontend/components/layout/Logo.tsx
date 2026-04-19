import { cn } from "@/lib/utils";
import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { width: 90, height: 32 },
  md: { width: 115, height: 40 },
  lg: { width: 140, height: 48 },
};

export function Logo({ className, size = "md" }: LogoProps) {
  const { width, height } = sizes[size];
  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src="/Intara-logo.png"
        alt="Intara"
        width={width}
        height={height}
        priority
        className="object-contain"
      />
    </div>
  );
}
