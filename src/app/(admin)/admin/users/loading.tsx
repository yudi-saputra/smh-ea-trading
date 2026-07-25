import {
  PageHeaderSkeleton,
  TableSkeleton,
} from "@/components/skeletons/page-skeletons"

export default function AdminUsersLoading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <TableSkeleton rows={8} columns={5} />
    </div>
  )
}
