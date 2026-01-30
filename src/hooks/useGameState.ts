import { useEffect, useState, useCallback } from 'react'
import { supabase, GameState, Player } from '../lib/supabase'

export function useGameState(gameId: string | undefined) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch initial data
  useEffect(() => {
    if (!gameId) return

    async function fetchData() {
      setLoading(true)
      
      // Fetch game state
      const { data: stateData } = await supabase
        .from('game_state')
        .select('*')
        .eq('game_id', gameId)
        .single()

      if (stateData) {
        setGameState(stateData)
      }

      // Fetch players
      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameId)
        .order('score', { ascending: false })

      if (playersData) {
        setPlayers(playersData)
      }

      setLoading(false)
    }

    fetchData()
  }, [gameId])

  // Subscribe to realtime updates
  useEffect(() => {
    if (!gameId) return

    // Subscribe to game_state changes
    const stateChannel = supabase
      .channel(`game_state_${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_state',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          if (payload.new) {
            setGameState(payload.new as GameState)
          }
        }
      )
      .subscribe()

    // Subscribe to players changes
    const playersChannel = supabase
      .channel(`players_${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${gameId}`
        },
        async () => {
          // Refetch all players when any change occurs
          const { data } = await supabase
            .from('players')
            .select('*')
            .eq('game_id', gameId)
            .order('score', { ascending: false })

          if (data) {
            setPlayers(data)
          }
        }
      )
      .subscribe()

    return () => {
      stateChannel.unsubscribe()
      playersChannel.unsubscribe()
    }
  }, [gameId])

  // Update game state helper
  const updateGameState = useCallback(async (updates: Partial<GameState>) => {
    if (!gameId) return

    await supabase
      .from('game_state')
      .update(updates)
      .eq('game_id', gameId)
  }, [gameId])

  return { gameState, players, loading, updateGameState }
}
