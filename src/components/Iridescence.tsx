import { Renderer, Program, Mesh, Color, Triangle } from "ogl";
import { useEffect, useRef } from "react";
import type { HTMLAttributes } from "react";

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;
uniform float uUsePalette;
uniform vec3 uPalette0;
uniform vec3 uPalette1;
uniform vec3 uPalette2;
uniform vec3 uPalette3;

varying vec2 vUv;

vec3 paletteLookup(float t) {
  t = clamp(t, 0.0, 1.0);
  float t3 = t * 3.0;
  vec3 c01 = mix(uPalette0, uPalette1, clamp(t3, 0.0, 1.0));
  vec3 c12 = mix(uPalette1, uPalette2, clamp(t3 - 1.0, 0.0, 1.0));
  vec3 c23 = mix(uPalette2, uPalette3, clamp(t3 - 2.0, 0.0, 1.0));
  float seg1 = step(0.333, t);
  float seg2 = step(0.667, t);
  return mix(c01, mix(c12, c23, seg2), seg1);
}

void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;

  uv += (uMouse - vec2(0.5)) * uAmplitude;

  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;

  float t = sin(a * 0.4 + d * 0.25) * 0.5 + 0.5;
  vec3 paletteColor = paletteLookup(t);

  gl_FragColor = vec4(mix(col, paletteColor, uUsePalette), 1.0);
}
`;

type RGB = [number, number, number];

interface IridescenceProps extends Omit<HTMLAttributes<HTMLDivElement>, "color"> {
  color?: RGB;
  palette?: [RGB, RGB, RGB, RGB];
  speed?: number;
  amplitude?: number;
  mouseReact?: boolean;
}

export default function Iridescence({
  color = [1, 1, 1],
  palette,
  speed = 1.0,
  amplitude = 0.1,
  mouseReact = true,
  ...rest
}: IridescenceProps) {
  const { style, ...divProps } = rest;
  const ctnDom = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    if (!ctnDom.current) return;
    const ctn = ctnDom.current;
    const renderer = new Renderer();
    const gl = renderer.gl;
    gl.clearColor(1, 1, 1, 1);

    const p0 = palette?.[0] ?? [0, 0, 0];
    const p1 = palette?.[1] ?? [0, 0, 0];
    const p2 = palette?.[2] ?? [0, 0, 0];
    const p3 = palette?.[3] ?? [0, 0, 0];

    let program: Program | undefined;
    let animateId = 0;
    let resizeObserver: ResizeObserver | undefined;

    function resize() {
      const scale = 1;
      const width = Math.max(1, ctn.clientWidth);
      const height = Math.max(1, ctn.clientHeight);
      renderer.setSize(width * scale, height * scale);
      if (program) {
        program.uniforms.uResolution.value = new Color(
          gl.canvas.width,
          gl.canvas.height,
          gl.canvas.width / gl.canvas.height
        );
      }
    }
    window.addEventListener("resize", resize, false);
    resize();
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(ctn);
    }

    const geometry = new Triangle(gl);
    program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(...color) },
        uResolution: {
          value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height),
        },
        uMouse: { value: new Float32Array([mousePos.current.x, mousePos.current.y]) },
        uAmplitude: { value: amplitude },
        uSpeed: { value: speed },
        uUsePalette: { value: palette ? 1.0 : 0.0 },
        uPalette0: { value: new Color(...p0) },
        uPalette1: { value: new Color(...p1) },
        uPalette2: { value: new Color(...p2) },
        uPalette3: { value: new Color(...p3) },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    function update(t: number) {
      animateId = requestAnimationFrame(update);
      program!.uniforms.uTime.value = t * 0.001;
      renderer.render({ scene: mesh });
    }
    animateId = requestAnimationFrame(update);
    ctn.appendChild(gl.canvas);
    requestAnimationFrame(resize);

    function handleMouseMove(e: MouseEvent) {
      if (!program) return;
      const rect = ctn.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      mousePos.current = { x, y };
      program.uniforms.uMouse.value[0] = x;
      program.uniforms.uMouse.value[1] = y;
    }
    if (mouseReact) {
      ctn.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener("resize", resize);
      resizeObserver?.disconnect();
      if (mouseReact) {
        ctn.removeEventListener("mousemove", handleMouseMove);
      }
      if (ctn.contains(gl.canvas)) {
        ctn.removeChild(gl.canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [color, palette, speed, amplitude, mouseReact]);

  return <div ref={ctnDom} style={{ width: "100%", height: "100%", ...style }} {...divProps} />;
}
