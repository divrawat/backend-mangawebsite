import Chapter from '../models/chapters.js';
import multer from 'multer';

const upload = multer({});

export const UploadSingleChapter = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    upload.none()(req, res, async (err) => {
        try {

            const { manganame, chapterNumber, numImages } = req.body;

            const existingChapter = await Chapter.findOne({ manganame: manganame, chapterNumber: chapterNumber });

            if (existingChapter) { return res.status(400).json({ error: 'Chapter number already exists for this manga' }); }
            const newChapter = new Chapter({ manganame, chapterNumber, numImages });
            await newChapter.save();

            res.status(201).json({ message: 'Chapter added successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error creating chapter' });
        }
    });
};




export const GetMangaChaptersDashBoard = async (req, res) => {
    if (req.method !== 'GET') { return res.status(405).json({ error: 'Method not allowed' }); }
    await connectMongo();
    try {
        const totalCount = await Chapter.countDocuments().exec();
        const page = Number(req.query.page) || 1;
        const perPage = 20;
        const { search } = req.query;
        const query = { $and: [{ manganame: { $regex: search, $options: 'i' } }] };
        const skip = (page - 1) * perPage;
        const data = await Chapter.find(query).skip(skip).limit(perPage).exec();

        res.json({
            status: true,
            message: 'All Chapters Fetched Successfully',
            totalBlogs: totalCount, data
        });
    } catch (err) { console.error('Error fetching Chapters:', err); res.status(500).json({ error: 'Internal Server Error' }); }
};



export const getParticularMangaChapter = async (req, res) => {
    if (req.method !== 'GET') { return res.status(405).json({ error: 'Method not allowed' }); }

    let { manganame, chapterNumber } = req.query;

    try {
        const data = await Chapter.findOne({ manganame, chapterNumber }).select('-_id -__v').exec();
        res.json({ status: true, message: 'Particular Chapter Found', data });
    } catch (err) {
        console.error('Error fetching Particular Chapter:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


export const getMangaChapters = async (req, res) => {
    if (req.method !== 'GET') { return res.status(405).json({ error: 'Method not allowed' }); }
    let { manganame } = req.query;

    try {
        const data = await Chapter.find({ manganame }).select('-_id -__v').exec();
        res.json({ status: true, message: 'All Chapters Fetched Successfully', data });
    } catch (err) {
        console.error('Error fetching Chapters:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const BulkPostChapters = async (req, res) => {
    if (req.method !== 'POST') { res.status(405).json({ message: 'Method not allowed' }); }
    try {
        const chaptersData = req.body;

        const existingChapters = await Chapter.find({
            $or: chaptersData.map(chapter => ({
                manganame: chapter.manganame,
                chapterNumber: chapter.chapterNumber
            }))
        });

        const existingChapterMap = {};
        existingChapters.forEach(chapter => {
            const key = `${chapter.manganame}_${chapter.chapterNumber}`;
            existingChapterMap[key] = true;
        });

        const newChapters = chaptersData.filter(chapter => {
            const key = `${chapter.manganame}_${chapter.chapterNumber}`;
            return !existingChapterMap[key];
        });

        if (newChapters.length > 0) {
            const result = await Chapter.insertMany(newChapters, { timestamps: false });
            return res.status(200).json({ message: 'Bulk Chapters Added Successfully', result });
        } else {
            return res.status(400).json({ message: 'All chapters already exist' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error saving chapters' });
    }
}


export const BulkDeleteChapters = async (req, res) => {
    if (req.method !== 'DELETE') { return res.status(405).json({ message: 'Method not allowed' }); }
    const { manganame } = req.body;
    try {
        const manga = await Chapter.find({ manganame });
        if (!manga || manga.length === 0) { return res.status(404).json({ error: 'Manga not found' }); }
        const result = await Chapter.deleteMany({ manganame });
        res.status(200).json({ message: 'Chapters deleted successfully', result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
















export const UpdateChapter = async (req, res) => {
    if (req.method === 'POST') { return res.status(405).json({ message: 'Method not allowed' }); }

    const { id } = req.query;
    if (!id) { return res.status(404).json({ error: 'Chapter not found' }); }

    upload.none()(req, res, async (err) => {
        if (err) { return res.status(400).json({ error: 'Something went wrong' }); }

        try {
            let manga = await Chapter.findById(id);
            if (!manga) { return res.status(404).json({ error: 'Chapter not found' }); }

            const { manganame, numImages, chapterNumber } = req.body;
            const updatefields = req.body;
            Object.keys(updatefields).forEach((key) => {

                if (key === 'manganame') { manga.manganame = manganame; }
                if (key === 'numImages') { manga.numImages = numImages; }
                else if (key === 'chapterNumber') { manga.chapterNumber = chapterNumber; }
            });

            const savedBlog = await manga.save();
            return res.status(200).json(savedBlog);
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    });
};


export const DeleteChapter = async (req, res) => {
    const { id } = req.query;
    if (!id) { return res.status(404).json({ error: 'Chapter not found' }); }

    try {
        const manga = await Chapter.findByIdAndDelete(id);
        if (!manga) { return res.status(404).json({ error: 'Chapter not found' }); }
        return res.status(200).json({ message: 'Chapter deleted successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}