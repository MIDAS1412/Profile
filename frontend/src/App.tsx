import { Route, Routes } from 'react-router-dom'
import { MapPage } from './pages/MapPage'
import { ProfilePage } from './pages/ProfilePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ProfilePage />} />
      <Route path="/map" element={<MapPage />} />
    </Routes>
  )
}
