import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import type { AgentState } from '../../lib/types'

const profiles: Record<AgentState, { rotation: number; float: number }> = {
  idle: { rotation: 0.18, float: 0.45 },
  planning: { rotation: 0.22, float: 0.55 },
  waiting_approval: { rotation: 0.05, float: 0.1 },
  executing: { rotation: 0.28, float: 0.65 },
  verifying: { rotation: 0.32, float: 0.72 },
  success: { rotation: 0.14, float: 0.35 },
  failed: { rotation: 0.02, float: 0.05 },
}

type PointerTarget = MutableRefObject<{
  x: number
  y: number
  targetX: number
  targetY: number
  active: number
  targetActive: number
}>

function useWindowPointerTarget() {
  const target = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, active: 0, targetActive: 0 })

  useEffect(() => {
    const update = (event: PointerEvent) => {
      const width = Math.max(window.innerWidth, 1)
      const height = Math.max(window.innerHeight, 1)
      target.current.targetX = (event.clientX / width) * 2 - 1
      target.current.targetY = -(event.clientY / height) * 2 + 1
      target.current.targetActive = 1
    }
    const settle = () => {
      target.current.targetActive = 0
    }
    const tick = () => {
      // Hyper-responsive lerp factor (0.45) for instant zero-lag cursor tracking
      target.current.x = THREE.MathUtils.lerp(target.current.x, target.current.targetX, 0.45)
      target.current.y = THREE.MathUtils.lerp(target.current.y, target.current.targetY, 0.45)
      target.current.active = THREE.MathUtils.lerp(target.current.active, target.current.targetActive, 0.35)
      frame = window.requestAnimationFrame(tick)
    }
    let frame = window.requestAnimationFrame(tick)

    window.addEventListener('pointermove', update, { passive: true })
    window.addEventListener('pointerover', update, { passive: true })
    window.addEventListener('pointerleave', settle)
    window.addEventListener('blur', settle)
    document.addEventListener('visibilitychange', settle)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', update)
      window.removeEventListener('pointerover', update)
      window.removeEventListener('pointerleave', settle)
      window.removeEventListener('blur', settle)
      document.removeEventListener('visibilitychange', settle)
    }
  }, [])

  return target
}

function mobiusPoint(u: number, v: number, radius = 1.72) {
  const half = u * 0.5
  const radial = radius + v * Math.cos(half)
  return new THREE.Vector3(
    radial * Math.cos(u),
    v * Math.sin(half),
    radial * Math.sin(u)
  )
}

function buildClosedMobius(segments = 360, widthSegments = 56, halfWidth = 0.52) {
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const u = t * Math.PI * 2
    for (let j = 0; j <= widthSegments; j++) {
      const s = j / widthSegments
      const p = mobiusPoint(u, -halfWidth + s * halfWidth * 2)
      positions.push(p.x, p.y, p.z)
      uvs.push(t, s)
    }
  }

  for (let i = 0; i < segments; i++) {
    const next = i + 1
    for (let j = 0; j < widthSegments; j++) {
      const a = i * (widthSegments + 1) + j
      const d = i * (widthSegments + 1) + j + 1
      const b = next * (widthSegments + 1) + j
      const c = next * (widthSegments + 1) + j + 1
      indices.push(a, b, d, b, c, d)
    }
  }

  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  g.setIndex(indices)
  g.computeVertexNormals()
  return g
}

const stateColors: Record<AgentState, { body: string; emissive: string; sheen: string }> = {
  idle: { body: '#8899ac', emissive: '#003344', sheen: '#00e5ff' },
  planning: { body: '#b89468', emissive: '#442200', sheen: '#ffaa00' },
  waiting_approval: { body: '#9e4b52', emissive: '#4a080c', sheen: '#ff2b40' },
  executing: { body: '#7e78b8', emissive: '#1a0044', sheen: '#00f5d4' },
  verifying: { body: '#5cae8a', emissive: '#00331a', sheen: '#34d399' },
  success: { body: '#4ade80', emissive: '#0a3a1a', sheen: '#22c55e' },
  failed: { body: '#5c3a3e', emissive: '#3a080c', sheen: '#f43f5e' },
}

