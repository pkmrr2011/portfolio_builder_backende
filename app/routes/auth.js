const controller = require("../controllers/auth");
const validate = require("../controllers/auth.validate");
const AuthController = require("../controllers/auth");
const express = require("express");
const router = express.Router();
require("../../config/passport");
const passport = require("passport");
const requireAuth = passport.authenticate("jwt", {
  session: false,
});
const trimRequest = require("trim-request");

router.post(
  "/checkEmailAvailability",
  trimRequest.all,
  validate.email,
  controller.checkEmailAvailability
);

/*
 * Verify email route
 */
router.get("/verifyEmail/:token", trimRequest.all, controller.verifyEmail);

/*
 * Forgot password email generation route
 */
router.post(
  "/sendForgotPasswordEmail",
  trimRequest.all,
  controller.sendForgotPasswordEmail
);

/*
 * Register route
 */
router.post(
  "/register",
  trimRequest.all,
  // validate.register,
  controller.register
);
/*
 * Login route
 */
router.post(
  "/login", 
  trimRequest.all, 
  // validate.login, 
  controller.login);


/*
 * Social RegisterAndLogin route
 */
router.post(
  "/socialRegisterAndLogin",
  trimRequest.all,
  validate.socialRegisterAndLogin,
  controller.socialRegisterAndLogin
);
/*
 * Change password
 */
router.post(
  "/resetPassword", 
  trimRequest.all, 
  controller.resetPassword
  );
/*
 * Forgot password
 */
router.post(
  "/sendOtp", 
  trimRequest.all,
  // validate.email, 
  controller.sendOtp
);


router.post(
  "/forgotPassword", 
  trimRequest.all,
  validate.forgotPassword, 
  controller.forgotPassword
);

router.post(
  "/checkCredentialAvailability", 
  trimRequest.all,
  controller.checkCredentialAvailability
);



module.exports = router;
