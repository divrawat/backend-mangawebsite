import User from '../models/users.js';
import jwt from "jsonwebtoken"
import { expressjwt } from "express-jwt"
const OBJECTID = process.env.OBJECTID;

export const login = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const { email, password } = req.body;
    try {

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        if (!user.authenticate(password)) {
            return res.status(401).json({ error: 'Email and password do not match' });
        }
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.status(200).json({
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};


export const signout = async (req, res) => {
    if (req.method !== 'GET') { return res.status(405).json({ error: 'Method not allowed' }); }
    try {
        res.clearCookie('token');
        res.json({ message: 'Signout success' });
    }
    catch (error) { return res.status(500).json({ error: 'Internal Server Error' }); }
};







export const requireSignin = expressjwt({
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"],
    userProperty: "auth",
});


/*
export const adminMiddleware = async (req, res, next) => {
    try {
        const adminUserId = req.auth._id;
        const user = await User.findById({ _id: adminUserId }).exec();
        if (!user) { return res.status(400).json({ error: 'User not found' }); }
        // console.log(OBJECTID, user._id);
        if (user._id !== OBJECTID) { return res.status(400).json({ error: 'Admin resource. Access denied' }); }
        req.profile = user;
        next();
    } catch (err) { res.status(400).json({ error: errorHandler(err) }); }
};
*/

export const adminMiddleware = async (req, res, next) => {
    try {
        const adminUserId = req.auth._id;
        const user = await User.findById(adminUserId).exec();
        if (!user) { return res.status(400).json({ error: 'User not found' }); }

        if (!user._id.equals(OBJECTID)) {
            return res.status(400).json({ error: 'Admin resource. Access denied' });
        }

        req.profile = user;
        next();
    } catch (err) {
        res.status(400).json({ error: "Something Went Wrong" });
    }
};