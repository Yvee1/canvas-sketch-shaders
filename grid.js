const canvasSketch = require('canvas-sketch');
const createShader = require('canvas-sketch-util/shader');
const glsl = require('glslify');

// Setup our sketch
const settings = {
  dimensions: [1024, 1024],
  context: 'webgl',
  animate: true,
  duration: 6,
  fps: 50
};

// Your glsl code
const frag = glsl(/* glsl */`
  precision highp float;

  uniform float playhead;
  varying vec2 vUv;

  #pragma glslify: noise = require(glsl-noise/simplex/3d);

  float loopNoise (float x, float y, float t, float scale, float offset) {
    float duration = scale;
    float current = t * scale;
    return ((duration - current) * noise(vec3(x, y, current + offset)) + current * noise(vec3(x, y, current - duration + offset))) / duration;
  }

  void main () {
    float size = 3.;
    vec2 st = vUv;
    st *= size;

    st.x += 3.*playhead;
    st.x = mod(st.x, 3.);

    float column = floor(st.x);
    float row = floor(st.y);
    float index = size * (column) + (row);

    // st.x += playhead;
    st = fract(st);
    // st.x += playhead;

    float dist = length(st - vec2(0.5, 0.5));

    float red = smoothstep(0.15, 0.17, loopNoise(st.x, st.y, playhead, 1., 0. + 60. * index));
    float green = smoothstep(0.105, 0.12, loopNoise(st.x, st.y, playhead, 1., 120. + 60. * index));
    float blue = .5;
    // float blue = smoothstep(0.2, 0.205, noise(vec3(st.x, st.y, playhead*.5+100.)));

    vec3 color = vec3(red, green, blue);
    // vec3 color = vec3(st, 0.0);
    float alpha = smoothstep(0.250, 0.245, dist);
    gl_FragColor = vec4(color, alpha);
  }

  
`);

// Your sketch, which simply returns the shader
const sketch = ({ gl }) => {
  // Create the shader and return it
  return createShader({
    clearColor: "rgb(240, 248, 255)",
    // Pass along WebGL context
    gl,
    // Specify fragment and/or vertex shader strings
    frag,
    // Specify additional uniforms to pass down to the shaders
    uniforms: {
      // Expose props from canvas-sketch
      playhead: ({ playhead }) => playhead
    }
  });
};

canvasSketch(sketch, settings);
