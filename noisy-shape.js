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

// Your glsl code
const frag = glsl(/* glsl */`
  #ifdef GL_OES_standard_derivatives
  #extension GL_OES_standard_derivatives : enable
  #endif

  precision highp float;

  uniform float playhead;
  varying vec2 vUv;

  #pragma glslify: aastep = require('glsl-aastep')
  #pragma glslify: noise = require(glsl-noise/simplex/3d);

  float loopNoise (float x, float y, float t, float scale, float offset) {
    float duration = scale;
    float current = t * scale;
    return ((duration - current) * noise(vec3(x, y, current + offset)) + current * noise(vec3(x, y, current - duration + offset))) / duration;
  }

  float sdEquilateralTriangle( in vec2 p ) {
    const float k = sqrt(3.0);
    p.x = abs(p.x) - 1.0;
    p.y = p.y + 1.0/k;
    if( p.x+k*p.y>0.0 ) p = vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;
    p.x -= clamp( p.x, -2.0, 0.0 );
    return -length(p)*sign(p.y);
}

  void main () {
    float dist = sdEquilateralTriangle(5.*(vUv+vec2(-0.5, -0.45)));

    float red = aastep(0.45, loopNoise(vUv.x, vUv.y, playhead, 1., 60.));
    float green = aastep(0.005, loopNoise(vUv.x, vUv.y, playhead, 1., 120.));
    float light = .15*aastep(0.15, loopNoise(vUv.x, vUv.y, playhead, 1., 220.));

    float blue = .5;

    vec3 color = vec3(red, green, blue);

    // don't mix the lighter blue with green and red
    if (green + red < 1.){
      color += vec3(light);
    } 

    float alpha = aastep(.4, dist);

    // whitish triangle
    color = mix(vec3(240./255., 248./255., 1.), mix(vec3(.7), color, smoothstep(.4, .41, dist)+0.5), alpha);
    
    // box shadow effect
    color -= pow((1.-alpha) * smoothstep(.35, .4, dist) * vec3(.4), vec3(1.4));

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
