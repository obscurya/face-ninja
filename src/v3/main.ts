import * as THREE from 'three'

import FaceControls from './FaceControls/FaceControls'

import { createScene } from './scene'

new FaceControls({
  containerId: 'faceContainer',
  diagonalFov: THREE.MathUtils.degToRad(80),
  cb: faceControls => {
    createScene(faceControls)
  },
})

