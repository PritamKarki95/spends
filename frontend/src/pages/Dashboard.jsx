import { useNavigate, Link } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="p-8">
      <p>Dashboard — coming soon</p>
      <Link to="/upload" className="mt-4 ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
  Upload Statement
</Link>
<Link to="/transactions" className="mt-4 ml-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
  Transactions
</Link>
      <button
        onClick={handleLogout}
        className="mt-4 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
      >
        Log Out
      </button>
    </div>
  )
}

export default Dashboard