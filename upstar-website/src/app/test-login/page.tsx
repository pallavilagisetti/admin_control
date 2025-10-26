export default function TestLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Test Login Page</h1>
          <p className="text-gray-400">This is a test page to check if the server is working.</p>
          <div className="mt-8">
            <a 
              href="/login" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
            >
              Go to Real Login Page
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
