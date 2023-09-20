import * as THREE from 'three'

class FaceCamera {
  video: HTMLVideoElement
  diagonalFov: number
  focalLength = 1
  plane = new THREE.Plane(new THREE.Vector3(0, 0, 1))

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

    // https://learnopencv.com/approximate-focal-length-for-webcams-and-cell-phone-cameras/

    const diagonal = Math.sqrt(this.width ** 2 + this.height ** 2)

    this.focalLength = (diagonal / 2) * (1 / Math.tan(this.diagonalFov / 2))
    this.plane.constant = this.focalLength
  }
}

export default FaceCamera
