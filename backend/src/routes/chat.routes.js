import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { getStreamtoken } from "../controllers/chat.controller.js";
const router= express.Router();

router.get("/token",protectRoute,getStreamtoken);


export default router;