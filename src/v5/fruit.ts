import Matter from 'matter-js'

import FaceControls from './FaceControls/FaceControls'

type Point = {
  x: number
  y: number
}

type Circle = Point & {
  r: number
}

const WIDTH = window.screen.width
const HEIGHT = window.screen.height

const BLADE = {
  TRAIL_LENGTH: 10,
  // TRAIL_LENGTH: 1,
  HEAD_RADIUS: 10,
  COLOR: '#ed4344',
}

const FRUIT = {
  RADIUS: 40,
  COLOR: '#fff200',
}

const SLING = {
  X: WIDTH / 2,
  Y: HEIGHT + FRUIT.RADIUS * 2,
}

const DEFAULT_DELAY = 60 * 3
const DELAY_STEP = 5

const CIRCLE_VERTICES_NUMBER = 50

const createCircle = (
  x: number,
  y: number,
  startAngle = 0,
  deltaAngle = Math.PI * 2
) => {
  let verticesNumber = Math.floor(
    Math.abs((deltaAngle / (Math.PI * 2)) * CIRCLE_VERTICES_NUMBER)
  )

  const angleStep = deltaAngle / verticesNumber

  if (verticesNumber !== CIRCLE_VERTICES_NUMBER) {
    verticesNumber++
  }

  const vertices = Array.from({ length: verticesNumber }, (_, i) => {
    const angle = startAngle + i * angleStep

    return Matter.Vector.create(
      x + FRUIT.RADIUS * Math.cos(angle),
      y + FRUIT.RADIUS * Math.sin(angle)
    )
  })

  return Matter.Bodies.fromVertices(x, y, [vertices], {
    render: {
      fillStyle: FRUIT.COLOR,
    },
  })
}

const getPointsDeltas = (p1: Point, p2: Point) => ({
  dx: p2.x - p1.x,
  dy: p2.y - p1.y,
})

const getDistanceBetweenPoints = (p1: Point, p2: Point) => {
  const { dx, dy } = getPointsDeltas(p1, p2)

  return Math.sqrt(dx ** 2 + dy ** 2)
}

const getAngleBetweenPoints = (p1: Point, p2: Point) => {
  const { dx, dy } = getPointsDeltas(p1, p2)

  return Math.atan2(dy, dx)
}

const areCirclesColliding = (c1: Circle, c2: Circle) => {
  return getDistanceBetweenPoints(c1, c2) < c1.r + c2.r
}

class Blade {
  trail: Point[] = [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ]

  get angle() {
    return getAngleBetweenPoints(this.trail[0], this.trail[1])
  }

  get velocity() {
    return getDistanceBetweenPoints(this.trail[0], this.trail[1])
  }

  update({ x, y }: Point) {
    this.trail = [{ x, y }, ...this.trail.slice(0, BLADE.TRAIL_LENGTH - 1)]
  }

  render(ctx: CanvasRenderingContext2D) {
    this.trail.forEach((p1, i) => {
      const p2 = this.trail[i + 1]

      if (!p2) return

      ctx.lineWidth =
        ((this.trail.length - i - 1) / (this.trail.length - 1)) *
        BLADE.HEAD_RADIUS *
        2

      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.stroke()
      ctx.closePath()
    })

    ctx.fillStyle = BLADE.COLOR

    ctx.beginPath()
    ctx.arc(this.trail[0].x, this.trail[0].y, BLADE.HEAD_RADIUS, 0, Math.PI * 2)
    ctx.closePath()
    ctx.fill()
  }
}

export const fruitNinja = (faceControls: FaceControls) => {
  const canvas = document.createElement('canvas')

  canvas.id = 'fruit'

  document.body.appendChild(canvas)

  const engine = Matter.Engine.create({ gravity: { y: 0.5 } })
  const render = Matter.Render.create({
    canvas,
    engine,
    options: {
      width: WIDTH,
      height: HEIGHT,
      wireframes: false,
      // background: 'white',
    },
  })

  Matter.Render.run(render)

  const blade = new Blade()

  // window.addEventListener('mousemove', e => {
  //   blade.update({
  //     x: e.clientX - canvas.offsetLeft,
  //     y: e.clientY - canvas.offsetTop,
  //   })
  // })

  let fruits: Matter.Body[] = []
  let fruitPieces: Matter.Body[] = []
  let score = 0
  let delay = DEFAULT_DELAY
  let delayCounter = 0

  const ctx = render.context

  ctx.font = 'bold 20px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.strokeStyle = BLADE.COLOR
  ctx.lineCap = 'round'

  const loop = () => {
    Matter.Engine.update(engine)

    delayCounter++

    if (delayCounter > delay) {
      const fruit = createCircle(SLING.X, SLING.Y)

      fruits.push(fruit)

      Matter.Composite.add(engine.world, fruit)
      Matter.Body.applyForce(
        fruit,
        fruit.position,
        Matter.Vector.create(
          Matter.Common.random(-0.1, 0.1),
          Matter.Common.random(-0.3, -0.5)
        )
      )

      delayCounter = 0
    }

    blade.update(faceControls.target)

    const bladeCircle = {
      ...blade.trail[0],
      r: BLADE.HEAD_RADIUS,
    }

    fruits = fruits.filter(fruit => {
      if (fruit.position.y > SLING.Y) {
        Matter.World.remove(engine.world, fruit)
        score--
        delay += DELAY_STEP
        return false
      }

      const fruitCircle = {
        x: fruit.position.x,
        y: fruit.position.y,
        r: FRUIT.RADIUS,
      }

      if (areCirclesColliding(bladeCircle, fruitCircle)) {
        const angle = blade.angle
        const velocity = blade.velocity * 0.002
        const pieces = [angle, angle + Math.PI].map((angle, i) => {
          const direction = angle + Math.PI / 2
          const x =
            fruit.position.x + (FRUIT.RADIUS / 2.4) * Math.cos(direction)
          const y =
            fruit.position.y + (FRUIT.RADIUS / 2.4) * Math.sin(direction)
          const semiCircle = createCircle(x, y, angle, Math.PI)

          Matter.Body.setVelocity(semiCircle, fruit.velocity)
          Matter.Body.applyForce(
            semiCircle,
            semiCircle.position,
            Matter.Vector.create(
              velocity * Math.cos(direction),
              velocity * Math.sin(direction)
            )
          )

          Matter.Body.setAngularVelocity(
            semiCircle,
            Matter.Common.random(0.1, 0.2) * (i ? -1 : 1)
          )

          return semiCircle
        })

        fruitPieces.push(...pieces)
        Matter.Composite.add(engine.world, pieces)
        Matter.World.remove(engine.world, fruit)
        score++
        delay -= DELAY_STEP
        return false
      }

      return true
    })

    fruitPieces = fruitPieces.filter(piece => {
      const opacity = (piece.render.opacity || 1) - 0.02

      if (opacity <= 0) {
        Matter.World.remove(engine.world, piece)
        return false
      }

      piece.render.opacity = opacity

      return true
    })

    blade.render(ctx)

    ctx.fillStyle = '#fff'
    ctx.fillText(String(score), WIDTH / 2, 30)

    requestAnimationFrame(loop)
  }

  loop()
}
