import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema;

const mangaSchema = new mongoose.Schema(
    {
        fullname: {
            type: String,
            trim: true,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            trim: true,
            required: true,
            unique: true,
            index: true,
        },
        description: {
            type: String,
            trim: true,
            required: true,
        },
        longdescription: {
            type: String,
            trim: true,
            required: true,
        },
        author: {
            type: String,
            trim: true,
            required: true,
        },
        releaseDate: {
            type: String,
            trim: true,
            required: true,
        },
        type: {
            type: String,
            trim: true,
            required: true,
        },
        photo: {
            type: String,
            trim: true,
            required: true,
        },
        categories: [{ type: ObjectId, ref: 'Category', required: true, index: true }],
        slug: {
            type: String,
            unique: true,
            index: true,
            required: true,
        }
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        versionKey: false
    },
);

// export default mongoose.models.Manga || mongoose.model('Manga', mangaSchema);

export default mongoose.model('Manga', mangaSchema);
