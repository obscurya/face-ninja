import * as THREE from 'three'

import FaceControls from './FaceControls/FaceControls'

import { createScene } from './scene'
import { fruitNinja } from './fruit'

new FaceControls({
  containerId: 'faceContainer',
  diagonalFov: THREE.MathUtils.degToRad(80),
  screenDiagonal: 16,
  cb: faceControls => {
    createScene(faceControls)
    fruitNinja(faceControls)
  },
})

