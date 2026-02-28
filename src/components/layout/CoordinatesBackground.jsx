import { useState, useEffect } from 'react'

export default function CoordinatesBackground() {
  // Generate initial coordinates
  const generateInitialCoords = () => {
    const numCoords = 120
    return Array.from({ length: numCoords }, (_, i) => {
      // Random distribution across the entire viewport (0-100%)
      // Slightly extend beyond edges for better coverage
      const xPercent = Math.random() * 100
      const yPercent = Math.random() * 100

      return {
        id: i,
        xPercent,
        yPercent,
        baseX: Math.floor(Math.random() * 10000),
        baseY: Math.floor(Math.random() * 10000),
        baseZ: Math.floor(Math.random() * 10000),
        incrementSpeed: 0.6 + Math.random() * 2,
        fontSize: 0.4 + Math.random() * 0.8,
        opacity: 0.1 + Math.random() * 0.3,
        floatDuration: 10 + Math.random() * 6,
        floatDelay: Math.random() * 2,
      }
    })
  }

  const [coordinates, setCoordinates] = useState(generateInitialCoords)

  useEffect(() => {

    // Only increment the numeric values; positions are animated via CSS
    const interval = setInterval(() => {
      setCoordinates((prev) =>
        prev.map((coord) => ({
          ...coord,
          baseX: coord.baseX + coord.incrementSpeed,
          baseY: coord.baseY + coord.incrementSpeed,
          baseZ: coord.baseZ + coord.incrementSpeed,
        }))
      )
    }, 80)

    return () => clearInterval(interval)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
      >
      {/* Coordinates */}
      {coordinates.map((coord) => (
        <div
          key={coord.id}
          style={{
            position: 'absolute',
            top: `${coord.yPercent}%`,
            left: `${coord.xPercent}%`,
            fontSize: `${coord.fontSize}rem`,
            color: `rgba(255, 255, 255, ${coord.opacity})`,
            fontFamily: 'Orbitron, monospace',
            whiteSpace: 'nowrap',
            transform: 'translate(-50%, -50%)',
            textShadow: 'none',
            animation: `floatCoordinates ${coord.floatDuration}s ease-in-out ${coord.floatDelay}s infinite alternate`,
          }}
        >
          ({Math.floor(coord.baseX)}, {Math.floor(coord.baseY)}, {Math.floor(coord.baseZ)})
        </div>
      ))}
    </div>
  )
}
