import * as THREE from 'three'

import FaceControls from './FaceControls/FaceControls'

import { createScene } from './scene'
import { fruitNinja } from './fruit'

new FaceControls({
  containerId: 'faceContainer',
  diagonalFov: THREE.MathUtils.degToRad(80),
  screenProps: {
    x: -173,
    y: -5,
    width: 346,
    height: 217,
  },
  cb: faceControls => {
    createScene(faceControls)
    fruitNinja(faceControls)
  },
})

