import { Component, Suspense, useCallback, useEffect, useState, type ReactNode, type RefObject } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import MacbookModel from './MacbookModel.tsx'
import MacbookAnimation from './MacbookAnimation.tsx'
import type { MacbookController, MacbookLoadStatus, MacbookRig, MacbookSnapshot } from './macbook-config.ts'

type Props = {
  scrollRef: RefObject<HTMLElement | null>
  copyRef: RefObject<HTMLHeadingElement | null>
  anchorRef: RefObject<HTMLDivElement | null>
  controllerRef: RefObject<MacbookController | null>
  onSnapshot: (snapshot: MacbookSnapshot) => void
  onStatusChange: (status: MacbookLoadStatus) => void
  paused: boolean
  introReady: boolean
  reducedMotion: boolean
  mobile: boolean
}

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch() { this.props.onError() }
  render() {
    if (this.state.error) {
      return (
        <div className="macbook-test__scene-error" role="alert">
          <strong>3D 장면을 불러오지 못했어요.</strong>
          <p>WebGL 지원과 모델·이미지 경로를 확인해주세요.</p>
          <button type="button" onClick={() => window.location.reload()}>다시 불러오기</button>
        </div>
      )
    }
    return this.props.children
  }
}

function WebGLFallback({ onError }: { onError: () => void }) {
  useEffect(onError, [onError])
  return <div className="macbook-test__scene-error" role="alert">이 브라우저에서는 WebGL을 사용할 수 없습니다.</div>
}

export default function MacbookScene(props: Props) {
  const [rig, setRig] = useState<MacbookRig | null>(null)
  const onReady = useCallback((value: MacbookRig | null) => {
    setRig(value)
    props.onStatusChange(value ? 'ready' : 'loading')
  }, [props.onStatusChange])
  const onError = useCallback(() => props.onStatusChange('error'), [props.onStatusChange])

  return (
    <SceneBoundary onError={onError}>
      <Canvas
        className="macbook-test__canvas"
        frameloop="demand"
        dpr={props.mobile ? [1, 1.25] : [1, 1.5]}
        shadows={false}
        camera={{ position: [0, 0.306, 1.5], fov: 38, near: 0.001, far: 20 }}
        gl={{ antialias: true, powerPreference: 'low-power', alpha: true }}
        fallback={<WebGLFallback onError={onError} />}
        onCreated={({ gl }) => { gl.setClearColor('#292929', 0) }}
        aria-label="스크롤로 펼쳐지는 MacBook 3D 미리보기"
      >
        <ambientLight intensity={0.35} />
        <hemisphereLight args={['#e6dcff', '#252234', 0.8]} />
        <directionalLight position={[0.35, 0.85, 0.5]} intensity={2} />
        <Environment resolution={props.mobile ? 64 : 128} frames={1}>
          <Lightformer form="rect" intensity={2.5} position={[0, 4, -2]} rotation={[Math.PI / 2, 0, 0]} scale={[5, 5, 1]} />
          <Lightformer form="rect" intensity={3} position={[-3, 1, 2]} rotation={[0, Math.PI / 3, 0]} scale={[3, 5, 1]} />
          <Lightformer form="rect" intensity={1.5} position={[3, 1, 1]} rotation={[0, -Math.PI / 3, 0]} scale={[3, 3, 1]} />
        </Environment>
        <Suspense fallback={null}>
          <MacbookModel onReady={onReady} />
          {rig && <MacbookAnimation {...props} rig={rig} />}
        </Suspense>
      </Canvas>
    </SceneBoundary>
  )
}
