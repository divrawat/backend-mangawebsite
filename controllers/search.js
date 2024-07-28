import Manga from '../models/mangas.js';

export const SearchMangas = async (req, res) => {
    const { manganame } = req.query;

    try {
        const regex = new RegExp(manganame, 'i');
        const mangas = await Manga.find({ name: { $regex: regex } }).select('name slug totalChapters latestChapter secondlatestChapter photo -_id').populate({ path: 'latestChapter', select: 'chapterNumber -_id' }).populate({ path: 'secondlatestChapter', select: 'chapterNumber -_id' })

        res.status(200).json({ mangas });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
};