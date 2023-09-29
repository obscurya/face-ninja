import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision'
import * as THREE from 'three'

import FaceCamera from './FaceCamera'

class FaceTracker {
  landmarker!: FaceLandmarker
  points = Array.from({ length: 468 + 10 }, () => new THREE.Vector3())

  async init() {
    const wasmFileset = await FilesetResolver.forVisionTasks('./wasm')

    this.landmarker = await FaceLandmarker.createFromOptions(wasmFileset, {
      baseOptions: {
        modelAssetPath: './face_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFacialTransformationMatrixes: true,
      outputFaceBlendshapes: false,
    })
  }

  update(camera: FaceCamera) {
    const {
      faceLandmarks: [landmarks],
    } = this.landmarker.detectForVideo(camera.video, performance.now())

    if (!landmarks) return

    landmarks.forEach(({ x, y, z }, i) => {
      this.points[i].set(
        (x - 0.5) * camera.width * 1,
        (y - 0.5) * camera.height * -1,
        (z - 0) * camera.width * -1
      )
    })
  }
}

export default FaceTracker
