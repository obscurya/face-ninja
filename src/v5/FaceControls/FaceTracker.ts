import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision'
import * as THREE from 'three'

import FaceCamera from './FaceCamera'

class FaceTracker {
  landmarker!: FaceLandmarker
  points = Array.from({ length: 468 + 10 }, () => new THREE.Vector3())
  transform = new THREE.Matrix4()
  direction = new THREE.Vector3()
  ray = new THREE.Ray()
  intersection = new THREE.Vector3()

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
      facialTransformationMatrixes: [transformationMatrix],
    } = this.landmarker.detectForVideo(camera.video, performance.now())

    if (!landmarks) return

    landmarks.forEach(({ x, y, z }, i) => {
      this.points[i].set(
        (x - 0.5) * camera.width * 1,
        (y - 0.5) * camera.height * -1,
        (z - 0) * camera.width * -1
      )
    })

    this.transform.fromArray(transformationMatrix.data)
    this.direction.setFromMatrixColumn(this.transform, 2)

    this.ray.set(this.points[168], this.direction)
    this.ray.intersectPlane(camera.plane, this.intersection)
  }

  get irisWidthInPx() {
    const rightIrisWidth = this.points[469].distanceTo(this.points[471])
    const leftIrisWidth = this.points[474].distanceTo(this.points[476])

    return (rightIrisWidth + leftIrisWidth) / 2
  }
}

export default FaceTracker
