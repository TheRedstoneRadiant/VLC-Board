const { exec } = require("child_process");

// Load .env
const dotenv = require("dotenv");
dotenv.config();

// Express
const express = require("express");
const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());

// Socket
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Gapi
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env["GOOGLE_SECRET"]);

// MongoDB
const { MongoClient, ServerApiVersion } = require("mongodb");
const client = new MongoClient(process.env["MONGO_URI"], {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
const client2 = new MongoClient(process.env["MONGO_URI2"], {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

let pixelArray, boardCollection;
const usersCollection = client.db(process.env["DATABASE"]).collection("users");
const placedCollection = client2.db(process.env["DATABASE"]).collection("placed");

const allowedUsers = [
]

client.connect(async (err) => {
  if (err) {
    console.log(err);
    exec("kill 1");
    process.exit(1);
  }

  boardCollection = client.db(process.env["DATABASE"]).collection("pixels");

  const board = await boardCollection.findOne({ _id: "latestBoard" });
  try {
    pixelArray = board.pixelArray;
  } catch (err) {
    pixelArray = Array(50).fill(Array(50).fill(32));
    await boardCollection.updateOne(
      { _id: "latestBoard" },
      { $set: { _id: "latestBoard", pixelArray } },
      { upsert: true }
    );
  }
});

client2.connect();

const verifyToken = async (idToken) => {
  // if missing ID token
  if (!idToken) {
    throw "Missing Google ID token";
  }

  // verify legitimacy of ID token
  const ticket = await googleClient.verifyIdToken({
    idToken: idToken,
    audience: process.env["GOOGLE_CLIENT_ID"],
  });

  // get user payload
  const payload = ticket.getPayload();

  if (!["mustafaraza0206@gmail.com"].includes(payload.email) && (payload.hd !== "virtuallearning.ca" && payload.hd !== "tldsb.on.ca")) {
    throw "You must sign in with your VLC (@virtuallearning.ca or @tldsb.on.ca) account.";
  } else if (payload.aud !== process.env["GOOGLE_CLIENT_ID"]) {
    throw "Invalid Client ID: " + payload.aud;
  }

  return payload;
};

const renderIndex = (req, res) => {
  if (!pixelArray) {
    // Retry render in 3s
    return setTimeout(() => {renderIndex(req, res)}, 3000);
  }

  res.render("board", { googleClientId: process.env["GOOGLE_CLIENT_ID"], canvasHeight: pixelArray.length * 10, canvasWidth: pixelArray[0].length * 10 });
}

app.get("/", renderIndex);

app.post("/", async (req, res) => {
  let userPayload;

  try {
    userPayload = await verifyToken(req.body.token);
  } catch (err) {
    return res.status(405).send(err);
  }

  const user = await usersCollection.findOne({ _id: userPayload.sub });
  let cooldown;

  if (user) {
    cooldown = user.cooldown;
  } else {
    cooldown = Date.now();
    usersCollection.insertOne({
      _id: userPayload.sub,
      name: userPayload.name,
      cooldown: cooldown,
      picture: userPayload.picture,
      ip: req.header("x-forwarded-for"),
    });
  }

  res.send({ cooldown: cooldown });
});

// app.post("/placepixel", async (req, res) => {
//   let userPayload;

//   try {
//     userPayload = await verifyToken(req.body.token);
//   } catch (err) {
//     return res.status(405).send(err);
//   }

//   const user = await usersCollection.findOne({ _id: userPayload.sub });
//   let cooldown;

//   if (user) {
//     cooldown = user.cooldown;
//   } else {
//     return res.status(405).send("Not a registered user!");
//   }

//   if (cooldown < Date.now()) {
//     try {
//       pixelArray[req.body.selectedY][req.body.selectedX] = parseInt(
//         req.body.selectedColor,
//         10
//       );
//     } catch (err) {
//       return res.sendStatus(403);
//     }

//     io.emit("pixelUpdate", {
//       x: req.body.selectedX,
//       y: req.body.selectedY,
//       color: req.body.selectedColor,
//       pixelArray: pixelArray,
//       u: user._id,
//     });

				// EESA EDITS

				// let userAllowedPixels = 0;

				// Todo: Fetch ahsens website and get current credit balance

				// if payed {
				// 		 userAllowedPixels = 4
				// }

				// ... NVM, todo later ;-;

				// EESA EDITS

//     const cooldown = allowedUsers.includes(user.name) ? 10 : Date.now() + 8000;
//     res.send({ cooldown: cooldown });

//     await usersCollection.updateOne(
//       { _id: userPayload.sub },
//       { $set: { cooldown: cooldown } }
//     );

//     let _id = `${req.body.selectedX}${req.body.selectedY}`;
//     const pixel = await placedCollection.findOne({ _id });
//     if (!pixel) {
//       placedCollection.insertOne({
//         _id,
//         p: [{ c: req.body.selectedColor, u: user._id }],
//       });
//     } else {
//       placedCollection.updateOne(
//         { _id },
//         { $push: { p: { c: req.body.selectedColor, u: user._id } } }
//       );
//     }
//   } else {
//     return res.status(403).send({ cooldown: cooldown });
//   }
// });

app.get("/about", (req, res) => {
  res.redirect("https://en.wikipedia.org/wiki/R/place");
});

app.post("/user", async (req, res) => {
  const user = await usersCollection.findOne({ _id: req.body.id });

  res.json({ name: user.name, picture: user.picture });
});

app.post("/pixel", async (req, res) => {
  const pixel = await placedCollection.findOne({
    _id: `${req.body.x}${req.body.y}`,
  });

  if (!pixel) {
    return res.sendStatus(404);
  }

  res.json(pixel.p[pixel.p.length - 1]);
});

const sendPixelArray = (socket) => {
  if (typeof pixelArray !== "undefined") {
    if (socket) {
      socket.emit("canvasUpdate", { pixelArray: pixelArray });
    }
  } else {
    setTimeout(() => {sendPixelArray(socket)}, 250);
  }
};

io.on("connection", sendPixelArray);


// setInterval(() => {
//   if (pixelArray) {
//     boardCollection.updateOne({ _id: "latestBoard" }, { $set: { pixelArray } });
//   }
// }, 5000);

server.listen(8080, () => {
  console.log("Listening on port 8080\nhttp://localhost:8080");
});
