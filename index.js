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
  console.log("Load setlists...");

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

  setlists.sort();

  console.log(setlists);

  return setlists;
}

async function trygetSetlistPath() {
  return await storage.getItem('setlist');
}

async function getSetlistPath() {
  const setlistPath = await trygetSetlistPath();
  if (!setlistPath) {
    throw new Error("Missing setlist path");
  }
  return setlistPath;
}

async function getSetlist() {
  const setlistPath = await getSetlistPath();
  const data = fs.readFileSync(setlistPath, "utf-8");
  return JSON.parse(data);
}

async function getLyrics(filename) {
  const setlistPath = await getSetlistPath();
  const dir = path.basename(path.dirname(setlistPath))
  const songPath = path.join(dir, filename);
  const data = fs.readFileSync(songPath, "utf-8");
  return Converter.makeHtml(data.replace(/^[^~.+\r?\n].*.+\r?\n/gm, "$&<br>\r\n"))
}

async function getMetadata(filename) {
  const setlistPath = await getSetlistPath();
  const dir = path.basename(path.dirname(setlistPath))
  const songPath = path.join(dir, filename);
  fs.readFileSync(songPath, "utf-8");
  return Converter.getMetadata();
}

function getSongInSetlist(filename, setlist, i) {
  const index = setlist.songs.findIndex((x) => x.filename == filename);
  return setlist.songs[index + i];
}

app.get("/", async(req, res) => {
  try {
    let setlist = await getSetlist();
    res.render("setlist", {
      setlist,
      keycodes: config.keycodes,
      fontSize: config.fontSize,
      css: config.css,
    });
  } catch (error) {
    console.log(error);
    res.redirect(`/settings?error=${error}`);
  }
});

app.get("/settings", async (req, res) => {
  const setlists = await getSetlists();
  const setlistPath = await trygetSetlistPath();
  const selectedIndex = setlists.indexOf(setlistPath);
  res.render("settings", {
    keycodes: config.keycodes,
    error: req.query.error,
    setlists,
    selectedIndex,
    css: config.css,
  });
});

app.post("/settings", async (req, res) => {
  const setlists = await getSetlists();
  const setlist = setlists[req.body.setlist];
  console.log(setlist);

  await storage.setItem('setlist', setlist);

  res.redirect(`/`);
});

app.get("/:filename", async (req, res) => {
  try {
    const lyrics = await getLyrics(req.params.filename);
    const setlist = await getSetlist();
    const metadata = await getMetadata(req.params.filename);
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
  } catch (error) {
    console.log(error);
    res.redirect(`/settings?error=${error}`);
  }
});

app.listen(config.port, () => {
  console.log(`Server is up and running on port ${config.port}`);
});
