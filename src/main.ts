import './style.css'
import { bootstrap } from './game'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <canvas id="canvas" height="400" width="600"></canvas>
  </div>
  <button id="pause">pause</button>
  <button id="debug">debug label</button>
`
bootstrap(document.querySelector("#canvas") as HTMLCanvasElement);