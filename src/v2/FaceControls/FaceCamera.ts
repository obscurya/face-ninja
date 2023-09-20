class FaceCamera {
  video: HTMLVideoElement

  constructor(container: HTMLDivElement) {
    this.video = document.createElement('video')

    container.appendChild(this.video)
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
        facingMode: { ideal: 'user' },
        width: { ideal: 4096 },
        height: { ideal: 2160 },
      },
    })

    this.video.srcObject = stream

    await this.video.play()
  }
}

export default FaceCamera
