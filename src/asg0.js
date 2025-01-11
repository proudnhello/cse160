SCALE_FACTOR = 20;
var ctx = null;
// DrawRectangle.js
function main() {
    // Retrieve <canvas> element                                  <- (1)
    var canvas = document.getElementById('example');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }

    // Get the rendering context for 2DCG                          <- (2)
    ctx = canvas.getContext('2d');

    // Draw a blue rectangle                                       <- (3)
    ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set a blue color
    ctx.fillRect(0, 0, canvas.width, canvas.width); // Fill a rectangle with the color

    var v1 = new Vector3([2.25, 2.25, 0.0]);
    drawVector(v1, "red")
}

function drawVector(v, color){
    centerX = ctx.canvas.width/2;
    centerY = ctx.canvas.height/2;

    ctx.strokeStyle = color;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);

    ctx.fillStyle = color;
    ctx.lineTo(centerX + v.elements[0]*SCALE_FACTOR, centerY - v.elements[1]*SCALE_FACTOR);
    ctx.stroke();
}