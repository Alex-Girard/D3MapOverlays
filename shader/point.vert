
attribute vec4 worldCoord;

uniform mat4 mapMatrix;

void main() {
	// transform world coordinate by matrix uniform variable
	gl_Position = mapMatrix * worldCoord;

    // a constant size for points, regardless of zoom level
    gl_PointSize = 0.05 * mapMatrix[0].x;
}
