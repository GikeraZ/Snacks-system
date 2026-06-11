export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
        <a href="/" className="text-primary-600 hover:text-primary-500 font-medium">
          Go to Home
        </a>
      </div>
    </div>
  )
}
