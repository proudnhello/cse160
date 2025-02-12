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
        this.textureNum = -3; // By default, use error purple
        this.colorReduction = 0.1;
    }

    render() {
        let rgba = this.color;
        let colorPercent = 1

        gl.uniform1i(u_whichtexture, this.textureNum);

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        let bottomUV = [0,0, 1,0, 1,1]
        let topUV = [0,0, 0,1, 1,1]
        // Front face
        gl.uniform4f(u_FragColor, rgba[0] * colorPercent, rgba[1] * colorPercent, rgba[2] * colorPercent, rgba[3]);
        drawTriangle3DUV([0, 0, 0,  0, 1, 0,  1, 1, 0], bottomUV);
        drawTriangle3DUV([0, 0, 0,  1, 0, 0,  1, 1, 0], topUV);
        colorPercent -= this.colorReduction

        // Back
        gl.uniform4f(u_FragColor, rgba[0] * colorPercent, rgba[1] * colorPercent, rgba[2] * colorPercent, rgba[3]);
        drawTriangle3DUV([0, 0, 1,  0, 1, 1,  1, 1, 1], bottomUV);
        drawTriangle3DUV([0, 0, 1,  1, 0, 1,  1, 1, 1], topUV);
        colorPercent -= this.colorReduction

        // Top
        gl.uniform4f(u_FragColor, rgba[0] * colorPercent, rgba[1] * colorPercent, rgba[2] * colorPercent, rgba[3]);
        drawTriangle3DUV([0, 1, 0,  1, 1, 0,  1, 1, 1], bottomUV);
        drawTriangle3DUV([0, 1, 0,  0, 1, 1,  1, 1, 1], topUV);
        colorPercent -= this.colorReduction

        // Bottom
        gl.uniform4f(u_FragColor, rgba[0] * colorPercent, rgba[1] * colorPercent, rgba[2] * colorPercent, rgba[3]);
        drawTriangle3DUV([0, 0, 0,  1, 0, 0,  1, 0, 1], bottomUV);
        drawTriangle3DUV([0, 0, 0,  0, 0, 1,  1, 0, 1], topUV);
        colorPercent -= this.colorReduction

        // Left
        gl.uniform4f(u_FragColor, rgba[0] * colorPercent, rgba[1] * colorPercent, rgba[2] * colorPercent, rgba[3]);
        drawTriangle3DUV([0, 0, 1,  0, 1, 1,  0, 1, 0], bottomUV);
        drawTriangle3DUV([0, 0, 1,  0, 0, 0,  0, 1, 0], topUV);
        colorPercent -= this.colorReduction

        // Right
        gl.uniform4f(u_FragColor, rgba[0] * colorPercent, rgba[1] * colorPercent, rgba[2] * colorPercent, rgba[3]);
        drawTriangle3DUV([1, 0, 0,  1, 1, 0,  1, 1, 1], bottomUV);
        drawTriangle3DUV([1, 0, 0,  1, 0, 1,  1, 1, 1], topUV);
        colorPercent -= this.colorReduction
    }
}

