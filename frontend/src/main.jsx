import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

const savedTheme = localStorage.getItem('theme')
document.documentElement.classList.toggle(
  'dark',
  savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches,
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
