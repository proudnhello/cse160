SCALE_FACTOR = 20;
// DrawRectangle.js
function main() {
    // Retrieve <canvas> element                                  <- (1)
    var ctx = fetchContext();

    // Draw a black rectangle                                       <- (3)
    ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set a black color
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.width); // Fill a rectangle with the color

    var drawButton = document.getElementById('drawButton'); 
    drawButton.onclick = handleDrawEvent;

    var operationButton = document.getElementById('operationButton');
    operationButton.onclick = handleDrawOperationEvent;
}

function drawVector(v, color){
    var ctx = fetchContext();

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
    var canvas = document.getElementById('example');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }

    // Get the rendering context for 2DCG                          <- (2)
    return canvas.getContext('2d');
}

function clearBoard(){
    var ctx = fetchContext();
    // Clear the board by drawing over it with a black rectangle
    ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set a black color
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.width); // Fill a rectangle with the color
}

function fetchVector(name){
    return new Vector3([document.getElementById(name + 'x').value, document.getElementById(name + 'y').value, 0]);
}

function handleDrawEvent(){
    var ctx = fetchContext();
    clearBoard();

    var v1 = fetchVector('v1');
    drawVector(v1, 'red');

    var v2 = fetchVector('v2');
    drawVector(v2, 'blue');
}

function handleDrawOperationEvent(){
    var ctx = fetchContext();
    clearBoard();

    var v1 = fetchVector('v1');
    drawVector(v1, 'red');

    var v2 = fetchVector('v2');
    drawVector(v2, 'blue');

    var scalar = document.getElementById('scalar').value;

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
    }
}