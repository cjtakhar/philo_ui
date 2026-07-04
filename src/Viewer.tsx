import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'

export default function Viewer({ stlUrl }: { stlUrl: string }) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x16181d)

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      5000,
    )
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const key = new THREE.DirectionalLight(0xffffff, 1.4)
    key.position.set(1, 2, 1.5)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0x8899ff, 0.4)
    fill.position.set(-2, -1, -1)
    scene.add(fill)

    new STLLoader().load(stlUrl, (geometry) => {
      geometry.center()
      geometry.computeVertexNormals()
      const material = new THREE.MeshStandardMaterial({
        color: 0x7aa2f7,
        metalness: 0.35,
        roughness: 0.45,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.rotation.x = -Math.PI / 2 // Z-up CAD coordinates → three.js Y-up
      scene.add(mesh)

      geometry.computeBoundingSphere()
      const r = geometry.boundingSphere?.radius ?? 100
      camera.position.set(r * 1.7, r * 1.3, r * 1.7)
      camera.lookAt(0, 0, 0)

      const grid = new THREE.GridHelper(r * 4, 20, 0x30343c, 0x22252b)
      grid.position.y = -r * 0.7
      scene.add(grid)
      controls.update()
    })

    let raf = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      controls.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [stlUrl])

  return <div ref={mountRef} className="viewer" />
}
