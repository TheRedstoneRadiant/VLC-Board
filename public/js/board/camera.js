const zoomElement = document.getElementById("zoom-container");
const board = document.getElementById("board");

let zoom = window.screen.availHeight / (canvas.height * 1.5);
zoomElement.style.transform = `scale(${zoom})`;

let dragging = false;
let currentX = 0;
let currentY = 0;
let initialX, initialY;
let focusTimeout, pixelQueryTimeout;
let cachedUsers = {};
let cachedPixels = {};

function zoom_camera(event) {
  const isTouchPad = event.wheelDeltaY
    ? event.wheelDeltaY === -3 * event.deltaY
    : event.deltaMode === 0;

  if (event.deltaY < 0) {
    if (zoom >= 7) return;
    zoomElement.style.transform = `scale(${(zoom += isTouchPad ? 0.1 : 0.5)})`;
  } else {
    if (zoom <= 1) return;
    zoomElement.style.transform = `scale(${(zoom -= isTouchPad ? 0.1 : 0.5)})`;
  }
}

function dragStart(e) {
  if (e.type === "touchmove") {
    x = e.touches[0].clientX;
    y = e.touches[0].clientY;
  } else {
    x = e.clientX;
    y = e.clientY;
  }

  initialX = x - currentX * zoom;
  initialY = y - currentY * zoom;

  dragging = true;
  board.classList.add("dragging");
}

function drag(e) {
  if (dragging) {
    e.preventDefault();

    const currentNextX = (x - initialX) / zoom;
    const currentNextY = (y - initialY) / zoom;

    const selectedNextX = ~((currentNextX - canvas.width / 2) / 10) + 1;
    const selectedNextY = ~((currentNextY - canvas.height / 2) / 10) + 1;

    let moveDeltaX = Math.abs(x - e.clientX);
    let moveDeltaY = Math.abs(y - e.clientY);

    if (focusTimeout && (moveDeltaX > 1 || moveDeltaY > 1)) {
      clearTimeout(focusTimeout);
      focusTimeout = null;
    }

    const { outOfBoundsX, outOfBoundsY } = crosshairBorderRender(
      selectedNextX,
      selectedNextY
    );

    if (e.type === "touchmove") {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    } else {
      x = e.clientX;
      y = e.clientY;
    }

    if (!outOfBoundsX) {
      currentX = (x - initialX) / zoom;
    }
    if (!outOfBoundsY) {
      currentY = (y - initialY) / zoom;
    }

    board.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
  }
}

function dragEnd(e) {
  dragging = false;
  board.classList.remove("dragging");
}

function crosshairBorderRender(selectedNextX, selectedNextY) {
  const outOfBoundsX = selectedNextX < 0 || selectedNextX > pixelArray.length;
  const outOfBoundsY =
    selectedNextY < 0 || selectedNextY > pixelArray[0].length;

  if (selectedNextX != selectedX || selectedNextY != selectedY) {
    if (pixelQueryTimeout) {
      clearTimeout(pixelQueryTimeout);
      pixelQueryTimeout = null;
    }

    if (typeof selectedX != "undefined") {
      unrenderCrosshair(selectedX, selectedY);
    }

    if (selectedNextX < 0) {
      selectedX = 0;
    } else if (selectedNextX > pixelArray[0].length - 1) {
      selectedX = pixelArray[0].length - 1;
    } else {
      selectedX = selectedNextX;
    }

    if (selectedNextY < 0) {
      selectedY = 0;
    } else if (selectedNextY > pixelArray.length - 1) {
      selectedY = pixelArray.length - 1;
    } else {
      selectedY = selectedNextY;
    }

    renderCrosshair(selectedX, selectedY);
    pixelInfo(selectedNextX, selectedNextY);
  }

  return outOfBoundsX, outOfBoundsY;
}

function renderPixelOwner(pixel) {
  if (pixel == "open") {
    ownerElement.innerHTML = "";
    return;
  }

  let pixelOwner = pixel.u;
  if (!cachedUsers[pixelOwner]) {
    fetch("/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: pixelOwner,
      }),
    }).then((response) => {
      response.json().then((json) => {
        cachedUsers[pixelOwner] = json;
        ownerElement.innerHTML = `<img src="${cachedUsers[pixelOwner].picture}" alt="${cachedUsers[pixelOwner].name}">
  <h5 class="name">${cachedUsers[pixelOwner].name}</h5>`;
      });
    });
  } else {
    ownerElement.innerHTML = `<img src="${cachedUsers[pixelOwner].picture}" alt="${cachedUsers[pixelOwner].name}">
  <h5 class="name">${cachedUsers[pixelOwner].name}</h5>`;
  }
}

function pixelInfo(x, y) {
  if (!cachedPixels[`${x}${y}`]) {
    renderPixelOwner("open");

    pixelQueryTimeout = setTimeout(() => {
      fetch("/pixel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          x,
          y,
        }),
      }).then((response) => {
        if (response.status != 200) {
          cachedPixels[`${x}${y}`] = "open";
          renderPixelOwner("open");
        } else {
          response.json().then(async (json) => {
            cachedPixels[`${x}${y}`] = json;
            renderPixelOwner(cachedPixels[`${x}${y}`]);
          });
        }
      });
    }, 100);
  } else {
    renderPixelOwner(cachedPixels[`${x}${y}`]);
  }
}

document.addEventListener("wheel", zoom_camera);

document.addEventListener("touchstart", dragStart);
document.addEventListener("touchend", dragEnd);
document.addEventListener("touchmove", drag);

document.addEventListener("mousedown", dragStart);
document.addEventListener("mouseup", dragEnd);
document.addEventListener("mousemove", drag);

let pointerdown = false;

function pixelFocus(e) {
  if (!pointerdown) {
    const rect = board.getBoundingClientRect();

    const selectedNextX = ~~((e.clientX - rect.left) / zoom / 10);
    const selectedNextY = ~~((e.clientY - rect.top) / zoom / 10);

    crosshairBorderRender(selectedNextX, selectedNextY);

    new Audio("audio/Select Tile & Open Color Select.mp3").play();

    currentX = canvas.width / 2 - (e.clientX - rect.left) / zoom;
    currentY = canvas.height / 2 - (e.clientY - rect.top) / zoom;
    board.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
  }
}

let holdTimeStart;

board.onpointerdown = function (e) {
  focusTimeout = setTimeout(() => {
    pixelFocus(e);
  }, 300);
  pointerdown = true;
};

board.onpointerup = function (e) {
  pointerdown = false;

  if (focusTimeout) {
    clearTimeout(focusTimeout);
    focusTimeout = null;
    pixelFocus(e);
  }
};
