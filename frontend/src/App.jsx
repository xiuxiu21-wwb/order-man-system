import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login.jsx'
import ElderDashboard from './pages/ElderDashboard.jsx'
import FamilyDashboard from './pages/FamilyDashboard.jsx'
import MapView from './pages/MapView.jsx'
import MedicationReminder from './pages/MedicationReminder.jsx'
import VoiceAssistant from './pages/VoiceAssistant.jsx'
import AlertCenter from './pages/AlertCenter.jsx'
import ImageRecognition from './pages/ImageRecognition.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Login />} />
        
        <Route path="/elder" element={<ElderDashboard />} />
        <Route path="/elder/map" element={<MapView />} />
        <Route path="/elder/medication" element={<MedicationReminder />} />
        <Route path="/elder/voice" element={<VoiceAssistant />} />
        <Route path="/elder/image-recognition" element={<ImageRecognition />} />
        <Route path="/elder/alerts" element={<AlertCenter />} />
        
        <Route path="/family" element={<FamilyDashboard />} />
        <Route path="/family/map" element={<MapView />} />
        <Route path="/family/alerts" element={<AlertCenter />} />
        
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </div>
  )
}

export default App
