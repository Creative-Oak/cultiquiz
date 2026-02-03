import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getQuizzes, createGame, Quiz } from '../lib/supabase'

export default function QuizSelect() {
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState<string | null>(null)

  useEffect(() => {
    loadQuizzes()
  }, [])

  const loadQuizzes = async () => {
    setLoading(true)
    const data = await getQuizzes()
    setQuizzes(data)
    setLoading(false)
  }

  const handleSelectQuiz = async (quiz: Quiz) => {
    setCreating(quiz.id)
    
    const game = await createGame(quiz.id)
    
    if (game) {
      // Navigate to lobby with quiz info
      navigate(`/lobby/${game.id}`, { state: { quiz } })
    } else {
      setCreating(null)
      alert('Kunne ikke oprette spil. Prøv igen.')
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('da-DK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mt-24 mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-retro text-4xl md:text-6xl neon-text-pink mb-4">
            CREATIVE OAK QUIZ PORTAL!
          </h1>
          <p className="font-arcade text-xl text-neon-cyan">
            Vælg en quiz at spille
          </p>
        </div>

        {/* Create Quiz Link */}
        <div className="mb-8 flex justify-center">
          <a 
            href="/create-quiz"
            className="retro-btn text-lg px-8 py-4 flex items-center gap-3"
          >
            ✨ Opret Ny Quiz
          </a>
        </div>

        {/* Quiz List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="font-arcade text-2xl text-neon-cyan pulse">
              Indlæser quizzer...
            </p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-12 bg-arcade-purple/30 rounded-lg border border-gray-700">
            <p className="font-arcade text-xl text-gray-400 mb-4">
              Ingen quizzer fundet
            </p>
            <a 
              href="/create-quiz"
              className="font-arcade text-neon-pink hover:text-neon-cyan transition-colors"
            >
              Opret den første quiz →
            </a>
          </div>
        ) : (
          <div className="grid gap-4">
            {quizzes.map((quiz) => (
              <button
                key={quiz.id}
                onClick={() => handleSelectQuiz(quiz)}
                disabled={creating !== null}
                className={`w-full p-6 bg-arcade-purple/50 rounded-lg neon-border text-left transition-all hover:bg-arcade-purple/70 hover:scale-[1.02] ${
                  creating === quiz.id ? 'animate-pulse' : ''
                } ${creating !== null && creating !== quiz.id ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="font-retro text-2xl neon-text-yellow">
                        {quiz.name}
                      </h2>
                      {quiz.is_default && (
                        <span className="px-2 py-1 bg-neon-pink/20 border border-neon-pink rounded text-xs font-arcade text-neon-pink">
                          ORIGINAL
                        </span>
                      )}
                    </div>
                    
                    {quiz.description && (
                      <p className="font-arcade text-sm text-gray-400 mb-3">
                        {quiz.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-arcade text-neon-green">
                        📝 {quiz.questions.length} spørgsmål
                      </span>
                      <span className="font-arcade text-gray-500">
                        {formatDate(quiz.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {creating === quiz.id ? (
                      <span className="font-arcade text-neon-cyan">
                        Opretter...
                      </span>
                    ) : (
                      <span className="font-retro text-3xl neon-text-cyan">
                        ▶
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Admin Link */}
        <div className="mt-12 text-center">
          <a 
            href="/admin"
            className="font-arcade text-sm text-gray-500 hover:text-gray-400 transition-colors"
          >
            Admin Panel →
          </a>
        </div>
      </div>
    </div>
  )
}
