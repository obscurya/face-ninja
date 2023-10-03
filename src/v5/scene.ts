import { FaceLandmarker } from '@mediapipe/tasks-vision'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import {
  CSS2DRenderer,
  CSS2DObject,
} from 'three/addons/renderers/CSS2DRenderer.js'

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
    // 50,
    1000,
    // 200,
    0xed4344,
    15,
    10
  )

  face.add(direction)

  const cameraClone = camera.clone()

  cameraClone.far = faceControls.camera.focalLength

  const cameraHelper = new THREE.CameraHelper(cameraClone)

  scene.add(cameraHelper)

  camera.position.set(500, 200, 1100)
  camera.lookAt(0, 0, 0)
  camera.position.set(450, 180, 1120)

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 500),
    new THREE.MeshBasicMaterial({
      color: 0x156289,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    })
  )

  plane.position.set(0, 0, faceControls.camera.plane.constant)

  // scene.add(plane)

  const target = new THREE.Mesh(
    new THREE.SphereGeometry(10),
    new THREE.MeshNormalMaterial({
      // color: 0xed4344,
      side: THREE.DoubleSide,
    })
  )

  scene.add(target)

  const irises = [...new Array(2)].map(
    () =>
      new THREE.Mesh(
        new THREE.CircleGeometry(1),
        new THREE.MeshBasicMaterial({ color: 0xed4344 })
      )
  )

  scene.add(...irises)

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(),
    new THREE.MeshBasicMaterial({
      color: 0xfff200,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    })
  )

  screen.position.setZ(faceControls.camera.focalLength)
  scene.add(screen)

  const coordsElement = document.createElement('div')

  coordsElement.id = 'coords'

  const coordsLabel = new CSS2DObject(coordsElement)

  coordsLabel.position.set(0, 0, 0)
  coordsLabel.center.set(-0.3, 0.1)
  target.add(coordsLabel)

  const labelRenderer = new CSS2DRenderer()

  labelRenderer.setSize(
    faceControls.container.clientWidth,
    faceControls.container.clientHeight
  )

  faceControls.container.appendChild(labelRenderer.domElement)

  const render = () => {
    // console.log(camera.position.x, camera.position.y, camera.position.z)

    face.geometry.setFromPoints(faceControls.tracker.points)
    face.geometry.computeVertexNormals()

    direction.position.copy(faceControls.tracker.ray.origin)
    direction.setDirection(faceControls.tracker.ray.direction)

    target.position.copy(faceControls.tracker.intersection)

    coordsElement.textContent = [faceControls.target.x, faceControls.target.y]
      .map(value => value.toFixed(2))
      .join(', ')

    irises.forEach((iris, i) => {
      const index = i ? 473 : 468

      iris.position.copy(faceControls.tracker.points[index])
      iris.scale.set(
        faceControls.tracker.irisWidthInPx / 2,
        faceControls.tracker.irisWidthInPx / 2,
        1
      )
    })

    screen.position.setX(faceControls.screen.center.x)
    screen.position.setY(faceControls.screen.center.y)
    screen.scale.copy(faceControls.screen.halfScale).multiplyScalar(2)

    renderer.render(scene, camera)
    labelRenderer.render(scene, camera)

    requestAnimationFrame(render)
  }

  render()
}
