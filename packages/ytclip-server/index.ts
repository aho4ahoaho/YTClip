import Express from "express";
import ClipRouter from "./src/router/clip";
import VideoRouter from "./src/router/video";

const app = Express();

app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    console.log(req.method, req.url);
    next();
});

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use("/clip", ClipRouter);
app.use("/video", VideoRouter);

app.use("/videos", Express.static("videos"));
app.use("/clips", Express.static("clips"));

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
