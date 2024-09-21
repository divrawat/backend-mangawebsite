import Chapter from '../models/chapters.js';
import Manga from '../models/mangas.js';
import Category from '../models/categories.js';
import multer from 'multer';
const upload = multer({});
import slugify from 'slugify';
import { FRONTEND_DOMAIN_1, FRONTEND_DOMAIN_2 } from '../domains.js';
import fetch from 'isomorphic-fetch';

import Redis from 'ioredis';

const redis = new Redis({
    host: 'patient-puma-43077.upstash.io',
    port: 6379,
    password: 'AahFAAIjcDEzOGQ2ZWEwYTgzYTc0ZjY5ODI1NmYxMjRlNDMxZjU0Y3AxMA',
    tls: {}
});



/*
export const HomePageMangas = async (req, res) => {

    try {
        const aggregation = [
            { $sample: { size: 10 } },
            {
                $lookup: {
                    from: 'categories', localField: 'categories', foreignField: '_id', as: 'categories',
                    pipeline: [{ $project: { _id: 0, name: 1, slug: 1 } }]
                }
            },
            {
                $project: { _id: 0, fullname: 1, type: 1, slug: 1, description: 1, categories: 1 }
            }
        ];

        const data = await Manga.aggregate(aggregation);

        res.json({ status: true, message: '10 Random Mangas Fetched Successfully', data });
    } catch (err) {
        console.error('Error fetching Mangas:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
*/


