# VLC r/Place
Recreated [r/Place](https://en.wikipedia.org/wiki/R/place) canvas allowing real-time pixel placements at a one-minute interval.
Hosted in collaboration with the school student council for Spirit Week featuring 80 students all creating art simultaneously.

## Features
- Scrollable and pannable camera
- Pixel placement live in real time using Socket.io
- Pixels and cooldown stored server side in MongoDB database
- Pixel owner displayed on hover
- Google sign in restricted to school domain
- Google OAuth token verified on each request
- `expand.js` expands canvas in real time

<details>
  <summary><h2>Screenshots</h2></summary>

Default view:
<br>
<img src="https://user-images.githubusercontent.com/76220359/209420823-7b69fe4b-ca1d-4c21-9d98-26c81bf170e6.png" width="500">
<br><br>
Hovering pixel, displaying user that placed it:
<br>
<img src="https://user-images.githubusercontent.com/76220359/209420828-30b22ae4-4e70-4c8a-b02e-56f4a057e279.png" width="500">
<br><br>
Signed in to non school domain:
<br>
<img src="https://user-images.githubusercontent.com/76220359/209421281-1b43d4f1-621c-4e98-86fa-2af16be8d5cb.png" width="500">
<br><br>
Signed in:
<br>
<img src="https://user-images.githubusercontent.com/76220359/209420942-e0a0dfb3-387a-4ec7-acb9-c5a7df75b2bc.png" width="500">
<br><br>
Orange colour selected:
<br>
<img src="https://user-images.githubusercontent.com/76220359/209420960-c5e02170-5f2f-4031-aa4c-df630620a0b7.png" width="500"></img>
<br><br>
Placed orange pixel, on placement cooldown:
<br>
<img src="https://user-images.githubusercontent.com/76220359/209420964-3e09c524-1edb-46af-b9d4-a611ab0261bc.png" width="500">
</details>

## Installation

Clone the repo
```bash
git clone https://github.com/TheRedstoneRadiant/VLC-Board
cd VLC-Board
```

Install dependencies
```bash
npm install
```

Copy .env.example to .env
```bash
cp .env.example .env
nano .env
```

<details>
  <summary>Edit environment variables</summary>
  
  - `MONGO_URI`: Primary MongoDB database URI where pixels and users are stored
  - `MONGO_URI2`: Secondary MongoDB database URI, stores pixel ownership
  - `GOOGLE_SECRET`: Google OAuth Secret (see [Create Authorization Credentials](https://developers.google.com/identity/sign-in/web/sign-in#create_authorization_credentials))
  - `GOOGLE_CLIENT_ID`: Google OAuth Client ID
  - `DATABASE`: MongoDB database name, can be anything
  
</details>

Start server
```bash
npm run dev
OR
npm run start
```
