class Camera{
    constructor(){
        this.eye = new Vector3(0, 0, 3);
        this.lookat = new Vector3(0, 0, -100);
        this.up = new Vector3(0, 1, 0);
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
        let left = Vector3.cross(direction, g_up);
        left.normalize();
        left.mul(amount);
        this.eye.sub(left);
        this.lookat.sub(left);
    }
    
    rotateY(angle) {
        let atp = new Vector3();
        atp.set(this.lookat);
        atp.sub(this.eye);
        // I'll be ignoring the y component for now, as we're rotating around the y axis
        atp.elements[1] = 0;
        let r = atp.magnitude();
        let theta = Math.atan2(atp.elements[2], atp.elements[0]);
        theta += angle;
        this.lookat.elements[0] = this.eye.elements[0] + r * Math.cos(theta);
        this.lookat.elements[2] = this.eye.elements[2] + r * Math.sin(theta);
    }
    
    rotateX(angle) {
        let atp = new Vector3();
        atp.set(this.lookat);
        atp.sub(this.eye);
    
        // I'll be ignoring the x component , as we're rotating around the x axis
        atp.elements[0] = 0;
        let r = atp.magnitude();
        let theta = Math.atan2(atp.elements[2], atp.elements[1]);
        theta += angle;
        this.lookat.elements[1] = this.eye.elements[1] + r * Math.cos(theta);
        this.lookat.elements[2] = this.eye.elements[2] + r * Math.sin(theta);
    }
}

