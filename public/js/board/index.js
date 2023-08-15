let selectedX;
let selectedY;
let pixelArray, interval;
const coordElement = document.getElementById("pixel");
const placeButton = document.getElementById("placePixel");
const ownerElement = document.getElementById("owner");
const chatInput = document.getElementById("chatInput");
const messages = document.getElementById("messages");

const colors = {
  1: "#6d001a",
  2: "#be0039",
  3: "#ff4500",
  4: "#ffa800",
  5: "#ffd635",
  6: "#fff8b8",
  7: "#00a368",
  8: "#00cc78",
  9: "#7eed56",
  10: "#00756f",
  11: "#009eaa",
  12: "#00ccc0",
  13: "#2450a4",
  14: "#3690ea",
  15: "#51e9f4",
  16: "#493ac1",
  17: "#6a5cff",
  18: "#94b3ff",
  19: "#811e9f",
  20: "#b44ac0",
  21: "#e4abff",
  22: "#de107f",
  23: "#ff3881",
  24: "#ff99aa",
  25: "#6d482f",
  26: "#9c6926",
  27: "#ffb470",
  28: "#000000",
  29: "#515252",
  30: "#898d90",
  31: "#d4d7d9",
  32: "#ffffff",
};

let selectedColor;

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

function renderPixels(pixelArray) {
  for (let y = 0; y < pixelArray.length; y += 1) {
    for (let x = 0; x < pixelArray[y].length; x += 1) {
      if (pixelArray[y][x] != 32) {
        ctx.fillStyle = colors[pixelArray[y][x]];
        ctx.fillRect(x * 10, y * 10, 10, 10);
      }
    }
  }
}

function renderPixel(x, y, color) {
  ctx.fillStyle = colors[color];
  ctx.fillRect(x * 10, y * 10, 10, 10);
}

function updateColor(event) {
  selectedColor = event.target.getAttribute("color");
  new Audio("audio/Select Color.mp3").play();
  showPlaceButton();
}

function showPlaceButton() {
  if (typeof selectedX !== "undefined" && selectedColor) {
    placeButton.classList.add("show");
  }
}

function renderCrosshair(selectedX, selectedY) {
  coordElement.classList.add("show");
  coordElement.innerHTML = `${selectedX + 1}, ${selectedY + 1}`;

  const x = selectedX * 10;
  const y = selectedY * 10;

  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";

  ctx.fillRect(x + 1, y, 2, 1);
  ctx.fillRect(x, y, 1, 3);

  ctx.fillRect(x + 7, y, 2, 1);
  ctx.fillRect(x + 9, y, 1, 3);

  ctx.fillRect(x, y + 7, 1, 2);
  ctx.fillRect(x, y + 9, 3, 1);

  ctx.fillRect(x + 7, y + 9, 2, 1);
  ctx.fillRect(x + 9, y + 7, 1, 3);

  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";

  ctx.fillRect(x, y - 1, 4, 0.7);
  ctx.fillRect(x - 1, y - 1, 0.7, 5);

  ctx.fillRect(x + 6, y - 1, 4, 0.7);
  ctx.fillRect(x + 10.3, y - 1, 0.7, 5);

  ctx.fillRect(x - 1, y + 6, 0.7, 5);
  ctx.fillRect(x, y + 10.3, 4, 0.7);

  ctx.fillRect(x + 10.3, y + 6, 0.7, 4);
  ctx.fillRect(x + 6, y + 10.3, 5, 0.7);

  showPlaceButton();
}

