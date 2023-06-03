const uuid = require("uuid");
const { handleError, buildErrObject } = require("../middleware/utils");
const db = require("../middleware/db");
const fs = require("fs");

const auth = require("../middleware/auth");
const axios = require("axios");

const { Blob, Buffer } = require("buffer");

const {
  getItem,
  getItemAccQuery,
  createItem,
  updateItem,
  deleteCustom,
  getItemsAccQuery,
  getItemsAccQueryWidCount,
  getItemWithInclude,
  getItemsWithInclude,
} = require("../shared/core");
const { uploadFile, getUserIdFromToken } = require("../shared/helpers");
const { Op, Model, where } = require("sequelize");

const sequelize = require("../../config/mysql");

const STORAGE_PATH_HTTP = process.env.STORAGE_PATH_HTTP;
const STORAGE_PATH = process.env.STORAGE_PATH;

// * models
const Models = require("../models/models");

/**
 * Upload Media function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */

/********************
 * Public functions *
 ********************/

exports.changePassword = async (req, res) => {
  try {
    const data = req.body;

    data.user_id = req.user.id;

    const USER = await getItem(Models.User, data.user_id);

    const isPasswordMatch = await auth.checkPassword(
      data.old_password,
      USER.password
    );

    if (!isPasswordMatch) {
      throw buildErrObject(422, "WRONG_OLD_PASSWORD");
    }

    USER.password = data.new_password;

    await USER.save();

    return res.status(200).json({
      code: 200,
      passwordChange: true,
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const data = req.body;

    data.user_id = req.user.id;

    if (req.files && req.files.profile_image) {
      // check if image
      var image = await uploadFile({
        file: req.files.profile_image,
        path: STORAGE_PATH + "/usersImages",
      });
      data.profile_image = image;
    }
    // if(data.first_name || data.last_name){
    //   data.name = data.first_name+" "+data.last_name;
    // }

    if(data.experience){
      data.experience= parseInt(data.experience); 
    }
    if(data.working_radius){
      data.working_radius= parseInt(data.working_radius); 
    }
    await updateItem(Models.User, { id: data.user_id }, data);

    return res.status(200).json({
      code: 200,
      profileUpdated: true,
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.getProfile = async (req, res) => {
  try {
    const id  = req.query.id;
    const condition = {
      id: id,
    };
    const item = await getItemAccQuery(Models.User, condition);

    return res.status(200).json({
      code: 200,
      profileData: item,
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.schedule_unavailability= async (req, res) => {
  try {
    const data = req.body;
    data.user_id = req.user.id;


   const item= await createItem(Models.RefreeUnavailability,data)

    return res.status(200).json({
      code: 200,
      data: item,
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.myProfile = async (req, res) => {
  try {
    const id = req.user.id;

    const profile = await getItem(Models.User , id)

    return res.status(200).json({
      code: 200,
      data: profile,
    });
  } catch (error) {
    handleError(res, error);
  }
};


exports.addBankAccount = async (req, res) => {
  try {
    const data = req.body;
    data.user_id = req.user.id;
console.log("_____------>",data);
    // const bank = await createItem(Models.Bank , data);
    // const bank = await Models.Bank.findOrCreate({
    //   where:{data , user_id:data.user_id},
    //   defaults:{data}
    // })

    const details = await getItemAccQuery(Models.Bank , {user_id:data.user_id , account_no : data.account_no});
    if(details){
      return res.status(200).json({
        code: 200,
        message: "already added",
      });
    }else{
      const bank = await createItem(Models.Bank , data);
      return res.status(200).json({
        code: 200,
        bank_detail: bank,
      });
    }


  } catch (error) {
    handleError(res, error);
  }
};

exports.removeBank = async (req, res) => {
  try {
    const data = req.body;

    await Models.Bank.destroy({
      where:{id:data.id}
    })

    return res.status(200).json({
      code: 200,
      message: "removed",
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.contactForm = async (req, res) => {
  try {
    const data = req.body;
    if(req.user){

      data.user_id = req.user.id;
    }

    const contact = await createItem(Models.Contact , data);

    return res.status(200).json({
      code: 200,
      data: contact,
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.myContactList = async (req, res) => {
  try {
    const id = req.user.id;

    const list = await getItemsAccQuery(Models.Contact , {receiver_id: id});

    return res.status(200).json({
      code: 200,
      data: list,
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.cms = async (req, res) => {
  try {
    const data = req.body;

    const cms = await getItemAccQuery(Models.CMS , {type:data.type})

    return res.status(200).json({
      code: 200,
      data: cms,
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.faq = async (req, res) => {
  try {

    const faq = await Models.FAQ.findAll({});

    return res.status(200).json({
      code: 200,
      data: faq,
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.appAuthentication = async (req, res) => {
  try {
    const data = req.body;
    const id = req.user.id;

    await updateItem(Models.User , {id:id} , data);

    return res.status(200).json({
      code: 200,
      message: "updated",
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.completeProfile = async (req, res) => {
  try {
    const data = req.body;

    data.user_id = req.user.id;


console.log("DATA_---->",data);
    if (req.files && req.files.profile_image) {
      // check if image
      var image = await uploadFile({
        file: req.files.profile_image,
        path: STORAGE_PATH + "/usersImages",
      });
      data.profile_image = image;
    }

    if(data.experience){
      data.experience= parseInt(data.experience); 
    }
    if(data.working_radius){
      data.working_radius= parseInt(data.working_radius); 
    }
    data.isProfileCompleted = 1;
    await updateItem(Models.User, { id: data.user_id }, data);

    return res.status(200).json({
      code: 200,
      profileUpdated: true,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// exports.getProfile = async (req, res) => {
//   try {
//     const data = req.body;
//     data.user_id = req.user.id;

//     return res.status(200).json({
//       code: 200,
//       data: "",
//     });
//   } catch (error) {
//     handleError(res, error);
//   }
// };