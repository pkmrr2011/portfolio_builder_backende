const Sequelize = require("sequelize");
const bcrypt = require("bcrypt");
const saltRounds = 10;

// exports.User = sequelize.define("users", {
//   id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
//   name: {
//     type: Sequelize.STRING,
//   },
//   first_name: {
//     type: Sequelize.STRING,
//   },
//   last_name: {
//     type: Sequelize.STRING,
//   },
//   email: {
//     type: Sequelize.STRING,
//     validate: {
//       isEmail: {
//         msg: "Email Not Valid!",
//       },
//     },
//   },
//   country_code: {
//     type: Sequelize.STRING,
//   },
//   phone_no: {
//     type: Sequelize.STRING,
//   },
//   password: {
//     type: Sequelize.STRING,
//     set(value) {
//       // Storing passwords in plaintext in the database is terrible.
//       // Hashing the value with an appropriate cryptographic hash function is better.
//       this.setDataValue("password", bcrypt.hashSync(value, saltRounds));
//     },
//   },
//   profile_image: {
//     type: Sequelize.STRING,
//   },
//   dob: {
//     type: Sequelize.STRING,
//   },
//   experience: {
//     type: Sequelize.INTEGER,
//   },
//   bio: {
//     type: Sequelize.STRING,
//   },
//   location: {
//     type: Sequelize.STRING,
//   },
//   working_radius: {
//     type: Sequelize.INTEGER,
//   },
//   status: {
//     type: Sequelize.ENUM,
//     values: ["active", "inactive"],
//   },
//   forgot_password_otp: {
//     // default is null
//     type: Sequelize.INTEGER,
//   },
//   forgot_password_otp_time: {
//     // default is null
//     type: Sequelize.DATE,
//   },
//   social_id: {
//     type: Sequelize.STRING,
//   },
//   social_type: {
//     type: Sequelize.ENUM,
//     values: ["google", "facebook"],
//   },

//   last_sign_in: {
//     type: Sequelize.DATE,
//   },
//   // sign_up_date: {
//   //   type: Sequelize.DATE,
//   // },

//   // full_address: {
//   //   type: Sequelize.STRING,
//   // },
//   // city: {
//   //   type: Sequelize.STRING,
//   // },
//   // state: {
//   //   type: Sequelize.STRING,
//   // },
//   // zip_code: {
//   //   type: Sequelize.STRING,
//   // },
//   latitude: {
//     type: Sequelize.DOUBLE,
//   },
//   longitude: {
//     type: Sequelize.DOUBLE,
//   },
//   role: {
//     type: Sequelize.ENUM,
//     values: [
//       "referee", 
//       "coordinator"
//     ],
//   },
//   lock_preferences: {
//     type: Sequelize.ENUM,
//     values: [
//       "app_lock", 
//       "phone_lock"
//     ],
//   },
//   pin: {
//     type: Sequelize.INTEGER,
//   },
//   blockExpires: {
//     type: Sequelize.DATE,
//   },
//   loginAttempts: {
//     type: Sequelize.INTEGER,
//   },
//   verified: {
//     // default is 0
//     type: Sequelize.TINYINT,
//   },
//   verification: {
//     type: Sequelize.STRING,
//   },
//   isProfileCompleted: {
//     type: Sequelize.TINYINT,
//   }, 
//   created_at: {
//     type: Sequelize.DATE,
//   },
//   updated_at: {
//     type: Sequelize.DATE,
//   },
// });

exports.User = sequelize.define("users", {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },

  email: {
    type: Sequelize.STRING,
    validate: {
      isEmail: {
        msg: "Email Not Valid!",
      },
    },
  },

  password: {
    type: Sequelize.STRING,
    set(value) {
      // Storing passwords in plaintext in the database is terrible.
      // Hashing the value with an appropriate cryptographic hash function is better.
      this.setDataValue("password", bcrypt.hashSync(value, saltRounds));
    },
  },
  forgot_password_otp: {
    // default is null
    type: Sequelize.INTEGER,
  }, 
  created_at: {
    type: Sequelize.DATE,
  },
  updated_at: {
    type: Sequelize.DATE,
  },
});


exports.UserAccess = sequelize.define("user_accesses", {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  email: {
    type: Sequelize.STRING,
  },
  role: {
    type: Sequelize.ENUM,
    values: [
      "referee", 
      "coordinator"
    ],
  },
  ip: {
    type: Sequelize.STRING,
  },
  browser: {
    type: Sequelize.STRING,
  },
  country: {
    type: Sequelize.STRING,
  },
  created_at: {
    type: Sequelize.DATE,
  },
  updated_at: {
    type: Sequelize.DATE,
  },
});

