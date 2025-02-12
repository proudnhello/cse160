class Camera{
    constructor(){
        this.eye = new Vector3([0, 1, 3]);
        this.originalLookat = new Vector3([0, 1, -100]);
        this.lookat = new Vector3([0, 1, -100]);
        this.up = new Vector3([0, 1, 0]);
        this.pitch = 0;
        this.tilt = 0;
        console.log(this.eye.elements);
    }

    fetchArray(){
        return [this.eye.elements[0], 
        this.eye.elements[1], 
        this.eye.elements[2], 
        this.lookat.elements[0], 
        this.lookat.elements[1], 
        this.lookat.elements[2], 
        this.up.elements[0], 
        this.up.elements[1], 
        this.up.elements[2]]
    }

    fetchDirection() {
        let direction = new Vector3();
        direction.set(this.lookat);
        direction.sub(this.eye);
        direction.normalize();
        return direction;
    }

    findGridPosition() {
        // Convert the eye position to an index in g_map
        // 0, 0 is the top left corner of the grid, at 16, 16
        let x = Math.floor(g_map.length/2 - this.eye.elements[0])
        let z = Math.floor(g_map.length/2 - this.eye.elements[2]);
        return [x, z];
    }

    colisionCheck(direction) {
        let testDirection = new Vector3();
        testDirection.set(direction);
        testDirection.mul(2);
        let newX = this.eye.elements[0] + testDirection.elements[0];
        let newZ = this.eye.elements[2] + testDirection.elements[2];

        let x = Math.floor(g_map.length/2 - newX);
        let z = Math.floor(g_map.length/2 - newZ);

        if (x < 0 || x >= g_map.length || z < 0 || z >= g_map.length || g_map[z][x] !== 0) {
            return true
        }
        return false
    }
    
    moveFwdOrBwd(amount) {
        let direction = this.fetchDirection();
        direction.elements[1] = 0;
        direction.normalize();
        direction.mul(amount);
        // Check if we are going to hit a wall
        let colision = this.colisionCheck(direction);
        // If we are on the edge of the map, don't move
        if (!colision) {
            // Otherwise, check if the direction we are moving in is a wall
            this.eye.add(direction);
            this.lookat.add(direction);
        }
    }
    
    moveLOrR(amount) {
        let direction = this.fetchDirection();
        direction.elements[1] = 0;
        direction.normalize();
        let left = Vector3.cross(direction, this.up);
        left.normalize();
        left.mul(amount);
        // invert the direction b/c we want to move left
        left.mul(-1);
        let colision = this.colisionCheck(left);
        left.mul(-1);
        // If we are on the edge of the map, don't move
        if (!colision) {
            // Otherwise, check if the direction we are moving in is a wall
            this.eye.sub(left);
            this.lookat.sub(left);
        }
    }
    
    rotate(angleX, angleY) {
        this.pitch += angleX;
        this.tilt += angleY;
        // Constrain the tilt so that the camera doesn't flip upside down
        if (this.tilt > 90) {
            this.tilt = 90;
        }
        if (this.tilt < -90) {
            this.tilt = -90;
        }
        let pitchMatrix = new Matrix4();
        let tiltMatrix = new Matrix4();
        pitchMatrix.setRotate(-this.pitch, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        tiltMatrix.setRotate(this.tilt, 1, 0, 0);
        pitchMatrix.multiply(tiltMatrix);

        this.lookat = pitchMatrix.multiplyVector3(this.originalLookat);
    }
}

