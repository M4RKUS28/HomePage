'use client';

export default function ContactError({
  error,
  reset,
}) {
  return (
    <div className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="text-6xl mb-6">📧</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Contact Form Error
          </h1>
          <p className="text-gray-600 mb-8">
            There was a problem loading the contact form. This might be due to a 
            temporary server issue or network connection problem.
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-left max-w-md mx-auto">
            <h3 className="font-semibold text-red-800 mb-2">Error Details:</h3>
            <p className="text-red-700 text-sm">
              {error?.message || 'Unknown error occurred'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Retry Contact Form
            </button>
            <a
              href="mailto:hello@m4rkus.dev"
              className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-block"
            >
              Email Directly
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
