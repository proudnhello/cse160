// HelloTriangle.js (c) 2012 matsuda
class Cube{
    constructor(matrix) {
        // this.position = position;
        this.color = [1, 1, 1, 1];
        // this.size = size;
        this.type = 'cube';
        // this.segments = segments;
        this.matrix = new Matrix4();
        this.normalMatrix = new Matrix4();
        if (matrix != null){
            this.matrix.set(matrix);
        }
        this.textureNum = -3; // By default, use error purple
        this.colorReduction = 0.1;
        this.skybox = false;

        // Precomputed vertices for the cube
        // In the format of [x,y,z, u,v, nx,ny,nz,  next point], with each triangle defined on a new line, and n is the normal
        this.cubeVerts = [
            0,0,0, 1,0, 0,0,-1,  0,1,0, 1,1, 0,0,-1,  1,1,0, 0,1, 0,0,-1, // Front face
            0,0,0, 1,0, 0,0,-1,  1,0,0, 0,0, 0,0,-1,  1,1,0, 0,1, 0,0,-1, // Front face
            0,0,1, 1,0, 0,0,1,  0,1,1, 1,1, 0,0,1,  1,1,1, 0,1, 0,0,1, // Back face
            0,0,1, 1,0, 0,0,1,  1,0,1, 0,0, 0,0,1,  1,1,1, 0,1, 0,0,1, // Back face
            0,1,0, 1,0, 0,1,0,  1,1,0, 1,1, 0,1,0,  1,1,1, 0,1, 0,1,0, // Top face
            0,1,0, 1,0, 0,1,0,  0,1,1, 0,0, 0,1,0,  1,1,1, 0,1, 0,1,0, // Top face
            0,0,0, 1,0, 0,-1,0,  1,0,0, 1,1, 0,-1,0,  1,0,1, 0,1, 0,-1,0, // Bottom face
            0,0,0, 1,0, 0,-1,0,  0,0,1, 0,0, 0,-1,0,  1,0,1, 0,1, 0,-1,0, // Bottom face
            0,0,1, 1,0, -1,0,0,  0,1,1, 1,1, -1,0,0,  0,1,0, 0,1, -1,0,0, // Left face
            0,0,1, 1,0, -1,0,0,  0,0,0, 0,0, -1,0,0,  0,1,0, 0,1, -1,0,0, // Left face
            1,0,0, 1,0, 1,0,0,  1,1,0, 1,1, 1,0,0,  1,1,1, 0,1, 1,0,0, // Right face
            1,0,0, 1,0, 1,0,0,  1,0,1, 0,0, 1,0,0,  1,1,1, 0,1, 1,0,0] // Right face
    }
    
    fastRender(){
        let rgba = this.color;

        gl.uniform1i(u_whichtexture, this.textureNum);

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        if(!this.skybox){
            this.normalMatrix.setInverseOf(this.matrix).transpose();
        }else{
            this.normalMatrix.setIdentity();
        }
        gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);

        drawTriangle3DUVNormal(this.cubeVerts);
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

