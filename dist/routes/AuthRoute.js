"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//where Router will live
const express_1 = __importDefault(require("express"));
const authControl_1 = require("../controller/authControl");
const router = express_1.default.Router();
router.post("/register", authControl_1.register);
router.get("/user/:id", authControl_1.fetchUserId);
router.put("/updateInfo/:id", authControl_1.UpdateUserInfo);
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
router.post("/login", authControl_1.login);
router.post("/verify-login-otp", authControl_1.verifyLoginOtp);
router.post("/resend-login-otp", authControl_1.resendLoginOtp);
router.get("/verify-email", authControl_1.verifyEmail);
router.post("/verify-email", authControl_1.verifyEmail);
router.post("/resend-verification", authControl_1.resendVerificationCode);
router.post("/complete-registration", authControl_1.completeRegistration);
exports.default = router;
