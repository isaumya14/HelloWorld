import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectRoute = async (req, res, next) => {
    try{
        const token= req.cookies.jwt;
        if(!token) return res.status(401).json({message:"Unauthorized access- No token provided"});

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY );
        if(!decoded) return res.status(401).json({message:"Unauthorized access- Invalid token"});  

        const user = await User.findById(decoded.userId).select("-password"); // Exclude password from the user object
        if(!user) return res.status(401).json({message:"Unauthorized access- User not found"});
        req.user = user; // Attach user to request object
        next();
    }catch(error){
        console.log("Authentication error in middleware :", error);
        return res.status(401).json({message:"Unauthorized access"});
    }
}