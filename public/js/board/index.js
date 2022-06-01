let selectedX = 0;
let selectedY = 0;
let id_token, pixelArray;
const coordElement = document.getElementById("pixel");
const placeButton = document.getElementById("placePixel");

const colors = {
  1: "#ff4500",
  2: "#ffa800",
  3: "#ffd635",
  4: "#00a368",
  5: "#7eed56",
  6: "#2450a4",
  7: "#3690ea",
  8: "#51e9f4",
  9: "#811e9f",
  10: "#b44ac0",
  11: "#ff99aa",
  12: "#9c6926",
  13: "#000000",
  14: "#898d90",
  15: "#d4d7d9",
  16: "#ffffff",
};

const keys = Object.keys(colors);
let selectedColor;

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

function renderPixels(pixelArray) {
  for (let y = 0; y < pixelArray.length; y += 1) {
    for (let x = 0; x < pixelArray[y].length; x += 1) {
      ctx.fillStyle = colors[pixelArray[y][x]];
      ctx.fillRect(x * 100, y * 100, 100, 100);
    }
  }
}

function updateColor(event) {
  selectedColor = event.target.getAttribute("color");
  showPlaceButton();
}

let googleUser = {};

gapi.load("auth2", () => {
  auth2 = gapi.auth2.init({
    client_id:
      "643889621133-5d35fgfaovrpo14rea6gv6oifssmd3jv.apps.googleusercontent.com",
    cookiepolicy: "single_host_origin",
  });

  auth2.attachClickHandler(
    document.getElementById("google-button"),
    {},
    (googleUser) => {
      id_token = googleUser.getAuthResponse().id_token;
      const googleButton = document.getElementById("google-button");
      const colorElement = googleButton.parentNode;
      colorElement.innerHTML = "Verifying...";

      fetch(window.location.href, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: id_token,
        }),
      }).then((response) => {
        response.text().then((text) => {
          if (response.status == 200) {
            colorElement.innerHTML = "";
            for (const color of Object.keys(colors)) {
              colorElement.innerHTML += `<input ${
                color == selectedColor ? 'checked=""' : ""
              } onchange="updateColor(event);" type="radio" name="color" style="background-color: ${
                colors[color]
              };" color="${color}"></div>`;
            }
          } else {
            colorElement.innerHTML = text;
          }
        });
      });
    }
  );
});

function showPlaceButton() {
  if (selectedY && selectedX && selectedColor) {
    placeButton.classList.add("show");
  }
}

function renderCrosshair(selectedX, selectedY) {
  const x = selectedX * 100;
  const y = selectedY * 100;

  renderPixels(pixelArray);

  ctx.fillStyle = "#000";

  ctx.fillRect(x, y, 30, 10);
  ctx.fillRect(x, y, 10, 30);

  ctx.fillRect(x + 70, y, 30, 10);
  ctx.fillRect(x + 90, y, 10, 30);

  ctx.fillRect(x, y + 70, 10, 30);
  ctx.fillRect(x, y + 90, 30, 10);

  ctx.fillRect(x + 70, y + 90, 30, 10);
  ctx.fillRect(x + 90, y + 70, 10, 30);

  ctx.fillStyle = "#e0e2e4";

  ctx.fillRect(x + 10, y + 10, 20, 7);
  ctx.fillRect(x + 10, y + 10, 7, 20);

  ctx.fillRect(x + 70, y + 10, 20, 7);
  ctx.fillRect(x + 83, y + 10, 7, 20);

  ctx.fillRect(x + 10, y + 70, 7, 20);
  ctx.fillRect(x + 10, y + 83, 20, 7);

  ctx.fillRect(x + 70, y + 83, 20, 7);
  ctx.fillRect(x + 83, y + 70, 7, 20);

  coordElement.classList.add("show");
  coordElement.innerHTML = `${selectedX}, ${selectedY}`;
  showPlaceButton();
}

board.addEventListener("mousedown", (e) => {
  const rect = board.getBoundingClientRect();

  selectedX = ~~((e.clientX - rect.left) / zoom / 100);
  selectedY = ~~((e.clientY - rect.top) / zoom / 100);
  renderCrosshair(selectedX, selectedY);
});

const socket = io();

socket.on("canvasUpdate", function(event) {
    pixelArray = event.pixelArray;
    renderPixels(pixelArray);
});

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
    response.json().then((json) => {
      generateCountdown(event.target, json.cooldown);
    });
  });
}

function generateCountdown(element, timestamp) {
  const enableTime = new Date(timestamp);
  const interval = setInterval(() => {
    const timeRemaining = Math.ceil(
      (enableTime.getTime() - new Date().getTime()) / 1000
    );
    const second = Math.ceil(timeRemaining / 60).toString();
    const minute = (timeRemaining % 60).toString();

    element.innerHTML = `${second.length == 1 ? "0" : ""}${second}:${
      minute.length == 1 ? "0" : ""
    }${minute}`;
    if (1 > timeRemaining) {
      element.innerHTML = "✓";
      clearInterval(interval);
    }
  }, 1000);
}