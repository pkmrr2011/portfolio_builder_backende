const jwt = require("jsonwebtoken");
const Models = require("../models/models");
const utils = require("../middleware/utils");
const uuid = require("uuid");
const { addHours } = require("date-fns");
const { matchedData } = require("express-validator");
const auth = require("../middleware/auth");
const emailer = require("../middleware/emailer");
const HOURS_TO_BLOCK = 2;
const LOGIN_ATTEMPTS = 5;
const OTP_EXPIRED_TIME = 5;
const {
  getItem,
  getItemAccQuery,
  createItem,
  updateItem,
  deleteCustom,
  getItems,
  getItemWithInclude,
  getItemsWithInclude,
} = require("../shared/core");
const { capitalizeFirstLetter, uploadFile } = require("../shared/helpers");
const storagePath = process.env.STORAGE_PATH;
const storagePathHttp = process.env.STORAGE_PATH_HTTP;
/*********************
 * Private functions *
 *********************/

/**
 * Generates a token
 * @param {Object} user - user object
 */
const generateToken = (user) => {
  // Gets expiration time
  console.log("user", user);
  const expiration =
    Math.floor(Date.now() / 1000) + 60 * process.env.JWT_EXPIRATION_IN_MINUTES;

  // returns signed and encrypted token
  return auth.encrypt(
    jwt.sign(
      {
        data: {
          id: user.id,
          role: user.role,
        },
        exp: expiration,
      },
      process.env.JWT_SECRET
    )
  );
};

/**
 * Creates an object with user info
 * @param {Object} req - request object
 */
const setUserInfo = (req) => {
  console.log("req", req);
  delete req.dataValues.password;
  let user = {
    ...req.dataValues,
  };
  // Adds verification for testing purposes
  if (process.env.NODE_ENV !== "production") {
    user = {
      ...user,
      verification: req.verification,
    };
  }
  return user;
};

/**
 * Saves a new user access and then returns token
 * @param {Object} req - request object
 * @param {Object} user - user object
 */
const saveUserAccessAndReturnToken = async (req, user) => {
  return new Promise((resolve, reject) => {
    const userAccess = {
      email: user.email,
      ip: utils.getIP(req),
      browser: utils.getBrowserInfo(req),
      country: utils.getCountry(req),
    };
    Models.UserAccess.create(userAccess)
      .then((item) => {
        resolve({
          token: generateToken(user),
          user: setUserInfo(user),
        });
      })
      .catch((err) => {
        reject(utils.buildErrObject(422, err.message));
      });
  });
};


/**
 * Blocks a user by setting blockExpires to the specified date based on constant HOURS_TO_BLOCK
 * @param {Object} user - user object
 */
const blockUser = async (user) => {
  return new Promise((resolve, reject) => {
    user.blockExpires = addHours(new Date(), HOURS_TO_BLOCK);
    user.save((err, result) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message));
      }
      if (result) {
        resolve(utils.buildErrObject(409, "BLOCKED_USER"));
      }
    });
  });
};

/**
 * Saves login attempts to dabatabse
 * @param {Object} user - user object
 */
const saveLastLoginTimeAndAttemptsToDB = async (user) => {
  return new Promise((resolve, reject) => {
    user
      .save()
      .then((flag) => {
        resolve(true);
      })
      .catch((err) => {
        reject(utils.buildErrObject(422, err.message));
      });
  });
};

/**
 * Checks that login attempts are greater than specified in constant and also that blockexpires is less than now
 * @param {Object} user - user object
 */
const blockIsExpired = (user) =>
  user.loginAttempts > LOGIN_ATTEMPTS && user.blockExpires <= new Date();

/**
 *
 * @param {Object} user - user object.
 */
const checkLoginAttemptsAndBlockExpires = async (user) => {
  return new Promise((resolve, reject) => {
    // Let user try to login again after blockexpires, resets user loginAttempts
    if (blockIsExpired(user)) {
      user.loginAttempts = 0;
      user
        .save()
        .then((data) => {
          resolve(true);
        })
        .catch((err) => {
          reject(utils.buildErrObject(422, err.message));
        });
    } else {
      // User is not blocked, check password (normal behaviour)
      resolve(true);
    }
  });
};

