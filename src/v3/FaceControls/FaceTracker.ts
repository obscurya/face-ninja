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
    const { faceLandmarks, facialTransformationMatrixes } =
      this.landmarker.detectForVideo(camera.video, performance.now())

    const [landmarks] = faceLandmarks

    if (!landmarks) return

    landmarks.forEach(({ x, y, z }, i) => {
      this.points[i].set(
        x * camera.width - camera.width / 2,
        y * camera.height - camera.height / 2,
        z * camera.width
      )
    })

    const [transformationMatrix] = facialTransformationMatrixes

    this.transform.fromArray(transformationMatrix.data)
    this.direction.setFromMatrixColumn(this.transform, 2)

    this.direction.setY(-this.direction.y)
    this.direction.setZ(-this.direction.z)

    this.ray.set(this.points[168], this.direction)
    this.ray.intersectPlane(camera.plane, this.intersection)
  }
}

export default FaceTracker
