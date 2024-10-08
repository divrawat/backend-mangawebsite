import Category from "../models/categories.js";
import Manga from "../models/mangas.js";
import Chapter from "../models/chapters.js";
import slugify from "slugify";

export const DeleteCategory = async (req, res) => {
    if (req.method === 'DELETE') {

        const { slug } = req.params;
        try {
            const data = await Category.findOneAndDelete({ slug }).exec();
            if (!data) { return res.status(400).json({ error: 'Category not found' }); }
            res.json({ message: 'Category deleted successfully' });
        } catch (err) { res.status(400).json({ error: "Internal Server Error" }); }
    }

    else {
        res.status(400).json({ error: "Method Not Allowed" });
    }
};

/*
export const GetMangaCategories = async (req, res) => {
    const { slug } = req.query;

    try {
        const category = await Category.findOne({ slug }).select('-description -__v').exec();
        if (!category) { return res.status(400).json({ error: 'Category not found' }); }


        const page = Number(req.query.page) || 1;
        const perPage = 18;
        const skip = (page - 1) * perPage;

        const totalCount = await Manga.countDocuments({ categories: category }).exec();
        const mangas = await Manga.find({ categories: category }).select('-_id -__v -createdAt').sort({ createdAt: -1 }).skip(skip).limit(perPage).exec();

        const mangasWithChapterCounts = await Promise.all(mangas.map(async (manga) => {
            const chapterCount = await Chapter.countDocuments({ manganame: manga.name }).exec();
            return {
                ...manga.toObject(),
                chapterCount,
            };
        }));

        res.json({ category, mangas: mangasWithChapterCounts, totalCount });
    } catch (err) {
        console.log(err);
        res.status(400).json({ error: "Internal Server Error" });
    }
}
*/

export const GetMangaCategories = async (req, res) => {
    const { slug } = req.query;

    try {
        const category = await Category.findOne({ slug }).select('-description -__v').exec();
        if (!category) {
            return res.status(400).json({ error: 'Category not found' });
        }

        const page = Number(req.query.page) || 1;
        const perPage = 30;
        const skip = (page - 1) * perPage;
        const totalCount = await Manga.countDocuments({ categories: category._id }).exec();
        const mangas = await Manga.find({ categories: category._id })
            .select('-_id -__v -createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(perPage)
            .exec();

        if (mangas.length == []) {
            return res.status(404).json({ error: 'No mangas found for this page' });
        }



        res.json({ category, mangas, totalCount });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: "Internal Server Error" });
    }
};



export const CreateCategory = async (req, res) => {

    const { name, description } = req.body;
    const slug = slugify(name).toLowerCase();
    try {
        const category = new Category({ name, description, slug });
        const data = await category.save();
        const message = "Category created successfully";
        res.json({ data, message });
    } catch (err) { res.status(400).json({ error: "Internal Server Error" }); }
};



export const GetCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        return res.status(200).json({ categories });
    } catch (error) {
        console.error('Error retrieving web stories:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};