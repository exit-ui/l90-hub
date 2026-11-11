import {
  bokehField,
  type BokehDisc,
  type LightName,
  parseCssColor,
  type Rgba,
  seeded,
  skylineField,
  streetLamps,
  type Tower,
  withAlpha,
} from '@/lib/backdrop';

/** One seed, so the city looks the same on each visit. */
export const CITY_SEED = 90;

interface Palette {
  skyTop: Rgba;
  skyBottom: Rgba;
  haze: Rgba;
  skyGlow: Rgba;
  fog: Rgba;
  towers: [Rgba, Rgba, Rgba];
  windowWarm: Rgba;
  windowCold: Rgba;
  road: Rgba;
  car: Rgba;
  carRim: Rgba;
  tail: Rgba;
  lamp: Rgba;
  shade: Rgba;
  noise: Rgba;
  lights: Record<LightName, Rgba>;
}

/** The fallback when a token is missing: no light. */
const NONE: Rgba = [0, 0, 0, 0];

/** Reads the colour tokens of the city from index.css. */
function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string): Rgba => parseCssColor(style.getPropertyValue(name)) ?? NONE;
  return {
    skyTop: read('--hub-city-sky-top'),
    skyBottom: read('--hub-city-sky-bottom'),
    haze: read('--hub-city-haze'),
    skyGlow: read('--hub-city-sky-glow'),
    fog: read('--hub-city-fog'),
    towers: [read('--hub-city-tower-far'), read('--hub-city-tower-mid'), read('--hub-city-tower-near')],
    windowWarm: read('--hub-city-window-warm'),
    windowCold: read('--hub-city-window-cold'),
    road: read('--hub-city-road'),
    car: read('--hub-city-car'),
    carRim: read('--hub-city-car-rim'),
    tail: read('--hub-city-tail'),
    lamp: read('--hub-city-lamp'),
    shade: read('--hub-photo-shade'),
    noise: read('--hub-city-noise'),
    lights: {
      sodium: read('--hub-city-sodium'),
      blue: read('--hub-city-blue'),
      red: read('--hub-city-red'),
      white: read('--hub-city-white'),
    },
  };
}

type Context = CanvasRenderingContext2D;

function radial(context: Context, x: number, y: number, radius: number, color: Rgba, alpha: number, hold = 0) {
  const gradient = context.createRadialGradient(x, y, 0, x, y, Math.max(1, radius));
  gradient.addColorStop(0, withAlpha(color, alpha));
  if (hold > 0) {
    gradient.addColorStop(hold, withAlpha(color, alpha * 0.92));
  }
  gradient.addColorStop(1, withAlpha(color, 0));
  context.fillStyle = gradient;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function paintSky(context: Context, palette: Palette, width: number, height: number, groundY: number) {
  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, withAlpha(palette.skyTop, 1));
  sky.addColorStop(1, withAlpha(palette.skyBottom, 1));
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);
  // Light pollution: a warm haze low over the city and a cold glow higher up.
  context.save();
  context.scale(1, 0.45);
  radial(context, width * 0.55, groundY / 0.45, width * 0.9, palette.haze, palette.haze[3]);
  context.restore();
  radial(context, width * 0.2, height * 0.12, width * 0.7, palette.skyGlow, palette.skyGlow[3]);
}

function paintTower(context: Context, tower: Tower, groundY: number, color: Rgba) {
  context.fillStyle = withAlpha(color, 1);
  context.fillRect(tower.x, tower.top, tower.width, groundY - tower.top + 1);
  if (tower.crownWidth > 0) {
    const crownX = tower.x + (tower.width - tower.crownWidth) / 2;
    context.fillRect(crownX, tower.top - tower.crownHeight, tower.crownWidth, tower.crownHeight + 1);
  }
  if (tower.mast > 0) {
    const mastX = tower.x + tower.width / 2;
    const base = tower.top - tower.crownHeight;
    context.fillRect(mastX - 1, base - tower.mast, 2, tower.mast);
  }
}

