interface TimerProps {
  timeLeft: number
  percentage: number
}

export default function Timer({ timeLeft, percentage }: TimerProps) {
  const getColor = () => {
    if (percentage > 50) return 'bg-neon-green'
    if (percentage > 25) return 'bg-neon-yellow'
    return 'bg-red-500'
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        <span className="font-arcade text-3xl neon-text-cyan">TID</span>
        <span className={`font-retro text-4xl ${percentage <= 25 ? 'neon-text-pink animate-pulse' : 'neon-text-yellow'}`}>
          {timeLeft}s
        </span>
      </div>
      <div className="w-full h-6 bg-gray-800 rounded-full overflow-hidden neon-border">
        <div 
          className={`h-full ${getColor()} transition-all duration-1000 ease-linear`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
