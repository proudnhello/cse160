class Point{
    constructor(position, color, size) {
        this.position = position;
        this.color = color.slice();
        this.size = size;
        this.type = 'point';
    }

    render() {
        let xy = this.position;
        let rgba = this.color;
        let size = this.size;
        // Pass the position and size of a point to a_Position and u_PointSize variable
        gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
        gl.uniform1f(u_PointSize, size);
        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        // Draw
        gl.drawArrays(gl.POINTS, 0, 1);
    }
}