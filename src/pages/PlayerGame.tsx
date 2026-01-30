import { useParams } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { useGameState } from '../hooks/useGameState'
import { supabase } from '../lib/supabase'
import { 
  getQuestionForIndex, 
  getRoundForQuestion,
  QUESTIONS_PER_ROUND 
} from '../lib/questions'

const QUESTION_TIME = 20

export default function PlayerGame() {
  const { gameId, playerId } = useParams<{ gameId: string; playerId: string }>()
  const { gameState, players } = useGameState(gameId)
  
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [pointsEarned, setPointsEarned] = useState(0)

  const currentQuestion = gameState ? getQuestionForIndex(gameState.current_question) : null
  const currentRound = gameState ? getRoundForQuestion(gameState.current_question) : 1
  const currentPlayer = players.find((p) => p.id === playerId)

  // Reset state when question changes
  useEffect(() => {
    if (gameState?.phase === 'question') {
      setSelectedAnswer(null)
      setHasAnswered(false)
      setIsCorrect(null)
      setPointsEarned(0)
    }
  }, [gameState?.current_question, gameState?.phase])

  const handleAnswer = useCallback(async (answer: string) => {
    if (hasAnswered || !gameState || !gameId || !playerId || !currentQuestion) return

    setSelectedAnswer(answer)
    setHasAnswered(true)

    const isAnswerCorrect = answer === currentQuestion.correct
    setIsCorrect(isAnswerCorrect)

    // Calculate points based on speed
    let points = 0
    if (isAnswerCorrect && gameState.question_started_at) {
      const startTime = new Date(gameState.question_started_at).getTime()
      const answerTime = Date.now()
      const timeTaken = (answerTime - startTime) / 1000
      const timeRemaining = Math.max(0, QUESTION_TIME - timeTaken)
      
      // Base 1000 + up to 500 speed bonus
      points = Math.floor(1000 + (500 * (timeRemaining / QUESTION_TIME)))
    }
    setPointsEarned(points)

    // Save answer to database
    await supabase.from('answers').insert({
      game_id: gameId,
      player_id: playerId,
      question_index: gameState.current_question,
      answer,
      is_correct: isAnswerCorrect,
      points_earned: points
    })

    // Update player score
    if (points > 0 && currentPlayer) {
      await supabase
        .from('players')
        .update({ score: currentPlayer.score + points })
        .eq('id', playerId)
    }
  }, [hasAnswered, gameState, gameId, playerId, currentQuestion, currentPlayer])

  // Loading state
  if (!gameState || !currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="font-arcade text-xl text-neon-cyan pulse">Indlæser...</p>
      </div>
    )
  }

  // Waiting in lobby
  if (gameState.phase === 'lobby') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <h2 className="font-retro text-2xl text-center neon-text-pink mb-4">
          QUIZ AFTEN!
        </h2>
        <p className="font-arcade text-xl text-white mb-2">
          Hej <span className="text-neon-yellow">{currentPlayer.name}</span>!
        </p>
        <p className="font-arcade text-lg text-neon-cyan pulse">
          Venter på at quizzen starter...
        </p>
        
        <div className="mt-8 p-4 bg-arcade-purple/50 rounded-lg neon-border">
          <p className="font-arcade text-sm text-gray-400">Din score</p>
          <p className="font-retro text-3xl neon-text-yellow">
            {currentPlayer.score}
          </p>
        </div>
      </div>
    )
  }

  // Scoreboard phase
  if (gameState.phase === 'scoreboard') {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
    const rank = sortedPlayers.findIndex((p) => p.id === playerId) + 1

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <h2 className="font-retro text-2xl text-center neon-text-pink mb-4">
          RUNDE {currentRound} SLUT
        </h2>
        
        <div className="text-center mb-6">
          <p className="font-arcade text-lg text-white">Du er nummer</p>
          <p className="font-retro text-6xl neon-text-yellow">#{rank}</p>
          <p className="font-arcade text-lg text-gray-400">
            af {players.length} spillere
          </p>
        </div>

        <div className="p-6 bg-arcade-purple/50 rounded-lg neon-border">
          <p className="font-arcade text-sm text-gray-400 mb-1">Total score</p>
          <p className="font-retro text-4xl neon-text-green">
            {currentPlayer.score.toLocaleString()}
          </p>
        </div>

        <p className="font-arcade text-lg text-neon-cyan mt-8 pulse">
          Venter på næste runde...
        </p>
      </div>
    )
  }

  // Question phase (or reveal)
  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="font-arcade text-sm text-gray-400">
          Runde {currentRound}
        </div>
        <div className="font-arcade text-sm text-neon-green">
          Score: {currentPlayer.score}
        </div>
      </div>

      {/* Question number */}
      <div className="text-center mb-4">
        <span className="font-arcade text-sm text-neon-cyan">
          Spørgsmål {(gameState.current_question % QUESTIONS_PER_ROUND) + 1}
        </span>
      </div>

      {/* Question */}
      {currentQuestion && (
        <div className="flex-1 flex flex-col">
          {/* Question Image */}
          {currentQuestion.image && (
            <div className="mb-4 flex justify-center">
              <img 
                src={currentQuestion.image} 
                alt="Spørgsmålsbillede"
                className="w-full max-w-xs h-auto max-h-40 object-contain rounded-lg border-2 border-neon-cyan"
              />
            </div>
          )}

          <h2 className="font-arcade text-xl text-center text-white mb-6">
            {currentQuestion.question}
          </h2>

          {/* Answer buttons */}
          <div className="flex-1 grid grid-cols-1 gap-3">
            {(['A', 'B', 'C', 'D'] as const).map((letter, idx) => {
              const isSelected = selectedAnswer === letter
              const isThisCorrect = currentQuestion.correct === letter
              const showResult = gameState.phase === 'reveal'

              let btnClass = 'answer-btn'
              if (isSelected) btnClass += ' selected'
              if (showResult && isThisCorrect) btnClass += ' correct'
              if (showResult && isSelected && !isThisCorrect) btnClass += ' incorrect'

              return (
                <button
                  key={letter}
                  onClick={() => handleAnswer(letter)}
                  disabled={hasAnswered || gameState.phase === 'reveal'}
                  className={btnClass}
                >
                  <span className="font-retro text-2xl text-neon-cyan mr-3">
                    {letter}
                  </span>
                  <span className="font-arcade">
                    {currentQuestion.options[idx]}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Feedback */}
          {hasAnswered && gameState.phase === 'question' && (
            <div className="mt-4 text-center p-4 bg-arcade-purple/50 rounded-lg">
              <p className="font-arcade text-lg text-neon-cyan pulse">
                Svar modtaget! Venter på afsløring...
              </p>
            </div>
          )}

          {gameState.phase === 'reveal' && (
            <div className={`mt-4 text-center p-4 rounded-lg ${
              isCorrect ? 'bg-green-900/50 neon-border' : 'bg-red-900/50 border-2 border-red-500'
            }`}>
              <p className={`font-retro text-3xl ${isCorrect ? 'neon-text-green' : 'text-red-500'}`}>
                {isCorrect ? 'RIGTIGT!' : 'FORKERT!'}
              </p>
              {isCorrect && (
                <p className="font-arcade text-xl text-neon-yellow mt-2">
                  +{pointsEarned} point
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
