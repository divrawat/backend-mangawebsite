import express from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config.js";
import categoryRoutes from "./routes/categories.js";
import mangaRoutes from "./routes/mangas.js";
import chaptersRoutes from "./routes/chapters.js";
import authRoutes from "./routes/auth.js";
import contactRoutes from "./routes/contact.js";
import compression from "compression";

const app = express();

app.use(cors());


app.use(compression({
  level: 6,
  threshold: 1 * 1000
}));


mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGODB_URI, {}).then(() => console.log("DB connected")).catch((err) => console.log("DB Error => ", err));

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use('/api', categoryRoutes);
app.use('/api', mangaRoutes);
app.use('/api', chaptersRoutes);
app.use('/api', authRoutes);
app.use('/api', contactRoutes);


app.get('/', (req, res) => { res.json("Backend index"); });
const port = 8000;
app.listen(port, () => { console.log(`Server is running on port ${port}`); });