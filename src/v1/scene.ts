import { FaceLandmarker } from '@mediapipe/tasks-vision'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import FaceControls from './FaceControls/FaceControls'

export const createScene = (faceControls: FaceControls) => {
  const aspectRatio = faceControls.camera.width / faceControls.camera.height
  const camera = new THREE.PerspectiveCamera(50, aspectRatio, 0.1, 2000)

  camera.position.setZ(-800)
  camera.lookAt(new THREE.Vector3(0))

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  })

  renderer.setSize(faceControls.camera.width, faceControls.camera.height)

  faceControls.container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()

  scene.scale.set(-1, -1, 1)

  new OrbitControls(camera, renderer.domElement)

  const faceGeometry = new THREE.BufferGeometry()

  faceGeometry.setIndex(
    FaceLandmarker.FACE_LANDMARKS_TESSELATION.map(({ start }) => start)
  )

  const face = new THREE.Mesh(
    faceGeometry,
    // new THREE.MeshNormalMaterial({
    //   side: THREE.DoubleSide,
    // })
    new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      color: 0x000000,
      wireframe: true,
    })
  )

  scene.add(face)

  const render = () => {
    face.geometry.setFromPoints(faceControls.tracker.points)
    face.geometry.computeVertexNormals()

    renderer.render(scene, camera)

    requestAnimationFrame(render)
  }

  render()
}
