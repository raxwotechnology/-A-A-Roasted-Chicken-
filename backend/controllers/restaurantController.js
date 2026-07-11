// backend/controllers/restaurantController.js
const RestaurantSetting = require("../models/RestaurantSetting");

exports.getRestaurantSetting = async (req, res) => {
  try {
    let setting = await RestaurantSetting.findOne({});
    if (!setting) {
      // Return defaults if none exists
      setting = {
        name: "OAK & IVORY RESTAURANT",
        address: "No: 5/B/C, Ja- Ela Road, Gampaha.",
        phone: "071 1635912",
        logo: ""
      };
    }
    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: "Failed to load restaurant settings" });
  }
};

exports.updateRestaurantSetting = async (req, res) => {
  const { name, address, phone, logo } = req.body;

  try {
    let setting = await RestaurantSetting.findOne({});
    if (!setting) {
      setting = new RestaurantSetting({ name, address, phone, logo });
    } else {
      if (name !== undefined) setting.name = name;
      if (address !== undefined) setting.address = address;
      if (phone !== undefined) setting.phone = phone;
      if (logo !== undefined) setting.logo = logo;
    }

    await setting.save();
    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: "Failed to update restaurant settings" });
  }
};
