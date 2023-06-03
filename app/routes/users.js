const controller = require("../controllers/users");
const validate = require("../controllers/users.validate");
const express = require("express");
const router = express.Router();
require("../../config/passport");
const passport = require("passport");
const requireAuth = passport.authenticate("jwt", {
  session: false,
});
const trimRequest = require("trim-request");

/*
 * Users routes
 */

// ****** ****  Profile **** *********

router.post(
  "/changePassword",
  trimRequest.all,
  requireAuth,
  validate.changePassword,
  controller.changePassword
);

router.post(
  "/updateProfile",
  trimRequest.all,
  requireAuth,
  controller.updateProfile
);

router.get(
  "/getProfile", 
  trimRequest.all,
  validate.getProfile,
  controller.getProfile
);

router.post(
  "/schedule_unavailability", 
  trimRequest.all, 
  requireAuth, 
  validate.schedule_unavailability,
  controller.schedule_unavailability
);

router.get(
  "/myProfile", 
  trimRequest.all, 
  requireAuth, 
  controller.myProfile
);


router.post(
  "/addBankAccount", 
  trimRequest.all, 
  requireAuth, 
  validate.addBankAccount,
  controller.addBankAccount
);

router.delete(
  "/removeBank", 
  trimRequest.all,
  validate.removeBank,
  controller.removeBank
);

router.post(
  "/contactForm", 
  trimRequest.all,
  validate.contactForm,
  controller.contactForm
);


router.get(
  "/myContactList", 
  trimRequest.all, 
  requireAuth, 
  controller.myContactList
);

router.post(
  "/cms", 
  trimRequest.all,
  validate.cms,
  controller.cms
);

router.get(
  "/faq", 
  trimRequest.all, 
  controller.faq
);

router.post(
  "/appAuthentication", 
  trimRequest.all, 
  requireAuth, 
  controller.appAuthentication
);


router.post(
  "/completeProfile", 
  trimRequest.all,
  requireAuth,
  validate.completeProfile,
  controller.completeProfile
);

module.exports = router;
