import FaceCamera from './FaceCamera'
import FaceTracker from './FaceTracker'

type FaceControlsConfig = {
  containerId: string
  diagonalFov: number
  cb: (faceControls: FaceControls) => void
}

class FaceControls {
  container: HTMLDivElement
  camera: FaceCamera
  tracker!: FaceTracker

  constructor({ containerId, diagonalFov, cb }: FaceControlsConfig) {
    this.container = document.createElement('div')
    this.container.id = containerId
    document.body.appendChild(this.container)

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

    requestAnimationFrame(() => this.loop())
  }
}

export default FaceControls
