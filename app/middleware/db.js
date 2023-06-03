const {
  buildErrObject,
  handleError,
  buildSuccObject,
  itemNotFound,
  itemAlreadyExists,
  itemExists,
} = require("../middleware/utils");

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

const { randomString } = require("../shared/helpers");

module.exports = {
  async test(collection, data) {
    return new Promise(async (resolve, reject) => {
      try {
        const item = await getItemCustom(
          collection,
          { type: data.type },
          "content title updatedAt"
        );
        resolve(item);
      } catch (error) {
        reject(buildErrObject(422, error.message));
      }
    });
  },
};
