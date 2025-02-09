// HelloTriangle.js (c) 2012 matsuda
class Cylinder{
    constructor(segments, matrix) {
        // this.position = position;
        this.color = [1, 1, 1, 1];
        // this.size = size;
        this.type = 'cube';
        // this.segments = segments;
        this.matrix = new Matrix4();
        if (matrix != null){
            this.matrix.set(matrix);
        }
        this.segments = segments;
    }

    render() {
        let rgba = this.color;
        // Reduces the color of the cylinder for each segment
        let colorReduction = 0.3/(this.segments/2)
        let colorPercent = 1

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Each segment is a triangle for the bottom circle, a triangle for the top circle, and a rectangle for the wall
        let angleStep = 360 / this.segments;
        for (let i = 0; i <= 360; i += angleStep){
            let angle1 = i;
            let angle2 = i + angleStep;

            // Bottom circle triangle (this is the same as circle render, but im gonna use the points for wall rectangles)
            let bottomCenter = [0, 0, 0];
            let bottomVec1 = [Math.cos(angle1 * Math.PI / 180) * 0.5, 0, Math.sin(angle1 * Math.PI / 180) * 0.5];
            let bottomVec2 = [Math.cos(angle2 * Math.PI / 180) * 0.5, 0, Math.sin(angle2 * Math.PI / 180) * 0.5];

            let bottomP1 = [bottomCenter[0] + bottomVec1[0], bottomCenter[1] + bottomVec1[1], bottomCenter[2] + bottomVec1[2]];
            let bottomP2 = [bottomCenter[0] + bottomVec2[0], bottomCenter[1] + bottomVec2[1], bottomCenter[2] + bottomVec2[2]];

            drawTriangle3D([bottomCenter[0], bottomCenter[1], bottomCenter[2], bottomP1[0], bottomP1[1], bottomP1[2], bottomP2[0], bottomP2[1], bottomP2[2]]);

            // Top circle triangle
            let topCenter = [0, 1, 0];
            let topVec1 = [Math.cos(angle1 * Math.PI / 180) * 0.5, 0, Math.sin(angle1 * Math.PI / 180) * 0.5];
            let topVec2 = [Math.cos(angle2 * Math.PI / 180) * 0.5, 0, Math.sin(angle2 * Math.PI / 180) * 0.5];

            let topP1 = [topCenter[0] + topVec1[0], topCenter[1] + topVec1[1], topCenter[2] + topVec1[2]];
            let topP2 = [topCenter[0] + topVec2[0], topCenter[1] + topVec2[1], topCenter[2] + topVec2[2]];

            drawTriangle3D([topCenter[0], topCenter[1], topCenter[2], topP1[0], topP1[1], topP1[2], topP2[0], topP2[1], topP2[2]]);

            // Wall rectangle
            drawTriangle3D([bottomP1[0], bottomP1[1], bottomP1[2], bottomP2[0], bottomP2[1], bottomP2[2], topP1[0], topP1[1], topP1[2]]);
            drawTriangle3D([bottomP2[0], bottomP2[1], bottomP2[2], topP1[0], topP1[1], topP1[2], topP2[0], topP2[1], topP2[2]])

            // Reduce the color for each segment, then increase it for the other half. This stops an obvious seam
            if (i < 180){
                colorPercent -= colorReduction
            }else{
                colorPercent += colorReduction
            }
            gl.uniform4f(u_FragColor, rgba[0] * colorPercent, rgba[1] * colorPercent, rgba[2] * colorPercent, rgba[3]);
        }
    }
}

