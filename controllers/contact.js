import Contact from '../models/contact.js';


export const contact = async (req, res) => {

    const { email, message, subject } = req.body;

    try {

        const contact = new Contact({ email, message, subject });
        await contact.save();
        return res.status(200).json({ status: true, message: 'Message sent successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};



export const getcontacts = async (req, res) => {

    try {
        const totalCount = await Contact.countDocuments().exec();
        const page = Number(req.query.page) || 1;
        const perPage = 20;
        const { search } = req.query;
        const query = { $and: [{ email: { $regex: search, $options: 'i' } }] };
        const skip = (page - 1) * perPage;
        const data = await Contact.find(query).skip(skip).limit(perPage).exec();

        res.json({
            status: true,
            message: 'All Chapters Fetched Successfully',
            totalContacts: totalCount, data
        });
    } catch (err) { console.error('Error fetching Chapters:', err); res.status(500).json({ error: 'Internal Server Error' }); }
};






export const DeleteContact = async (req, res) => {
    const { id } = req.params;

    try {
        const contact = await Contact.findByIdAndDelete(id);
        if (!contact) { return res.status(404).json({ error: 'Contact not found' }); }

        return res.status(200).json({ message: 'Contact deleted successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
