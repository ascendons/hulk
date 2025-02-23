import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export const renderSkeleton = () => (
  <div className="flex min-h-screen bg-gray-100">
    {/* Sidebar Skeleton */}
    <div className="w-16 bg-gray-900 h-screen"></div>

    {/* Main Content Skeleton */}
    <div className="flex-1 p-6">
      {/* Header Skeleton */}
      <Skeleton height={40} width={200} className="mb-6" />

      {/* Profile Section Skeleton */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-center justify-between border border-gray-200">
        <div className="flex items-center">
          <Skeleton circle height={48} width={48} className="mr-4" />
          <div>
            <Skeleton width={150} height={20} className="mb-2" />
            <Skeleton width={100} height={16} className="mb-1" />
            <Skeleton width={80} height={16} />
          </div>
        </div>
        <Skeleton width={100} height={40} />
      </div>

      {/* Statistics Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="bg-white p-4 rounded-lg shadow-md text-center border border-gray-200"
          >
            <Skeleton height={40} width={50} className="mx-auto mb-2" />
            <Skeleton width={100} height={20} className="mx-auto" />
          </div>
        ))}
      </div>

      {/* Action Buttons Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} height={50} className="rounded-lg" />
        ))}
      </div>

      {/* Notice Board Skeleton */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <Skeleton height={30} width={150} className="mb-4" />
        <Skeleton count={3} />
      </div>
    </div>
  </div>
);
