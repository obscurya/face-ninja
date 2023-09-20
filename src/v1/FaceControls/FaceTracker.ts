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
    const { faceLandmarks } = this.landmarker.detectForVideo(
      camera.video,
      performance.now()
    )

    const [landmarks] = faceLandmarks

    if (!landmarks) return

    landmarks.forEach(({ x, y, z }, i) => {
      this.points[i].set(
        x * camera.width - camera.width / 2,
        y * camera.height - camera.height / 2,
        z * camera.width
      )
    })
  }
}

export default FaceTracker
