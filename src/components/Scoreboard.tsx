import { Player } from '../lib/supabase'
import { generateResultsPDF } from '../lib/generatePDF'

interface ScoreboardProps {
  players: Player[]
  round: number
  isFinal?: boolean
}

export default function Scoreboard({ players, round, isFinal = false }: ScoreboardProps) {
  // Get top 5 players for display
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
  const topPlayers = sortedPlayers.slice(0, 5)

  const handleDownloadPDF = () => {
    generateResultsPDF(players)
  }

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0: return 'neon-text-yellow'
      case 1: return 'text-gray-300'
      case 2: return 'text-amber-600'
      default: return 'text-white'
    }
  }

  const winner = topPlayers[0]

  return (
    <div className="w-full max-w-6xl mx-auto p-8">
      <h2 className="font-retro text-4xl text-center mb-6 neon-text-pink">
        {isFinal ? 'ENDELIG SCORE' : `RUNDE ${round} SLUT`}
      </h2>

      {/* Final scoreboard: Winner left, others right */}
      {isFinal && winner ? (
        <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center">
          {/* Winner - Large on left */}
          <div className="flex flex-col items-center">
            <p className="font-arcade text-3xl text-neon-yellow mb-6">🏆 VINDEREN 🏆</p>
            <div className="w-72 h-72 rounded-xl overflow-hidden bg-white border-4 border-neon-yellow shadow-lg shadow-yellow-500/50 mb-6">
              {winner.portrait ? (
                <img 
                  src={winner.portrait} 
                  alt={winner.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-8xl">
                  ?
                </div>
              )}
            </div>
            <p className="font-arcade text-4xl neon-text-yellow">{winner.name}</p>
            <p className="font-retro text-3xl text-neon-green mt-2">{winner.score.toLocaleString()} point</p>
            
            {/* Download PDF button */}
            <button
              onClick={handleDownloadPDF}
              className="mt-6 retro-btn text-sm px-6 py-3"
            >
              📄 Download PDF
            </button>
          </div>

          {/* Runner ups - Right side */}
          <div className="flex-1 max-w-md">
            <p className="font-arcade text-xl text-center mb-4 text-neon-cyan">
              Top 5
            </p>
            <div className="space-y-3">
              {topPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className={`scoreboard-entry flex items-center gap-3 p-3 bg-arcade-purple/50 rounded-lg ${index === 0 ? 'neon-border' : 'border border-gray-700'}`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className={`font-retro text-2xl w-10 ${getMedalColor(index)}`}>
                    #{index + 1}
                  </div>
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border-2 border-gray-600">
                    {player.portrait ? (
                      <img src={player.portrait} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">?</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-arcade text-lg text-white truncate">{player.name}</p>
                  </div>
                  <div className={`font-retro text-xl ${getMedalColor(index)}`}>
                    {player.score.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="font-arcade text-xl text-center mb-8 text-neon-cyan">
            Top 5 Spillere
          </p>
          <div className="space-y-4">
            {topPlayers.map((player, index) => (
              <div
                key={player.id}
                className="scoreboard-entry flex items-center gap-4 p-4 bg-arcade-purple/50 rounded-lg neon-border"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className={`font-retro text-4xl w-12 ${getMedalColor(index)}`}>
                  #{index + 1}
                </div>
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border-2 border-gray-600">
                  {player.portrait ? (
                    <img src={player.portrait} alt={player.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">?</div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-arcade text-2xl text-white truncate">{player.name}</p>
                </div>
                <div className={`font-retro text-3xl ${getMedalColor(index)}`}>
                  {player.score.toLocaleString()}
                </div>
              </div>
            ))}
            {topPlayers.length === 0 && (
              <p className="text-center font-arcade text-xl text-gray-400">
                Ingen spillere endnu...
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
