import * as THREE from 'three'
import { KalmanFilter } from 'kalman-filter'

import FaceCamera from './FaceCamera'
import FaceTracker from './FaceTracker'

const SCREEN_HALF_WIDTH = window.screen.width / 2
const SCREEN_HALF_HEIGHT = window.screen.height / 2

type FaceControlsConfig = {
  containerId: string
  diagonalFov: number
  irisWidth?: number
  screenDiagonal: number
  cb: (faceControls: FaceControls) => void
}

class FaceControls {
  container: HTMLDivElement
  camera: FaceCamera
  tracker!: FaceTracker
  irisWidth: number
  screenHalfScaleReal: THREE.Vector3
  screen = {
    halfScale: new THREE.Vector3(),
    center: new THREE.Vector3(0, 0, 0),
  }
  target = new THREE.Vector3()
  kalman = new KalmanFilter({
    observation: {
      name: 'sensor',
      sensorDimension: 2,
    },
    dynamic: {
      name: 'constant-position',
      covariance: [0.005, 0.005],
    },
  })
  kalmanState: any

  constructor({
    containerId,
    diagonalFov,
    irisWidth = 12,
    screenDiagonal,
    cb,
  }: FaceControlsConfig) {
    this.container = document.createElement('div')
    this.container.id = containerId
    document.body.appendChild(this.container)

    this.irisWidth = irisWidth

    const ppMm =
      Math.hypot(window.screen.width, window.screen.height) /
      (screenDiagonal * 2.54 * 10)

    this.screenHalfScaleReal = new THREE.Vector3(
      SCREEN_HALF_WIDTH / ppMm,
      SCREEN_HALF_HEIGHT / ppMm
    )

    this.camera = new FaceCamera(this.container, diagonalFov)
    this.camera.init().then(async () => {
      this.tracker = new FaceTracker()
      await this.tracker.init()
      this.loop()
      cb(this)
    })
  }

  get irisRatio() {
    return this.tracker.irisWidthInPx / this.irisWidth
  }

  loop() {
    this.tracker.update(this.camera)

    this.screen.halfScale
      .copy(this.screenHalfScaleReal)
      .multiplyScalar(this.irisRatio)

    this.screen.center.setY(-this.screen.halfScale.y)

    this.target
      .copy(this.tracker.intersection)
      .sub(this.screen.center)
      .divide(this.screen.halfScale)

    if (!isNaN(this.target.x)) {
      this.target.setX((1 - this.target.x) * SCREEN_HALF_WIDTH)
      this.target.setY((1 - this.target.y) * SCREEN_HALF_HEIGHT)

      this.kalmanState = this.kalman.filter({
        previousCorrected: this.kalmanState,
        observation: [this.target.x, this.target.y],
      })

      const { mean } = this.kalmanState

      this.target.setX(mean[0][0])
      this.target.setY(mean[1][0])
    }

    requestAnimationFrame(() => this.loop())
  }
}

export default FaceControls
