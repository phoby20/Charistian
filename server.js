// server.js
import { createServer } from "https";
import { readFileSync } from "fs";
import { parse } from "url";
import next from "next";

const port = 3001;
const hostname = "0.0.0.0";
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, hostname, port, turbo: true }); // --turbopack 활성화
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(
    {
      key: readFileSync("./localhost-key.pem"),
      cert: readFileSync("./localhost.pem"),
    },
    (req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }
  ).listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on https://${hostname}:${port}`);
    console.log(`> Ready on https://localhost:${port}`);
    console.log(`> Ready on https://192.168.x.x:${port}`); // 로컬 IP로 수정
  });
});
