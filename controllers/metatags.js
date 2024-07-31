import Metatag from "../models/metatags.js";

export const AddTag = async (req, res) => {

    const { name, content } = req.body;
    try {

        const metatag = new Metatag({ name, content });
        await metatag.save();
        return res.status(200).json({ status: true, message: 'Meta Tag created successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};


export const getMetaTags = async (req, res) => {

    try {
        const data = await Metatag.find().exec();

        res.json({
            status: true,
            message: 'All Tags Fetched Successfully',
            data
        });
    } catch (err) { console.error('Error fetching Chapters:', err); res.status(500).json({ error: 'Internal Server Error' }); }
};


export const DeleteMetaTag = async (req, res) => {
    const { id } = req.params;

    try {
        const tag = await Metatag.findByIdAndDelete(id);
        if (!tag) { return res.status(404).json({ error: 'Meta tag not found' }); }

        return res.status(200).json({ message: 'Meta Tag deleted successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}




export const updateTag = async (req, res) => {
    const { id } = req.params;
    const { name, content } = req.body;
    console.log(req.body);


    try {
        const existingMetatag = await Metatag.findById(id);

        if (existingMetatag) {
            if (name !== undefined) existingMetatag.name = name;
            if (content !== undefined) existingMetatag.content = content;
            await existingMetatag.save();
            return res.status(200).json({ status: true, message: 'Meta Tag updated successfully' });
        } else {
            return res.status(404).json({ status: false, message: 'Meta Tag not found' });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }

};