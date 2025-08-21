import { Suspense } from 'react';

// Simulate slow data fetching
async function SlowData() {
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h3 className="font-semibold text-green-800 mb-2">Data Loaded!</h3>
      <p className="text-green-700">This content took 2 seconds to load.</p>
    </div>
  );
}

// Component that might error
function ErrorProneComponent({ shouldError }) {
  if (shouldError) {
    throw new Error('This is a demo error to show error boundaries!');
  }
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="font-semibold text-blue-800 mb-2">Success!</h3>
      <p className="text-blue-700">This component rendered without errors.</p>
    </div>
  );
}

export default function Demo({ searchParams }) {
  const showError = searchParams?.error === 'true';
  
  return (
    <div className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Loading & Error Demo
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Slow Loading Data</h2>
            <Suspense fallback={
              <div className="animate-pulse bg-gray-200 rounded-lg p-4">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            }>
              <SlowData />
            </Suspense>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-4">Error Handling</h2>
            <div className="space-y-4">
              <ErrorProneComponent shouldError={showError} />
              
              <div className="flex gap-2">
                <a
                  href="/demo"
                  className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                >
                  Normal
                </a>
                <a
                  href="/demo?error=true"
                  className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                >
                  Trigger Error
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">How to Test:</h3>
          <ul className="space-y-2 text-gray-700">
            <li>• Refresh the page to see loading states</li>
            <li>• Click "Trigger Error" to see error boundary</li>
            <li>• Navigate between pages to see route loading</li>
            <li>• Try visiting /nonexistent to see 404 page</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
