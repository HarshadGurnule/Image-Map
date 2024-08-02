let img = new Image();
let canvas = document.getElementById("image-canvas");
let ctx = canvas.getContext("2d");
let areas = [];
let isDrawing = false;
let startX, startY, endX, endY, shape;
let undoStack = [];
let redoStack = [];

document.getElementById("image-upload").onchange = function (event) {
  const reader = new FileReader();
  reader.onload = function (e) {
    img.src = e.target.result;
    img.onload = function () {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      canvas.style.pointerEvents = "auto";
      document.getElementById("shape").disabled = false;
      document.getElementById("generate").disabled = false;
      document.getElementById("undo").disabled = false;
      document.getElementById("redo").disabled = false;
      document.getElementById("copy").disabled = false;
      document.getElementById("generated-code").value = "";

      // Clear the areas array and undo/redo stacks
      areas = [];
      undoStack = [];
      redoStack = [];

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.addEventListener("mousedown", (e) => {
        isDrawing = true;
        startX = (e.offsetX / canvas.offsetWidth) * canvas.width;
        startY = (e.offsetY / canvas.offsetHeight) * canvas.height;
        shape = document.getElementById("shape").value;
      });

      canvas.addEventListener("mousemove", (e) => {
        if (isDrawing) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          endX = (e.offsetX / canvas.offsetWidth) * canvas.width;
          endY = (e.offsetY / canvas.offsetHeight) * canvas.height;
          drawShape(ctx, startX, startY, endX, endY);
        }
      });

      canvas.addEventListener("mouseup", (e) => {
        if (isDrawing) {
          isDrawing = false;
          endX = (e.offsetX / canvas.offsetWidth) * canvas.width;
          endY = (e.offsetY / canvas.offsetHeight) * canvas.height;
          let coords;
          if (shape === "rect") {
            coords = [startX, startY, endX, endY];
          } else if (shape === "circle") {
            let radius = Math.sqrt(
              Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
            );
            coords = [startX, startY, radius];
          }
          areas.push({ shape, coords });
          undoStack.push({ action: "draw", area: { shape, coords } });
          redoStack = [];
          drawAllShapes();
        }
      });
    };
  };
  reader.readAsDataURL(event.target.files[0]);
};

document.getElementById("generate").onclick = function () {
  generateMapCode();
};

document.getElementById("undo").onclick = function () {
  if (undoStack.length > 0) {
    let lastAction = undoStack.pop();
    redoStack.push(lastAction);
    if (lastAction.action === "draw") {
      areas.pop();
    }
    drawAllShapes();
  }
};

document.getElementById("redo").onclick = function () {
  if (redoStack.length > 0) {
    let lastAction = redoStack.pop();
    undoStack.push(lastAction);
    if (lastAction.action === "draw") {
      areas.push(lastAction.area);
    }
    drawAllShapes();
  }
};

document.getElementById("copy").onclick = function () {
  const textarea = document.getElementById("generated-code");
  textarea.select();
  document.execCommand("copy");
};

function drawShape(ctx, startX, startY, endX, endY) {
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;

  if (shape === "rect") {
    ctx.strokeRect(startX, startY, endX - startX, endY - startY);
  } else if (shape === "circle") {
    let radius = Math.sqrt(
      Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
    );
    ctx.beginPath();
    ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
    ctx.stroke();
  }
}

function drawAllShapes() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  areas.forEach((area) => {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    if (area.shape === "rect") {
      ctx.strokeRect(
        area.coords[0],
        area.coords[1],
        area.coords[2] - area.coords[0],
        area.coords[3] - area.coords[1]
      );
    } else if (area.shape === "circle") {
      ctx.beginPath();
      ctx.arc(area.coords[0], area.coords[1], area.coords[2], 0, 2 * Math.PI);
      ctx.stroke();
    }
  });
}

function generateMapCode() {
  let mapCode = '<map name="image-map">\n';
  areas.forEach((area) => {
    let coords = area.coords.map((coord) => coord.toFixed(2)).join(",");
    mapCode += `  <area shape="${area.shape}" coords="${coords}" href="#" alt="Area">\n`;
  });
  mapCode += "</map>";
  document.getElementById("generated-code").value = mapCode;
}
