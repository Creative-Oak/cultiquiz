import { Routes, Route } from 'react-router-dom'
import HostLobby from './pages/HostLobby'
import HostGame from './pages/HostGame'
import PlayerJoin from './pages/PlayerJoin'
import PlayerGame from './pages/PlayerGame'
import AdminGames from './pages/AdminGames'

function App() {
  return (
    <div className="min-h-screen scanlines">
      <Routes>
        <Route path="/" element={<HostLobby />} />
        <Route path="/admin" element={<AdminGames />} />
        <Route path="/host/:gameId" element={<HostGame />} />
        <Route path="/play/:code" element={<PlayerJoin />} />
        <Route path="/game/:gameId/:playerId" element={<PlayerGame />} />
      </Routes>
    </div>
  )
}

export default App
