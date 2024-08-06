import Chapter from '../models/chapters.js';
import Manga from '../models/mangas.js';
import multer from 'multer';
import { formatDistanceToNow } from 'date-fns';
import fetch from 'isomorphic-fetch'
import { FRONTEND_DOMAIN_1, FRONTEND_DOMAIN_2 } from '../domains.js';
import slugify from 'slugify';

const upload = multer({});

export const UploadSingleChapter = async (req, res) => {

    upload.none()(req, res, async (err) => {
        try {

            const { manganame, chapterNumber, numImages } = req.body;

            const manga = await Manga.findOne({ name: manganame });
            if (!manga) { return res.status(404).json({ error: 'There is no Manga with this name' }); }

            const existingChapter = await Chapter.findOne({ manganame: manganame, chapterNumber: chapterNumber });

            if (existingChapter) { return res.status(400).json({ error: 'Chapter number already exists for this manga' }); }
            const newChapter = new Chapter({ manganame, chapterNumber, numImages });
            await newChapter.save();

            const updateFields = {
                $inc: { totalChapters: 1 },
                $set: {
                    latestChapter: newChapter._id,
                    secondlatestChapter: manga.latestChapter
                }
            };

            await Manga.findOneAndUpdate({ name: manganame }, updateFields);

            res.status(201).json({ message: 'Chapter added successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error creating chapter' });
        }
    });
};




