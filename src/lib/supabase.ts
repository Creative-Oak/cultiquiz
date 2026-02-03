import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Question {
  question: string
  options: [string, string, string, string]
  correct: 'A' | 'B' | 'C' | 'D'
  image?: string
}

export interface Quiz {
  id: string
  name: string
  description: string | null
  questions: Question[]
  created_at: string
  is_default: boolean
}

export interface Game {
  id: string
  code: string
  created_at: string
  quiz_id: string | null
}

export interface Player {
  id: string
  game_id: string
  name: string
  portrait: string | null
  score: number
  joined_at: string
}

export interface GameState {
  game_id: string
  phase: 'lobby' | 'question' | 'reveal' | 'scoreboard'
  current_round: number
  current_question: number
  question_started_at: string | null
}

export interface Answer {
  id: string
  game_id: string
  player_id: string
  question_index: number
  answer: string
  answered_at: string
  is_correct: boolean
  points_earned: number
}

// Helper functions
export async function createGame(quizId: string): Promise<Game | null> {
  const code = generateGameCode()
  
  const { data: game, error: gameError } = await supabase
    .from('games')
    .insert({ code, quiz_id: quizId })
    .select()
    .single()

  if (gameError || !game) {
    console.error('Error creating game:', gameError)
    return null
  }

  // Create initial game state
  const { error: stateError } = await supabase
    .from('game_state')
    .insert({
      game_id: game.id,
      phase: 'lobby',
      current_round: 1,
      current_question: 0
    })

  if (stateError) {
    console.error('Error creating game state:', stateError)
    return null
  }

  return game
}

export async function getQuizzes(): Promise<Quiz[]> {
  const { data, error } = await supabase
    .from('quizzes')
    .select()
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching quizzes:', error)
    return []
  }

  return data || []
}

export async function getQuizById(id: string): Promise<Quiz | null> {
  const { data, error } = await supabase
    .from('quizzes')
    .select()
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching quiz:', error)
    return null
  }

  return data
}

export async function createQuiz(name: string, description: string | null, questions: Question[]): Promise<Quiz | null> {
  const { data, error } = await supabase
    .from('quizzes')
    .insert({ name, description, questions })
    .select()
    .single()

  if (error) {
    console.error('Error creating quiz:', error)
    return null
  }

  return data
}

export async function formatQuestionsWithAI(rawText: string): Promise<Question[] | null> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/format-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rawText }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Error formatting questions:', error)
      return null
    }

    const data = await response.json()
    return data.questions
  } catch (error) {
    console.error('Error calling format-questions:', error)
    return null
  }
}

export async function joinGame(code: string, name: string, portrait: string): Promise<Player | null> {
  // Find game by code
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select()
    .eq('code', code.toUpperCase())
    .single()

  if (gameError || !game) {
    console.error('Game not found:', gameError)
    return null
  }

  // Create player
  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert({
      game_id: game.id,
      name,
      portrait
    })
    .select()
    .single()

  if (playerError) {
    console.error('Error creating player:', playerError)
    return null
  }

  return player
}

export async function getGameByCode(code: string): Promise<Game | null> {
  const { data, error } = await supabase
    .from('games')
    .select()
    .eq('code', code.toUpperCase())
    .single()

  if (error) return null
  return data
}

function generateGameCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
