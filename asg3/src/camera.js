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
    
    moveFwdOrBwd(amount) {
        let direction = this.fetchDirection();
        direction.mul(amount);
        this.eye.add(direction);
        this.lookat.add(direction);
    }
    
    moveLOrR(amount) {
        let direction = this.fetchDirection();
        let left = Vector3.cross(direction, this.up);
        left.normalize();
        left.mul(amount);
        this.eye.sub(left);
        this.lookat.sub(left);
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