export const GetMangaChaptersDashBoard = async (req, res) => {

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



/*
export const BulkPostChapters = async (req, res) => {
    try {
        const chaptersData = req.body;

        const currentmanganame = chaptersData[0].manganame

        const manga = await Manga.findOne({ name: currentmanganame });
        if (!manga) { return res.status(404).json({ error: 'There is no Manga with this name' }); }



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
            const result = await Chapter.insertMany(newChapters);
            const lastInsertedChapter = result[result.length - 1];
            const secondlastInsertedChapter = result[result.length - 2];

            const mangaChapterCount = {};

            newChapters.forEach(chapter => {
                if (!mangaChapterCount[chapter.manganame]) {
                    mangaChapterCount[chapter.manganame] = 0;
                }
                mangaChapterCount[chapter.manganame]++;

            });

            await Promise.all(
                Object.keys(mangaChapterCount).map(async manganame => {
                    await Manga.findOneAndUpdate(
                        { name: manganame },
                        {
                            $inc: { totalChapters: mangaChapterCount[manganame] },
                            $set: { latestChapter: lastInsertedChapter._id },
                            $set: { secondlatestChapter: secondlastInsertedChapter._id }
                        }
                    );
                })
            );

            return res.status(200).json({ message: 'Bulk Chapters Added Successfully', result });
        } else {
            return res.status(400).json({ message: 'All chapters already exist' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error saving chapters' });
    }
};
*/

export const BulkPostChapters = async (req, res) => {
    try {
        const chaptersData = req.body;

        if (!chaptersData || chaptersData.length === 0) {
            return res.status(400).json({ error: 'No chapter data provided' });
        }

        const currentmanganame = chaptersData[0].manganame;

        const manga = await Manga.findOne({ name: currentmanganame });
        if (!manga) {
            return res.status(404).json({ error: 'There is no Manga with this name' });
        }

        const existingChapters = await Chapter.find({
            $or: chaptersData.map(chapter => ({
                manganame: chapter.manganame,
                chapterNumber: chapter.chapterNumber
            }))
        });

        const existingChapterMap = new Set(existingChapters.map(chapter => `${chapter.manganame}_${chapter.chapterNumber}`));

        const newChapters = chaptersData.filter(chapter => {
            const key = `${chapter.manganame}_${chapter.chapterNumber}`;
            return !existingChapterMap.has(key);
        });

        if (newChapters.length > 0) {
            const result = await Chapter.insertMany(newChapters);

            const slug = slugify(currentmanganame).toLowerCase();

            // Handle cases where fewer than 2 chapters are inserted
            const lastInsertedChapter = result[result.length - 1] || null;
            const secondLastInsertedChapter = result.length > 1 ? result[result.length - 2] : null;

            const mangaChapterCount = {};

            newChapters.forEach(chapter => {
                if (!mangaChapterCount[chapter.manganame]) {
                    mangaChapterCount[chapter.manganame] = 0;
                }
                mangaChapterCount[chapter.manganame]++;
            });

            await Promise.all(
                Object.keys(mangaChapterCount).map(async manganame => {
                    await Manga.findOneAndUpdate(
                        { name: manganame },
                        {
                            $inc: { totalChapters: mangaChapterCount[manganame] },
                            $set: {
                                latestChapter: lastInsertedChapter ? lastInsertedChapter._id : manga.latestChapter,
                                secondlatestChapter: secondLastInsertedChapter ? secondLastInsertedChapter._id : manga.secondlatestChapter
                            }
                        }
                    );
                })
            );

            return res.status(200).json({ message: 'Bulk Chapters Added Successfully', result });
        } else {
            return res.status(400).json({ message: 'All chapters already exist' });
        }

    } catch (error) {
        console.error('Error saving chapters:', error);
        res.status(500).json({ message: 'Error saving chapters' });
    }
};





export const BulkDeleteChapters = async (req, res) => {
    const { manganame } = req.body;

    try {
        const chapters = await Chapter.find({ manganame });
        if (!chapters || chapters.length === 0) {
            return res.status(404).json({ error: 'Manga not found or no chapters to delete' });
        }


        const result = await Chapter.deleteMany({ manganame });

        await Manga.findOneAndUpdate({ name: manganame }, { $set: { totalChapters: 0, latestChapter: null, secondlatestChapter: null } });




        res.status(200).json({ message: `${result.deletedCount} Chapters deleted successfully`, result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};






export const UpdateChapter = async (req, res) => {

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
    const { id } = req.params;
    if (!id) { return res.status(404).json({ error: 'Chapter not found' }); }

    try {
        const manga = await Chapter.findByIdAndDelete(id);
        if (!manga) { return res.status(404).json({ error: 'Chapter not found' }); }

        await Manga.findOneAndUpdate({ name: manga.manganame }, { $inc: { totalChapters: -1 } });

        const slug = slugify(manga.manganame).toLowerCase();


        return res.status(200).json({ message: 'Chapter deleted successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}



/*
export const getParticularMangaChapterWithRelated = async (req, res) => {

    let { manganame, chapterNumber } = req.query;

    function convertToTitleCase(str) {
        return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    const convertedString = convertToTitleCase(manganame);
    let numericPart = chapterNumber.split('-')[1];

    try {
        const chapterData = await Chapter.findOne({ manganame: convertedString, chapterNumber: numericPart }).select('-_id').exec();
        if (!chapterData) { return res.status(404).json({ error: 'Chapter Not Found' }); }

        const manga = await Manga.findOne({ manganame }).populate({ path: 'categories', select: 'slug name' }).select('-_id').exec();
        const allchapterNumbers = await Chapter.find({ manganame: convertedString }).select('-_id -numImages -manganame').exec();

        const categories = manga.categories;

        const relatedMangas = await Manga.find({
            categories: { $in: categories },
            name: { $ne: convertedString }
        })
            .limit(10).select('-_id name slug chapterCount').exec();

        const mangasWithChapterCounts = await Promise.all(
            relatedMangas.map(async (manga) => {
                const chapterCount = await Chapter.countDocuments({ manganame: manga.name }).exec();
                return {
                    ...manga.toObject(),
                    chapterCount,
                };
            })
        );

        res.json({ status: true, message: 'Particular Chapter Found', chapterData, manga, allchapterNumbers, relatedMangas: mangasWithChapterCounts });
    } catch (err) {
        console.error('Error fetching Particular Chapter:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
*/



export const getParticularMangaChapterWithRelated = async (req, res) => {
    let { manganame, chapterNumber } = req.query;

    function convertToTitleCase(str) {
        return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    const convertedString = convertToTitleCase(manganame);
    let numericPart = chapterNumber.split('-')[1];

    try {
        // Parallelize independent queries
        const [chapterData, manga] = await Promise.all([
            Chapter.findOne({ manganame: convertedString, chapterNumber: numericPart }).select('-_id').exec(),
            Manga.findOne({ slug: manganame }).populate({ path: 'categories', select: 'slug name' }).select('-_id').exec()
        ]);

        if (!chapterData) {
            return res.status(404).json({ error: 'Chapter Not Found' });
        }

        // Fetch all  chapter numbers and related mangas in parallel
        /*
        const [allchapterNumbers, relatedMangas] = await Promise.all([
            Chapter.find({ manganame: convertedString }).select('chapterNumber -_id').exec(),
            Manga.aggregate([
                { $match: { categories: { $in: manga.categories.map(cat => cat._id) }, name: { $ne: convertedString } } },
                { $lookup: { from: 'chapters', localField: 'name', foreignField: 'manganame', as: 'chapters' } },
                { $addFields: { chapterCount: { $size: '$chapters' } } },
                { $project: { _id: 0, name: 1, slug: 1, chapterCount: 1 } },
                { $limit: 10 }
            ]).exec()
        ]);
        */

        const allchapterNumbers = await Chapter.find({ manganame: convertedString }).select('chapterNumber -_id').exec()

        res.json({
            status: true,
            message: 'Particular Chapter Found',
            chapterData,
            manga,
            allchapterNumbers,
            // relatedMangas
        });
    } catch (err) {
        console.error('Error fetching Particular Chapter:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



export const GetMostRecentChapters = async (req, res) => {
    try {
        const mangas = await Manga.find().populate({ path: 'latestChapter', select: 'chapterNumber createdAt', })
            .populate({ path: 'secondlatestChapter', select: 'chapterNumber createdAt', });

        let recentChapters = mangas
            .filter(manga => manga.latestChapter)
            .map(manga => ({
                mangaName: manga.name,
                slug: manga.slug,
                latestChapterNumber: manga.latestChapter.chapterNumber,
                latestChapterDate: new Date(manga.latestChapter.createdAt),
                secondlatestChapterNumber: manga.secondlatestChapter ? manga.secondlatestChapter.chapterNumber : null,
                secondlatestChapterDate: manga.secondlatestChapter ? new Date(manga.secondlatestChapter.createdAt) : null,
            }));

        recentChapters = recentChapters
            .sort((a, b) => b.latestChapterDate - a.latestChapterDate)
            .slice(0, 100);

        recentChapters = recentChapters.map(chapter => ({
            ...chapter,
            latestChapterDate: formatDistanceToNow(chapter.latestChapterDate, { addSuffix: true }),
            secondlatestChapterDate: chapter.secondlatestChapterDate ? formatDistanceToNow(chapter.secondlatestChapterDate, { addSuffix: true }) : null,
        }));

        res.status(200).json(recentChapters);
    } catch (error) {
        console.error('Error fetching recent chapters:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};




export const ChapterForSitemap = async (req, res) => {
    try {
        const chapters = await Chapter.find().select('chapterNumber manganame createdAt -_id').exec();
        res.json({ chapters });
    } catch (error) {
        console.error('Error fetching chapters:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};