// const BACKGROUND = '#0a0816';
// const BACKGROUND = '#1a1538';
const BACKGROUND = '#3f376e';
const FPS_COLOR = 'yellow';
let context: CanvasRenderingContext2D
const width = 600;
const height = 400;
const entities: Entity[] = [];
let pause = false;
let debug = true;

type Entity = Square | GravitySquare
type V2D = { x: number, y: number }
const UNIT_V2D_UP = { x: 0, y: -1 }
const UNIT_V2D_RIGHT = { x: 1, y: 0 }

interface Base {
    x: number
    y: number
    vx: number
    vy: number
    color: string
}

interface Square extends Base {
    type: 'square'
    width: number
    height: number
}

interface GravitySquare extends Base {
    id: number
    type: 'g-square'
    width: number
    height: number,
    mass: number
}

const sol = {
    id: 1,
    type: 'g-square',
    width: 30,
    height: 30,
    x: 300,
    y: 200,
    vx: 0,
    vy: 0,
    color: 'gold',
    mass: 1000
} as GravitySquare

entities.push(
    sol,

    // {
    //     id: 2,
    //     type: 'g-square',
    //     width: 6,
    //     height: 6,
    //     x: 100 - 3,
    //     y: 10 - 3,
    //     vx: 0.4,
    //     vy: 0,
    //     color: 'red',
    //     mass: 10
    // } as GravitySquare,

    // {
    //     id: 3,
    //     type: 'g-square',
    //     width: 6,
    //     height: 6,
    //     x: 500 - 3,
    //     y: 390 - 3,
    //     vx: -0.4,
    //     vy: 0,
    //     color: 'blue',
    //     mass: 10
    // } as GravitySquare,

    // {
    //     id: 4,
    //     type: 'g-square',
    //     width: 6,
    //     height: 6,
    //     x: 100 - 3,
    //     y: 300 - 3,
    //     vx: 0,
    //     vy: -0.4,
    //     color: 'yellow',
    //     mass: 10
    // } as GravitySquare,

    // {
    //     id: 5,
    //     type: 'g-square',
    //     width: 6,
    //     height: 6,
    //     x: 500 - 3,
    //     y: 10 - 3,
    //     vx: 0,
    //     vy: 0.4,
    //     color: 'green',
    //     mass: 10
    // } as GravitySquare
)

const n = 12
const angle_step = 360 / n
let curr_ang = 0
const radius = 175
for (let i = 0; i < n; i++) {
    const deg = curr_ang * (Math.PI / 180)
    const dir = scale(
        { x: Math.cos(deg), y: Math.sin(deg) },
        radius
    )
    curr_ang += angle_step
    entities.push(
        {
            id: i + 10,
            type: 'g-square',
            width: 6,
            height: 6,
            x: 300 + dir.x,
            y: 200 + dir.y,
            vx: 0,
            vy: 0.4,
            color: random_rgb(),
            mass: 10
        } as GravitySquare
    )
}

export function bootstrap(canvas: HTMLCanvasElement) {
    context = canvas.getContext('2d') as CanvasRenderingContext2D;

    const pause_btn = document.querySelector("#pause") as HTMLButtonElement
    pause_btn.onclick = () => pause = !pause

    const debug_btn = document.querySelector("#debug") as HTMLButtonElement
    debug_btn.onclick = () => debug = !debug

    requestAnimationFrame(step)
}

let previous_frame_time: DOMHighResTimeStamp;
let delta: DOMHighResTimeStamp = 0;
const refresh_every_ms = 1000 / 90;
function step(now: DOMHighResTimeStamp) {
    if (previous_frame_time === undefined) {
        previous_frame_time = now
    }

    delta += now - previous_frame_time;

    if (delta >= refresh_every_ms) {
        if (!pause) {
            clear(context);

            update(delta / 100);

            draw(context)

            const fps = 1000 / delta;
            print_fps(context, fps);
        }

        delta = 0;
    }

    previous_frame_time = now

    requestAnimationFrame(step);
}

function clear(context: CanvasRenderingContext2D) {
    context.fillStyle = BACKGROUND;
    context.fillRect(0, 0, width, height);
}

function print_fps(context: CanvasRenderingContext2D, fps: number) {
    context.fillStyle = FPS_COLOR;
    context.font = '16px monospace';
    context.fillText(String(fps).slice(0, 2), 16, 16);
}

// La original, la de nuestro universo
// const G = 6.67e-11

// La mia, mas divertida
const G = 6.67e-3
function update(delta: number) {
    for (let n of entities) {
        if (n.type == 'g-square') {
            let a_r = { x: 0, y: 0 }

            for (let p of entities) {
                if (p.type == 'g-square' && n.id != p.id) {
                    const f = (G * n.mass * p.mass) / ds(p, n)
                    const a = f / n.mass
                    let accel_vector = minus(p, n)
                    accel_vector = unit(accel_vector)
                    accel_vector = scale(accel_vector, a)
                    a_r = plus(a_r, accel_vector)
                }
            }

            n.vx += a_r.x
            n.vy += a_r.y
            n.x += n.vx * delta;
            n.y += n.vy * delta;
        }
    }
}

