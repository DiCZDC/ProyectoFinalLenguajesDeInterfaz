import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface RadarPoint {
  angle: number
  distance: number
  id: string
  timestamp: number
}

export default function RadarDetector() {
  const [input, setInput] = useState("")
  const [currentPoint, setCurrentPoint] = useState<RadarPoint | null>(null)
  const [detectedObjects, setDetectedObjects] = useState<RadarPoint[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [data, setData] = useState({ first: 0, second: 0 })
  const [connectionStatus, setConnectionStatus] = useState("Desconectado")
  
  // Referencias para limpiar intervalos y conexiones
  const socketRef = useRef<any>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const maxDistance = 39 // cm
  const radarRadius = 200 // pixels
  const centerX = 250
  const centerY = 250

  useEffect(() => {
    // Solo importar socket.io-client en el lado del cliente
    const initSocket = async () => {
      try {
        const { io } = await import('socket.io-client')
        
        socketRef.current = io('http://localhost:4000', {
          transports: ['websocket', 'polling']
        })
        
        socketRef.current.on('connect', () => {
          console.log('Conectado al servidor')
          setConnectionStatus("Conectado")
        })
        
        socketRef.current.on('disconnect', () => {
          console.log('Desconectado del servidor')
          setConnectionStatus("Desconectado")
        })
        
        socketRef.current.on('serial-data', (incomingData: any) => {
          console.log('Datos recibidos:', incomingData)
          setData(incomingData)
        })

        socketRef.current.on('connect_error', (error: any) => {
          console.error('Error de conexión:', error)
          setConnectionStatus("Error de conexión")
        })

      } catch (error) {
        console.error('Error al inicializar socket:', error)
        setConnectionStatus("Error al cargar socket")
      }
    }

    initSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
    }
  }, [])

  // Efecto separado para manejar los datos del radar cuando isScanning es true
  useEffect(() => {
    if (isScanning && data.first !== undefined && data.second !== undefined) {
      const newPoint: RadarPoint = {
        angle: data.first,
        distance: data.second,
        id: Date.now().toString(),
        timestamp: Date.now(),
      }

      if (newPoint.distance <= maxDistance && newPoint.distance > 0) {
        setCurrentPoint(newPoint)
        setDetectedObjects((prev) => [...prev.slice(-9), newPoint])
      } else {
        setCurrentPoint({ ...newPoint, distance: newPoint.distance <= 0 ? maxDistance + 1 : newPoint.distance })
      }
    }
  }, [data, isScanning, maxDistance])

  // Convertir coordenadas polares a cartesianas
  const polarToCartesian = (angle: number, distance: number) => {
    const normalizedDistance = Math.min(distance, maxDistance)
    const radius = (normalizedDistance / maxDistance) * radarRadius
    // Corregir orientación: 0° a la izquierda, 90° arriba, 180° a la derecha
    const angleRad = ((angle - 90) * (Math.PI / 180))

    return {
      x: centerX + radius * Math.sin(angleRad),
      y: centerY - radius * Math.cos(angleRad),
    }
  }

  const startScanning = () => {
    setIsScanning(!isScanning)
    if (!isScanning) {
      console.log("Iniciando escaneo...")
    } else {
      console.log("Deteniendo escaneo...")
    }
  }

  const addDetection = () => {
    const parts = input.split(",").map((s) => s.trim())
    if (parts.length !== 2) {
      alert("Formato incorrecto. Use: grados,distancia")
      return
    }

    const angle = Number.parseFloat(parts[0])
    const distance = Number.parseFloat(parts[1])

    if (isNaN(angle) || isNaN(distance)) {
      alert("Los valores deben ser números válidos")
      return
    }

    if (distance < 0) {
      alert("La distancia no puede ser negativa")
      return
    }

    const newPoint: RadarPoint = {
      angle,
      distance,
      id: Date.now().toString(),
      timestamp: Date.now(),
    }

    if (distance <= maxDistance) {
      setCurrentPoint(newPoint)
      setDetectedObjects((prev) => [...prev.slice(-9), newPoint])
    } else {
      setCurrentPoint({ ...newPoint, distance: maxDistance + 1 })
    }
    setInput("")
  }

  const clearDetections = () => {
    setDetectedObjects([])
    setCurrentPoint(null)
  }

  // Crear líneas radiales para los grados
  const createRadialLines = () => {
    const lines = []
    for (let i = 0; i <= 180; i += 30) {
      const { x, y } = polarToCartesian(i, maxDistance)
      lines.push(
        <line 
          key={i} 
          x1={centerX} 
          y1={centerY} 
          x2={x} 
          y2={y} 
          stroke="rgb(34 197 94 / 0.3)" 
          strokeWidth="1" 
        />
      )
    }
    return lines
  }

  // Crear círculos concéntricos para las distancias
  const createDistanceCircles = () => {
    const circles = []
    for (let i = 1; i <= 5; i++) {
      const radius = (i / 5) * radarRadius
      circles.push(
        <path
          key={i}
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
          fill="none"
          stroke="rgb(34 197 94 / 0.3)"
          strokeWidth="1"
        />
      )
    }
    return circles
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-gray-900 border-green-500/30">
          <CardHeader>
            <CardTitle className="text-green-400 text-center text-2xl font-mono">
              SISTEMA RADAR - DETECCIÓN DE OBJETOS
            </CardTitle>
          </CardHeader>
          <div className="text-green-400 text-center text-xl font-mono">
            <p>Estado: <span className={connectionStatus === "Conectado" ? "text-green-400" : "text-red-400"}>{connectionStatus}</span></p>
          </div>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Panel de información */}
              <div className="space-y-4">
                {/* Panel de Control */}
                <Card className="bg-gray-800 border-green-500/20">
                  <CardHeader>
                    <CardTitle className="text-green-400 text-sm font-mono">CONTROLES</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    
                    <Button
                      onClick={startScanning}
                      className={`w-full font-mono ${
                        isScanning 
                          ? "bg-red-600 hover:bg-red-700 text-white" 
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {isScanning ? "DETENER ESCANEO" : "COMENZAR ESCANEO"}
                    </Button>
                    <Button
                      onClick={clearDetections}
                      variant="outline"
                      className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 font-mono"
                    >
                      LIMPIAR
                    </Button>
                  </CardContent>
                </Card>
                
                {/* Información del objeto actual */}
                {currentPoint && (
                  <Card className="bg-gray-800 border-green-500/20">
                    <CardHeader>
                      <CardTitle className="text-green-400 text-sm font-mono">
                        {currentPoint.distance > maxDistance ? "SENSOR ACTIVO" : "OBJETO DETECTADO"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 font-mono text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-300">ÁNGULO:</span>
                          <Badge variant="outline" className="border-green-500/30 text-green-400">
                            {currentPoint.angle.toFixed(1)}°
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-300">DISTANCIA:</span>
                          <Badge
                            variant="outline"
                            className={`border-green-500/30 ${currentPoint.distance > maxDistance ? "text-yellow-400" : "text-green-400"}`}
                          >
                            {currentPoint.distance > maxDistance ? `>${maxDistance}` : currentPoint.distance.toFixed(1)} cm
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-300">ESTADO:</span>
                          <Badge
                            className={`${currentPoint.distance > maxDistance ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}
                          >
                            {currentPoint.distance > maxDistance ? "SIN CONTACTO" : "CONTACTO"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Pantalla del Radar */}
              <div className="lg:col-span-2">
                <Card className="bg-gray-800 border-green-500/20">
                  <CardContent className="p-6">
                    <div className="relative">
                      <svg
                        width="500"
                        height="300"
                        className="mx-auto bg-black border border-green-500/30"
                        style={{ filter: "drop-shadow(0 0 10px rgba(34, 197, 94, 0.3))" }}
                      >
                        {/* Círculos de distancia */}
                        {createDistanceCircles()}

                        {/* Líneas radiales */}
                        {createRadialLines()}

                        {/* Etiquetas de distancia */}
                        {[8, 16, 24, 32, 40].map((dist, i) => {
                          const radius = ((i + 1) / 5) * radarRadius
                          return (
                            <text
                              key={dist}
                              x={centerX + radius - 15}
                              y={centerY - 5}
                              fill="rgb(34 197 94 / 0.6)"
                              fontSize="10"
                              fontFamily="monospace"
                            >
                              {dist}cm
                            </text>
                          )
                        })}

                        {/* Etiquetas de grados */}
                        <text x={centerX - radarRadius - 20} y={centerY} fill="rgb(34 197 94)" fontSize="12" fontFamily="monospace">0°</text>
                        <text x={centerX - radarRadius * 0.7 - 50} y={centerY - radarRadius * 0.5 - 10} fill="rgb(34 197 94)" fontSize="12" fontFamily="monospace">30°</text>
                        <text x={centerX - radarRadius * 0.3 - 55} y={centerY - radarRadius * 0.85 - 10} fill="rgb(34 197 94)" fontSize="12" fontFamily="monospace">60°</text>
                        <text x={centerX-5} y={centerY -radarRadius- 5} fill="rgb(34 197 94)" fontSize="12" fontFamily="monospace">90°</text>
                        <text x={centerX + radarRadius * 0.3 + 40} y={centerY - radarRadius * 0.85 - 10} fill="rgb(34 197 94)" fontSize="12" fontFamily="monospace">120°</text>
                        <text x={centerX + radarRadius * 0.7 + 35} y={centerY - radarRadius * 0.5} fill="rgb(34 197 94)" fontSize="12" fontFamily="monospace">150°</text>
                        <text x={centerX + radarRadius+10} y={centerY} fill="rgb(34 197 94)" fontSize="12" fontFamily="monospace">180°</text>

                        {/* Objetos detectados anteriores */}
                        {detectedObjects.slice(0, -1).map((point, index) => {
                          const { x, y } = polarToCartesian(point.angle, point.distance)
                          const opacity = 0.1 + (index / detectedObjects.length) * 0.4
                          return (
                            <circle
                              key={point.id}
                              cx={x}
                              cy={y}
                              r="4"
                              fill={`rgba(34, 197, 94, ${opacity})`}
                              stroke="rgb(34 197 94)"
                              strokeWidth="1"
                            />
                          )
                        })}

                        {/* Línea indicadora de dirección actual */}
                        {currentPoint && (() => {
                          const { x: indicatorX, y: indicatorY } = polarToCartesian(currentPoint.angle, maxDistance)
                          return (
                            <line
                              x1={centerX}
                              y1={centerY}
                              x2={indicatorX}
                              y2={indicatorY}
                              stroke="rgb(34 197 94 / 0.8)"
                              strokeWidth="2"
                              strokeDasharray="3,3"
                            />
                          )
                        })()}

                        {/* Objeto actual (solo si está dentro del rango) */}
                        {currentPoint && currentPoint.distance <= maxDistance && (() => {
                          const { x, y } = polarToCartesian(currentPoint.angle, currentPoint.distance)
                          return (
                            <>
                              <circle
                                cx={x}
                                cy={y}
                                r="8"
                                fill="rgb(239 68 68)"
                                stroke="rgb(239 68 68)"
                                strokeWidth="2"
                                style={{ filter: "drop-shadow(0 0 8px rgba(239, 68, 68, 0.8))" }}
                              >
                                <animate attributeName="r" values="8;12;8" dur="1s" repeatCount="indefinite" />
                              </circle>
                              <line
                                x1={centerX}
                                y1={centerY}
                                x2={x}
                                y2={y}
                                stroke="rgb(239 68 68 / 0.6)"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                              />
                            </>
                          )
                        })()}

                        {/* Centro del radar */}
                        <circle
                          cx={centerX}
                          cy={centerY}
                          r="3"
                          fill="rgb(34 197 94)"
                          style={{ filter: "drop-shadow(0 0 5px rgba(34, 197, 94, 0.8))" }}
                        />

                        {/* Línea base del radar */}
                        <line
                          x1={centerX - radarRadius}
                          y1={centerY}
                          x2={centerX + radarRadius}
                          y2={centerY}
                          stroke="rgb(34 197 94)"
                          strokeWidth="2"
                        />
                      </svg>

                      <div className="text-center mt-4">
                        <p className="text-green-400 font-mono text-sm">
                          RANGO: 180° | DISTANCIA MÁXIMA: {maxDistance} cm | OBJETOS: {detectedObjects.length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}