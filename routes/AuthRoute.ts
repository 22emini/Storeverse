//where Router will live
import express from "express"
import { register, fetchUserId, login, UpdateUserInfo, verifyEmail, resendVerificationCode, completeRegistration } from "../controller/authControl";

const router = express.Router();

router.post("/register", register);
router.get("/user/:id", fetchUserId);
router.put("/updateInfo/:id", UpdateUserInfo);
router.post("/login", login);
router.get("/verify-email", verifyEmail);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationCode);
router.post("/complete-registration", completeRegistration);

export default router;