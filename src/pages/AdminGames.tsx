import { useState, useEffect } from 'react'
import { supabase, Game, Player } from '../lib/supabase'
import { generateResultsPDF } from '../lib/generatePDF'

interface GameWithPlayers extends Game {
  players: Player[]
}

export default function AdminGames() {
  const [games, setGames] = useState<GameWithPlayers[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGames()
  }, [])

  const loadGames = async () => {
    setLoading(true)
    
    // Fetch all games with their players
    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        players (*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading games:', error)
    } else {
      setGames(data || [])
    }
    
    setLoading(false)
  }

  const handleDownload = (game: GameWithPlayers) => {
    if (game.players.length === 0) {
      alert('Ingen spillere i dette spil')
      return
    }
    generateResultsPDF(game.players, game.code)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('da-DK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTopScore = (players: Player[]) => {
    if (players.length === 0) return 0
    return Math.max(...players.map(p => p.score))
  }

  const getWinner = (players: Player[]) => {
    if (players.length === 0) return null
    return [...players].sort((a, b) => b.score - a.score)[0]
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-retro text-4xl md:text-5xl neon-text-pink mb-4">
            SPIL OVERSIGT
          </h1>
          <p className="font-arcade text-neon-cyan">
            Alle quiz spil
          </p>
        </div>

        {/* Back link */}
        <div className="mb-6">
          <a 
            href="/" 
            className="font-arcade text-neon-cyan hover:text-neon-pink transition-colors"
          >
            ← Tilbage til start
          </a>
        </div>

        {/* Refresh button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={loadGames}
            className="retro-btn text-sm px-4 py-2"
            disabled={loading}
          >
            {loading ? 'Indlæser...' : '🔄 Opdater'}
          </button>
        </div>

        {/* Games list */}
        {loading ? (
          <div className="text-center">
            <p className="font-arcade text-xl text-neon-cyan pulse">Indlæser spil...</p>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center p-8 bg-arcade-purple/50 rounded-lg neon-border">
            <p className="font-arcade text-xl text-gray-400">
              Ingen spil fundet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {games.map((game) => {
              const winner = getWinner(game.players)
              return (
                <div
                  key={game.id}
                  className="bg-arcade-purple/50 rounded-lg neon-border p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Game info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="font-retro text-2xl neon-text-yellow">
                          {game.code}
                        </span>
                        <span className="font-arcade text-sm text-gray-400">
                          {formatDate(game.created_at)}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="font-arcade text-neon-cyan">
                          👥 {game.players.length} spillere
                        </span>
                        {game.players.length > 0 && (
                          <>
                            <span className="font-arcade text-neon-green">
                              🏆 Top: {getTopScore(game.players).toLocaleString()} point
                            </span>
                            {winner && (
                              <span className="font-arcade text-neon-yellow">
                                Vinder: {winner.name}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDownload(game)}
                        disabled={game.players.length === 0}
                        className={`retro-btn text-sm px-4 py-2 ${
                          game.players.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        📄 Download PDF
                      </button>
                    </div>
                  </div>

                  {/* Player preview */}
                  {game.players.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <p className="font-arcade text-xs text-gray-400 mb-2">Spillere:</p>
                      <div className="flex flex-wrap gap-2">
                        {[...game.players]
                          .sort((a, b) => b.score - a.score)
                          .slice(0, 8)
                          .map((player, idx) => (
                            <div
                              key={player.id}
                              className="flex items-center gap-2 bg-arcade-dark/50 rounded px-2 py-1"
                            >
                              <div className="w-6 h-6 rounded overflow-hidden bg-white">
                                {player.portrait ? (
                                  <img 
                                    src={player.portrait} 
                                    alt={player.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">?</div>
                                )}
                              </div>
                              <span className={`font-arcade text-xs ${
                                idx === 0 ? 'text-neon-yellow' : 'text-white'
                              }`}>
                                {player.name}
                              </span>
                              <span className="font-arcade text-xs text-gray-400">
                                {player.score}
                              </span>
                            </div>
                          ))}
                        {game.players.length > 8 && (
                          <span className="font-arcade text-xs text-gray-400 px-2 py-1">
                            +{game.players.length - 8} mere
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 p-6 bg-arcade-purple/30 rounded-lg border border-gray-700">
          <h3 className="font-arcade text-lg text-neon-cyan mb-4">Statistik</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="font-retro text-3xl neon-text-yellow">{games.length}</p>
              <p className="font-arcade text-xs text-gray-400">Spil i alt</p>
            </div>
            <div className="text-center">
              <p className="font-retro text-3xl neon-text-green">
                {games.reduce((sum, g) => sum + g.players.length, 0)}
              </p>
              <p className="font-arcade text-xs text-gray-400">Spillere i alt</p>
            </div>
            <div className="text-center">
              <p className="font-retro text-3xl neon-text-cyan">
                {games.filter(g => g.players.length > 0).length}
              </p>
              <p className="font-arcade text-xs text-gray-400">Spil med deltagere</p>
            </div>
            <div className="text-center">
              <p className="font-retro text-3xl neon-text-pink">
                {games.length > 0 
                  ? Math.round(games.reduce((sum, g) => sum + g.players.length, 0) / games.length * 10) / 10
                  : 0}
              </p>
              <p className="font-arcade text-xs text-gray-400">Gns. spillere/spil</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
