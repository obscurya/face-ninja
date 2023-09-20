import FaceControls from './FaceControls/FaceControls'

import { createScene } from './scene'

new FaceControls({
  containerId: 'faceContainer',
  cb: faceControls => {
    createScene(faceControls)
  },
})

