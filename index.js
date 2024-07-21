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

const app = express();

const corsOptions = {
  origin: ['https://mangawebsite.vercel.app', 'https://backend-mangawebsite.vercel.app', 'http://localhost:3000'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
};

app.use(cors(corsOptions));

mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGODB_URI, {}).then(() => console.log("DB connected")).catch((err) => console.log("DB Error => ", err));

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use('/api', categoryRoutes);
app.use('/api', mangaRoutes);
app.use('/api', chaptersRoutes);
app.use('/api', authRoutes);


app.get('/', (req, res) => { res.json("Backend index"); });
const port = 8000;
app.listen(port, () => { console.log(`Server is running on port ${port}`); });