import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema(
    {
        manganame: {
            type: String,
            index: true,
            required: true,
            trim: true,
        },
        chapterNumber: {
            type: String,
            trim: true,
            required: true,
            index: true,
        },
        numImages: {
            type: String,
            trim: true,
            required: true,
        },
    },
    { timestamps: { createdAt: true, updatedAt: false } },
    { versionKey: false }
);

chapterSchema.index({ manganame: 1, chapterNumber: 1 }, { unique: true });
// export default mongoose.models.Chapter || mongoose.model('Chapter', chapterSchema);

export default mongoose.model('Chapter', chapterSchema);