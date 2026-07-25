import Image from "next/image";
import { cn } from "@/lib/utils";

export function SmhLogo({
  size = 32,
  className,
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/logo_smh.png"
      alt="SMH"
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0 rounded-full object-cover object-center", className)}
    />
  );
}
