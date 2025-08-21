export default function PortfolioLoading() {
  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="text-center mb-16">
          <div className="h-12 bg-gray-200 rounded-lg mb-6 max-w-md mx-auto animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded-lg max-w-2xl mx-auto animate-pulse"></div>
        </div>

        {/* Filter Buttons Skeleton */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-20 bg-gray-200 rounded-full animate-pulse"></div>
          ))}
        </div>

        {/* Projects Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="h-48 bg-gray-200 animate-pulse"></div>
              <div className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded mb-4 w-3/4 animate-pulse"></div>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
