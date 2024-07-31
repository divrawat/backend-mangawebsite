import mongoose from "mongoose";

const metatagSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: true,
        },
        content: {
            type: String,
            trim: true,
            required: true,
        }
    },
    { timestamps: { createdAt: false, updatedAt: false } },
);


export default mongoose.model('Metatag', metatagSchema);