function paintWindows(context: Context, palette: Palette, tower: Tower, depth: 0 | 1 | 2) {
  const step = 9;
  const size = depth === 0 ? [2, 3] : depth === 1 ? [3, 4] : [4, 5];
  const strength = depth === 0 ? 0.6 : depth === 1 ? 0.8 : 0.95;
  for (const [column, row] of tower.windows) {
    const x = tower.x + 3 + column * step;
    const y = tower.top + 6 + row * (step + 3);
    const warm = (column * 31 + row * 17) % 5 !== 0;
    const color = warm ? palette.windowWarm : palette.windowCold;
    context.fillStyle = withAlpha(color, color[3] * strength);
    context.fillRect(x, y, size[0] ?? 2, size[1] ?? 3);
    if (depth === 2) {
      radial(context, x + 2, y + 2, 10, color, 0.12);
    }
  }
}

/** A band of fog that hides the tops of the towers behind it. */
function paintFogBand(context: Context, palette: Palette, width: number, top: number, bottom: number, alpha: number) {
  const band = context.createLinearGradient(0, top, 0, bottom);
  band.addColorStop(0, withAlpha(palette.fog, 0));
  band.addColorStop(0.45, withAlpha(palette.fog, alpha));
  band.addColorStop(1, withAlpha(palette.fog, 0));
  context.fillStyle = band;
  context.fillRect(0, top, width, bottom - top);
}

function paintSkyline(context: Context, palette: Palette, width: number, groundY: number, maxHeight: number) {
  const layers = skylineField(CITY_SEED, width, groundY, maxHeight);
  const skyTop = groundY - maxHeight;
  for (const layer of layers) {
    const color = palette.towers[layer.depth];
    for (const tower of layer.towers) {
      paintTower(context, tower, groundY, color);
      paintWindows(context, palette, tower, layer.depth);
    }
    // Depth haze: each layer further back sinks into the night air.
    if (layer.depth < 2) {
      const haze = context.createLinearGradient(0, skyTop - 60, 0, groundY);
      haze.addColorStop(0, withAlpha(palette.skyBottom, layer.depth === 0 ? 0.55 : 0.3));
      haze.addColorStop(1, withAlpha(palette.fog, layer.depth === 0 ? 0.03 : 0.015));
      context.fillStyle = haze;
      context.fillRect(0, skyTop - 60, width, groundY - skyTop + 60);
    }
    // Aircraft lights on the highest far towers.
    if (layer.depth === 0) {
      for (const tower of layer.towers) {
        if (tower.mast > 0) {
          const top = tower.top - tower.crownHeight - tower.mast;
          radial(context, tower.x + tower.width / 2, top, 6, palette.lights.red, 0.9);
        }
      }
      paintFogBand(context, palette, width, skyTop - 60, skyTop + maxHeight * 0.4, 0.34);
    }
    if (layer.depth === 1) {
      paintFogBand(context, palette, width, skyTop + maxHeight * 0.3, groundY - maxHeight * 0.15, 0.16);
    }
  }
  // Two large banks of fog across the skyline.
  context.save();
  context.scale(1, 0.4);
  radial(context, width * 0.25, (skyTop + maxHeight * 0.5) / 0.4, width * 0.6, palette.fog, palette.fog[3] * 1.3);
  radial(context, width * 0.8, (skyTop + maxHeight * 0.3) / 0.4, width * 0.55, palette.fog, palette.fog[3] * 1.3);
  context.restore();
}

