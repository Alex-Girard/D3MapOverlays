
attribute vec4 worldCoord;
attribute vec2 textureCoord;
    
uniform mat4 mapMatrix;

varying highp vec2 vTextureCoord;

void main() {
	vTextureCoord = vec2(textureCoord.s, textureCoord.t);
	// transform world coordinate by matrix uniform variable
	gl_Position = mapMatrix * worldCoord;
}
