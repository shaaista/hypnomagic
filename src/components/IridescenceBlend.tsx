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
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;
uniform float uDiagShift;

varying vec2 vUv;

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
  vec3 base = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5);

  vec3 leftCol = base * uColor1;

  float luma = dot(base, vec3(0.299, 0.587, 0.114));
  vec3 rightCol = vec3(luma) * uColor2;

  /* Diagonal center shifts based on mouse hover */
  float diagX = mix(0.20, 0.80, vUv.y) + uDiagShift;
  float t = smoothstep(diagX - 0.04, diagX + 0.04, vUv.x);
  gl_FragColor = vec4(mix(leftCol, rightCol, t), 1.0);
}
`;

type RGB = [number, number, number];

interface IridescenceBlendProps extends Omit<HTMLAttributes<HTMLDivElement>, "color"> {
  color1?: RGB;
  color2?: RGB;
  speed?: number;
  amplitude?: number;
  mouseReact?: boolean;
}

// How far the diagonal shifts on hover
const HOVER_SHIFT = 0.30;
const CENTER_MIN = 0.40;
const CENTER_MAX = 0.60;
const LERP = 0.07;

export default function IridescenceBlend({
  color1 = [1, 1, 1],
  color2 = [1, 1, 1],
  speed = 1.0,
  amplitude = 0.1,
  mouseReact = true,
  ...rest
}: IridescenceBlendProps) {
  const { style, ...divProps } = rest;
  const ctnDom = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0.5, y: 0.5 });
  const targetShift = useRef(0);
  const currentShift = useRef(0);

  useEffect(() => {
    if (!ctnDom.current) return;
    const ctn = ctnDom.current;
    const renderer = new Renderer();
    const gl = renderer.gl;
    gl.clearColor(1, 1, 1, 1);

    let program: Program | undefined;
    let animateId = 0;
    let resizeObserver: ResizeObserver | undefined;

    function resize() {
      const width = Math.max(1, ctn.clientWidth);
      const height = Math.max(1, ctn.clientHeight);
      renderer.setSize(width, height);
      if (program) {
        program.uniforms.uResolution.value = new Color(
          gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height
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
        uTime:       { value: 0 },
        uColor1:     { value: new Color(...color1) },
        uColor2:     { value: new Color(...color2) },
        uResolution: { value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height) },
        uMouse:      { value: new Float32Array([0.5, 0.5]) },
        uAmplitude:  { value: amplitude },
        uSpeed:      { value: speed },
        uDiagShift:  { value: 0 },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    function update(t: number) {
      animateId = requestAnimationFrame(update);
      // Smooth lerp toward target shift
      currentShift.current += (targetShift.current - currentShift.current) * LERP;
      program!.uniforms.uDiagShift.value = currentShift.current;
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

      // Update diagonal shift target
      if (x >= CENTER_MIN && x <= CENTER_MAX) {
        targetShift.current = 0;
      } else if (x < CENTER_MIN) {
        targetShift.current = HOVER_SHIFT;   // left hover → diagonal shifts right → left expands
      } else {
        targetShift.current = -HOVER_SHIFT;  // right hover → diagonal shifts left → right expands
      }
    }

    function handleMouseLeave() {
      targetShift.current = 0;
    }

    if (mouseReact) {
      ctn.addEventListener("mousemove", handleMouseMove);
      ctn.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener("resize", resize);
      resizeObserver?.disconnect();
      if (mouseReact) {
        ctn.removeEventListener("mousemove", handleMouseMove);
        ctn.removeEventListener("mouseleave", handleMouseLeave);
      }
      if (ctn.contains(gl.canvas)) ctn.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [color1, color2, speed, amplitude, mouseReact]);

  return <div ref={ctnDom} style={{ width: "100%", height: "100%", ...style }} {...divProps} />;
}
