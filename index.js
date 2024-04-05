const showdown = require("showdown"),
  bodyParser = require("body-parser"),
  express = require("express"),
  nocache = require("nocache"),
  fs = require("fs"),
  dotenv = require("dotenv"),
  path = require("path"),
  storage = require('node-persist'),
  { glob } = require('glob'),
  drivelist = require('drivelist');

dotenv.config({ path: path.join(__dirname, ".env") });

storage.init();

const app = express();

showdown.extension("lyrics", function () {
  return [
    {
      type: "output",
      regex: /~([\w]+)[^>]*~([^]+?)~\/\1~/gi,
      replace: '<div class="$1" markdown="1">$2</div>',
    },
    {
      type: "lang",
      regex: /##\/([\w]+)[^>]*##/gi,
      replace: "</div>",
    },
    {
      type: "lang",
      regex: /##([\w]+)[^>]*##/gi,
      replace: '<div class="$1" markdown="1">',
    },
    // {
    //   type: "output",
    //   regex: /<p>([^]+?)<\/p>/gi,
    //   replace: '<span class="paragraph">$1</span>'
    // },
  ];
});

const Converter = new showdown.Converter({
  extensions: ["lyrics"],
  metadata: true,
});

app.use(nocache());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use("/public", express.static(path.join(__dirname, "public")));

const config = {
  port: process.env.PORT || 8080,
  keycodes: {
    left: process.env.KEYCODE_LEFT || 37,
    middle: process.env.KEYCODE_MIDDLE || 40,
    right: process.env.KEYCODE_RIGHT || 39,
  },
  css:
    `--highlight-color: ${process.env.HIGHLIGHT_COLOR || "yellow"};` +
    `--refrain-color: ${process.env.REFRAIN_COLOR || "yellow"};` +
    `--bridge-color: ${process.env.BRIDGE_COLOR || "orange"};` +
    `--font-size: ${process.env.FONT_SIZE || "30px"};`,
};

async function getSetlists() {
  console.log("Load Setlists");

  let setlists = [];

  let files = await glob(`${__dirname}/**/setlist.json`, { ignore: 'node_modules/**' });
  files.forEach(f => setlists.push(f));

  let drives = await drivelist.list();

  for (const drive of drives) {
    if (drive.isSystem == false) {
      // console.log(drive);
      let files = await glob(`${drive.mountpoints[0].path}/**/setlist.json`)
      files.forEach(f => setlists.push(f));
    }
  }

  console.log(setlists);
}


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

function getMetadata(filename) {
  return new Promise((resolve, reject) => {
    const songPath = path.join(config.setlistsPath, filename);
    fs.readFile(songPath, "utf-8", (err, data) => {
      if (err) {
        console.error(err);
        reject(`${filename} can not be opened`);
      } else {
        resolve(Converter.getMetadata());
      }
    });
  });
}

function getSongInSetlist(filename, setlist, i) {
  const index = setlist.songs.findIndex((x) => x.filename == filename);
  return setlist.songs[index + i];
}

app.get("/", (req, res) => {
  getSetlist()
    .then((setlist) => {
      res.render("setlist", {
        setlist: setlist,
        keycodes: config.keycodes,
        fontSize: config.fontSize,
        css: config.css,
      });
    })
    .catch((error) => {
      res.send(error);
    });
});

app.get("/settings", (req, res) => {
  res.render("settings", {
    keycodes: config.keycodes,
  });
});

app.get("/:filename", (req, res) => {
  Promise.all([getLyrics(req.params.filename), getSetlist()])
    .then(([lyrics, setlist]) => {
      getMetadata(req.params.filename)
        .then((metadata) => {
          res.render("song", {
            lyrics: lyrics,
            song: getSongInSetlist(req.params.filename, setlist, 0),
            nextSong: getSongInSetlist(req.params.filename, setlist, 1),
            prevSong: getSongInSetlist(req.params.filename, setlist, -1),
            setlist: setlist,
            keycodes: config.keycodes,
            fontSize: config.fontSize,
            flex: metadata.flex === "true",
            css: config.css,
          });
        })
        .catch((error) => {
          res.send(error);
        });
    })
    .catch((error) => {
      res.send(error);
    });
});

app.listen(config.port, () => {
  console.log("Server is up and running on port " + config.port);
  getSetlists();
});
