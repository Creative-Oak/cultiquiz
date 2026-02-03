import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatQuestionsWithAI, createQuiz, Question } from '../lib/supabase'

const FUN_FACTS = [
  'Did you know? Octopuses have three hearts!',
  'Vidste du det? En blæksprutte har tre hjerter!',
  'Fun fact: Honey never spoils. Archaeologists have found 3000-year-old honey that\'s still edible!',
  'Sjovt faktum: Honning bliver aldrig dårlig. Arkæologer har fundet 3000 år gammel honning, der stadig kan spises!',
  'Did you know? Bananas are berries, but strawberries aren\'t!',
  'Vidste du det? Bananer er bær, men jordbær er ikke!',
  'Fun fact: A group of flamingos is called a "flamboyance"!',
  'Sjovt faktum: En flok flamingoer kaldes en "flamboyance"!',
  'Did you know? Wombat poop is cube-shaped!',
  'Vidste du det? Wombat-affe er terningeformet!',
  'Fun fact: There are more possible games of chess than atoms in the observable universe!',
  'Sjovt faktum: Der er flere mulige skakspil end atomer i det observerbare univers!',
  'Did you know? A day on Venus is longer than its year!',
  'Vidste du det? En dag på Venus er længere end dens år!',
  'Fun fact: Dolphins have names for each other!',
  'Sjovt faktum: Delfiner har navne til hinanden!',
]

export default function CreateQuiz() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [rawText, setRawText] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'input' | 'preview'>('input')
  const [funFact, setFunFact] = useState('')

  // Rotate fun facts while loading
  useEffect(() => {
    if (!loading) return

    // Set initial fact
    setFunFact(FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)])

    // Rotate every 3 seconds
    const interval = setInterval(() => {
      setFunFact(FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)])
    }, 3000)

    return () => clearInterval(interval)
  }, [loading])

  const handleGenerate = async () => {
    if (!rawText.trim()) {
      setError('Indtast nogle spørgsmål først')
      return
    }

    setLoading(true)
    setError(null)

    const formatted = await formatQuestionsWithAI(rawText)
    
    if (formatted && formatted.length > 0) {
      setQuestions(formatted)
      setStep('preview')
    } else {
      setError('Kunne ikke formatere spørgsmålene. Prøv at være mere specifik.')
    }

    setLoading(false)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Quiz skal have et navn')
      return
    }

    if (questions.length === 0) {
      setError('Quiz skal have mindst ét spørgsmål')
      return
    }

    setLoading(true)
    setError(null)

    const quiz = await createQuiz(name, description || null, questions)
    
    if (quiz) {
      navigate('/')
    } else {
      setError('Kunne ikke gemme quiz. Prøv igen.')
    }

    setLoading(false)
  }

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    setQuestions(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions(prev => {
      const updated = [...prev]
      const newOptions = [...updated[questionIndex].options] as [string, string, string, string]
      newOptions[optionIndex] = value
      updated[questionIndex] = { ...updated[questionIndex], options: newOptions }
      return updated
    })
  }

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mt-24 mb-8">
          <h1 className="font-retro text-4xl md:text-5xl neon-text-pink mb-4">
            OPRET QUIZ
          </h1>
          <p className="font-arcade text-neon-cyan">
            {step === 'input' ? 'Indtast dine spørgsmål' : 'Gennemse og rediger'}
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

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
            <p className="font-arcade text-red-400">{error}</p>
          </div>
        )}

        {step === 'input' ? (
          /* Input Step */
          <div className="space-y-6">
            {/* Quiz Name */}
            <div>
              <label className="block font-arcade text-neon-yellow mb-2">
                Quiz Navn *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="F.eks. Geografi Quiz"
                className="w-full p-4 bg-arcade-dark border-2 border-neon-cyan rounded-lg font-arcade text-white focus:border-neon-pink focus:outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block font-arcade text-neon-yellow mb-2">
                Beskrivelse (valgfri)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="F.eks. Test din viden om verdens lande"
                className="w-full p-4 bg-arcade-dark border-2 border-neon-cyan rounded-lg font-arcade text-white focus:border-neon-pink focus:outline-none"
              />
            </div>

            {/* Raw Questions */}
            <div>
              <label className="block font-arcade text-neon-yellow mb-2">
                Spørgsmål (AI formaterer dem)
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Skriv dine spørgsmål i et vilkårligt format. AI'en formaterer dem automatisk.

Eksempler:
- Hvad er Danmarks hovedstad? (København)
- Hvilket land har flest indbyggere? A) USA B) Kina C) Indien D) Rusland (svar: B)
- Hvor høj er Eiffeltårnet? ca. 330 meter

