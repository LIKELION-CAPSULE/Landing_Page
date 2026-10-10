import { useEffect, useMemo } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Box3, Group, Mesh, MeshBasicMaterial, SRGBColorSpace } from 'three'
import { MACBOOK_MODEL_URL, MACBOOK_PREVIEW_URL, type MacbookRig } from './macbook-config.ts'

type Props = { onReady: (rig: MacbookRig | null) => void }

export default function MacbookModel({ onReady }: Props) {
  const gl = useThree(state => state.gl)
  // Drei caches the source assets. Only transforms and the display material belong to this instance.
  const gltf = useGLTF(MACBOOK_MODEL_URL)
  const sourceTexture = useTexture(MACBOOK_PREVIEW_URL)
  const rig = useMemo<MacbookRig>(() => {
    const scene = gltf.scene.clone(true)
    const root = scene.getObjectByName('MacBook')
    const hinge = scene.getObjectByName('Lid_Hinge')
    const screen = scene.getObjectByName('Screen_Display')
    const base = scene.getObjectByName('Base')
    if (!root || !hinge || !base || !(screen instanceof Mesh)) {
      throw new Error('GLB에 MacBook, Lid_Hinge, Screen_Display가 필요합니다.')
    }
    const previewTexture = sourceTexture.clone()
    previewTexture.flipY = false
    previewTexture.colorSpace = SRGBColorSpace
    previewTexture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
    previewTexture.needsUpdate = true
    const screenMaterial = new MeshBasicMaterial({
      map: previewTexture,
      color: 0x000000,
      toneMapped: false,
    })
    root.updateMatrixWorld(true)
    const baseBounds = new Box3().setFromObject(base)
    const presentation = new Group()
    presentation.add(root)
    presentation.visible = false
    hinge.rotation.x = 0
    root.traverse(object => {
      if (object instanceof Mesh) {
        object.castShadow = false
        object.receiveShadow = false
      }
    })
    return { root, presentation, baseBounds, hinge, screen, screenMaterial, previewTexture }
  }, [gltf.scene, sourceTexture, gl])

  useEffect(() => {
    const originalMaterial = rig.screen.material
    rig.screen.material = rig.screenMaterial
    rig.previewTexture.needsUpdate = true
    onReady(rig)
    return () => {
      onReady(null)
      rig.screen.material = originalMaterial
      rig.screenMaterial.dispose()
      rig.previewTexture.dispose()
    }
  }, [rig, onReady])

  return <primitive object={rig.presentation} dispose={null} />
}
