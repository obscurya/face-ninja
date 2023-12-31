import { FaceLandmarker } from '@mediapipe/tasks-vision'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import FaceControls from './FaceControls/FaceControls'

export const createScene = (faceControls: FaceControls) => {
  const halfDiagonalFov = faceControls.camera.diagonalFov / 2
  const aspectRatio = faceControls.camera.width / faceControls.camera.height
  const verticalFov =
    2 *
    Math.atan(Math.tan(halfDiagonalFov) * Math.sin(Math.atan(1 / aspectRatio)))
  const camera = new THREE.PerspectiveCamera(
    THREE.MathUtils.radToDeg(verticalFov),
    aspectRatio,
    0.1,
    faceControls.camera.focalLength * 5
  )

  camera.position.setZ(-faceControls.camera.focalLength)
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
    new THREE.MeshNormalMaterial({
      side: THREE.DoubleSide,
    })
  )

  // const face = new THREE.Mesh(
  //   faceGeometry,
  //   new THREE.MeshStandardMaterial({
  //     side: THREE.DoubleSide,
  //     color: 0xed4344,
  //     flatShading: true,
  //   })
  // )

  scene.add(face)

  // const light = new THREE.DirectionalLight(0xffffff)

  // light.lookAt(0, 0, 0)
  // light.position.setZ(-1)

  // scene.add(light)

  // const ambient = new THREE.AmbientLight(0xffffff, 0.5)

  // scene.add(ambient)

  const direction = new THREE.ArrowHelper(
    new THREE.Vector3(),
    new THREE.Vector3(),
    50,
    // 1000,
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

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(),
    new THREE.MeshBasicMaterial({
      color: 0xfff200,
      side: THREE.DoubleSide,
    })
  )

  screen.position.setZ(-faceControls.camera.focalLength)
  scene.add(screen)

  const render = () => {
    face.geometry.setFromPoints(faceControls.tracker.points)
    face.geometry.computeVertexNormals()

    direction.position.copy(faceControls.tracker.ray.origin)
    direction.setDirection(faceControls.tracker.ray.direction)

    target.position.copy(faceControls.tracker.intersection)

    screen.position.setX(faceControls.screen.center.x)
    screen.position.setY(faceControls.screen.center.y)
    screen.scale.copy(faceControls.screen.halfScale).multiplyScalar(2)

    renderer.render(scene, camera)

    requestAnimationFrame(render)
  }

  render()
}
