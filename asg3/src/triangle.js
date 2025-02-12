// HelloTriangle.js (c) 2012 matsuda
class Triangle{
    constructor(position, color, size) {
        this.position = position;
        this.color = color.slice();
        this.size = size;
        this.type = 'triangle';
        this.points = null
    }

    addPoints(points){
        this.points = points;
    }

    render(){
        if (this.points){
            this.renderFromPoints();
        } else{
            this.renderFromPosition();
        }
    }

    renderFromPoints(){
        let rgba = this.color;
        let size = this.size;

        gl.uniform1f(u_PointSize, size);
        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        // Draw
        drawTriangle([this.points[0], this.points[1], this.points[2], this.points[3], this.points[4], this.points[5]]);
    }

    renderFromPosition() {
        let xy = this.position;
        let rgba = this.color;
        let size = this.size;

        gl.uniform1f(u_PointSize, size);
        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        // Draw
        // deltaMag will be the offset from the center to the triangle's vertices
        let deltaMag = this.size / 400;
        // deltaComponent will be the x and y values of the vector from the center to the left and right corners of the triangle
        let deltaXComponent = Math.cos(Math.PI / 6) * deltaMag;
        let deltaYComponent = Math.sin(Math.PI / 6) * deltaMag;
        let top = [xy[0], xy[1] + deltaMag];
        let left = [xy[0] - deltaXComponent, xy[1] - deltaYComponent];
        let right = [xy[0] + deltaXComponent, xy[1] - deltaYComponent];

        drawTriangle([top[0], top[1], left[0], left[1], right[0], right[1]]);
    }
}


function drawTriangle(vertices) {
    var n = 3; // The number of vertices

    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write data into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    // Assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.TRIANGLES, 0, n);
}

function drawTriangle3D(vertices) {
    var n = 3; // The number of vertices

    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write data into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    // Assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.TRIANGLES, 0, n);
}

let g_vertexBuffer = null;
let FSIZE = 4;

function initVertexBuffers() {
    // Create a buffer object
    g_vertexBuffer = gl.createBuffer();
    if (!g_vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);

    // Assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 5, 0);
    gl.enableVertexAttribArray(a_Position);

    // Assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, FSIZE * 5, FSIZE * 3);
    gl.enableVertexAttribArray(a_UV);
}

function drawTriangle3DUV(vertices) {
    var n = vertices.length/5; // The number of vertices
    let bufferVerts = new Float32Array(vertices)
    FSIZE = bufferVerts.BYTES_PER_ELEMENT;

    // Create a buffer object
    if (!g_vertexBuffer) {
        console.log('Failed to create the buffer object');
        initVertexBuffers();
    }

    // Write data into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, bufferVerts, gl.DYNAMIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, n);
}