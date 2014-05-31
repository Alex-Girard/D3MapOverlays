
attribute vec4 worldCoord;
uniform vec2 pointSize;

uniform mat4 mapMatrix;
varying float value;

void main() {
	// transform world coordinate by matrix uniform variable
	gl_Position = mapMatrix * worldCoord;

    // a constant size for points, regardless of zoom level
    gl_PointSize = pointSize.x * mapMatrix[0].x;
    value = worldCoord.z;
}
