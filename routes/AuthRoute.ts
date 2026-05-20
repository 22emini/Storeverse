//where Router will live
import express from "express"
import { register, fetchUserId, login, verifyLoginOtp,ChangePassword,  resendLoginOtp, UpdateUserInfo, verifyEmail, resendVerificationCode, completeRegistration } from "../controller/authControl";

const router = express.Router();

router.post("/register", register);
router.get("/user/:id", fetchUserId);
router.put("/updateInfo/:id", UpdateUserInfo);
router.get("/login", (_req, res) => {
  res.status(405).json({
    message: "Login does not support GET. Use POST with email and password, or open /email-test.html to test login.",
    method: "POST",
    endpoints: {
      login: "POST /api/auth/login",
      verifyOtp: "POST /api/auth/verify-login-otp",
      resendOtp: "POST /api/auth/resend-login-otp",
    },
  });
});
router.post("/login", login);
router.post("/verify-login-otp", verifyLoginOtp);
router.post("/resend-login-otp", resendLoginOtp);
router.get("/verify-email", verifyEmail);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationCode);
router.post("/complete-registration", completeRegistration);
router.put("/change-password/:id", ChangePassword);

export default router;
