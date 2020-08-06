const canvasSketch = require('canvas-sketch');
const createShader = require('canvas-sketch-util/shader');
const glsl = require('glslify');

// Setup our sketch
const settings = {
  dimensions: [1024, 1024],
  context: 'webgl',
  animate: true,
  duration: 10,
  fps: 50
};

const frag = glsl(/* glsl */`
  #ifdef GL_OES_standard_derivatives
  #extension GL_OES_standard_derivatives : enable
  #endif

  precision highp float;

  uniform float playhead;
  varying vec2 vUv;

  const float TWO_PI = 6.28318530718;
  const int numOctaves = 5;

  #pragma glslify: aastep = require('glsl-aastep')
  #pragma glslify: noise = require(glsl-noise/simplex/4d);

  float fbm_( in vec2 x, in float z, in float w, in float H )
  {    
      float t = 0.0;
      for( int i=0; i<numOctaves; i++ )
      {
          float f = pow( 2.0, float(i) );
          float a = pow( f, -H );
          t += a*noise(vec4(f*x, z, w));
      }
      return t;
  }

  float fbm(in vec2 x) {
      float r = 0.1;
      return fbm_(x, r*cos(playhead*TWO_PI), r*sin(playhead*TWO_PI), 1.);
  }

  vec2 g(vec2 p) {
      return vec2(fbm(p)) + vec2(0.5);
  }

  void main () {
    vec2 p = vUv + vec2(0.8, 0.7);
    float blue = fbm(p);
    vec2 tmp = g(p);
    float red = fbm(tmp);
    float green1 = fbm(g(tmp));
    vec3 color = vec3(red, green1 * blue, blue);
    gl_FragColor = vec4(color, 1.);
  }
`);

// Your sketch, which simply returns the shader
const sketch = ({ gl }) => {
  // Enable extension
  gl.getExtension('OES_standard_derivatives');

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
