// HelloTriangle.js (c) 2012 matsuda
class Cube{
    constructor(matrix) {
        // this.position = position;
        this.color = [1, 1, 1, 1];
        // this.size = size;
        this.type = 'cube';
        // this.segments = segments;
        this.matrix = new Matrix4();
        if (matrix != null){
            this.matrix.set(matrix);
        }
    }

    render() {
        let rgba = this.color;
        let colorReduction = 0.1
        let colorPercent = 1

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        let bottomUV = [0,0, 1,0, 1,1]
        let topUV = [0,0, 0,1, 1,1]
        // Front face
        gl.uniform4f(u_FragColor, rgba[0] * colorPercent, rgba[1] * colorPercent, rgba[2] * colorPercent, rgba[3]);
        drawTriangle3DUV([-0.5, -0.5, -0.5,  -0.5, 0.5, -0.5,  0.5, 0.5, -0.5], bottomUV);
        drawTriangle3DUV([-0.5, -0.5, -0.5,  0.5, -0.5, -0.5,  0.5, 0.5, -0.5], topUV);
        colorPercent -= colorReduction

        // Back
        gl.uniform4f(u_FragColor, rgba[0] * colorPercent, rgba[1] * colorPercent, rgba[2] * colorPercent, rgba[3]);
        drawTriangle3DUV([-0.5, -0.5, 0.5,  -0.5, 0.5, 0.5,  0.5, 0.5, 0.5], bottomUV);
        drawTriangle3DUV([-0.5, -0.5, 0.5,  0.5, -0.5, 0.5,  0.5, 0.5, 0.5], topUV);
        colorPercent -= colorReduction

        // Top
        gl.uniform4f(u_FragColor, rgba[0] * colorPercent, rgba[1] * colorPercent, rgba[2] * colorPercent, rgba[3]);
        drawTriangle3DUV([-0.5, 0.5, -0.5,  0.5, 0.5, -0.5,  0.5, 0.5, 0.5], bottomUV);
        drawTriangle3DUV([-0.5, 0.5, -0.5,  -0.5, 0.5, 0.5,  0.5, 0.5, 0.5], topUV);
        colorPercent -= colorReduction

        // Bottom
        gl.uniform4f(u_FragColor, rgba[0] * colorPercent, rgba[1] * colorPercent, rgba[2] * colorPercent, rgba[3]);
        drawTriangle3DUV([-0.5, -0.5, -0.5,  0.5, -0.5, -0.5,  0.5, -0.5, 0.5], bottomUV);
        drawTriangle3DUV([-0.5, -0.5, -0.5,  -0.5, -0.5, 0.5,  0.5, -0.5, 0.5], topUV);
        colorPercent -= colorReduction

        // Left
        gl.uniform4f(u_FragColor, rgba[0] * colorPercent, rgba[1] * colorPercent, rgba[2] * colorPercent, rgba[3]);
        drawTriangle3DUV([-0.5, -0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5, 0.5, -0.5], bottomUV);
        drawTriangle3DUV([-0.5, -0.5, 0.5,  -0.5, -0.5, -0.5,  -0.5, 0.5, -0.5], topUV);
        colorPercent -= colorReduction

        // Right
        gl.uniform4f(u_FragColor, rgba[0] * colorPercent, rgba[1] * colorPercent, rgba[2] * colorPercent, rgba[3]);
        drawTriangle3DUV([0.5, -0.5, -0.5,  0.5, 0.5, -0.5,  0.5, 0.5, 0.5], bottomUV);
        drawTriangle3DUV([0.5, -0.5, -0.5,  0.5, -0.5, 0.5,  0.5, 0.5, 0.5], topUV);
        colorPercent -= colorReduction
    }
}

