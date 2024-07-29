import Chapter from '../models/chapters.js';
import Manga from '../models/mangas.js';
import Category from '../models/categories.js';
import multer from 'multer';
const upload = multer({});
import slugify from 'slugify';

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
                $project: { _id: 0, photo: 1, fullname: 1, type: 1, slug: 1, description: 1, categories: 1 }
            }
        ];

        const data = await Manga.aggregate(aggregation);

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
            .limit(10).select('-_id fullname name slug chapterCount photo').exec();

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

        const { name, fullname, description, slug, author, photo, type, categories, releaseDate, longdescription } = req.body;

        if (!categories || categories.length === 0) {
            return res.status(400).json({ error: 'At least one category is required' });
        }

        const slugifiedSlug = slugify(slug).toLowerCase();
        let manga = new Manga({ name, fullname, longdescription, slug: slugifiedSlug, description, author, releaseDate, photo, type, });

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

            const { name, fullname, description, author, type, categories, releaseDate, photo, longdescription } = req.body;
            const updatefields = req.body;
            Object.keys(updatefields).forEach((key) => {
                if (key === 'name') { manga.name = name; }
                if (key === 'fullname') { manga.fullname = fullname; }
                else if (key === 'description') { manga.description = description; }
                else if (key === 'longdescription') { manga.longdescription = longdescription; }
                else if (key === 'author') { manga.author = author; }
                else if (key === 'releaseDate') { manga.releaseDate = releaseDate; }
                else if (key === 'type') { manga.type = type; }
                else if (key === 'slug') { manga.slug = slugify(updatefields.slug).toLowerCase(); }
                else if (key === 'categories') { manga.categories = categories.split(',').map(category => category.trim()); }
                else if (key === 'photo') { manga.photo = photo; }
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
    if (req.method !== 'GET') { return res.status(405).json({ error: 'Method not allowed' }); }
    let { manganame } = req.query;

    function convertToTitleCase(str) {
        return str
            .split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    const convertedString = convertToTitleCase(manganame);

    try {
        const manga = await Manga.findOne({ slug: manganame }).populate({ path: 'categories', select: 'slug name' }).select('-_id -createdAt').exec();
        if (!manga) { return res.status(404).json({ error: 'Manga Not Found' }); }
        const data = await Chapter.find({ manganame: convertedString }).select('-_id -numImages -manganame').exec();

        const categories = manga.categories;

        const relatedMangas = await Manga.find({
            categories: { $in: categories },
            name: { $ne: convertedString }
        })
            .limit(10).select('-_id name slug chapterCount photo').exec();

        const mangasWithChapterCounts = await Promise.all(
            relatedMangas.map(async (manga) => {
                const chapterCount = await Chapter.countDocuments({ manganame: manga.name }).exec();
                return {
                    ...manga.toObject(),
                    chapterCount,
                };
            })
        );

        res.json({ status: true, message: 'All Chapters Fetched Successfully', data, manga, relatedMangas: mangasWithChapterCounts });
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
        // Using a single aggregation pipeline for efficiency
        const manga = await Manga.aggregate([
            { $match: { slug: manganame } },
            { $lookup: { from: 'categories', localField: 'categories', foreignField: '_id', as: 'categories' } },
            { $project: { _id: 0, createdAt: 0 } }
        ]).exec();

        if (!manga.length) {
            return res.status(404).json({ error: 'Manga Not Found' });
        }

        const [mangaData] = manga;

        // Fetch chapters and related mangas
        const [chapters, relatedMangas] = await Promise.all([
            Chapter.find({ manganame: convertedString }).select('-_id -numImages -manganame -__v').exec(),
            Manga.aggregate([
                { $match: { categories: { $in: mangaData.categories.map(cat => cat._id) }, name: { $ne: convertedString } } },
                { $project: { _id: 0, name: 1, slug: 1, photo: 1, totalChapters: 1 } },
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






export const getMangaPerCategoryHome = async (req, res) => {
    try {
        const categories = await Category.find({ projection: { name: 1 } });

        const mangasByCategory = await Promise.all(
            categories.map(async (category) => {
                const mangas = await Manga.find({ categories: category._id })
                    .select('photo slug name -_id totalChapters').limit(50);
                return { categoryName: category.name, mangas };
            })
        );

        const result = mangasByCategory.reduce((acc, { categoryName, mangas }) => {
            acc[categoryName] = mangas;
            return acc;
        }, {});

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while fetching mangas by category' });
    }
};


/*
export const getLatestMangas = async (req, res) => {
    try {
        const latestMangas = await Manga.find().sort({ createdAt: -1 }).select('name photo slug totalChapters -_id').limit(50);
        res.json(latestMangas);
    } catch (error) {
        console.error('Error fetching latest mangas:', error);
        throw error;
    }
};
*/


export const getLatestMangas = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const perPage = 30;
        const skip = (page - 1) * perPage;
        const totalCount = await Manga.countDocuments().exec();

        const latestMangas = await Manga.find()
            .sort({ createdAt: -1 })
            .select('name photo slug totalChapters -_id')
            .skip(skip)
            .limit(perPage)
            .exec();

        if (latestMangas.length == []) {
            return res.status(404).json({ error: 'No mangas found for this page' });
        }

        res.json({
            mangas: latestMangas,
            totalCount,
            page,
        });
    } catch (error) {
        console.error('Error fetching latest mangas:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