exports.RefreeUnavailability = sequelize.define("referee_unavailables", {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: {
    type: Sequelize.INTEGER,
  },
  day_time: {
    type: Sequelize.ENUM,
    values: [
      "early", 
      "mid_day",
      "evening",
      "night"
    ],
  },
  date: {
    type: Sequelize.DATEONLY,
  },
  time: {
    type: Sequelize.TIME,
  },
  created_at: {
    type: Sequelize.DATE,
  },
  updated_at: {
    type: Sequelize.DATE,
  },
});


exports.Bank = sequelize.define("banks", {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: {
    type: Sequelize.INTEGER,
  },
  name: {
    type: Sequelize.STRING,
  },
  account_no: {
    type: Sequelize.STRING,
  },
  ifsc_code: {
    type: Sequelize.STRING,
  },
  created_at: {
    type: Sequelize.DATE,
  },
  updated_at: {
    type: Sequelize.DATE,
  },
});


exports.Contact = sequelize.define("contacts", {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: {
    type: Sequelize.INTEGER,
  },
  receiver_id: {
    type: Sequelize.INTEGER,
  },
  name: {
    type: Sequelize.STRING,
  },
  email: {
    type: Sequelize.STRING,
  },
  content: {
    type: Sequelize.STRING,
  },
  created_at: {
    type: Sequelize.DATE,
  },
  updated_at: {
    type: Sequelize.DATE,
  },
});



exports.CMS = sequelize.define("cms", {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  type: {
    type: Sequelize.ENUM,
    values: [
      "about_us", 
      "terms_and_condition",
      "privacy_policy",
      "guidelines"
    ],
  },
  title: {
    type: Sequelize.STRING,
  },
  content: {
    type: Sequelize.STRING,
  },
  // created_at: {
  //   type: Sequelize.DATE,
  // },
  // updated_at: {
  //   type: Sequelize.DATE,
  // },
});


exports.FAQ = sequelize.define("faqs", {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  question: {
    type: Sequelize.STRING,
  },
  answer: {
    type: Sequelize.STRING,
  },
  created_at: {
    type: Sequelize.DATE,
  },
  updated_at: {
    type: Sequelize.DATE,
  },
});

exports.Game = sequelize.define("games", {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: {
    type: Sequelize.INTEGER,
  },
  referee_id: {
    type: Sequelize.INTEGER,
  },
  booking_id: {
    type: Sequelize.STRING,
  },
  game_name: {
    type: Sequelize.STRING,
  },
  venue: {
    type: Sequelize.STRING,
  },
  date: {
    type: Sequelize.DATEONLY,
  },
  start_time: {
    type: Sequelize.TIME,
  },
  end_time: {
    type: Sequelize.TIME,
  },
  price: {
    type: Sequelize.INTEGER,
  },
  latitude: {
    type: Sequelize.STRING,
  },
  longitude: {
    type: Sequelize.STRING,
  },
  game_status:{
    type: Sequelize.ENUM,
    values: [
      "completed", 
      "upcoming",
      "cancelled",
      "pending",
      "rejected",
    ],
  },
  // coordinator_status:{
  //   type: Sequelize.ENUM,
  //   values: [
  //     "about_us", 
  //     "terms_and_condition",
  //     "privacy_policy",
  //     "guidelines"
  //   ],
  // },
  rating: {
    type: Sequelize.INTEGER,
  },
  comment: {
    type: Sequelize.STRING,
  },
  created_at: {
    type: Sequelize.DATE,
  },
  updated_at: {
    type: Sequelize.DATE,
  },
});


exports.RefereeGame = sequelize.define("referee_games", {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: {
    type: Sequelize.INTEGER,
  },
  coordinator_id: {
    type: Sequelize.INTEGER,
  },
  game_id: {
    type: Sequelize.INTEGER,
  },
  received_amount: {
    type: Sequelize.INTEGER,
  },
  game_status:{
    type: Sequelize.ENUM,
    values: [
      "completed", 
      "accepted",
      "cancelled",
      "pending",
      "rejected",
    ],
  },
  created_at: {
    type: Sequelize.DATE,
  },
  updated_at: {
    type: Sequelize.DATE,
  },
});