import { Routes, Route } from 'react-router-dom'
import SelecionarDispositivo from './pages/SelecionarDispositivo'
import ProximaEtapa from './pages/ProximaEtapa'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SelecionarDispositivo />} />
      <Route path="/solicitacao" element={<ProximaEtapa />} />
    </Routes>
  )
}