// const light_pos = { x: 300, y: 200 }
function draw(context: CanvasRenderingContext2D) {
    for (let n of entities) {
        if (n.type == 'square' || n.type == 'g-square') {
            let shadow_displacement: V2D = {
                x: 0, y: 0
            }

            if (n.type == 'g-square' && n.id != sol.id) {
                let dist_sol_n = ds(sol, n as GravitySquare)
                shadow_displacement = scale(
                    unit(minus(n, sol)), dist_sol_n
                )

                const obj_half_side = n.width / 2;
                const corners = get_corners_facing(n as V2D, n.width)
                const puntos: V2D[] = [
                    { x: n.x, y: n.y },
                    corners[0],
                    plus(corners[0], shadow_displacement),
                    plus({x:0, y:1}, plus(corners[0], shadow_displacement)),
                    plus({x:-1, y:0}, plus({x:0, y:1}, plus(corners[0], shadow_displacement))),
                ]

                // sombra
                const sol_to_n = minus(n as V2D, sol as V2D);

                const a = ang(UNIT_V2D_RIGHT, sol_to_n).toFixed(2);

                const side = n.width + (n.width * (1 / (dist_sol_n / 64)))
                const half_side = side / 2
                context.fillStyle = 'rgba(0, 0, 0, 0.1)'
                context.fillRect(
                    n.x + shadow_displacement.x - half_side,
                    n.y + shadow_displacement.y - half_side,
                    side,
                    side
                )

                if (debug) {
                    context.fillStyle = FPS_COLOR;
                    context.font = '10px monospace';
                    context.fillText(`ang = ${a}`, n.x - 28, n.y - 16);
                    context.fillText(`(${sol_to_n.x.toFixed(2)}, ${sol_to_n.y.toFixed(2)})`, n.x - 40, n.y - 32);
                }
            }

            // cuadrado
            context.fillStyle = n.color
            context.fillRect(
                n.x - n.width / 2,
                n.y - n.height / 2,
                n.width,
                n.height
            )

            if (n.type == 'g-square' && n.id != sol.id) {
                // context.strokeStyle = 'black'
                // context.beginPath()
                // context.moveTo(sol.x, sol.y)
                // context.lineTo(n.x, n.y)
                // context.stroke()
                // context.closePath()

                // context.strokeStyle = 'red'
                // context.beginPath()
                // context.moveTo(n.x, n.y)
                // context.lineTo(n.x + shadow_displacement.x, n.y + shadow_displacement.y)
                // context.stroke()
                // context.closePath()
                // console.log(shadow_displacement)
            }

            // error = true;
        }
    }
}

function random_rgb() {
    const r = Math.random() * 255;
    const g = Math.random() * 255;
    const b = Math.random() * 255;
    return `rgb(${r}, ${g}, ${b})`
}

function cuadradito(): Square {
    const x = Math.random() * 600
    const y = Math.random() * 400
    const side = 10 + Math.ceil(Math.random() * 20)
    return {
        type: 'square',
        x,
        y,
        vx: Math.random() / 2,
        vy: Math.random() / 2,
        color: random_rgb(),
        height: side,
        width: side
    }
}

function gsquare(id: number): GravitySquare {
    const x = Math.random() * 600
    const y = Math.random() * 400
    const side = 6
    return {
        id,
        type: 'g-square',
        x,
        y,
        vx: Math.random() / 2,
        vy: Math.random() / 2,
        color: random_rgb(),
        height: side,
        width: side,
        mass: Math.random() * 10
    }
}

function ds(a: GravitySquare, b: GravitySquare) {
    return Math.sqrt(
        (a.x - b.x) ** 2 + (a.y - b.y) ** 2
    )
}

function minus(a: V2D, b: V2D): V2D {
    return { x: a.x - b.x, y: a.y - b.y }
}

function unit(v: V2D): V2D {
    const m = 1 / Math.sqrt(v.x ** 2 + v.y ** 2)
    return { x: v.x * m, y: v.y * m }
}

function scale(v: V2D, f: number): V2D {
    return { x: v.x * f, y: v.y * f }
}

function plus(a: V2D, b: V2D): V2D {
    return {
        x: a.x + b.x,
        y: a.y + b.y
    }
}

function mag(v: V2D): number {
    return Math.sqrt(v.x ** 2 + v.y ** 2)
}

function dot(v: V2D, w: V2D): number {
    return v.x * w.x + v.y * w.y
}

function ang(v: V2D, w: V2D): number {
    const a =  Math.acos(
        dot(v, w) / (mag(v) * mag(w))
    );

    return a
}

function quadrant(v: V2D): number {
    if (v.x >= 0 && v.y >= 0) {
        return 1
    } else if (v.x < 0 && v.y >= 0) {
        return 2
    } else if (v.x < 0 && v.y < 0) {
        return 3
    } else {
        return 4
    }
}

function get_corners_facing(v: V2D, width: number): [V2D, V2D] {
    const q = quadrant(v)

    const half_side = width / 2

    let r: [V2D, V2D] = [UNIT_V2D_RIGHT, UNIT_V2D_RIGHT]

    switch (q) {
        case 1:
            r = [
                { x: v.x - half_side, y: v.y + half_side },
                { x: v.x + half_side, y: v.y - half_side }
            ]
            break;
        case 2:
            r = [
                { x: v.x + half_side, y: v.y + half_side },
                { x: v.x - half_side, y: v.y - half_side }
            ]
            break;
        case 3:
            r = [
                { x: v.x + half_side, y: v.y - half_side },
                { x: v.x - half_side, y: v.y + half_side }
            ]
            break;
        case 4:
            r = [
                { x: v.x + half_side, y: v.y + half_side },
                { x: v.x - half_side, y: v.y - half_side }
            ]
            break;
    }

    return r;
}