/**
 * Checks if blockExpires from user is greater than now
 * @param {Object} user - user object
 */
const userIsBlocked = async (user) => {
  return new Promise((resolve, reject) => {
    if (user.blockExpires > new Date()) {
      reject(utils.buildErrObject(409, "BLOCKED_USER"));
    }
    resolve(true);
  });
};

/**
 * Finds user by email
 * @param {string} email - user´s email
 */
const findUser = async (email) => {
  return new Promise((resolve, reject) => {

    Models.User.findOne({
      where: { email: email },
    })
      .then((item) => {
        if (item) {
          resolve(item);
        } else {
          reject(utils.buildErrObject(422, "User Does Not Exist"));
        }
      })
      .catch((err, item) => {
        utils.itemNotFound(err, item, reject, "EMAIL NOT FOUND");
      });
  });
};

const findUserByPhoneNo = async (phone_no) => {
  return new Promise((resolve, reject) => {

    Models.User.findOne({
      where: { phone_no: phone_no },
    })
      .then((item) => {
        if (item) {
          resolve(item);
        } else {
          reject(utils.buildErrObject(422, "User Does Not Exist"));
        }
      })
      .catch((err, item) => {
        utils.itemNotFound(err, item, reject, "PHONE NUMBER NOT FOUND");
      });
  });
};


/**
 * Finds user by ID
 * @param {string} id - user´s id
 */
const findUserById = async (userId) => {
  return new Promise((resolve, reject) => {
    User.findById(userId, (err, item) => {
      utils.itemNotFound(err, item, reject, "USER_DOES_NOT_EXIST");
      resolve(item);
    });
  });
};

/**
 * Adds one attempt to loginAttempts, then compares loginAttempts with the constant LOGIN_ATTEMPTS, if is less returns wrong password, else returns blockUser function
 * @param {Object} user - user object
 */
const passwordsDoNotMatch = async (user) => {
  user.loginAttempts += 1;
  await saveLastLoginTimeAndAttemptsToDB(user);
  return new Promise((resolve, reject) => {
    if (user.loginAttempts <= LOGIN_ATTEMPTS) {
      resolve(utils.buildErrObject(409, "WRONG PASSWORD"));
    } else {
      resolve(blockUser(user));
    }
    reject(utils.buildErrObject(422, "ERROR"));
  });
};

const otpDoNotMatch = async (user) => {
  user.loginAttempts += 1;
  await saveLastLoginTimeAndAttemptsToDB(user);
  return new Promise((resolve, reject) => {
    if (user.loginAttempts <= LOGIN_ATTEMPTS) {
      resolve(utils.buildErrObject(409, "WRONG OTP"));
    } else {
      resolve(blockUser(user));
    }
    reject(utils.buildErrObject(422, "ERROR"));
  });
};

const missing = async () => {
return new Promise((resolve, reject) => {
    resolve(utils.buildErrObject(409, "MISSING"));
});
}
/**
 * Registers a new user in database
 * @param {Object} req - request object
 */
const registerUser = async (req) => {
  return new Promise(async (resolve, reject) => {
    try {
      // req.body.name = req.body.first_name+" "+req.body.last_name;
      if (req.files && req.files.profile_image) {
        // check if image
        var image = await uploadFile({
          file: req.files.profile_image,
          path: storagePath + "/usersImages",
        });
        req.body.profile_image = image;
      }
      req.body.verification = uuid.v4();
      console.log("req", req.body);
      const user = await createItem(Models.User, req.body);
      resolve(user);
    } catch (err) {
      reject(utils.buildErrObject(422, err.message));
    }
  });
};
/**
 * Builds the registration token
 * @param {Object} item - user object that contains created id
 * @param {Object} userInfo - user object
 */
const returnRegisterToken = (item, userInfo) => {
  if (process.env.NODE_ENV !== "production") {
    userInfo.verification = item.verification;
  }
  const data = {
    code: 200,
    token: generateToken(item),
    user: userInfo,
  };
  return data;
};

/**
 * Checks if verification id exists for user
 * @param {string} id - verification id
 */

