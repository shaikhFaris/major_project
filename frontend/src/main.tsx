import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import App from './App'
import './index.css'

// Register Chart.js components once
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler)

// Chart.js global theme: Geist Mono ticks, zinc grid, dark tooltip (matches cockpit palette)
ChartJS.defaults.font.family = "'Geist Mono Variable', ui-monospace, monospace"
ChartJS.defaults.font.size = 11
ChartJS.defaults.color = '#a1a1aa'
ChartJS.defaults.borderColor = 'rgba(255,255,255,0.04)'
ChartJS.defaults.plugins.tooltip.backgroundColor = '#18181b'
ChartJS.defaults.plugins.tooltip.borderColor = '#27272a'
ChartJS.defaults.plugins.tooltip.borderWidth = 1
ChartJS.defaults.plugins.tooltip.titleColor = '#f4f4f5'
ChartJS.defaults.plugins.tooltip.bodyColor = '#d4d4d8'
ChartJS.defaults.plugins.tooltip.padding = 10

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
