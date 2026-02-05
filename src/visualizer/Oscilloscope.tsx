import { useEffect, useRef } from 'react'

interface OscilloscopeProps {
  waveformRef?: React.RefObject<{ getValue(): Float32Array } | null>
}

export function Oscilloscope({ waveformRef }: OscilloscopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height

    const draw = () => {
      const waveform = waveformRef?.current
      if (!waveform) {
        requestAnimationFrame(draw)
        return
      }
      const values = waveform.getValue()
      if (!values || values.length === 0) {
        requestAnimationFrame(draw)
        return
      }
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#2ecc71'
      ctx.lineWidth = 1
      ctx.beginPath()
      const step = w / values.length
      for (let i = 0; i < values.length; i++) {
        const x = i * step
        const y = (1 + values[i]) * 0.5 * h
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      requestAnimationFrame(draw)
    }
    draw()
  }, [waveformRef])

  return (
    <div className="oscilloscope">
      <canvas ref={canvasRef} width={400} height={80} />
    </div>
  )
}