function paintCar(context: Context, palette: Palette, x: number, groundY: number, length: number, facingRight: boolean) {
  const height = length * 0.2;
  const base = groundY + length * 0.12;
  context.save();
  context.translate(x, base);
  if (!facingRight) {
    context.scale(-1, 1);
  }
  const body = new Path2D();
  // A low wedge: long nose on the right, short tail on the left.
  body.moveTo(-length * 0.5, -height * 0.25);
  body.bezierCurveTo(-length * 0.5, -height * 0.7, -length * 0.38, -height * 0.78, -length * 0.22, -height * 0.86);
  body.bezierCurveTo(-length * 0.08, -height * 1.18, length * 0.1, -height * 1.15, length * 0.2, -height * 0.78);
  body.bezierCurveTo(length * 0.34, -height * 0.62, length * 0.48, -height * 0.5, length * 0.5, -height * 0.28);
  body.lineTo(length * 0.5, -height * 0.05);
  body.lineTo(-length * 0.5, -height * 0.05);
  body.closePath();
  context.fillStyle = withAlpha(palette.car, 1);
  context.fill(body);
  // The rim light of the street lamp on the roof line.
  context.strokeStyle = withAlpha(palette.carRim, palette.carRim[3]);
  context.lineWidth = 1.2;
  context.beginPath();
  context.moveTo(-length * 0.3, -height * 0.82);
  context.bezierCurveTo(-length * 0.08, -height * 1.18, length * 0.1, -height * 1.15, length * 0.24, -height * 0.74);
  context.stroke();
  // The tail-light strip.
  context.fillStyle = withAlpha(palette.tail, palette.tail[3]);
  context.fillRect(-length * 0.5, -height * 0.5, length * 0.05, height * 0.1);
  radial(context, -length * 0.49, -height * 0.45, length * 0.12, palette.tail, 0.35);
  // The wheels.
  context.fillStyle = withAlpha(palette.road, 1);
  for (const wheel of [-0.3, 0.3]) {
    context.beginPath();
    context.ellipse(length * wheel, -height * 0.08, length * 0.075, length * 0.075, 0, Math.PI, 0);
    context.fill();
  }
  // The reflection on the wet road.
  context.globalAlpha = 0.25;
  context.scale(1, -0.5);
  context.fillStyle = withAlpha(palette.car, 1);
  context.fill(body);
  context.globalAlpha = 1;
  context.restore();
  // The red reflection of the tail-light on the road.
  const tailX = facingRight ? x - length * 0.49 : x + length * 0.49;
  context.save();
  context.scale(1, 3);
  radial(context, tailX, (base + height * 0.3) / 3, length * 0.06, palette.tail, 0.28);
  context.restore();
}

function paintStreet(context: Context, palette: Palette, width: number, height: number, groundY: number) {
  const road = context.createLinearGradient(0, groundY, 0, height);
  road.addColorStop(0, withAlpha(palette.road, 0.96));
  road.addColorStop(1, withAlpha(palette.road, 1));
  context.fillStyle = road;
  context.fillRect(0, groundY, width, height - groundY);
  // A wet sheen: the sky haze on the tarmac.
  context.save();
  context.scale(1, 0.25);
  radial(context, width * 0.5, (groundY + 4) / 0.25, width * 0.7, palette.haze, palette.haze[3] * 0.9);
  context.restore();

  const lamps = streetLamps(CITY_SEED, width);
  for (const lamp of lamps) {
    const headY = groundY - lamp.height * (height / 900);
    context.fillStyle = withAlpha(palette.towers[2], 1);
    context.fillRect(lamp.x - 1.5, headY, 3, groundY - headY);
    context.fillRect(lamp.x - 1.5, headY, 18, 3);
    // The pool of sodium light under the lamp.
    radial(context, lamp.x + 14, headY + 4, 10, palette.lamp, 0.95);
    radial(context, lamp.x + 14, headY + 4, 90, palette.lights.sodium, 0.22);
    context.save();
    context.scale(1, 0.3);
    radial(context, lamp.x + 14, (groundY + 10) / 0.3, 140, palette.lights.sodium, 0.2);
    context.restore();
    // The long reflection of the lamp on the wet road.
    const streak = context.createLinearGradient(0, groundY, 0, height);
    streak.addColorStop(0, withAlpha(palette.lights.sodium, 0.5));
    streak.addColorStop(1, withAlpha(palette.lights.sodium, 0.04));
    context.fillStyle = streak;
    context.fillRect(lamp.x + 8, groundY, 12, height - groundY);
    const glow = context.createLinearGradient(0, groundY, 0, height);
    glow.addColorStop(0, withAlpha(palette.lights.sodium, 0.16));
    glow.addColorStop(1, withAlpha(palette.lights.sodium, 0));
    context.fillStyle = glow;
    context.fillRect(lamp.x - 14, groundY, 56, height - groundY);
  }

  // The lit windows of the near towers shimmer on the wet road as thin vertical streaks.
  const near = skylineField(CITY_SEED, width, groundY, height * 0.42)[2];
  for (const tower of near?.towers ?? []) {
    for (const [column] of tower.windows.slice(0, 2)) {
      const x = tower.x + 3 + column * 9;
      const streak = context.createLinearGradient(0, groundY, 0, groundY + (height - groundY) * 0.8);
      streak.addColorStop(0, withAlpha(palette.windowWarm, 0.12));
      streak.addColorStop(1, withAlpha(palette.windowWarm, 0));
      context.fillStyle = streak;
      context.fillRect(x, groundY, 2, (height - groundY) * 0.8);
    }
  }

  const carLength = Math.min(300, Math.max(150, width * 0.3));
  const first = lamps[0];
  if (first) {
    paintCar(context, palette, Math.min(width - carLength * 0.4, first.x + carLength * 0.45), groundY, carLength, true);
  }
  const second = lamps[2] ?? lamps[1];
  if (second && width > 720) {
    paintCar(context, palette, second.x - carLength * 0.2, groundY, carLength * 0.92, false);
  }
}

