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
  screenProps: {
    x: number
    y: number
    width: number
    height: number
  }
  cb: (faceControls: FaceControls) => void
}

class FaceControls {
  container: HTMLDivElement
  camera: FaceCamera
  tracker!: FaceTracker
  irisWidth: number
  screenReal: {
    halfScale: THREE.Vector3
    center: THREE.Vector3
  }
  screen = {
    center: new THREE.Vector3(),
    halfScale: new THREE.Vector3(),
  }
  target = new THREE.Vector3()
  // https://mp-lab.ru/filtr_kalmana_dlya_nachinayushchih/
  // https://habr.com/ru/articles/166693/
  // https://github.com/piercus/kalman-filter
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
    screenProps,
    cb,
  }: FaceControlsConfig) {
    this.container = document.createElement('div')
    this.container.id = containerId
    document.body.appendChild(this.container)

    this.irisWidth = irisWidth

    const halfScale = new THREE.Vector3(
      screenProps.width / 2,
      screenProps.height / 2
    )

    this.screenReal = {
      center: new THREE.Vector3(screenProps.x, -screenProps.y).add(halfScale),
      halfScale,
    }

    this.camera = new FaceCamera(this.container, diagonalFov)
    this.camera.init().then(async () => {
      this.tracker = new FaceTracker()
      await this.tracker.init()
      this.loop()
      cb(this)
    })
  }

  loop() {
    this.tracker.update(this.camera)

    const irisRatio = this.tracker.irisWidthInPx / this.irisWidth

    this.screen.center.copy(this.screenReal.center).multiplyScalar(irisRatio)

    this.screen.halfScale
      .copy(this.screenReal.halfScale)
      .multiplyScalar(irisRatio)

    this.target
      .copy(this.tracker.intersection)
      .sub(this.screen.center)
      .divide(this.screen.halfScale)

    this.target.setX(-this.target.x * SCREEN_HALF_WIDTH + SCREEN_HALF_WIDTH)
    this.target.setY(this.target.y * SCREEN_HALF_HEIGHT + SCREEN_HALF_HEIGHT)

    // https://github.com/piercus/kalman-filter#online-filter
    this.kalmanState = this.kalman.filter({
      previousCorrected: this.kalmanState,
      observation: [this.target.x, this.target.y],
    })

    const { mean } = this.kalmanState

    this.target.setX(mean[0][0])
    this.target.setY(mean[1][0])

    requestAnimationFrame(() => this.loop())
  }
}

export default FaceControls