function SculpturalStrip({ state, pointerTarget }: { state: AgentState; pointerTarget: PointerTarget }) {
  const strip = useRef<THREE.MeshPhysicalMaterial>(null)
  const geometry = useMemo(() => buildClosedMobius(360, 56), [])
  const palette = stateColors[state] || stateColors.idle

  useFrame(() => {
    const pointer = pointerTarget.current
    if (strip.current) {
      strip.current.color.lerp(new THREE.Color(palette.body), 0.12)
      strip.current.emissive.lerp(new THREE.Color(palette.emissive), 0.12)
      strip.current.sheenColor.lerp(new THREE.Color(palette.sheen), 0.12)
      const baseEmissive = state === 'executing' || state === 'verifying' ? 0.08 : state === 'planning' ? 0.05 : 0.02
      strip.current.emissiveIntensity = baseEmissive + pointer.active * 0.04
    }
  })

  return (
    <mesh geometry={geometry} castShadow>
      <meshPhysicalMaterial
        ref={strip}
        color={palette.body}
        emissive={palette.emissive}
        emissiveIntensity={0.03}
        metalness={0.82}
        roughness={0.18}
        clearcoat={0.85}
        clearcoatRoughness={0.08}
        iridescence={0.15}
        iridescenceIOR={1.25}
        sheen={0.25}
        sheenColor={palette.sheen}
        sheenRoughness={0.3}
        flatShading={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function SignalPath({ state, pointerTarget }: { state: AgentState; pointerTarget: PointerTarget }) {
  const geometry = useMemo(() => buildClosedMobius(360, 4, 0.018), [])
  const signal = useRef<THREE.MeshBasicMaterial>(null)
  const signalColor =
    state === 'success'
      ? '#4ade80'
      : state === 'waiting_approval'
      ? '#ff2b40'
      : state === 'failed'
      ? '#f43f5e'
      : state === 'executing'
      ? '#00f5d4'
      : state === 'verifying'
      ? '#34d399'
      : state === 'planning'
      ? '#ffaa00'
      : '#00e5ff'

  const intensity = state === 'executing' || state === 'verifying' ? 0.95 : state === 'planning' ? 0.75 : 0.55

  useFrame(() => {
    const pointer = pointerTarget.current
    if (signal.current) {
      signal.current.opacity = THREE.MathUtils.lerp(signal.current.opacity, intensity + pointer.active * 0.15, 0.15)
    }
  })

  return (
    <mesh geometry={geometry} renderOrder={2}>
      <meshBasicMaterial
        ref={signal}
        color={signalColor}
        transparent
        opacity={intensity}
        polygonOffset
        polygonOffsetFactor={-2}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function StripRig({ state, pointerTarget }: { state: AgentState; pointerTarget: PointerTarget }) {
  const group = useRef<THREE.Group>(null)
  const profile = profiles[state]

  useFrame(({ clock }, delta) => {
    if (!group.current) return
    const t = clock.getElapsedTime()
    const pointer = pointerTarget.current

    // Fast, buttery-smooth rotational response to cursor position
    group.current.rotation.y += delta * (profile.rotation + Math.abs(pointer.x) * 0.15 + pointer.active * 0.08)
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      0.46 + pointer.y * 0.55 + Math.sin(t * 0.4) * 0.04,
      0.28
    )
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, -0.08 + pointer.x * 0.45, 0.28)

    const breath = 1 + Math.sin(t * 1.2) * 0.015 + pointer.active * 0.035
    group.current.scale.setScalar(breath)
  })

  return (
    <group ref={group} rotation={[0.46, 1.45, -0.08]}>
      <SculpturalStrip state={state} pointerTarget={pointerTarget} />
      <SignalPath state={state} pointerTarget={pointerTarget} />
    </group>
  )
}

function DynamicCursorLight({ pointerTarget }: { pointerTarget: PointerTarget }) {
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame(() => {
    if (lightRef.current) {
      const pointer = pointerTarget.current
      // Instant pointer light tracking casting highlights on Mobius surface
      lightRef.current.position.x = pointer.x * 4.2
      lightRef.current.position.y = pointer.y * 3.2
      lightRef.current.position.z = 3.2
    }
  })

  return <pointLight ref={lightRef} intensity={4.5} color="#00e5ff" distance={9} />
}

function CoreAssembly({ state, pointerTarget }: { state: AgentState; pointerTarget: PointerTarget }) {
  return (
    <Float speed={profiles[state].float} rotationIntensity={0.12} floatIntensity={0.18} floatingRange={[-0.06, 0.06]}>
      <group position={[0, 0.18, 0]} scale={0.96}>
        <mesh scale={0.72}>
          <sphereGeometry args={[0.72, 48, 48]} />
          <meshBasicMaterial color="#00e5ff" transparent opacity={0.03} depthWrite={false} />
        </mesh>
        <StripRig state={state} pointerTarget={pointerTarget} />
      </group>
    </Float>
  )
}

function CameraEase({ dimmed, pointerTarget }: { dimmed: boolean; pointerTarget: PointerTarget }) {
  const { camera } = useThree()

  useFrame(() => {
    const pointer = pointerTarget.current
    const x = pointer.x * (dimmed ? 0.2 : 0.55)
    const y = pointer.y * (dimmed ? 0.15 : 0.38)
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, x, 0.18)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, y, 0.18)
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, (dimmed ? 7.05 : 7.25) - pointer.active * 0.35, 0.15)
    camera.lookAt(0, 0.12, 0)
  })

  return null
}

export function MobiusScene({ state, dimmed = false }: { state: AgentState; dimmed?: boolean }) {
  const pointerTarget = useWindowPointerTarget()
  const reducedMotion = useReducedMotion()

  return (
    <div className={dimmed ? 'mobius-canvas dimmed' : 'mobius-canvas'} data-state={state}>
      <div className="mobius-ambient" aria-hidden="true">
        <span />
        <span />
      </div>
      <Canvas
        aria-label={`Animated Mobius strip showing VELIKY ${state.replace('_', ' ')} state`}
        frameloop={reducedMotion ? 'demand' : 'always'}
        camera={{ position: [0, 0.08, 7.0], fov: 32 }}
        dpr={[1, 2]}
        performance={{ min: 0.7 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.15
        }}
        shadows
      >
        <CameraEase dimmed={dimmed} pointerTarget={pointerTarget} />
        <fog attach="fog" args={['#050508', 6.5, 10]} />
        <ambientLight intensity={0.35} />
        <hemisphereLight args={['#ffffff', '#050508', 1.2]} />
        <directionalLight position={[4, 5.5, 5.5]} intensity={4.0} color="#ffffff" castShadow />
        <directionalLight position={[-4, -2, 2]} intensity={1.5} color="#00e5ff" />
        <DynamicCursorLight pointerTarget={pointerTarget} />
        <pointLight
          position={[2.5, 0.2, 2.8]}
          intensity={state === 'verifying' ? 5.5 : 3.8}
          color={state === 'success' ? '#22c55e' : state === 'waiting_approval' ? '#ff2b40' : '#e10600'}
          distance={8}
        />
        <CoreAssembly state={state} pointerTarget={pointerTarget} />
      </Canvas>
    </div>
  )
}
