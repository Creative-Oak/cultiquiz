import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { joinGame, getGameByCode } from '../lib/supabase'
import PortraitCanvas from '../components/PortraitCanvas'

type Step = 'name' | 'portrait' | 'joining'

export default function PlayerJoin() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  
  const [step, setStep] = useState<Step>('name')
  const [name, setName] = useState('')
  const [portrait, setPortrait] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    // Verify game exists
    if (!code) {
      setError('Ingen spilkode fundet')
      return
    }

    const game = await getGameByCode(code)
    if (!game) {
      setError('Spillet blev ikke fundet. Tjek koden.')
      return
    }

    setStep('portrait')
  }

  const handlePortraitSave = async (dataUrl: string) => {
    setPortrait(dataUrl)
    setStep('joining')
    setError(null)

    if (!code) return

    const player = await joinGame(code, name.trim(), dataUrl)
    
    if (player) {
      // Navigate to game view
      navigate(`/game/${player.game_id}/${player.id}`)
    } else {
      setError('Kunne ikke deltage i spillet. Prøv igen.')
      setStep('portrait')
    }
  }

  const handleSkipPortrait = async () => {
    setStep('joining')
    setError(null)

    if (!code) return

    // Create a simple placeholder portrait
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 200
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, 200, 200)
      ctx.fillStyle = '#333'
      ctx.font = '80px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(name.charAt(0).toUpperCase(), 100, 100)
    }
    const dataUrl = canvas.toDataURL('image/png')

    const player = await joinGame(code, name.trim(), dataUrl)
    
    if (player) {
      navigate(`/game/${player.game_id}/${player.id}`)
    } else {
      setError('Kunne ikke deltage i spillet. Prøv igen.')
      setStep('portrait')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="font-retro text-3xl text-center mb-2 neon-text-pink">
        QUIZ AFTEN!
      </h1>
      <p className="font-arcade text-lg text-neon-cyan mb-8">
        Spilkode: <span className="text-neon-yellow">{code}</span>
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 rounded-lg border border-red-500">
          <p className="font-arcade text-red-300">{error}</p>
        </div>
      )}

      {step === 'name' && (
        <form onSubmit={handleNameSubmit} className="w-full max-w-sm">
          <label className="block font-arcade text-xl text-white mb-4 text-center">
            Hvad hedder du?
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dit navn..."
            maxLength={20}
            className="w-full p-4 text-xl font-arcade bg-arcade-dark border-2 border-neon-cyan rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-pink"
            autoFocus
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full mt-4 retro-btn-primary text-lg py-4 disabled:opacity-50"
          >
            Næste
          </button>
        </form>
      )}

      {step === 'portrait' && (
        <div className="w-full max-w-sm flex flex-col items-center">
          <p className="font-arcade text-lg text-white mb-2">
            Hej <span className="text-neon-yellow">{name}</span>!
          </p>
          
          <PortraitCanvas 
            width={200} 
            height={200} 
            onSave={handlePortraitSave}
          />

          <button
            onClick={handleSkipPortrait}
            className="mt-4 font-arcade text-sm text-gray-400 underline"
          >
            Spring over
          </button>
        </div>
      )}

      {step === 'joining' && (
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-arcade text-xl text-neon-cyan pulse">
            Deltager i spillet...
          </p>
        </div>
      )}
    </div>
  )
}
