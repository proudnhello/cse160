SCALE_FACTOR = 20;
// DrawRectangle.js
function main() {
    // Retrieve <canvas> element                                  <- (1)
    let ctx = fetchContext();

    // Draw a black rectangle                                       <- (3)
    ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set a black color
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.width); // Fill a rectangle with the color

    let drawButton = document.getElementById('drawButton'); 
    drawButton.onclick = handleDrawEvent;

    let operationButton = document.getElementById('operationButton');
    operationButton.onclick = handleDrawOperationEvent;
}

function drawVector(v, color){
    let ctx = fetchContext();

    centerX = ctx.canvas.width/2;
    centerY = ctx.canvas.height/2;

    ctx.strokeStyle = color;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);

    ctx.fillStyle = color;
    ctx.lineTo(centerX + v.elements[0]*SCALE_FACTOR, centerY - v.elements[1]*SCALE_FACTOR);
    ctx.stroke();
}

function fetchContext(){
    // Retrieve <canvas> element                                  <- (1)
    let canvas = document.getElementById('example');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }

    // Get the rendering context for 2DCG                          <- (2)
    return canvas.getContext('2d');
}

function clearBoard(){
    let ctx = fetchContext();
    // Clear the board by drawing over it with a black rectangle
    ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set a black color
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.width); // Fill a rectangle with the color
}

function fetchVector(name){
    return new Vector3([document.getElementById(name + 'x').value, document.getElementById(name + 'y').value, 0]);
}

function handleDrawEvent(){
    let ctx = fetchContext();
    clearBoard();

    let v1 = fetchVector('v1');
    drawVector(v1, 'red');

    let v2 = fetchVector('v2');
    drawVector(v2, 'blue');
}

function handleDrawOperationEvent(){
    clearBoard();

    let v1 = fetchVector('v1');
    drawVector(v1, 'red');

    let v2 = fetchVector('v2');
    drawVector(v2, 'blue');

    let scalar = document.getElementById('scalar').value;

    switch(document.getElementById('operations').value){
        case 'add':
            drawVector(v1.add(v2), 'green');
            break;
        case 'sub':
            drawVector(v1.sub(v2), 'green');
            break;
        case 'mult':
            drawVector(v1.mul(scalar), 'green');
            drawVector(v2.mul(scalar), 'green');
            break;
        case 'div':
            drawVector(v1.div(scalar), 'green');
            drawVector(v2.div(scalar), 'green');
            break;
        case 'mag':
            console.log("Vector 1 magnitude: " + v1.magnitude());
            console.log("Vector 2 magnitude: " + v2.magnitude());
            break;
        case 'norm':
            drawVector(v1.normalize(), 'green');
            drawVector(v2.normalize(), 'green');
            break;
    }
}