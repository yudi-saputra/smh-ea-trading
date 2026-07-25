import {
  PageHeaderSkeleton,
  TableSkeleton,
} from "@/components/skeletons/page-skeletons"

export default function AdminAccountLoading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton showAction />
      <TableSkeleton rows={6} columns={6} />
    </div>
  )
}
