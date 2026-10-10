import { useLayoutEffect, useRef, type RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import { MathUtils, PerspectiveCamera, Vector3 } from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  MACBOOK_FRONT_VIEW, MACBOOK_OPEN_ROTATION, MACBOOK_TIMING, macbookStage,
  type MacbookRig, type MacbookSnapshot,
} from './macbook-config.ts'

gsap.registerPlugin(ScrollTrigger)

type Props = {
  rig: MacbookRig
  scrollRef: RefObject<HTMLElement | null>
  copyRef: RefObject<HTMLHeadingElement | null>
  anchorRef: RefObject<HTMLDivElement | null>
  onSnapshot: (snapshot: MacbookSnapshot) => void
  introReady: boolean
  reducedMotion: boolean
}

export default function MacbookAnimation({
  rig, scrollRef, copyRef, anchorRef, onSnapshot, introReady, reducedMotion,
}: Props) {
  const { camera, invalidate, size } = useThree()
  const updateRef = useRef<((forcePublish?: boolean) => void) | null>(null)
  const introTweenRef = useRef<gsap.core.Tween | null>(null)

  useLayoutEffect(() => {
    const section = scrollRef.current
    const copy = copyRef.current
    const anchor = anchorRef.current
    if (!section || !copy || !anchor || !(camera instanceof PerspectiveCamera)) return
    const story = section.nextElementSibling

    const pose = { progress: 0 }
    // Keep the base in one place; only the hinge is animated.
    const baseHeight = -rig.baseBounds.min.y + 0.002
    rig.root.rotation.set(0, 0, 0)
    rig.root.position.set(0, baseHeight, 0)
    // Frame the fully open screen once so the camera stays still as the lid opens.
    const originalHingeAngle = rig.hinge.rotation.x
    rig.hinge.rotation.x = MACBOOK_OPEN_ROTATION
    rig.root.updateMatrixWorld(true)
    const cameraTarget = rig.root.worldToLocal(rig.screen.getWorldPosition(new Vector3()))
    cameraTarget.add(rig.root.position)
    cameraTarget.y += MACBOOK_FRONT_VIEW.targetOffsetY
    rig.hinge.rotation.x = originalHingeAngle
    rig.root.updateMatrixWorld(true)
    const landingCopy = section.querySelectorAll<HTMLElement>('[data-landing-item]')
    const stage = anchor.closest('.macbook-landing__stage')!.getBoundingClientRect()
    const anchorBox = anchor.getBoundingClientRect()
    const anchorX = anchorBox.left + anchorBox.width / 2 - stage.left
    const anchorY = anchorBox.top + anchorBox.height / 2 - stage.top
    const aspect = size.width / Math.max(size.height, 1)
    const finalWidth = Math.max(anchorBox.width * MACBOOK_FRONT_VIEW.widthRatio, 1)
    const frontDepth = Math.max(0, rig.baseBounds.max.z + rig.root.position.z - cameraTarget.z)
    const distance = (rig.baseBounds.max.x - rig.baseBounds.min.x) * size.width / finalWidth
      / (2 * Math.tan(MathUtils.degToRad(MACBOOK_FRONT_VIEW.fov / 2)) * aspect) + frontDepth
    camera.position.copy(cameraTarget).add(new Vector3(0, 0, distance))
    camera.up.set(0, 1, 0)
    camera.fov = MACBOOK_FRONT_VIEW.fov
    camera.near = 0.001
    camera.far = 20
    camera.setViewOffset(size.width, size.height, size.width / 2 - anchorX, size.height / 2 - anchorY, size.width, size.height)
    camera.lookAt(cameraTarget)
    camera.updateProjectionMatrix()
    let lastPublish = -Infinity
    let trigger: ScrollTrigger | undefined
    let timeline: gsap.core.Timeline | undefined

    const publish = (force = false) => {
      const now = performance.now()
      if (!force && now - lastPublish < 100) return
      lastPublish = now
      const modelVisible = rig.presentation.visible && rig.presentation.scale.x > 0.1
      onSnapshot({
        scrollProgress: trigger?.progress ?? 0,
        animationProgress: pose.progress,
        hingeDegrees: -MathUtils.radToDeg(rig.hinge.rotation.x),
        height: rig.root.position.y - baseHeight,
        rotationDegrees: MathUtils.radToDeg(rig.root.rotation.y),
        modelVisible,
        screenBrightness: rig.screenMaterial.color.r,
        frontView: rig.root.rotation.x === 0 && rig.root.rotation.y === 0 && rig.root.rotation.z === 0
          && camera.position.x === cameraTarget.x && camera.position.y === cameraTarget.y,
        stage: reducedMotion ? '모션 줄이기 · 서비스 화면' : modelVisible ? macbookStage(pose.progress) : '문구 타이핑',
      })
    }

    const updateView = (forcePublish = false) => {
      rig.root.updateMatrixWorld(true)
      invalidate()
      publish(forcePublish)
    }

    const context = gsap.context(() => {
      rig.hinge.rotation.x = reducedMotion ? MACBOOK_OPEN_ROTATION : 0
      rig.screenMaterial.color.setRGB(reducedMotion ? 1 : 0, reducedMotion ? 1 : 0, reducedMotion ? 1 : 0)
      if (reducedMotion) {
        pose.progress = 1
        gsap.set(landingCopy, { autoAlpha: 1, y: 0 })
        updateView()
        return
      }
      timeline = gsap.timeline({ defaults: { ease: 'none' }, onUpdate: updateView })
      timeline.to(pose, { progress: 1, duration: 1 }, 0)
      timeline.to(rig.hinge.rotation, { x: MACBOOK_OPEN_ROTATION, duration: MACBOOK_TIMING.openDuration, ease: 'power1.inOut' }, MACBOOK_TIMING.openStart)
      timeline.to(rig.screenMaterial.color, { r: 1, g: 1, b: 1, duration: MACBOOK_TIMING.screenDuration }, MACBOOK_TIMING.screenStart)
      timeline.fromTo(landingCopy, { autoAlpha: 0, y: 12 }, {
        autoAlpha: 1, y: 0, duration: MACBOOK_TIMING.copyDuration,
        stagger: MACBOOK_TIMING.copyStagger, ease: 'power2.out',
      }, MACBOOK_TIMING.copyStart)
      timeline.to(section.querySelector('.macbook-landing__hint-scroll'), { autoAlpha: 0, duration: 0.12 }, 0.12)
      trigger = ScrollTrigger.create({
        id: 'macbook-landing', trigger: section, start: 'top top',
        // Keep the opening distance unchanged, then spend extra scroll on the finished hero.
        endTrigger: story ?? section,
        end: story ? () => {
          const hold = Number.parseFloat(getComputedStyle(section).getPropertyValue('--macbook-exit-hold')) || 0
          return `top ${Math.max(window.innerHeight, stage.height) + hold}px`
        } : 'bottom bottom',
        animation: timeline, scrub: MACBOOK_TIMING.scrub,
        invalidateOnRefresh: true,
        onUpdate: () => publish(), onScrubComplete: () => publish(true),
        onRefresh: () => { updateView(); publish(true) },
      })
      updateView()
    }, section)
    updateRef.current = updateView

    const refreshFrame = window.requestAnimationFrame(() => trigger?.refresh())
    return () => {
      window.cancelAnimationFrame(refreshFrame)
      if (updateRef.current === updateView) updateRef.current = null
      context.revert()
      camera.clearViewOffset()
      invalidate()
    }
  }, [rig, camera, invalidate, size.width, size.height, scrollRef, copyRef, anchorRef, onSnapshot, reducedMotion])

  useLayoutEffect(() => {
    introTweenRef.current?.kill()
    rig.presentation.visible = introReady || reducedMotion
    rig.presentation.scale.setScalar(reducedMotion ? 1 : 0.001)
    updateRef.current?.(true)
    if (introReady && !reducedMotion) {
      introTweenRef.current = gsap.to(rig.presentation.scale, {
        x: 1, y: 1, z: 1, duration: 0.8, ease: 'power3.out',
        onUpdate: () => updateRef.current?.(),
        onComplete: () => updateRef.current?.(true),
      })
    }
    return () => { introTweenRef.current?.kill(); introTweenRef.current = null }
  }, [rig, introReady, reducedMotion])

  return null
}
