// backend/models/RestaurantSetting.js
const mongoose = require("mongoose");

const restaurantSettingSchema = new mongoose.Schema({
  name: {
    type: String,
    default: "OAK & IVORY RESTAURANT"
  },
  address: {
    type: String,
    default: "No: 5/B/C, Ja- Ela Road, Gampaha."
  },
  phone: {
    type: String,
    default: "071 1635912"
  },
  logo: {
    type: String,
    default: "" // Base64 data URL
  }
});

module.exports = mongoose.model("RestaurantSetting", restaurantSettingSchema);
