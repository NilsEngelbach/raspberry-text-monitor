const showdown = require("showdown"),
  bodyParser = require("body-parser"),
  express = require("express"),
  nocache = require("nocache"),
  fs = require("fs"),
  path = require("path");

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

app.use(nocache());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set("views", "./views");
app.set("view engine", "pug");

app.use("/public", express.static("public"));

const config = {
  port: 8080,
  setlistsPath: path.join(__dirname, "test-setlist"),
  keycodes: {
    left: 37,
    right: 39,
    middle: 40
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
        keycodes: config.keycodes
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
        keycodes: config.keycodes
      });
    })
    .catch(error => {
      res.send(error);
    });
});

app.listen(config.port, () => {
  console.log("Server is up and running on port numner " + config.port);
});
