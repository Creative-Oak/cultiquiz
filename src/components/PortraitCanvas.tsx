import { useRef, useEffect, useState, useCallback } from 'react'

interface PortraitCanvasProps {
  width?: number
  height?: number
  onSave: (dataUrl: string) => void
}

export default function PortraitCanvas({ 
  width = 280, 
  height = 280, 
  onSave 
}: PortraitCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // White background
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, width, height)
  }, [width, height])

  const getPos = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      }
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      }
    }
  }, [])

  const startDrawing = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    const pos = getPos(e)
    if (!pos) return

    setIsDrawing(true)
    lastPosRef.current = pos
  }, [getPos])

  const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return
    e.preventDefault()

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !lastPosRef.current) return

    const pos = getPos(e)
    if (!pos) return

    ctx.beginPath()
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()

    lastPosRef.current = pos
    setHasDrawn(true)
  }, [isDrawing, getPos])

  const stopDrawing = useCallback(() => {
    setIsDrawing(false)
    lastPosRef.current = null
  }, [])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, width, height)
    setHasDrawn(false)
  }, [width, height])

  const saveDrawing = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dataUrl = canvas.toDataURL('image/png')
    onSave(dataUrl)
  }, [onSave])

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="font-arcade text-xl text-neon-cyan">Tegn dit portræt!</p>
      
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="portrait-canvas rounded-lg"
        style={{ width: width, height: height }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      <div className="flex gap-3">
        <button
          onClick={clearCanvas}
          className="retro-btn text-xs"
        >
          Ryd
        </button>
        <button
          onClick={saveDrawing}
          disabled={!hasDrawn}
          className="retro-btn-primary text-xs disabled:opacity-50"
        >
          Gem
        </button>
      </div>
    </div>
  )
}
