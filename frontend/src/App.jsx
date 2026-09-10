import { Routes, Route } from 'react-router-dom'
import Landing from './pages/landing'
import Login from './pages/login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import UploadStatement from './pages/UploadStatement'
import Transactions from './pages/Transactions'
import MonthlyComparison from './pages/MonthlyComparison'
import Subscriptions from './pages/Subscriptions'
import About from './pages/About'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/subscriptions"
        element={
          <ProtectedRoute>
            <Subscriptions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <UploadStatement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        }
      />
      <Route
  path="/comparison"
  element={
    <ProtectedRoute>
      <MonthlyComparison />
    </ProtectedRoute>
  }
/>
<Route path="/about" element={<About />} />

    </Routes>
  )
}

export default App
