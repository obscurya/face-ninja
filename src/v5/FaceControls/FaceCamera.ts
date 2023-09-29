import * as THREE from 'three'

class FaceCamera {
  video: HTMLVideoElement
  diagonalFov: number
  plane!: THREE.Plane

  constructor(container: HTMLDivElement, diagonalFov: number) {
    this.video = document.createElement('video')

    container.appendChild(this.video)

    this.diagonalFov = diagonalFov
  }

  get width() {
    return this.video.videoWidth
  }

  get height() {
    return this.video.videoHeight
  }

  get aspectRatio() {
    return this.width / this.height
  }

  get diagonal() {
    return Math.hypot(this.width, this.height)
  }

  get focalLength() {
    return (this.diagonal / 2) * (1 / Math.tan(this.diagonalFov / 2))
  }

  async init() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { exact: 'user' },
        width: { ideal: 4096 },
        height: { ideal: 2160 },
      },
    })

    this.video.srcObject = stream

    await this.video.play()

    this.plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), this.focalLength)
  }
}

export default FaceCamera
