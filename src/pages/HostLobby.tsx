import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { supabase, Game, Player, Quiz } from '../lib/supabase'

export default function HostLobby() {
  const navigate = useNavigate()
  const { gameId } = useParams<{ gameId: string }>()
  const location = useLocation()
  const quiz = location.state?.quiz as Quiz | undefined
  
  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load game on mount
  useEffect(() => {
    const loadGame = async () => {
      if (!gameId) {
        navigate('/')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('games')
        .select()
        .eq('id', gameId)
        .single()

      if (fetchError || !data) {
        setError('Kunne ikke finde spillet')
        setLoading(false)
        return
      }

      setGame(data)
      setLoading(false)
    }

    loadGame()
  }, [gameId, navigate])

  // Subscribe to players joining
  useEffect(() => {
    if (!game) return

    const channel = supabase
      .channel(`lobby_players_${game.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${game.id}`
        },
        (payload) => {
          setPlayers((prev) => [...prev, payload.new as Player])
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [game])

  const handleStartGame = () => {
    if (!game) return
    navigate(`/host/${game.id}`, { state: { quiz } })
  }

  const joinUrl = game 
    ? `${window.location.origin}/play/${game.code}`
    : ''

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-arcade text-2xl text-neon-cyan pulse">Indlæser...</p>
      </div>
    )
  }

  if (error || !game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <p className="font-arcade text-xl text-red-500">{error || 'Spil ikke fundet'}</p>
        <a href="/" className="retro-btn px-8 py-4">← Tilbage</a>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center">
      {/* Header */}
      <h1 className="font-retro text-4xl md:text-8xl text-center mb-4 neon-text-pink">
        {quiz?.name || 'CULTIQUIZ!!'}
      </h1>
      <p className="font-arcade text-4xl text-neon-cyan mb-8">
        Velkommen til quiz!
      </p>

      {/* Lobby View */}
      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 items-center justify-center">
          {/* QR Code Section */}
          <div className="flex-1 flex flex-col items-center">
            <div className="qr-container mb-4">
              <QRCodeSVG 
                value={joinUrl}
                size={250}
                level="M"
                includeMargin
              />
            </div>
            
            <p className="font-arcade text-2xl text-neon-yellow mb-2">
              Spilkode:
            </p>
            <p className="font-retro text-5xl neon-text-cyan tracking-widest">
              {game.code}
            </p>
            
            <p className="font-arcade text-sm text-gray-400 mt-4 text-center">
              Scan QR-koden eller gå til:<br />
              <span className="text-neon-pink">{joinUrl}</span>
            </p>
          </div>

          {/* Players List */}
          <div className="flex-1 w-full">
            <h2 className="font-retro text-2xl text-center mb-4 neon-text-yellow">
              SPILLERE ({players.length})
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-2">
              {players.map((player) => (
                <div 
                  key={player.id}
                  className="flex flex-col items-center p-3 bg-arcade-purple/50 rounded-lg neon-border"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-white mb-2">
                    {player.portrait ? (
                      <img 
                        src={player.portrait} 
                        alt={player.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                        ?
                      </div>
                    )}
                  </div>
                  <p className="font-arcade text-sm text-white truncate max-w-full">
                    {player.name}
                  </p>
                </div>
              ))}
              
              {players.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <p className="font-arcade text-gray-400 pulse">
                    Venter på spillere...
                  </p>
                </div>
              )}
            </div>

            {/* Start Button */}
            {players.length > 0 && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleStartGame}
                  className="retro-btn-primary text-lg px-8 py-4"
                >
                  Start Quiz! ({players.length} spillere)
                </button>
              </div>
            )}
          </div>
        </div>
    </div>
  )
}
