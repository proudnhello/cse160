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

    fastRender(){
        let rgba = this.color;
        let colorPercent = 1

        gl.uniform1i(u_whichtexture, this.textureNum);

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        let bottomUV = [1,0, 1,1, 0,1]
        let topUV = [1,0, 0,0, 0,1]
        let verticies = []
        let uv = []
        // Front face
        //gl.uniform4f(u_FragColor, rgba[0] * colorPercent, rgba[1] * colorPercent, rgba[2] * colorPercent, rgba[3]);
        verticies = verticies.concat([0, 0, 0,  0, 1, 0,  1, 1, 0])
        uv = uv.concat(bottomUV)
        verticies = verticies.concat([0, 0, 0,  1, 0, 0,  1, 1, 0]);
        uv = uv.concat(topUV);
        colorPercent -= this.colorReduction

        // Back
        verticies = verticies.concat([0, 0, 1,  0, 1, 1,  1, 1, 1]);
        uv = uv.concat(bottomUV);
        verticies = verticies.concat([0, 0, 1,  1, 0, 1,  1, 1, 1]);
        uv = uv.concat(topUV);
        colorPercent -= this.colorReduction;

        // Top
        verticies = verticies.concat([0, 1, 0,  1, 1, 0,  1, 1, 1]);
        uv = uv.concat(bottomUV);
        verticies = verticies.concat([0, 1, 0,  0, 1, 1,  1, 1, 1]);
        uv = uv.concat(topUV);
        colorPercent -= this.colorReduction;

        // Bottom
        verticies = verticies.concat([0, 0, 0,  1, 0, 0,  1, 0, 1]);
        uv = uv.concat(bottomUV);
        verticies = verticies.concat([0, 0, 0,  0, 0, 1,  1, 0, 1]);
        uv = uv.concat(topUV);
        colorPercent -= this.colorReduction;

        // Left
        verticies = verticies.concat([0, 0, 1,  0, 1, 1,  0, 1, 0]);
        uv = uv.concat(bottomUV);
        verticies = verticies.concat([0, 0, 1,  0, 0, 0,  0, 1, 0]);
        uv = uv.concat(topUV);
        colorPercent -= this.colorReduction;

        // Right
        verticies = verticies.concat([1, 0, 0,  1, 1, 0,  1, 1, 1]);
        uv = uv.concat(bottomUV);
        verticies = verticies.concat([1, 0, 0,  1, 0, 1,  1, 1, 1]);
        uv = uv.concat(topUV);
        colorPercent -= this.colorReduction

        drawTriangle3DUV(this.interleaveAttributes(verticies, uv));
    }

    interleaveAttributes(vertices, uv){
        let interleaved = []
        let uvIndex = 0;
        for (let i = 0; i < vertices.length; i += 3){
            interleaved.push(vertices[i], vertices[i + 1], vertices[i + 2], uv[uvIndex], uv[uvIndex + 1]);
            uvIndex += 2;
        }
        return interleaved;
    }
}

