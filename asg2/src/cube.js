// HelloTriangle.js (c) 2012 matsuda
class Cube{
    constructor(position, color, size, segments) {
        // this.position = position;
        this.color = [1, 1, 1, 1];
        // this.size = size;
        this.type = 'cube';
        // this.segments = segments;
        this.matrix = new Matrix4();
    }

    render() {
        let xy = this.position;
        let rgba = this.color;
        let size = this.size;

        gl.uniform1f(u_PointSize, size);
        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        // Draw
        // let d = this.size / 200;
        
        // let angleStep = 360 / this.segments;
        // for(let angle = 0; angle < 360; angle += angleStep){
        //     let center = [xy[0], xy[1]];
        //     let angle1 = angle;
        //     let angle2 = angle + angleStep;

        //     let vec1 = [Math.cos(angle1 * Math.PI / 180) * d, Math.sin(angle1 * Math.PI / 180) * d];
        //     let vec2 = [Math.cos(angle2 * Math.PI / 180) * d, Math.sin(angle2 * Math.PI / 180) * d];

        //     let p1 = [center[0] + vec1[0], center[1] + vec1[1]];
        //     let p2 = [center[0] + vec2[0], center[1] + vec2[1]];

        //     drawTriangle([center[0], center[1], p1[0], p1[1], p2[0], p2[1]]);
        // }

        console.log("Drawing cube");

        drawTriangle3D([0, 0, 0,  1, 1, 0,  1, 0, 0]);
        drawTriangle3D([0, 0, 0,  0, 1, 0,  1, 1, 0]);
    }
}

