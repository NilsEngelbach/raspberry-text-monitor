const showdown = require("showdown"),
  bodyParser = require("body-parser"),
  express = require("express"),
  nocache = require("nocache"),
  fs = require("fs"),
  path = require('path');

const app = express();

const Converter = new showdown.Converter();
const MetaConverter = new showdown.Converter({metadata: true});

app.use(nocache());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const config = {
  port: 8080,
  setlistsPath: `C:\\DEV\\rasberry-text-monitor\\test-setlist`
};

app.get("/", (req, res) => {
  const setlistPath = path.normalize(config.setlistsPath + "\\setlist.json");
  fs.readFile(setlistPath, "utf-8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.send("setlist.json not found");
        return;
      }
      console.error(err);
      res.send("There was an error reading the setlist.json");
    }
    res.send(data);
  });
});

app.get("/:filename", (req, res) => {
  const songPath = path.normalize(config.setlistsPath + "\\" + req.params.filename);
  fs.readFile(songPath, "utf-8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.send("song not found");
        return;
      }
      console.error(err);
      res.send("There was an error reading the song");
    }

    const YAMLFrontMatter = /^---.*---/gs;

    dataWithoutFrontmatter = data.replace(YAMLFrontMatter, '').replace(/.+\r?\n/g,'$&<br>\r\n',);
 
    const html = Converter.makeHtml(dataWithoutFrontmatter);

    MetaConverter.makeHtml(data);
    const meta = MetaConverter.getMetadata();
    console.log(meta);
  
    res.send(html);
  });
});

app.listen(config.port, () => {
  console.log("Server is up and running on port numner " + config.port);
});
