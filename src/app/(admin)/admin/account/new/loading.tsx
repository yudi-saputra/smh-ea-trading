import { FormSkeleton } from "@/components/skeletons/page-skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminNewTerminalLoading() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Skeleton className="h-4 w-full" />
      <FormSkeleton />
    </div>
  )
}
