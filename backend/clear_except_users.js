// backend/clear_except_users.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

// Import models
const User = require("./models/User");
const Menu = require("./models/Menu");
const Employee = require("./models/Employee");
const Supplier = require("./models/Supplier");
const Driver = require("./models/Driver");
const Customer = require("./models/Customer");
const Expense = require("./models/Expense");
const OtherExpense = require("./models/OtherExpense");
const OtherIncome = require("./models/OtherIncome");
const Salary = require("./models/Salary");
const Attendance = require("./models/Attendance");
const DeliveryChargeByPlace = require("./models/DeliveryChargeByPlace");
const KitchenBill = require("./models/KitchenBill");
const KitchenRequest = require("./models/KitchenRequest");
const Order = require("./models/Order");
const ServiceCharge = require("./models/ServiceCharge");
const DeliveryCharge = require("./models/DeliveryCharge");
const CurrencySetting = require("./models/CurrencySetting");
const RestaurantSetting = require("./models/RestaurantSetting");
const InvoiceCounter = require("./models/InvoiceCounter");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully.");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

const runWipe = async () => {
  await connectDB();
  console.log("Wiping transactional and configuration data (keeping login users and restaurant details)...");

  try {
    // 1. Wipe operational/transactional data completely
    await Menu.deleteMany({});
    await Employee.deleteMany({});
    await Supplier.deleteMany({});
    await Driver.deleteMany({});
    await Customer.deleteMany({});
    await Expense.deleteMany({});
    await OtherExpense.deleteMany({});
    await OtherIncome.deleteMany({});
    await Salary.deleteMany({});
    await Attendance.deleteMany({});
    await DeliveryChargeByPlace.deleteMany({});
    await KitchenBill.deleteMany({});
    await KitchenRequest.deleteMany({});
    await Order.deleteMany({});
    await InvoiceCounter.deleteMany({});

    console.log(" Wiped: Menus, Employees, Suppliers, Drivers, Orders, Expenses, Attendance, Bills, and Counters.");

    // 2. Wipe users and seed ONLY the default logins
    await User.deleteMany({});
    const adminUser = new User({ name: "Admin User", email: "admin@restaurant.com", password: "admin123", role: "admin", isActive: true });
    const cashierUser = new User({ name: "Cashier User", email: "cashier@restaurant.com", password: "cashier123", role: "cashier", isActive: true });
    const kitchenUser = new User({ name: "Kitchen User", email: "kitchen@restaurant.com", password: "kitchen123", role: "kitchen", isActive: true });
    await adminUser.save();
    await cashierUser.save();
    await kitchenUser.save();
    console.log(" Seeded: Default Admin, Cashier, and Kitchen login users.");

    // 3. Ensure default settings exist (preserve RestaurantSetting if it has a custom logo)
    const currencyExists = await CurrencySetting.findOne({});
    if (!currencyExists) {
      await new CurrencySetting({ currency: "LKR", symbol: "Rs." }).save();
    }

    const serviceChargeExists = await ServiceCharge.findOne({});
    if (!serviceChargeExists) {
      await new ServiceCharge({ dineInCharge: 10, isActive: true }).save();
    }

    const deliveryChargeExists = await DeliveryCharge.findOne({});
    if (!deliveryChargeExists) {
      await new DeliveryCharge({ amount: 300, isActive: true }).save();
    }

    const restaurantSetting = await RestaurantSetting.findOne({});
    if (!restaurantSetting) {
      await new RestaurantSetting({
        name: "OAK & IVORY RESTAURANT",
        address: "No: 5/B/C, Ja- Ela Road, Gampaha.",
        phone: "071 1635912",
        logo: ""
      }).save();
    } else {
      // Reset name/address/phone to default OAK & IVORY but preserve custom logo if uploaded
      restaurantSetting.name = "OAK & IVORY RESTAURANT";
      restaurantSetting.address = "No: 5/B/C, Ja- Ela Road, Gampaha.";
      restaurantSetting.phone = "071 1635912";
      await restaurantSetting.save();
    }

    console.log(" Settings verified and updated to OAK & IVORY RESTAURANT.");
    console.log("=================================================");
    console.log("🎉 DATABASE CLEANED & LOGINS PRESERVED SUCCESSFULLY!");
    console.log("=================================================");
  } catch (err) {
    console.error("Error clearing database:", err.message);
  } finally {
    process.exit(0);
  }
};

runWipe();
