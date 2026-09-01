import { Link } from 'react-router-dom'

function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-900">SpendS</h1>
      <p className="mt-2 text-gray-600">Smart Spending — understand where your money goes.</p>

      <div className="mt-8 flex gap-4">
        <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Log In
        </Link>
        <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
          Try Demo
        </button>
      </div>
    </div>
  )
}

export default Landing