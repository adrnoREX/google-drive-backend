import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoute from "./routes/auth.route.js"
import filesRoute from "./routes/files.route.js"
import foldersRoute from "./routes/folders.route.js"
import storageRoute from "./routes/storage.route.js"
import userRoute from "./routes/user.route.js"

const app = express();
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(authRoute)
app.use(filesRoute)
app.use(foldersRoute)
app.use(storageRoute)
app.use(userRoute)

app.get("/", (req, res) => {
  res.send("Welcome to the Supabase Demo API!");
});

// Start server
app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