function unrenderCrosshair(selectedX, selectedY) {
  // Old Pixel
  renderPixel(selectedX, selectedY, pixelArray[selectedY][selectedX]);

  // Old Pixel Left
  if (pixelArray[selectedY][selectedX - 1]) {
    renderPixel(selectedX - 1, selectedY, pixelArray[selectedY][selectedX - 1]);
  }

  // Old Pixel Right
  if (pixelArray[selectedY][selectedX + 1]) {
    renderPixel(selectedX + 1, selectedY, pixelArray[selectedY][selectedX + 1]);
  }

  // Old Pixel Up
  if (pixelArray[selectedY - 1]) {
    renderPixel(selectedX, selectedY - 1, pixelArray[selectedY - 1][selectedX]);
  }

  // Old Pixel Down
  if (pixelArray[selectedY + 1]) {
    renderPixel(selectedX, selectedY + 1, pixelArray[selectedY + 1][selectedX]);
  }

  // Old Pixel Top
  if (pixelArray[selectedY - 1]) {
    // Old Pixel Top Right
    if (pixelArray[selectedY - 1][selectedX + 1]) {
      renderPixel(
        selectedX + 1,
        selectedY - 1,
        pixelArray[selectedY - 1][selectedX + 1]
      );
    }

    // Old Pixel Top Left
    if (pixelArray[selectedY - 1][selectedX - 1]) {
      renderPixel(
        selectedX - 1,
        selectedY - 1,
        pixelArray[selectedY - 1][selectedX - 1]
      );
    }
  }

  // Old Pixel Bottom
  if (pixelArray[selectedY + 1]) {
    // Old Pixel Bottom Right
    if (pixelArray[selectedY + 1][selectedX + 1]) {
      renderPixel(
        selectedX + 1,
        selectedY + 1,
        pixelArray[selectedY + 1][selectedX + 1]
      );
    }

    // Old Pixel Bottom Left
    if (pixelArray[selectedY + 1][selectedX - 1]) {
      renderPixel(
        selectedX - 1,
        selectedY + 1,
        pixelArray[selectedY + 1][selectedX - 1]
      );
    }
  }
}

const socket = io();

socket.on("pixelUpdate", function (event) {
  pixelArray = event.pixelArray;
  renderPixel(event.x, event.y, event.color);
  cachedPixels[`${event.x}${event.y}`] = { c: event.color, u: event.u };
});

socket.on("canvasUpdate", function (event) {
  pixelArray = event.pixelArray;
  renderPixels(event.pixelArray);
});

socket.on("chat", function (msg) {
  const newMsg = document.createElement("p");
  messages.appendChild(newMsg);
  newMsg.innerHTML = msg;
});

function handle(e) {
  if (e.keyCode === 13) {
    socket.emit("chat", chatInput.value);
    chatInput.value = "";
    return false;
  }
}

function placePixel(event) {
  fetch("/placepixel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: id_token,
      selectedX: selectedX,
      selectedY: selectedY,
      selectedColor: selectedColor,
    }),
  }).then((response) => {
    if (response.status == 200) {
      new Audio("audio/Pixel Placed.mp3").play();
    }
    response.json().then((json) => {
      generateCountdown(placeButton, json.cooldown);
    });
  });
}

function generateCountdown(element, timestamp) {
  const enableTime = new Date(timestamp);
  if (interval) {
    clearInterval(interval);
  }
  const timeRemaining = Math.ceil(
    (enableTime.getTime() - new Date().getTime()) / 100
  );
  if (1 > timeRemaining) {
    return;
  }

  element.classList.remove("enabled");
  placeButton.disabled = true;

  interval = setInterval(() => {
    const timeRemaining = Math.ceil(
      (enableTime.getTime() - new Date().getTime()) / 1000
    );

    const minute = ~~(timeRemaining / 59.9).toString();
    const second = (timeRemaining % 60).toString();

    element.innerHTML = `${minute.length == 1 ? "0" : ""}${minute}:${
      second.length == 1 ? "0" : ""
    }${second}`;
    if (1 > timeRemaining) {
      element.classList.add("enabled");
      element.innerHTML = `<i class="fa-sharp fa-solid fa-check"></i>`;
      clearInterval(interval);
      interval = undefined;
      placeButton.disabled = false;

      new Audio("audio/Pixel Ready.mp3").play();
    }
  }, 1000);
}
