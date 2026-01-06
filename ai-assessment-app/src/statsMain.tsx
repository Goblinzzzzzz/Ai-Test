import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Statistics from './pages/Statistics'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Statistics />
  </StrictMode>,
)
