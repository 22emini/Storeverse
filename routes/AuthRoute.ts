//where Router will live
import express from "express"
import {register,fetchUserId, login, UpdateUserInfo} from "../controller/authControl";

const router = express.Router();

router.post("/register", register);
router.get("/user/:id", fetchUserId);
router.put("/updateInfo/:id", UpdateUserInfo);
router.post("/login", login);


export default router;