const verificationExists = async (id) => {
  return new Promise((resolve, reject) => {
    User.findOne(
      {
        verification: id,
        verified: false,
      },
      (err, user) => {
        utils.itemNotFound(err, user, reject, "NOT_FOUND_OR_ALREADY_VERIFIED");
        resolve(user);
      }
    );
  });
};

/**
 * Verifies an user
 * @param {Object} user - user object
 */
const verifyUser = async (user) => {
  return new Promise((resolve, reject) => {
    user.verified = true;
    user.save((err, item) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message));
      }
      resolve({
        email: item.email,
        verified: item.verified,
      });
    });
  });
};

/**
 * Updates a user password in database
 * @param {string} password - new password
 * @param {Object} user - user object
 */
const updatePassword = async (password, user) => {
  return new Promise((resolve, reject) => {
    user.password = password;
    user
      .save()
      .then((item) => {
        resolve(item);
      })
      .catch((err, item) => {
        utils.itemNotFound(err, item, reject, "NOT_FOUND");
      });
  });
};

/**
 * Finds user by email to reset password
 * @param {string} email - user email
 */
const findUserToResetPassword = async (email) => {
  return new Promise((resolve, reject) => {
    User.findOne(
      {
        email,
      },
      (err, user) => {
        utils.itemNotFound(err, user, reject, "NOT_FOUND");
        resolve(user);
      }
    );
  });
};

/**
 * Creates a new password forgot
 * @param {Object} req - request object
 */
const saveForgotPassword = async (req) => {
  return new Promise((resolve, reject) => {
    const forgot = new ForgotPassword({
      email: req.body.email,
      verification: uuid.v4(),
      ipRequest: utils.getIP(req),
      browserRequest: utils.getBrowserInfo(req),
      countryRequest: utils.getCountry(req),
    });
    forgot.save((err, item) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message));
      }
      resolve(item);
    });
  });
};

/**
 * Builds an object with created forgot password object, if env is development or testing exposes the verification
 * @param {Object} item - created forgot password object
 */
const forgotPasswordResponse = (item) => {
  let data = {
    msg: "RESET_EMAIL_SENT",
    email: item.email,
  };
  if (process.env.NODE_ENV !== "production") {
    data = {
      ...data,
      verification: item.verification,
    };
  }
  return data;
};

/**
 * Gets user id from token
 * @param {string} token - Encrypted and encoded token
 */
const getUserIdFromToken = async (token) => {
  return new Promise((resolve, reject) => {
    // Decrypts, verifies and decode token
    jwt.verify(auth.decrypt(token), process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        reject(utils.buildErrObject(409, "BAD_TOKEN"));
      }
      resolve(decoded.data._id);
    });
  });
};

/********************
 * Public functions *
 ********************/

/**
 * Login function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.login = async (req, res) => {
  try {
    const data = req.body;

    if(data.email){

    if(!data.password){
      utils.handleError(res, await missing());
      // utils.buildErrObject(422, "ERROR")
      return;
    }

    const user = await findUser(data.email);

    await userIsBlocked(user);

    await checkLoginAttemptsAndBlockExpires(user);

    const isPasswordMatch = await auth.checkPassword(
      data.password,
      user.password
    );

    if (!isPasswordMatch) {
      utils.handleError(res, await passwordsDoNotMatch(user));
      return;
    }

    user.loginAttempts = 0;
    user.last_sign_in = new Date();
    await saveLastLoginTimeAndAttemptsToDB(user);

    if (user.status == "inactive") {
      return res.status(422).json({
        code: 422,
        errors: {
          msg: "You are disabled by Admin",
        },
      });
    }

    return res.status(200).json(await saveUserAccessAndReturnToken(req, user));
  }else if(data.phone_no){

    if(!data.otp){
      utils.handleError(res, await missing());
      // utils.buildErrObject(422, "ERROR")
      return;
    }

    const user = await findUserByPhoneNo(data.phone_no);

    await userIsBlocked(user);

    await checkLoginAttemptsAndBlockExpires(user);

    if (data.otp != user.forgot_password_otp) {
      utils.handleError(res, await otpDoNotMatch(user));
      return;
    }
    user.forgot_password_otp_time = new Date();
    user.forgot_password_otp = 0;

    user.loginAttempts = 0;
    user.last_sign_in = new Date();
    await saveLastLoginTimeAndAttemptsToDB(user);
    if (user.status == "inactive") {
      return res.status(422).json({
        code: 422,
        errors: {
          msg: "You are disabled by Admin",
        },
      });
    }

    return res.status(200).json(await saveUserAccessAndReturnToken(req, user));

  }
  } catch (error) {
    utils.handleError(res, error);
  }
};




exports.verifyEmail = async (req, res) => {
  jwt.verify(
    req.params.token,
    process.env.JWT_SECRET,
    async function (err, decoded) {
      if (err) {
        console.log(err);
        res.status(422).send("<h1> Token has been expired or invalid </h1>");
      } else {
        let item = await updateItem(
          User,
          { _id: mongoose.Types.ObjectId(decoded.data) },
          {
            verified: true,
            email_verified_at: Date.now(),
          }
        );
        if (item) {
          res.render("verificationSuccess", {
            redirectURL: `${process.env.WEBSITE_URL}auth/signin`,
          });
        } else {
          return res
            .status(201)
            .send("<h1 style='color:red'> Something Went Wrong </h1>");
        }
      }
    }
  );
};

/**
 * check email availablity
 * @param {Object} req - request object
 * @param {Object} res - response object
 */

