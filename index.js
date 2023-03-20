const showdown = require("showdown"),
  bodyParser = require("body-parser"),
  express = require("express"),
  nocache = require("nocache"),
  fs = require("fs"),
  dotenv = require('dotenv'),
  path = require("path");

dotenv.config({path: path.join(__dirname, ".env")});

const app = express();

showdown.extension("lyrics", function() {
  return [
    {
      type: "output",
      regex: /~([\w]+)[^>]*~([^]+?)~\1~/gi,
      replace: '<span class="$1">$2</span>'
    }
  ];
});

const Converter = new showdown.Converter({ extensions: ["lyrics"] });

// app.use(nocache());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use("/public", express.static(path.join(__dirname, "public")));

const config = {
  fontSize: "36px",
  port: process.env.PORT || 8080,
  setlistsPath: process.env.SETLIST_PATH || path.join(__dirname, "setlist-2023"),
  keycodes: {
    left: process.env.KEYCODE_LEFT || 37,
    middle: process.env.KEYCODE_MIDDLE || 40,
    right: process.env.KEYCODE_RIGHT || 39,
  }
};

function getSetlist() {
  return new Promise((resolve, reject) => {
    const setlistPath = path.join(config.setlistsPath, "setlist.json");
    fs.readFile(setlistPath, "utf-8", (err, data) => {
      if (err) {
        console.error(err);
        reject("setlist.json can not be opened");
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
}

function getLyrics(filename) {
  return new Promise((resolve, reject) => {
    const songPath = path.join(config.setlistsPath, filename);
    fs.readFile(songPath, "utf-8", (err, data) => {
      if (err) {
        console.error(err);
        reject(`${filename} can not be opened`);
      } else {
        resolve(
          Converter.makeHtml(
            data.replace(/^[^~.+\r?\n].*.+\r?\n/gm, "$&<br>\r\n")
          )
        );
      }
    });
  });
}

function getSongInSetlist(filename, setlist, i) {
  const index = setlist.songs.findIndex(x => x.filename == filename);
  return setlist.songs[index + i];
}

app.get("/", (req, res) => {
  getSetlist()
    .then(setlist => {
      res.render("setlist", {
        setlist: setlist,
        keycodes: config.keycodes,
        fontSize: config.fontSize
      });
    })
    .catch(error => {
      res.send(error);
    });
});

app.get("/:filename", (req, res) => {
  Promise.all([getLyrics(req.params.filename), getSetlist()])
    .then(([lyrics, setlist]) => {
      res.render("song", {
        lyrics: lyrics,
        song: getSongInSetlist(req.params.filename, setlist, 0),
        nextSong: getSongInSetlist(req.params.filename, setlist, 1),
        prevSong: getSongInSetlist(req.params.filename, setlist, -1),
        setlist: setlist,
        keycodes: config.keycodes,
        fontSize: config.fontSize
      });
    })
    .catch(error => {
      res.send(error);
    });
});

app.listen(config.port, () => {
  console.log("Server is up and running on port numner " + config.port);
});