function paintDisc(context: Context, palette: Palette, disc: BokehDisc, scaleY = 1, alpha = 1) {
  const color = palette.lights[disc.light];
  // A soft, out-of-focus disc: a wide falloff and a faint brighter core, like a lens at f/1.4.
  const hold = Math.max(0.15, 1 - disc.blur / (disc.radius + disc.blur));
  context.save();
  context.translate(disc.x, disc.y);
  context.scale(1, scaleY);
  radial(context, 0, 0, disc.radius + disc.blur, color, disc.opacity * alpha * 0.6, hold * 0.6);
  radial(context, 0, 0, disc.radius * 0.45, color, disc.opacity * alpha * 0.35);
  context.restore();
}

function paintBokeh(context: Context, palette: Palette, width: number, height: number, groundY: number) {
  const discs = bokehField(CITY_SEED, width, height);
  context.save();
  context.globalCompositeOperation = 'lighter';
  for (const disc of discs) {
    paintDisc(context, palette, disc);
  }
  // The wet ground: a mirrored, softer copy of the low discs in the last 12 % of the view.
  const wetTop = height * 0.88;
  context.beginPath();
  context.rect(0, wetTop, width, height - wetTop);
  context.clip();
  for (const disc of discs.filter((item) => item.y > height * 0.55)) {
    const mirrored = { ...disc, y: wetTop + (groundY - Math.min(disc.y, groundY)) * 0.3 + disc.radius * 0.4 };
    paintDisc(context, palette, { ...mirrored, blur: disc.blur * 1.6 }, 1.8, 0.5);
  }
  context.restore();
}

function paintVignette(context: Context, palette: Palette, width: number, height: number) {
  const gradient = context.createRadialGradient(
    width / 2,
    height * 0.55,
    Math.min(width, height) * 0.35,
    width / 2,
    height * 0.55,
    Math.max(width, height) * 0.85,
  );
  gradient.addColorStop(0, withAlpha(palette.shade, 0));
  gradient.addColorStop(1, withAlpha(palette.shade, 0.55));
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

/** A little film noise in the canvas, so the dark gradients do not band in the image. */
function paintNoise(context: Context, palette: Palette, width: number, height: number) {
  const next = seeded(CITY_SEED);
  context.fillStyle = withAlpha(palette.noise, palette.noise[3]);
  const count = Math.round((width * height) / 900);
  for (let index = 0; index < count; index += 1) {
    context.fillRect(next() * width, next() * height, 1, 1);
  }
}

/**
 * Paints the Night city in one pass: sky, skyline with lit windows and fog,
 * the wet street with lamps and two black cars, bokeh and the wet reflections.
 */
export function paintCity(canvas: HTMLCanvasElement, width: number, height: number, ratio: number): boolean {
  const context = canvas.getContext('2d');
  if (!context) {
    return false;
  }
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const palette = readPalette();
  // A tall phone view gets taller towers, so the city reaches into the top of the screen.
  const tall = height > width * 1.2;
  const groundY = height * (tall ? 0.86 : 0.84);
  const maxHeight = height * (tall ? 0.66 : 0.42);
  paintSky(context, palette, width, height, groundY);
  paintSkyline(context, palette, width, groundY, maxHeight);
  paintStreet(context, palette, width, height, groundY);
  paintBokeh(context, palette, width, height, groundY);
  paintVignette(context, palette, width, height);
  paintNoise(context, palette, width, height);
  return true;
}
