export default function MenuItemSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="h-56 bg-gray-200"></div>
      
      {/* Content skeleton */}
      <div className="p-6">
        <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded mb-4 w-full"></div>
        <div className="h-4 bg-gray-200 rounded mb-4 w-5/6"></div>
        
        {/* Tags skeleton */}
        <div className="flex gap-2 mb-4">
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
        </div>
        
        {/* Price and button skeleton */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="h-8 bg-gray-200 rounded w-20"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  )
}

