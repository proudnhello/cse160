// HelloTriangle.js (c) 2012 matsuda
class Sphere{
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

        // Precomputed vertices for the cube
        // In the format of [x,y,z, u,v, nx,ny,nz,  next point], with each triangle defined on a new line, and n is the normal
        this.cubeVerts = []

        let d = Math.PI / 10;
        let dd = Math.PI / 10;

        let tris = [];

        for(let t = 0; t<Math.PI; t+=d){
            for(let r = 0; r<2*Math.PI; r+=d){
                // Calculate sphere points
                let p1 = [Math.sin(t) * Math.cos(r), Math.sin(t) * Math.sin(r), Math.cos(t)];
                let p2 = [Math.sin(t + dd) * Math.cos(r), Math.sin(t + dd) * Math.sin(r), Math.cos(t + dd)];
                let p3 = [Math.sin(t) * Math.cos(r + dd), Math.sin(t) * Math.sin(r + dd), Math.cos(t)];
                let p4 = [Math.sin(t + dd) * Math.cos(r + dd), Math.sin(t + dd) * Math.sin(r + dd), Math.cos(t + dd)];

                let uv1 = [t / Math.PI, r / (2 * Math.PI)];
                let uv2 = [(t + dd) / Math.PI, r / (2 * Math.PI)];
                let uv3 = [t / Math.PI, (r + dd) / (2 * Math.PI)];
                let uv4 = [(t + dd) / Math.PI, (r + dd) / (2 * Math.PI)];

                // Add points to triangle array, with uv (unused) and normal
                tris = tris.concat(p1, uv1, p1)
                tris = tris.concat(p2, uv2, p2)
                tris = tris.concat(p4, uv4, p4)

                tris = tris.concat(p1, uv1, p1)
                tris = tris.concat(p4, uv4, p4)
                tris = tris.concat(p3, uv3, p3)
            }
        }

        this.verts = tris;
    }

    fastRender(){
        let rgba = this.color;

        gl.uniform1i(u_whichtexture, this.textureNum);

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        this.normalMatrix.setInverseOf(this.matrix).transpose();
        gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);

        drawTriangle3DUVNormal(this.verts);
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