export const HomePageMangas = async (req, res) => {
    try {


        const cacheKey = 'homepage_mangas';
        const cachedData = await redis.get(cacheKey);

        if (cachedData) {
            return res.json({ status: true, message: '10 Random Mangas Fetched Successfully', data: JSON.parse(cachedData) });
        }


        const aggregation = [
            { $sample: { size: 10 } },
            {
                $lookup: {
                    from: 'categories', localField: 'categories', foreignField: '_id', as: 'categories',
                    pipeline: [{ $project: { _id: 0, name: 1, slug: 1 } }]
                }
            },
            {
                $project: { _id: 0, fullname: 1, type: 1, slug: 1, description: 1, categories: 1 }
            }
        ];

        const data = await Manga.aggregate(aggregation);

        // Cache the data with an expiration time (e.g., 1 hour)
        await redis.set(cacheKey, JSON.stringify(data), 'EX', 3600);

        res.json({ status: true, message: '10 Random Mangas Fetched Successfully', data });
    } catch (err) {
        console.error('Error fetching Mangas:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
















export const GetMangasDashBoard = async (req, res) => {

    try {
        const totalCount = await Manga.countDocuments().exec();
        const page = Number(req.query.page) || 1;
        const perPage = 20;
        const { search } = req.query;
        const query = { $and: [{ name: { $regex: search, $options: 'i' } }] };
        const skip = (page - 1) * perPage;
        const data = await Manga.find(query).populate('categories').sort({ createdAt: -1 }).skip(skip).limit(perPage).exec();

        res.json({
            status: true,
            message: 'All Mangas Fetched Successfully',
            totalBlogs: totalCount, data
        });
    } catch (err) { console.error('Error fetching Mangas:', err); res.status(500).json({ error: 'Internal Server Error' }); }
};




export const getSingleManga = async (req, res) => {
    let { manganame } = req.query;
    let name = manganame;

    try {
        const data = await Manga.findOne({ name }).populate('categories').select('-_id ').exec();
        if (!data) { return res.status(404).json({ error: 'Manga Not Found' }); }

        const categories = data.categories;

        const relatedMangas = await Manga.find({
            categories: { $in: categories },
            name: { $ne: name }
        })
            .limit(10).select('-_id fullname name slug chapterCount').exec();

        const mangasWithChapterCounts = await Promise.all(
            relatedMangas.map(async (manga) => {
                const chapterCount = await Chapter.countDocuments({ manganame: manga.name }).exec();
                return {
                    ...manga.toObject(),
                    chapterCount,
                };
            })
        );

        res.json({ status: true, message: 'Mangas Fetched Successfully', data, relatedMangas: mangasWithChapterCounts });
    } catch (err) {
        console.error('Error fetching Mangas:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



export const addManga = async (req, res) => {

    upload.none()(req, res, async (err) => {
        if (err) { return res.status(400).json({ error: 'Something went wrong' }); }

        const { name, fullname, description, slug, author, type, categories, releaseDate } = req.body;

        if (!categories || categories.length === 0) {
            return res.status(400).json({ error: 'At least one category is required' });
        }

        const slugifiedSlug = slugify(slug).toLowerCase();
        let manga = new Manga({ name, fullname, slug: slugifiedSlug, description, author, releaseDate, type, });

        try {
            let arrayOfCategories = categories.split(',').map(category => category.trim());
            await manga.save();

            const updatedManga = await Manga.findByIdAndUpdate(manga._id, { $push: { categories: { $each: arrayOfCategories } } }, { new: true }
            ).exec();
            res.json(updatedManga);

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error saving manga' });
        }
    });
};



export const DeleteManga = async (req, res) => {
    const { id } = req.params;

    if (!id) { return res.status(404).json({ error: 'Manga not found' }); }

    try {
        const manga = await Manga.findByIdAndDelete(id);
        if (!manga) { return res.status(404).json({ error: 'Manga not found' }); }

        return res.status(200).json({ message: 'Manga deleted successfully' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


export const UpdateManga = async (req, res) => {
    const { id } = req.params;
    upload.none()(req, res, async (err) => {
        if (err) { return res.status(400).json({ error: 'Something went wrong' }); }

        try {
            let manga = await Manga.findById(id);
            if (!manga) { return res.status(404).json({ error: 'Manga not found' }); }

            const { name, fullname, description, author, type, categories, releaseDate, } = req.body;
            const updatefields = req.body;
            Object.keys(updatefields).forEach((key) => {
                if (key === 'name') { manga.name = name; }
                if (key === 'fullname') { manga.fullname = fullname; }
                else if (key === 'description') { manga.description = description; }
                else if (key === 'author') { manga.author = author; }
                else if (key === 'releaseDate') { manga.releaseDate = releaseDate; }
                else if (key === 'type') { manga.type = type; }
                else if (key === 'slug') { manga.slug = slugify(updatefields.slug).toLowerCase(); }
                else if (key === 'categories') { manga.categories = categories.split(',').map(category => category.trim()); }
            });

            const savedBlog = await manga.save();

            return res.status(200).json(savedBlog);
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    });
}


/*
export const getMangaChaptersRelated = async (req, res) => {
    let { manganame } = req.query;

    function convertToTitleCase(str) {
        return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    const convertedString = convertToTitleCase(manganame);

    try {

        const manga = await Manga.aggregate([
            { $match: { slug: manganame } },
            { $lookup: { from: 'categories', localField: 'categories', foreignField: '_id', as: 'categories' } },
            { $project: { _id: 0, "categories.description": 0, "categories.__v": 0 } }
        ]).exec();

        if (!manga.length) { return res.status(404).json({ error: 'Manga Not Found' }); }

        const [mangaData] = manga;

        const [chapters, relatedMangas] = await Promise.all([
            Chapter.find({ manganame: convertedString }).select('-_id -createdAt -numImages -manganame -__v').exec(),
            Manga.aggregate([
                { $match: { categories: { $in: mangaData.categories.map(cat => cat._id) }, name: { $ne: convertedString } } },
                { $project: { _id: 0, name: 1, slug: 1, totalChapters: 1 } },
                { $limit: 10 }
            ]).exec()
        ]);

        res.json({
            status: true,
            message: 'All Chapters Fetched Successfully',
            data: chapters,
            manga: mangaData,
            relatedMangas
        });
    } catch (err) {
        console.error('Error fetching Chapters:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
*/



export const getMangaChaptersRelated = async (req, res) => {
    let { manganame } = req.query;


    function convertToTitleCase(str) {
        return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    const convertedString = convertToTitleCase(manganame);

    try {
        const manga = await Manga.aggregate([
            { $match: { slug: manganame } },
            { $lookup: { from: 'categories', localField: 'categories', foreignField: '_id', as: 'categories' } },
            { $project: { _id: 0, "categories.description": 0, "categories.__v": 0 } }
        ]).exec();

        // if (!manga.length) {return res.status(404).json({ error: 'Manga Not Found' }); }



        const [mangaData] = manga;

        const [chapters, relatedMangas] = await Promise.all([
            Chapter.find({ manganame: convertedString }).select('-_id -manganame -__v').exec(),
            // Manga.aggregate([
            //     { $match: { categories: { $in: mangaData.categories.map(cat => cat._id) }, name: { $ne: convertedString } } },
            //     { $project: { _id: 0, name: 1, slug: 1, totalChapters: 1 } },
            //     { $limit: 10 }
            // ]).exec()
        ]);

        // if (!chapters.length) { return res.status(404).json({ error: 'No chapters found' }); }


        res.json({
            status: true,
            message: 'All Chapters Fetched Successfully',
            data: chapters,
            manga: mangaData,
            // relatedMangas
        });
    } catch (err) {
        console.error('Error fetching Chapters:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


















export const getLatestMangas = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const perPage = 30;
        const skip = (page - 1) * perPage;
        const totalCount = await Manga.countDocuments().exec();
        const latestMangas = await Manga.find().sort({ createdAt: -1 }).select('name slug totalChapters -_id').skip(skip).limit(perPage).exec();
        if (latestMangas.length == []) { return res.status(404).json({ error: 'No mangas found for this page' }); }
        res.json({ mangas: latestMangas, totalCount, page });
    } catch (error) {
        console.error('Error fetching latest mangas:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};



export const MangasForSitemap = async (req, res) => {
    try {
        const mangas = await Manga.find().select('slug createdAt -_id').exec();
        res.json({ mangas });
    } catch (error) {
        console.error('Error fetching mangas:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};