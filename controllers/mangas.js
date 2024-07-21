import Chapter from '../models/chapters.js';
import Manga from '../models/mangas.js';
import multer from 'multer';
const upload = multer({});

export const HomePageMangas = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const aggregation = [
            { $sample: { size: 10 } },
            { $lookup: { from: 'categories', localField: 'categories', foreignField: '_id', as: 'categories' } },
            {
                $project: {
                    _id: 0, photo: 1, fullname: 1, type: 1, slug: 1, description: 1,
                    categories: { $map: { input: '$categories', as: 'category', in: { name: '$$category.name', slug: '$$category.slug' } } },
                }
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
    if (req.method !== 'GET') { return res.status(405).json({ error: 'Method not allowed' }); }
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
    if (req.method !== 'GET') { return res.status(405).json({ error: 'Method not allowed' }); }
    let { manganame } = req.query;
    let name = manganame;

    try {
        const data = await Manga.findOne({ name }).populate('categories').select('-_id -__v ').exec();
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
    if (req.method !== 'POST') { return res.status(405).json({ error: 'Method not allowed' }); }

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
    if (req.method !== 'POST') { return res.status(405).json({ error: 'Method not allowed' }); }
    const { id } = req.query;
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
    if (req.method !== 'POST') { return res.status(405).json({ error: 'Method not allowed' }); }
    const { id } = req.query;
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