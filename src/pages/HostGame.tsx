import { useParams, useLocation } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { useGameState } from '../hooks/useGameState'
import { useTimer } from '../hooks/useTimer'
import { supabase, Answer, Quiz, Question, getQuizById } from '../lib/supabase'
import Timer from '../components/Timer'
import Scoreboard from '../components/Scoreboard'

const QUESTION_TIME = 20
const QUESTIONS_PER_ROUND = 5

export default function HostGame() {
  const { gameId } = useParams<{ gameId: string }>()
  const location = useLocation()
  const { gameState, players, updateGameState } = useGameState(gameId)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [quiz, setQuiz] = useState<Quiz | null>(location.state?.quiz || null)
  const [loadingQuiz, setLoadingQuiz] = useState(!location.state?.quiz)

  // Load quiz if not passed via state
  useEffect(() => {
    const loadQuiz = async () => {
      if (quiz || !gameId) return
      
      // First get the game to find quiz_id
      const { data: game } = await supabase
        .from('games')
        .select('quiz_id')
        .eq('id', gameId)
        .single()
      
      if (game?.quiz_id) {
        const loadedQuiz = await getQuizById(game.quiz_id)
        setQuiz(loadedQuiz)
      }
      setLoadingQuiz(false)
    }

    loadQuiz()
  }, [gameId, quiz])

  const questions: Question[] = quiz?.questions || []

  const getQuestionForIndex = (index: number): Question | null => {
    if (index < 0 || index >= questions.length) return null
    return questions[index]
  }

  const getRoundForQuestion = (questionIndex: number): number => {
    return Math.floor(questionIndex / QUESTIONS_PER_ROUND) + 1
  }

  const isLastQuestionOfRound = (questionIndex: number): boolean => {
    // Check if it's a multiple of QUESTIONS_PER_ROUND
    if ((questionIndex + 1) % QUESTIONS_PER_ROUND === 0) {
      return true
    }
    // Check if it's the last question overall
    if (questionIndex === questions.length - 1) {
      return true
    }
    // Check if the next question would be in a different round
    const currentRound = Math.floor(questionIndex / QUESTIONS_PER_ROUND)
    const nextRound = Math.floor((questionIndex + 1) / QUESTIONS_PER_ROUND)
    return currentRound !== nextRound
  }

  const isLastQuestion = (questionIndex: number): boolean => {
    return questionIndex === questions.length - 1
  }

  const getQuestionsInRound = (questionIndex: number): number => {
    const roundStart = Math.floor(questionIndex / QUESTIONS_PER_ROUND) * QUESTIONS_PER_ROUND
    const roundEnd = Math.min(roundStart + QUESTIONS_PER_ROUND - 1, questions.length - 1)
    return roundEnd - roundStart + 1
  }

  const currentQuestion = gameState ? getQuestionForIndex(gameState.current_question) : null
  const currentRound = gameState ? getRoundForQuestion(gameState.current_question) : 1
  const questionsInCurrentRound = gameState ? getQuestionsInRound(gameState.current_question) : QUESTIONS_PER_ROUND

  const handleTimerComplete = useCallback(async () => {
    if (!gameState || gameState.phase !== 'question') return
    
    // Move to reveal phase
    await updateGameState({ phase: 'reveal' })
  }, [gameState, updateGameState])

  const timer = useTimer({
    duration: QUESTION_TIME,
    onComplete: handleTimerComplete
  })

  // Subscribe to answers
  useEffect(() => {
    if (!gameId) return

    const channel = supabase
      .channel(`answers_${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'answers',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          setAnswers((prev) => [...prev, payload.new as Answer])
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [gameId])

  // Start first question
  const startQuiz = async () => {
    await updateGameState({
      phase: 'question',
      current_question: 0,
      current_round: 1,
      question_started_at: new Date().toISOString()
    })
    setAnswers([])
    timer.restart(QUESTION_TIME)
  }

  // Next question or scoreboard
  const handleNext = async () => {
    if (!gameState) return

    const questionIndex = gameState.current_question

    // Check if last question overall first (final scoreboard)
    if (isLastQuestion(questionIndex)) {
      // Final scoreboard
      await updateGameState({ phase: 'scoreboard' })
    } else if (isLastQuestionOfRound(questionIndex)) {
      // Show round scoreboard
      await updateGameState({ phase: 'scoreboard' })
    } else {
      // Next question
      const nextIndex = questionIndex + 1
      await updateGameState({
        phase: 'question',
        current_question: nextIndex,
        current_round: getRoundForQuestion(nextIndex),
        question_started_at: new Date().toISOString()
      })
      setAnswers([])
      timer.restart(QUESTION_TIME)
    }
  }

  // Continue from scoreboard to next round
  const continueToNextRound = async () => {
    if (!gameState) return

    const nextIndex = gameState.current_question + 1

    if (isLastQuestion(gameState.current_question)) {
      // Game over - stay on final scoreboard
      return
    }

    await updateGameState({
      phase: 'question',
      current_question: nextIndex,
      current_round: getRoundForQuestion(nextIndex),
      question_started_at: new Date().toISOString()
    })
    setAnswers([])
    timer.restart(QUESTION_TIME)
  }

  // Count answers for current question
  const answersForQuestion = answers.filter(
    (a) => a.question_index === gameState?.current_question
  )
  const correctAnswers = answersForQuestion.filter((a) => a.is_correct).length

  // Jump to 3 seconds when all players have answered
  useEffect(() => {
    if (
      gameState?.phase === 'question' &&
      players.length > 0 &&
      answersForQuestion.length >= players.length &&
      timer.timeLeft > 3
    ) {
      timer.restart(3)
    }
  }, [answersForQuestion.length, players.length, gameState?.phase, timer.timeLeft])

  // Render based on phase
  if (!gameState || loadingQuiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-arcade text-2xl text-neon-cyan pulse">Indlæser...</p>
      </div>
    )
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <p className="font-arcade text-xl text-red-500">Quiz ikke fundet eller ingen spørgsmål</p>
        <a href="/" className="retro-btn px-8 py-4">← Tilbage</a>
      </div>
    )
  }

  if (gameState.phase === 'lobby') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <h1 className="font-retro text-4xl neon-text-pink mb-8">KLAR TIL START</h1>
        <p className="font-arcade text-2xl text-neon-cyan mb-4">
          {players.length} spillere klar
        </p>
        <button
          onClick={startQuiz}
          className="retro-btn-primary text-xl px-12 py-6"
        >
          START QUIZ!
        </button>
      </div>
    )
  }

  if (gameState.phase === 'scoreboard') {
    const isFinal = isLastQuestion(gameState.current_question)
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <Scoreboard 
          players={players} 
          round={currentRound}
          isFinal={isFinal}
        />
        
        {!isFinal && (
          <button
            onClick={continueToNextRound}
            className="retro-btn-primary text-xl px-12 py-6 mt-8"
          >
            Fortsæt til Runde {currentRound + 1}
          </button>
        )}
        
        {isFinal && (
          <p className="font-arcade text-2xl text-neon-yellow mt-8">
            🏆 Tillykke til vinderen! 🏆
          </p>
        )}
      </div>
    )
  }

  // Question or reveal phase
  return (
    <div className="min-h-screen flex flex-col p-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="font-retro text-3xl neon-text-cyan">
          Runde {currentRound}
        </div>
        <div className="font-arcade text-2xl text-white">
          Spørgsmål {(gameState.current_question % QUESTIONS_PER_ROUND) + 1} / {questionsInCurrentRound}
        </div>
        <div className="font-arcade text-2xl text-neon-green">
          {answersForQuestion.length} / {players.length} svar
        </div>
      </div>

      {/* Timer */}
      {gameState.phase === 'question' && (
        <div className="mb-10">
          <Timer timeLeft={timer.timeLeft} percentage={timer.percentage} />
        </div>
      )}

      {/* Question */}
      {currentQuestion && (
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Question Image */}
          {currentQuestion.image && (
            <div className="mb-8 max-w-xl">
              <img 
                src={currentQuestion.image} 
                alt="Spørgsmålsbillede"
                className="w-full h-auto max-h-80 object-contain rounded-lg border-4 border-neon-cyan shadow-lg shadow-cyan-500/30"
              />
            </div>
          )}

          <h2 className="font-arcade text-5xl md:text-7xl text-center text-white mb-14 max-w-5xl">
            {currentQuestion.question}
          </h2>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
            {(['A', 'B', 'C', 'D'] as const).map((letter, idx) => {
              const isCorrect = currentQuestion.correct === letter
              const showCorrect = gameState.phase === 'reveal' && isCorrect
              const showWrong = gameState.phase === 'reveal' && !isCorrect

              return (
                <div
                  key={letter}
                  className={`
                    answer-btn flex items-center gap-6 !text-2xl !py-5 !px-6
                    ${showCorrect ? 'correct' : ''}
                    ${showWrong ? 'opacity-50' : ''}
                  `}
                >
                  <span className={`
                    font-retro text-4xl w-12
                    ${showCorrect ? 'neon-text-green' : 'neon-text-cyan'}
                  `}>
                    {letter}
                  </span>
                  <span className="font-arcade text-2xl">
                    {currentQuestion.options[idx]}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Reveal info */}
          {gameState.phase === 'reveal' && (
            <div className="mt-10 text-center">
              <p className="font-arcade text-3xl text-neon-green mb-6">
                {correctAnswers} spillere svarede rigtigt!
              </p>
              <button
                onClick={handleNext}
                className="retro-btn-primary text-xl px-10 py-5"
              >
                {isLastQuestionOfRound(gameState.current_question) || isLastQuestion(gameState.current_question)
                  ? 'Se Scoreboard'
                  : 'Næste Spørgsmål'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