exports.checkEmailAvailability = async (req, res) => {
  try {
    const doesEmailExists = await emailer.emailExists(req.body.email);
    res.status(201).json({ code: 200, status: doesEmailExists });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.checkCredentialAvailability = async (req, res) => {
  try {
    const data = req.body;

    if(data.email && !data.phone_no){
      const doesEmailExists = await emailer.emailExists(req.body.email);
      res.status(201).json({ code: 200, doesEmailExists: doesEmailExists });
    }else if(!data.email && data.phone_no){
      const doesmobileExists = await emailer.mobileExists(req.body.phone_no);
      res.status(201).json({ code: 200, doesmobileExists: doesmobileExists });
    }else{
      const doesEmailExists = await emailer.emailExists(req.body.email);
      const doesmobileExists = await emailer.mobileExists(req.body.phone_no);

      res.status(201).json({ code: 200, doesmobileExists: doesmobileExists , doesEmailExists: doesEmailExists });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

/**
 * Register function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */

exports.register = async (req, res) => {
  try {
    console.log(req.body);
    const locale = req.getLocale(); // Gets locale from header 'Accept-Language'
    const doesEmailExists = await emailer.emailExists(req.body.email);
    if (!doesEmailExists) {
      const item = await registerUser(req);
      const userInfo = setUserInfo(item);
      const response = returnRegisterToken(item, userInfo);
      // emailer.sendVerificationEmail(locale, item, 'verifyEmail')
      res.status(201).json(response);
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.socialRegisterAndLogin = async (req, res) => {
  try {
    console.log(req.body);
    const data = req.body;
    const locale = req.getLocale(); // Gets locale from header 'Accept-Language'
    const userExists = await emailer.userExists(data.email, false);
    const doesSocialIdExists = await emailer.socialIdExists(
      data.social_id,
      data.social_type
    );
    if (!userExists && !doesSocialIdExists) {
      const item = await registerUser(req);
      const userInfo = setUserInfo(item);
      const response = returnRegisterToken(item, userInfo);
      // emailer.sendVerificationEmail(locale, item, 'verifyEmail')
      res.status(201).json(response);
    } else {
      console.log("userExists===>", userExists);
      if (userExists && !userExists.social_id) {
        throw utils.buildErrObject(
          422,
          `User is Already Registered Without Social Login`
        );
      } else {
        userExists.loginAttempts = 0;
        userExists.last_sign_in = new Date();
        await saveLastLoginTimeAndAttemptsToDB(userExists);
        return res.status(200).json(
          Object.assign(await saveUserAccessAndReturnToken(req, userExists), {
            code: 200,
          })
        );
      }
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

/**
 * Verify function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.verify = async (req, res) => {
  try {
    req = matchedData(req);
    const user = await verificationExists(req.id);
    res.status(200).json(await verifyUser(user));
  } catch (error) {
    utils.handleError(res, error);
  }
};

/**
 * Forgot password function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.sendForgotPasswordEmail = async (req, res) => {
  try {
    const locale = req.getLocale(); // Gets locale from header 'Accept-Language'
    const data = req.body;
    const user = await findUser(data);
    let forgotPassword = await getItemCustom(ForgotPassword, {
      email: data.email,
      used: false,
      type: "user",
    });
    console.log("forgetPassword===>", forgotPassword);
    forgotPassword = forgotPassword.data;
    if (!forgotPassword) {
      forgotPassword = await saveForgotPassword(req);
    }
    let mailOptions = {
      to: data.email,
      subject: "Forgot Password",
      name: `${capitalizeFirstLetter(user.name)}`,
      url: `${
        data.is_development ? process.env.LOCAL_URL : process.env.WEBSITE_URL
      }auth/reset-password/${forgotPassword.verification}`,
    };
    emailer.sendEmail(locale, mailOptions, "/forgotPassword");
    res.status(200).json(forgotPasswordResponse(forgotPassword));
  } catch (error) {
    utils.handleError(res, error);
  }
};

/**
 * Checks User OTP
 * @param {Object} user - user object
 */
const checkOTP = async (user, otp) => {
  return new Promise((resolve, reject) => {
    if (user.forgot_password_otp_time < new Date())
      reject(utils.buildErrObject(409, "OTP_EXPIRED"));
    if (user.forgot_password_otp != otp)
      reject(utils.buildErrObject(409, "INVALID_OTP"));
    resolve(true);
  });
};

/**
 * Refresh token function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.resetPassword = async (req, res) => {
  try {
    var data = req.body;
    const changepassword = await auth.changeOldPassword(data, Models.User);
    res.status(200).json(changepassword);
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.sendOtp = async (req, res) => {
  try {

    const data = req.body;

    if(data.email){

    
    const  user = await findUser(data.email);

    user.forgot_password_otp = Math.floor(1000 + Math.random() * 9000);
    user.forgot_password_otp_time = new Date(
      new Date().getTime() + OTP_EXPIRED_TIME * 60 * 1000
    );

    await Promise.all([
      emailer.sendOtpOnEmail(
        req.getLocale(),
        {
          email: user.email,
          name: user.name,
          otp: user.forgot_password_otp,
        },
        "RESET PASSWORD OTP"
      ),
      user.save(),
    ]);

    res.status(200).json({
      code: 200,
      data: "EMAIL_SEND",
      email: user.email,
    });
    }else if(data.phone_no){
      const user = await findUserByPhoneNo(data.phone_no);

      if(!data.country_code){
        utils.handleError(res, await missing());
      // utils.buildErrObject(422, "ERROR")
      return;
      }else{
        if (data.country_code != user.country_code) {
          res.status(400).json({
            code: 400,
            message:"WRONG MOBILE NUMBER"
          });
        }
      }

      user.forgot_password_otp = Math.floor(1000 + Math.random() * 9000);
      user.forgot_password_otp_time = new Date(
        new Date().getTime() + OTP_EXPIRED_TIME * 60 * 1000
      );

      await user.save();

      res.status(200).json({
        code: 200,
        data: "OTP_SEND",
        otp:user.forgot_password_otp,
        phone_no: user.phone_no,
      });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};


/**
 * Refresh token function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */

exports.forgotPassword = async (req, res) => {
  try {
    const data = req.body;
    let user;
    if(data.email){
      user = await findUser(data.email);
    }else{
      user = await findUserByPhoneNo(data.phone_no);
    }
     

    if (await checkOTP(user, data.otp)) {
      user.forgot_password_otp_time = new Date();
      user.forgot_password_otp = 0;
      await user.save();
    }
    await updatePassword(data.new_password, user);

    res.status(200).json({
      code: 200,
      data: "PASSWORD CAHANGED",
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};


/**
 * Checks against user if has quested role
 * @param {Object} data - data object
 * @param {*} next - next callback
 */
const checkPermissions = async (data, next) => {
  return new Promise((resolve, reject) => {
    User.findById(data.id, (err, result) => {
      utils.itemNotFound(err, result, reject, "NOT_FOUND");
      if (data.roles.indexOf(result.role) > -1) {
        return resolve(next());
      }
      return reject(utils.buildErrObject(401, "UNAUTHORIZED"));
    });
  });
};
