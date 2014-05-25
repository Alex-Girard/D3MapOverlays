
precision mediump float;

uniform sampler2D uSampler;
uniform sampler2D uColorScale;

uniform vec2 uTextureSize;
varying highp vec2 vTextureCoord;

vec4 cubic(float v) {
    vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
    vec4 s = n * n * n;
    float x = s.x;
    float y = s.y - 4.0 * s.x;
    float z = s.z - 4.0 * s.y + 6.0 * s.x;
    float w = 6.0 - x - y - z;
    return vec4(x, y, z, w);
}

vec4 filter(sampler2D texture, vec2 texcoord, vec2 texscale) {
    float fx = fract(texcoord.x);
    float fy = fract(texcoord.y);
    texcoord.x -= fx;
    texcoord.y -= fy;

    vec4 xcubic = cubic(fx);
    vec4 ycubic = cubic(fy);

    vec4 c = vec4(texcoord.x - 0.5, texcoord.x + 1.5, texcoord.y - 0.5, texcoord.y + 1.5);
    vec4 s = vec4(xcubic.x + xcubic.y, xcubic.z + xcubic.w, ycubic.x + ycubic.y, ycubic.z + ycubic.w);
    vec4 offset = c + vec4(xcubic.y, xcubic.w, ycubic.y, ycubic.w) / s;

    vec4 sample0 = texture2D(texture, vec2(offset.x, offset.z) * texscale);
    vec4 sample1 = texture2D(texture, vec2(offset.y, offset.z) * texscale);
    vec4 sample2 = texture2D(texture, vec2(offset.x, offset.w) * texscale);
    vec4 sample3 = texture2D(texture, vec2(offset.y, offset.w) * texscale);

    float sx = s.x / (s.x + s.y);
    float sy = s.z / (s.z + s.w);

    return mix(
    		mix(sample3, sample2, sx),
        	mix(sample1, sample0, sx), sy);
}

void main() {	
	vec2 onePixel = vec2(1.0, 1.0) / uTextureSize;
	vec4 val = filter(uSampler, vTextureCoord * uTextureSize, onePixel);
	if (val.x > 0.08) {
		vec4 col = texture2D(uColorScale, vec2(val.x, 0.5));
		gl_FragColor = vec4(col.r, col.g, col.b, val.x * 0.7);
	} else {
 	   gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
	}
}