Du kan også bare skrive emner:
- 5 spørgsmål om danske konger
- Quiz om Harry Potter`}
                rows={12}
                className="w-full p-4 bg-arcade-dark border-2 border-neon-cyan rounded-lg font-arcade text-white focus:border-neon-pink focus:outline-none resize-none"
              />
            </div>

            {/* Generate Button */}
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleGenerate}
                disabled={loading || !rawText.trim()}
                className={`retro-btn-primary text-lg px-12 py-4 ${
                  loading || !rawText.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-3">
                    <span className="animate-spin">⚡</span>
                    AI arbejder...
                  </span>
                ) : (
                  '✨ Generer Spørgsmål'
                )}
              </button>

              {/* Fun Facts while loading */}
              {loading && funFact && (
                <div className="p-4 bg-arcade-purple/30 rounded-lg border border-neon-cyan/50 max-w-md">
                  <p className="font-arcade text-sm text-neon-cyan mb-2 text-center">
                    💡 Mens du venter...
                  </p>
                  <p className="font-arcade text-base text-white text-center animate-pulse">
                    {funFact}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Preview Step */
          <div className="space-y-6">
            {/* Quiz Info */}
            <div className="p-4 bg-arcade-purple/30 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-retro text-2xl neon-text-yellow">{name || 'Unavngivet Quiz'}</h2>
                  {description && (
                    <p className="font-arcade text-sm text-gray-400 mt-1">{description}</p>
                  )}
                </div>
                <span className="font-arcade text-neon-green">
                  {questions.length} spørgsmål
                </span>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {questions.map((q, qIndex) => (
                <div 
                  key={qIndex}
                  className="p-6 bg-arcade-purple/50 rounded-lg neon-border"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-retro text-xl neon-text-cyan">
                      #{qIndex + 1}
                    </span>
                    <button
                      onClick={() => removeQuestion(qIndex)}
                      className="font-arcade text-sm text-red-400 hover:text-red-300"
                    >
                      ✕ Fjern
                    </button>
                  </div>

                  {/* Question Text */}
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                    className="w-full p-3 mb-4 bg-arcade-dark border border-gray-600 rounded font-arcade text-white focus:border-neon-cyan focus:outline-none"
                  />

                  {/* Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(['A', 'B', 'C', 'D'] as const).map((letter, oIndex) => (
                      <div key={letter} className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuestion(qIndex, 'correct', letter)}
                          className={`w-10 h-10 rounded font-retro text-lg flex items-center justify-center transition-colors ${
                            q.correct === letter
                              ? 'bg-neon-green text-black'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                        >
                          {letter}
                        </button>
                        <input
                          type="text"
                          value={q.options[oIndex]}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          className="flex-1 p-2 bg-arcade-dark border border-gray-600 rounded font-arcade text-sm text-white focus:border-neon-cyan focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setStep('input')}
                className="retro-btn text-lg px-8 py-4"
              >
                ← Tilbage
              </button>
              <button
                onClick={handleSave}
                disabled={loading || questions.length === 0 || !name.trim()}
                className={`retro-btn-primary text-lg px-12 py-4 ${
                  loading || questions.length === 0 || !name.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Gemmer...' : '💾 Gem Quiz'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
