import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: true,
        },
        description: {
            type: String,
            trim: true,
        },
        slug: {
            type: String,
            unique: true,
            index: true
        }
    },
    { timestamps: { createdAt: false, updatedAt: false } },
    { versionKey: false }
);

// export default mongoose.models.Category || mongoose.model('Category', categorySchema);


export default mongoose.model('Category', categorySchema);