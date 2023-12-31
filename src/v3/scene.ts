import { FaceLandmarker } from '@mediapipe/tasks-vision'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import FaceControls from './FaceControls/FaceControls'

const diagonalToVerticalFov = (diagonalFov: number, aspectRatio: number) =>
  THREE.MathUtils.radToDeg(
    2 *
      Math.atan(
        Math.tan(diagonalFov / 2) * Math.sin(Math.atan(1 / aspectRatio))
      )
  )

export const createScene = (faceControls: FaceControls) => {
  const verticalFov = diagonalToVerticalFov(
    faceControls.camera.diagonalFov,
    faceControls.camera.aspectRatio
  )
  const camera = new THREE.PerspectiveCamera(
    verticalFov,
    faceControls.camera.aspectRatio,
    0.1,
    faceControls.camera.focalLength * 5
  )

  camera.position.setZ(faceControls.camera.focalLength)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  })

  renderer.setSize(faceControls.camera.width, faceControls.camera.height)

  faceControls.container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()

  new OrbitControls(camera, renderer.domElement)

  const faceGeometry = new THREE.BufferGeometry()

  faceGeometry.setIndex(
    FaceLandmarker.FACE_LANDMARKS_TESSELATION.map(({ start }) => start)
  )

  const face = new THREE.Mesh(
    faceGeometry,
    new THREE.MeshNormalMaterial({
      side: THREE.DoubleSide,
    })
  )

  scene.add(face)

  const direction = new THREE.ArrowHelper(
    new THREE.Vector3(),
    new THREE.Vector3(),
    50,
    0xed4344,
    15,
    10
  )

  face.add(direction)

  const cameraClone = camera.clone()

  cameraClone.far = faceControls.camera.focalLength

  const cameraHelper = new THREE.CameraHelper(cameraClone)

  scene.add(cameraHelper)

  const target = new THREE.Mesh(
    new THREE.SphereGeometry(10),
    new THREE.MeshBasicMaterial({
      color: 0xed4344,
      side: THREE.DoubleSide,
    })
  )

  scene.add(target)

  const render = () => {
    face.geometry.setFromPoints(faceControls.tracker.points)
    face.geometry.computeVertexNormals()

    direction.position.copy(faceControls.tracker.ray.origin)
    direction.setDirection(faceControls.tracker.ray.direction)

    target.position.copy(faceControls.tracker.intersection)

    renderer.render(scene, camera)

    requestAnimationFrame(render)
  }

  render()
}
