import { useLayoutEffect, useRef, type RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import { Box3, Euler, MathUtils, Matrix4, PerspectiveCamera, Quaternion, Vector3 } from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  MACBOOK_FINAL_FRAMING, MACBOOK_INITIAL_POSE, MACBOOK_LANDED_POSE, MACBOOK_OPEN_ROTATION,
  MACBOOK_SPIN_POSE, MACBOOK_TIMING, macbookStage,
  type MacbookController, type MacbookRig, type MacbookSnapshot,
} from './macbook-config.ts'

gsap.registerPlugin(ScrollTrigger)

type Props = {
  rig: MacbookRig
  scrollRef: RefObject<HTMLElement | null>
  copyRef: RefObject<HTMLHeadingElement | null>
  anchorRef: RefObject<HTMLDivElement | null>
  controllerRef: RefObject<MacbookController | null>
  onSnapshot: (snapshot: MacbookSnapshot) => void
  introReady: boolean
  paused: boolean
  reducedMotion: boolean
}

export default function MacbookAnimation({
  rig, scrollRef, copyRef, anchorRef, controllerRef, onSnapshot, introReady, paused, reducedMotion,
}: Props) {
  const { camera, invalidate, size } = useThree()
  const pauseRef = useRef(paused)
  const updateRef = useRef<((forcePublish?: boolean) => void) | null>(null)
  const introTweenRef = useRef<gsap.core.Tween | null>(null)
  pauseRef.current = paused

  useLayoutEffect(() => {
    const section = scrollRef.current
    const copy = copyRef.current
    const anchor = anchorRef.current
    if (!section || !copy || !anchor || !(camera instanceof PerspectiveCamera)) return
    const story = section.nextElementSibling

    const pose: { progress: number; height: number; x: number; z: number; rotationX: number; rotationY: number; rotationZ: number } = {
      progress: 0, ...MACBOOK_INITIAL_POSE,
    }
    const pointer = { x: 0, y: 0 }
    const floorBounds = new Box3()
    const rotation = new Matrix4()
    const cameraTarget = new Vector3(0, MACBOOK_INITIAL_POSE.height, 0)
    const cameraDirection = new Vector3(0.12, 0.44, 0.89).normalize()
    const frontRotation = new Euler(MACBOOK_INITIAL_POSE.rotationX, MACBOOK_INITIAL_POSE.rotationY, MACBOOK_INITIAL_POSE.rotationZ)
    const frontBounds = rig.baseBounds.clone().applyMatrix4(new Matrix4().makeRotationFromEuler(frontRotation))
    // Look horizontally into the front seam of the closed laptop, at display height.
    const closedSeamHeight = rig.hinge.position.y + rig.screen.position.y
    const frontTarget = new Vector3(0, MACBOOK_INITIAL_POSE.height - frontBounds.min.y + 0.002 + closedSeamHeight, 0)
    const frontDirection = new Vector3(0, 0, 1)
    const motionTarget = cameraTarget.clone()
    const motionDirection = cameraDirection.clone()
    const displayTarget = new Vector3()
    const displayDirection = new Vector3()
    const displayRotation = new Quaternion()
    const cameraPosition = new Vector3()
    const landingCopy = section.querySelectorAll<HTMLElement>('[data-landing-item]')
    const stage = anchor.closest('.macbook-test__stage')!.getBoundingClientRect()
    const anchorBox = anchor.getBoundingClientRect()
    const anchorX = anchorBox.left + anchorBox.width / 2 - stage.left
    const anchorY = anchorBox.top + anchorBox.height / 2 - stage.top
    const aspect = size.width / Math.max(size.height, 1)
    const fov = 38
    const distance = 0.48 * size.width / Math.max(anchorBox.width, 1) / (2 * Math.tan(MathUtils.degToRad(fov / 2)) * aspect)
    let lastPublish = -Infinity
    let trigger: ScrollTrigger | undefined
    let timeline: gsap.core.Timeline | undefined
    let pointerTween: gsap.core.Tween | undefined

    const publish = (force = false) => {
      const now = performance.now()
      if (!force && now - lastPublish < 100) return
      lastPublish = now
      const modelVisible = rig.presentation.visible && rig.presentation.scale.x > 0.1
      onSnapshot({
        scrollProgress: trigger?.progress ?? 0,
        animationProgress: pose.progress,
        hingeDegrees: -MathUtils.radToDeg(rig.hinge.rotation.x),
        height: pose.height,
        rotationDegrees: MathUtils.radToDeg(pose.rotationY - MACBOOK_INITIAL_POSE.rotationY),
        modelVisible,
        screenBrightness: rig.screenMaterial.color.r,
        frontView: !reducedMotion && pose.progress <= MACBOOK_TIMING.liftStart,
        stage: reducedMotion ? '모션 줄이기 · 서비스 화면' : modelVisible ? macbookStage(pose.progress) : '문구 타이핑',
      })
    }

    const updateView = (forcePublish = false) => {
      const viewBlend = reducedMotion ? 1 : MathUtils.smoothstep(pose.progress, MACBOOK_TIMING.liftStart, MACBOOK_TIMING.spinStart)
      const framingBlend = reducedMotion ? 1 : MathUtils.smoothstep(pose.progress, MACBOOK_TIMING.framingStart, MACBOOK_TIMING.framingStart + MACBOOK_TIMING.framingDuration)
      const pointerWeight = viewBlend * (1 - framingBlend)
      rig.root.rotation.set(pose.rotationX + pointer.y * 0.05 * pointerWeight, pose.rotationY + pointer.x * 0.08 * pointerWeight, pose.rotationZ)
      // The Base bounds provide floor contact without deforming any model geometry.
      rotation.makeRotationFromEuler(rig.root.rotation)
      floorBounds.copy(rig.baseBounds).applyMatrix4(rotation)
      rig.root.position.set(pose.x + pointer.x * 0.008 * pointerWeight, pose.height - floorBounds.min.y + 0.002, pose.z)
      rig.root.updateMatrixWorld(true)
      cameraTarget.lerpVectors(frontTarget, motionTarget, viewBlend)
      cameraDirection.lerpVectors(frontDirection, motionDirection, viewBlend).normalize()
      let cameraDistance = distance * MathUtils.lerp(1, 0.94, pose.progress)
      if (framingBlend > 0) {
        // Face the actual screen horizontally, with room below for the front case.
        rig.screen.getWorldPosition(displayTarget)
        displayTarget.y += MACBOOK_FINAL_FRAMING.targetOffsetY
        rig.screen.getWorldQuaternion(displayRotation)
        displayDirection.set(0, -1, 0).applyQuaternion(displayRotation)
        displayDirection.y = 0
        displayDirection.normalize()
        cameraTarget.lerp(displayTarget, framingBlend)
        cameraDirection.lerp(displayDirection, framingBlend).normalize()
        // Fit the closest part of the body too; the screen sits farther from the camera.
        const finalWidth = Math.max(anchorBox.width * MACBOOK_FINAL_FRAMING.widthRatio, 1)
        const frontDepth = Math.max(0, floorBounds.max.z + rig.root.position.z - displayTarget.z)
        const finalDistance = (floorBounds.max.x - floorBounds.min.x) * size.width / finalWidth
          / (2 * Math.tan(MathUtils.degToRad(MACBOOK_FINAL_FRAMING.fov / 2)) * aspect) + frontDepth
        cameraDistance = MathUtils.lerp(cameraDistance, finalDistance, framingBlend)
      }
      cameraPosition.copy(cameraTarget).addScaledVector(cameraDirection, cameraDistance)
      camera.position.copy(cameraPosition)
      camera.up.set(0, 1, 0)
      camera.fov = MathUtils.lerp(fov, MACBOOK_FINAL_FRAMING.fov, framingBlend)
      camera.near = 0.001
      camera.far = 20
      camera.setViewOffset(size.width, size.height, size.width / 2 - anchorX, size.height / 2 - anchorY, size.width, size.height)
      camera.lookAt(cameraTarget)
      camera.updateProjectionMatrix()
      invalidate()
      publish(forcePublish)
    }

    const context = gsap.context(() => {
      rig.hinge.rotation.x = reducedMotion ? MACBOOK_OPEN_ROTATION : 0
      rig.screenMaterial.color.setRGB(reducedMotion ? 1 : 0, reducedMotion ? 1 : 0, reducedMotion ? 1 : 0)
      if (reducedMotion) {
        Object.assign(pose, { height: 0, ...MACBOOK_LANDED_POSE })
        gsap.set(landingCopy, { autoAlpha: 1, y: 0 })
        updateView()
        return
      }
      timeline = gsap.timeline({ defaults: { ease: 'none' }, onUpdate: updateView })
      timeline.to(pose, { progress: 1, duration: 1 }, 0)
      timeline.to(pose, {
        height: 0.095, x: -0.018, rotationX: 0.04, rotationY: 0.14, rotationZ: 0.04,
        duration: MACBOOK_TIMING.liftDuration, ease: 'power2.out',
      }, MACBOOK_TIMING.liftStart)
      timeline.to(pose, {
        height: 0.055, x: 0.018, z: 0.006, ...MACBOOK_SPIN_POSE,
        duration: MACBOOK_TIMING.spinDuration, ease: 'power1.inOut',
      }, MACBOOK_TIMING.spinStart)
      timeline.to(pose, { height: 0, x: 0, z: 0, duration: MACBOOK_TIMING.landDuration, ease: 'power2.inOut' }, MACBOOK_TIMING.landStart)
      timeline.to(pose, { ...MACBOOK_LANDED_POSE, duration: MACBOOK_TIMING.framingDuration, ease: 'power2.inOut' }, MACBOOK_TIMING.framingStart)
      timeline.to(rig.hinge.rotation, { x: MACBOOK_OPEN_ROTATION, duration: MACBOOK_TIMING.openDuration, ease: 'power2.inOut' }, MACBOOK_TIMING.openStart)
      timeline.to(rig.screenMaterial.color, { r: 1, g: 1, b: 1, duration: MACBOOK_TIMING.screenDuration }, MACBOOK_TIMING.screenStart)
      timeline.to(copy, { autoAlpha: 0, y: -24, duration: 0.16 }, 0.14)
      timeline.fromTo(landingCopy, { autoAlpha: 0, y: 12 }, {
        autoAlpha: 1, y: 0, duration: MACBOOK_TIMING.copyDuration,
        stagger: MACBOOK_TIMING.copyStagger, ease: 'power2.out',
      }, MACBOOK_TIMING.copyStart)
      timeline.to(section.querySelector('.macbook-test__hint-scroll'), { autoAlpha: 0, duration: 0.12 }, 0.12)
      trigger = ScrollTrigger.create({
        id: 'macbook-test', trigger: section, start: 'top top',
        // Finish before the next section enters, then hold while the sticky stage releases.
        endTrigger: story ?? section,
        end: story ? () => `top ${Math.max(window.innerHeight, stage.height)}px` : 'bottom bottom',
        animation: timeline, scrub: MACBOOK_TIMING.scrub,
        invalidateOnRefresh: true,
        onUpdate: () => publish(), onScrubComplete: () => publish(true),
        onRefresh: () => { updateView(); publish(true) },
      })
      if (pauseRef.current) trigger.disable(false)
      updateView()
    }, section)
    updateRef.current = updateView

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || pauseRef.current || reducedMotion || !rig.presentation.visible) return
      const rect = section.querySelector('.macbook-test__stage')!.getBoundingClientRect()
      pointerTween?.kill()
      pointerTween = gsap.to(pointer, {
        x: MathUtils.clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1),
        y: MathUtils.clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1),
        duration: 0.35, ease: 'power2.out', onUpdate: updateView,
      })
    }
    const onPointerLeave = () => {
      if (pauseRef.current || reducedMotion) return
      pointerTween?.kill()
      pointerTween = gsap.to(pointer, { x: 0, y: 0, duration: 0.35, onUpdate: updateView })
    }
    if (!reducedMotion) {
      section.addEventListener('pointermove', onPointerMove)
      section.addEventListener('pointerleave', onPointerLeave)
    }
    const controller: MacbookController = {
      setPaused: value => {
        introTweenRef.current?.paused(value)
        if (value) { trigger?.disable(false); pointerTween?.pause() }
        else { pointerTween?.resume(); trigger?.enable(false, false); trigger?.update() }
        publish(true)
      },
      reset: () => {
        window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY, behavior: 'instant' })
        pointerTween?.kill()
        pointer.x = 0
        pointer.y = 0
        trigger?.enable(false, false)
        trigger?.getTween()?.pause()
        timeline?.progress(0)
        trigger?.update()
        updateView()
        publish(true)
      },
    }
    controllerRef.current = controller
    const refreshFrame = window.requestAnimationFrame(() => trigger?.refresh())
    return () => {
      window.cancelAnimationFrame(refreshFrame)
      section.removeEventListener('pointermove', onPointerMove)
      section.removeEventListener('pointerleave', onPointerLeave)
      pointerTween?.kill()
      if (controllerRef.current === controller) controllerRef.current = null
      if (updateRef.current === updateView) updateRef.current = null
      context.revert()
      camera.clearViewOffset()
      invalidate()
    }
  }, [rig, camera, invalidate, size.width, size.height, scrollRef, copyRef, anchorRef, controllerRef, onSnapshot, reducedMotion])

  useLayoutEffect(() => {
    introTweenRef.current?.kill()
    rig.presentation.visible = introReady || reducedMotion
    rig.presentation.scale.setScalar(reducedMotion ? 1 : 0.001)
    updateRef.current?.(true)
    if (introReady && !reducedMotion) {
      introTweenRef.current = gsap.to(rig.presentation.scale, {
        x: 1, y: 1, z: 1, duration: 0.8, ease: 'power3.out',
        paused: pauseRef.current, onUpdate: () => updateRef.current?.(),
        onComplete: () => updateRef.current?.(true),
      })
    }
    return () => { introTweenRef.current?.kill(); introTweenRef.current = null }
  }, [rig, introReady, reducedMotion])

  useLayoutEffect(() => { controllerRef.current?.setPaused(paused) }, [paused, controllerRef])
  return null
}
