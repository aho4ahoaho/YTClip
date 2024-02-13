import { Elysia } from "elysia";
import ClipRouter from "./src/router/clip";
import VideoRouter from "./src/router/video";
const port = process.env.PORT || 3000;

const app = new Elysia()
    .onRequest((data) => {
        const req = data.request as Request;
        console.log(req.method, req.url);
        data.set.headers["Access-Control-Allow-Origin"] = "*";
    })
    .get("/", ({ request }) => {
        return "Hello World!";
    })
    .use(ClipRouter)
    .use(VideoRouter)
    .listen(port, (server) => {
        console.log(`Listening on port ${server.port}`);
    });

export type App = typeof app;

/*
app.use("/clip", ClipRouter);
app.use("/video", VideoRouter);

app.use("/videos", Express.static("videos"));
app.use("/clips", Express.static("clips"));
*/
