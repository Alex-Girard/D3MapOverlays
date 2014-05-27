
precision mediump float;

uniform sampler2D uColorScale;
varying float value;

void main() {
	// set pixels in points to green
    gl_FragColor = texture2D(uColorScale, vec2(value, 0.5));
    gl_FragColor.a = 1.0;
}