import { Player } from '../lib/supabase'

interface ScoreboardProps {
  players: Player[]
  round: number
  isFinal?: boolean
}

export default function Scoreboard({ players, round, isFinal = false }: ScoreboardProps) {
  // Get top 5 players
  const topPlayers = [...players]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0: return 'neon-text-yellow'
      case 1: return 'text-gray-300'
      case 2: return 'text-amber-600'
      default: return 'text-white'
    }
  }

  const getDelayClass = (index: number) => {
    return `animation-delay-${index * 200}`
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-8">
      <h2 className="font-retro text-3xl text-center mb-2 neon-text-pink">
        {isFinal ? 'ENDELIG SCORE' : `RUNDE ${round} SLUT`}
      </h2>
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
            {/* Rank */}
            <div className={`font-retro text-4xl w-12 ${getMedalColor(index)}`}>
              #{index + 1}
            </div>

            {/* Portrait */}
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border-2 border-gray-600">
              {player.portrait ? (
                <img 
                  src={player.portrait} 
                  alt={player.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  ?
                </div>
              )}
            </div>

            {/* Name */}
            <div className="flex-1">
              <p className="font-arcade text-2xl text-white truncate">
                {player.name}
              </p>
            </div>

            {/* Score */}
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
    </div>
  )
}
