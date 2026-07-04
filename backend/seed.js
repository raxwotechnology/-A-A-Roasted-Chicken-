// backend/seed.js
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
const InvoiceCounter = require("./models/InvoiceCounter");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully for seeding.");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

const clearDatabase = async () => {
  console.log("Clearing existing data...");
  await User.deleteMany({});
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
  await ServiceCharge.deleteMany({});
  await DeliveryCharge.deleteMany({});
  await CurrencySetting.deleteMany({});
  await InvoiceCounter.deleteMany({});
  console.log("Database cleared.");
};

const seed = async () => {
  await connectDB();
  await clearDatabase();

  console.log("Starting seed process...");

  // 1. Create Default Users (with pre-save hook for password hashing)
  console.log("Seeding Users...");
  const adminUser = new User({
    name: "Admin User",
    email: "admin@rms.com",
    password: "admin123",
    role: "admin",
    isActive: true,
  });
  await adminUser.save();

  const cashierUser = new User({
    name: "Cashier User",
    email: "cashier@rms.com",
    password: "cashier123",
    role: "cashier",
    isActive: true,
  });
  await cashierUser.save();

  const kitchenUser = new User({
    name: "Kitchen User",
    email: "kitchen@rms.com",
    password: "kitchen123",
    role: "kitchen",
    isActive: true,
  });
  await kitchenUser.save();

  console.log("Users seeded successfully.");

  // 2. Create Settings (Currency, Service Charge, Delivery Charge)
  console.log("Seeding Settings...");
  await new CurrencySetting({
    currency: "LKR",
    symbol: "Rs."
  }).save();

  await new ServiceCharge({
    dineInCharge: 10, // 10%
    isActive: true
  }).save();

  await new DeliveryCharge({
    amount: 300,
    isActive: true
  }).save();

  await new DeliveryChargeByPlace({ placeName: "Colombo 1-15", charge: 250 }).save();
  await new DeliveryChargeByPlace({ placeName: "Dehiwala-Mount Lavinia", charge: 350 }).save();
  await new DeliveryChargeByPlace({ placeName: "Nugegoda", charge: 300 }).save();
  await new DeliveryChargeByPlace({ placeName: "Rajagiriya", charge: 400 }).save();
  await new DeliveryChargeByPlace({ placeName: "Battaramulla", charge: 450 }).save();

  console.log("Settings seeded successfully.");

  // 3. Create Suppliers
  console.log("Seeding Suppliers...");
  const suppliers = [
    {
      name: "Fresh Farms Ltd",
      companyName: "Fresh Farms",
      contact: "0112345678",
      email: "freshfarms@mail.com",
      address: "No. 12, Farm Road, Nuwara Eliya"
    },
    {
      name: "Prime Meats",
      companyName: "Prime Meats",
      contact: "0118765432",
      email: "primemeats@mail.com",
      address: "No. 45, Butcher Street, Colombo 10"
    },
    {
      name: "Daily Beverages",
      companyName: "Daily Beverages",
      contact: "0113334445",
      email: "beverages@mail.com",
      address: "No. 88, Drink Avenue, Gampaha"
    }
  ];
  const seededSuppliers = await Supplier.insertMany(suppliers);
  console.log("Suppliers seeded successfully.");

  // 4. Create Drivers
  console.log("Seeding Drivers...");
  const drivers = [
    {
      name: "Ravi Kumara",
      nic: "199411223344",
      vehicle: "Motorbike",
      numberPlate: "WP-BGG-1234",
      address: "No. 4, Temple Road, Dehiwala",
      phone: "0777123456",
      addedBy: cashierUser._id
    },
    {
      name: "Nimal Perera",
      nic: "199122334455",
      vehicle: "Motorbike",
      numberPlate: "WP-BJJ-5678",
      address: "No. 15, Station Road, Mount Lavinia",
      phone: "0711123456",
      addedBy: cashierUser._id
    }
  ];
  const seededDrivers = await Driver.insertMany(drivers);
  console.log("Drivers seeded successfully.");

  // 5. Create Employees
  console.log("Seeding Employees...");
  const employees = [
    {
      id: "EMP-0001",
      name: "John Doe",
      nic: "199012345678",
      phone: "0771234567",
      role: "Chef",
      basicSalary: 45000,
      workingHours: 8,
      otHourRate: 200,
      bankAccountNo: "1234567890"
    },
    {
      id: "EMP-0002",
      name: "Sarah Connor",
      nic: "199298765432",
      phone: "0711234567",
      role: "Cashier",
      basicSalary: 35000,
      workingHours: 8,
      otHourRate: 150,
      bankAccountNo: "0987654321"
    },
    {
      id: "EMP-0003",
      name: "Michael Scott",
      nic: "198512345999",
      phone: "0721234567",
      role: "Waiter",
      basicSalary: 25000,
      workingHours: 8,
      otHourRate: 100,
      bankAccountNo: "1122334455"
    },
    {
      id: "EMP-0004",
      name: "Dwight Schrute",
      nic: "198812345111",
      phone: "0751234567",
      role: "Waiter",
      basicSalary: 25000,
      workingHours: 8,
      otHourRate: 100,
      bankAccountNo: "5544332211"
    }
  ];
  const seededEmployees = await Employee.insertMany(employees);
  console.log("Employees seeded successfully.");

  // 6. Create Menu Items (with high quality food images)
  console.log("Seeding Menus...");
  const menus = [
    {
      name: "Classic Beef Burger",
      description: "Juicy flame-grilled beef patty with cheese, fresh lettuce, tomato, and house burger sauce, served in a toasted brioche bun.",
      price: 1200,
      cost: 700,
      category: "Burgers & Sandwiches",
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
      minimumQty: 10,
      currentQty: 45,
      menuStatus: "In Stock"
    },
    {
      name: "Crispy Chicken Burger",
      description: "Crispy golden fried chicken breast, spicy mayo, pickles, and shredded lettuce on a toasted bun.",
      price: 1100,
      cost: 600,
      category: "Burgers & Sandwiches",
      imageUrl: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80",
      minimumQty: 10,
      currentQty: 50,
      menuStatus: "In Stock"
    },
    {
      name: "Cheesy Pepperoni Pizza",
      description: "Classic pizza topped with premium pepperoni, rich marinara sauce, and loaded with melted mozzarella cheese.",
      price: 2400,
      cost: 1300,
      category: "Main Course",
      imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
      minimumQty: 5,
      currentQty: 25,
      menuStatus: "In Stock"
    },
    {
      name: "Margherita Pizza",
      description: "Simple yet delicious pizza topped with fresh tomatoes, basil, mozzarella, and a drizzle of olive oil.",
      price: 1800,
      cost: 950,
      category: "Main Course",
      imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80",
      minimumQty: 5,
      currentQty: 30,
      menuStatus: "In Stock"
    },
    {
      name: "Seafood Fried Rice",
      description: "Wok-tossed basmati rice with fresh prawns, cuttlefish, egg, and spring onions, seasoned with Asian spices.",
      price: 1500,
      cost: 850,
      category: "Main Course",
      imageUrl: "https://images.unsplash.com/photo-1603133872878-685f5888c3c1?auto=format&fit=crop&w=600&q=80",
      minimumQty: 15,
      currentQty: 60,
      menuStatus: "In Stock"
    },
    {
      name: "Spaghetti Bolognese",
      description: "Al dente spaghetti served with a rich, slow-simmered minced beef Bolognese sauce and topped with parmesan.",
      price: 1650,
      cost: 900,
      category: "Main Course",
      imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
      minimumQty: 10,
      currentQty: 40,
      menuStatus: "In Stock"
    },
    {
      name: "Creamy Chicken Alfredo Pasta",
      description: "Fettuccine pasta tossed in a creamy, velvety parmesan cheese and butter sauce, topped with grilled chicken strips.",
      price: 1750,
      cost: 950,
      category: "Main Course",
      imageUrl: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=600&q=80",
      minimumQty: 10,
      currentQty: 35,
      menuStatus: "In Stock"
    },
    {
      name: "Loaded French Fries",
      description: "Golden crispy french fries smothered in warm cheese sauce, jalapenos, and crispy turkey bacon bits.",
      price: 750,
      cost: 350,
      category: "Starters",
      imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
      minimumQty: 20,
      currentQty: 80,
      menuStatus: "In Stock"
    },
    {
      name: "Crispy Vegetable Spring Rolls",
      description: "Crispy pastry wrapper filled with a spiced mix of cabbage, carrots, glass noodles, served with sweet chili sauce (4 pcs).",
      price: 650,
      cost: 280,
      category: "Starters",
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
      minimumQty: 15,
      currentQty: 50,
      menuStatus: "In Stock"
    },
    {
      name: "Hot & Sour Chicken Soup",
      description: "A spicy and tangy broth packed with shredded chicken, mushrooms, bamboo shoots, and wispy beaten eggs.",
      price: 800,
      cost: 400,
      category: "Soups & Salads",
      imageUrl: "https://images.unsplash.com/photo-1547592165-e1d17fed6005?auto=format&fit=crop&w=600&q=80",
      minimumQty: 10,
      currentQty: 25,
      menuStatus: "In Stock"
    },
    {
      name: "Classic Caesar Salad",
      description: "Crisp romaine lettuce tossed in creamy Caesar dressing, garlic croutons, and grated parmesan cheese.",
      price: 1100,
      cost: 500,
      category: "Soups & Salads",
      imageUrl: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=600&q=80",
      minimumQty: 8,
      currentQty: 20,
      menuStatus: "In Stock"
    },
    {
      name: "Fresh Orange Juice",
      description: "100% natural, freshly squeezed orange juice served chilled over ice.",
      price: 450,
      cost: 150,
      category: "Beverages",
      imageUrl: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=600&q=80",
      minimumQty: 25,
      currentQty: 100,
      menuStatus: "In Stock"
    },
    {
      name: "Iced Caramel Macchiato",
      description: "Chilled espresso with milk, rich caramel syrup, topped with caramel drizzle.",
      price: 650,
      cost: 250,
      category: "Beverages",
      imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80",
      minimumQty: 15,
      currentQty: 40,
      menuStatus: "In Stock"
    },
    {
      name: "Coca Cola (Can)",
      description: "Chilled classic Coca-Cola can (330ml).",
      price: 250,
      cost: 120,
      category: "Beverages",
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
      minimumQty: 30,
      currentQty: 120,
      menuStatus: "In Stock"
    },
    {
      name: "Fudge Brownie with Ice Cream",
      description: "Warm fudgy chocolate brownie topped with a scoop of vanilla bean ice cream and chocolate fudge sauce.",
      price: 750,
      cost: 320,
      category: "Desserts",
      imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
      minimumQty: 10,
      currentQty: 30,
      menuStatus: "In Stock"
    },
    {
      name: "Strawberry Cheesecake Slice",
      description: "Creamy cheesecake on a buttery graham cracker crust, topped with fresh strawberry compote.",
      price: 850,
      cost: 400,
      category: "Desserts",
      imageUrl: "https://images.unsplash.com/photo-1524351199679-46cddf530c04?auto=format&fit=crop&w=600&q=80",
      minimumQty: 5,
      currentQty: 15,
      menuStatus: "In Stock"
    }
  ];
  const seededMenus = await Menu.insertMany(menus);
  console.log("Menus seeded successfully.");

  // 7. Create Customers
  console.log("Seeding Customers...");
  const customers = [
    { name: "Alice Smith", phone: "0770001111" },
    { name: "Bob Johnson", phone: "0770002222" },
    { name: "Charlie Brown", phone: "0770003333" },
    { name: "Diana Prince", phone: "0770004444" }
  ];
  const seededCustomers = await Customer.insertMany(customers);
  console.log("Customers seeded successfully.");

  // 8. Create Supplier Expenses (Purchases)
  console.log("Seeding Supplier Expenses...");
  const expensesList = [
    {
      supplier: seededSuppliers[0]._id, // Fresh Farms
      amount: 8000,
      date: new Date("2026-06-10T10:00:00Z"),
      billNo: "FF-10023",
      billItems: [
        { description: "Tomatoes", quantity: 40, unitPrice: 150, total: 6000, note: "Fresh vegetables" },
        { description: "Lettuce", quantity: 10, unitPrice: 200, total: 2000 }
      ],
      paymentMethod: "Cash"
    },
    {
      supplier: seededSuppliers[1]._id, // Prime Meats
      amount: 25000,
      date: new Date("2026-06-18T11:00:00Z"),
      billNo: "PM-509",
      billItems: [
        { description: "Chicken Breasts", quantity: 25, unitPrice: 800, total: 20000, note: "High quality chicken" },
        { description: "Beef Mince", quantity: 5, unitPrice: 1000, total: 5000 }
      ],
      paymentMethod: "Bank Transfer"
    },
    {
      supplier: seededSuppliers[2]._id, // Daily Beverages
      amount: 15000,
      date: new Date("2026-06-25T14:30:00Z"),
      billNo: "DB-4091",
      billItems: [
        { description: "Coca Cola Cans", quantity: 100, unitPrice: 100, total: 10000, note: "Beverage stock" },
        { description: "Sprite Cans", quantity: 50, unitPrice: 100, total: 5000 }
      ],
      paymentMethod: "Card"
    },
    {
      supplier: seededSuppliers[0]._id, // Fresh Farms
      amount: 6000,
      date: new Date("2026-07-02T09:00:00Z"),
      billNo: "FF-10112",
      billItems: [
        { description: "Onions", quantity: 20, unitPrice: 150, total: 3000 },
        { description: "Potatoes", quantity: 30, unitPrice: 100, total: 3000 }
      ],
      paymentMethod: "Cash"
    }
  ];
  await Expense.insertMany(expensesList);
  console.log("Supplier Expenses seeded successfully.");

  // 9. Create Other Expenses & Other Incomes
  console.log("Seeding Other Expenses and Incomes...");
  const otherExpensesList = [
    {
      category: "Marketing",
      amount: 15000,
      date: new Date("2026-06-05T12:00:00Z"),
      description: "Facebook ads campaign",
      paymentMethod: "Card",
      addedBy: adminUser._id
    },
    {
      category: "Stationery",
      amount: 3500,
      date: new Date("2026-06-12T10:00:00Z"),
      description: "Printed receipt rolls",
      paymentMethod: "Cash",
      addedBy: cashierUser._id
    },
    {
      category: "Cleaning",
      amount: 6500,
      date: new Date("2026-06-28T16:00:00Z"),
      description: "Floor cleaners and sanitizers",
      paymentMethod: "Cash",
      addedBy: cashierUser._id
    },
    {
      category: "Marketing",
      amount: 8000,
      date: new Date("2026-07-03T11:00:00Z"),
      description: "Flyer distribution in local area",
      paymentMethod: "Cash",
      addedBy: adminUser._id
    }
  ];
  await OtherExpense.insertMany(otherExpensesList);

  const otherIncomesList = [
    {
      source: "Recycling",
      amount: 4500,
      date: new Date("2026-06-14T15:00:00Z"),
      description: "Sale of waste cardboard & bottles",
      paymentMethod: "Cash",
      addedBy: cashierUser._id
    },
    {
      source: "Catering Event Deposit",
      amount: 50000,
      date: new Date("2026-06-28T09:30:00Z"),
      description: "Deposit for July 10th birthday catering",
      paymentMethod: "Bank Transfer",
      addedBy: adminUser._id
    },
    {
      source: "Catering Event Settlement",
      amount: 75000,
      date: new Date("2026-07-04T10:00:00Z"),
      description: "Final payment for July 10th catering event",
      paymentMethod: "Bank Transfer",
      addedBy: adminUser._id
    }
  ];
  await OtherIncome.insertMany(otherIncomesList);
  console.log("Other Expenses and Incomes seeded successfully.");

  // 10. Create Kitchen Bills
  console.log("Seeding Kitchen Bills...");
  const kitchenBillsList = [
    {
      type: "Gas",
      amount: 15000,
      date: new Date("2026-06-15T08:00:00Z"),
      description: "Monthly gas cylinder refill",
      paymentMethod: "Cash",
      addedBy: adminUser._id
    },
    {
      type: "Electricity",
      amount: 28000,
      date: new Date("2026-06-20T17:00:00Z"),
      description: "Electricity bill for June",
      paymentMethod: "Card",
      addedBy: adminUser._id
    },
    {
      type: "Water",
      amount: 8500,
      date: new Date("2026-06-22T10:00:00Z"),
      description: "Water bill for June",
      paymentMethod: "Bank Transfer",
      addedBy: adminUser._id
    },
    {
      type: "Repairs",
      amount: 12000,
      date: new Date("2026-07-01T14:00:00Z"),
      description: "Kitchen exhaust fan repairs",
      paymentMethod: "Cash",
      addedBy: adminUser._id
    }
  ];
  await KitchenBill.insertMany(kitchenBillsList);
  console.log("Kitchen Bills seeded successfully.");

  // 11. Create Kitchen Requests
  console.log("Seeding Kitchen Requests...");
  const kitchenRequestsList = [
    {
      requestedBy: kitchenUser._id,
      item: "Tomato Puree",
      quantity: 10,
      unit: "kg",
      reason: "Running low for pizza sauce",
      date: new Date("2026-07-02T10:00:00Z"),
      status: "Approved"
    },
    {
      requestedBy: kitchenUser._id,
      item: "Mozzarella Cheese",
      quantity: 5,
      unit: "kg",
      reason: "Running low",
      date: new Date("2026-07-03T08:30:00Z"),
      status: "Pending"
    },
    {
      requestedBy: kitchenUser._id,
      item: "Chicken Breast",
      quantity: 20,
      unit: "kg",
      reason: "Weekend preparation",
      date: new Date("2026-07-04T07:15:00Z"),
      status: "Pending"
    }
  ];
  await KitchenRequest.insertMany(kitchenRequestsList);
  console.log("Kitchen Requests seeded successfully.");

  // 12. Create Salaries
  console.log("Seeding Salaries...");
  const salariesList = [
    {
      employee: seededEmployees[0]._id, // John Doe (Chef)
      basicSalary: 45000,
      otHours: 10,
      otRate: 200,
      total: 47000,
      date: new Date("2026-06-30T17:00:00Z")
    },
    {
      employee: seededEmployees[1]._id, // Sarah Connor (Cashier)
      basicSalary: 35000,
      otHours: 5,
      otRate: 150,
      total: 35750,
      date: new Date("2026-06-30T17:00:00Z")
    },
    {
      employee: seededEmployees[2]._id, // Michael Scott (Waiter)
      basicSalary: 25000,
      otHours: 12,
      otRate: 100,
      total: 26200,
      date: new Date("2026-06-30T17:00:00Z")
    },
    {
      employee: seededEmployees[3]._id, // Dwight Schrute (Waiter)
      basicSalary: 25000,
      otHours: 8,
      otRate: 100,
      total: 25800,
      date: new Date("2026-06-30T17:00:00Z")
    }
  ];
  await Salary.insertMany(salariesList);
  console.log("Salaries seeded successfully.");

  // 13. Create Attendance Records
  console.log("Seeding Attendance...");
  const attendanceDates = [
    "2026-07-01",
    "2026-07-02",
    "2026-07-03",
    "2026-07-04"
  ];
  const attendanceRecords = [];

  for (const employee of seededEmployees) {
    for (const dateStr of attendanceDates) {
      attendanceRecords.push({
        employeeId: employee._id,
        date: new Date(`${dateStr}T00:00:00Z`),
        punches: [
          { time: "08:30 AM", type: "In" },
          { time: "01:00 PM", type: "Break In" },
          { time: "01:45 PM", type: "Break Out" },
          { time: "05:30 PM", type: "Out" }
        ]
      });
    }
  }
  await Attendance.insertMany(attendanceRecords);
  console.log("Attendance seeded successfully.");

  // 14. Create Orders (Historical & Current)
  console.log("Seeding Orders...");
  const invoiceCounterDocs = [];

  // Define order profiles
  const orderProfiles = [
    // --- JUNE ---
    {
      date: "2026-06-01T12:30:00Z",
      customer: seededCustomers[0], // Alice
      type: "Dine-In",
      table: "Table 4",
      items: [
        { menu: seededMenus[0], qty: 2 }, // Beef Burger
        { menu: seededMenus[11], qty: 2 } // Orange juice
      ],
      payment: { cash: 3300, card: 0, bankTransfer: 0, paid: 3300, change: 0 },
      waiter: seededEmployees[2], // Michael
      status: "Completed"
    },
    {
      date: "2026-06-05T18:45:00Z",
      customer: seededCustomers[1], // Bob
      type: "Takeaway",
      table: "Takeaway",
      items: [
        { menu: seededMenus[2], qty: 1 }, // Pepperoni Pizza
        { menu: seededMenus[13], qty: 2 } // Coke
      ],
      payment: { cash: 0, card: 2900, bankTransfer: 0, paid: 2900, change: 0 },
      waiter: null,
      status: "Completed"
    },
    {
      date: "2026-06-10T19:15:00Z",
      customer: seededCustomers[2], // Charlie
      type: "Delivery",
      table: "Takeaway",
      items: [
        { menu: seededMenus[4], qty: 2 }, // Seafood Fried rice
        { menu: seededMenus[7], qty: 1 }  // Loaded fries
      ],
      payment: { cash: 4100, card: 0, bankTransfer: 0, paid: 4100, change: 0 },
      waiter: null,
      driver: seededDrivers[0], // Ravi
      place: "Colombo 1-15",
      delCharge: 250,
      status: "Completed"
    },
    {
      date: "2026-06-15T13:00:00Z",
      customer: seededCustomers[3], // Diana
      type: "Dine-In",
      table: "Table 2",
      items: [
        { menu: seededMenus[5], qty: 1 }, // Spaghetti Bolognese
        { menu: seededMenus[12], qty: 1 } // Iced caramel macchiato
      ],
      payment: { cash: 2600, card: 0, bankTransfer: 0, paid: 2600, change: 70 },
      waiter: seededEmployees[3], // Dwight
      status: "Completed"
    },
    {
      date: "2026-06-20T20:30:00Z",
      customer: seededCustomers[0], // Alice
      type: "Delivery",
      table: "Takeaway",
      items: [
        { menu: seededMenus[2], qty: 2 }, // Pepperoni Pizza
        { menu: seededMenus[8], qty: 2 }  // Spring rolls
      ],
      payment: { cash: 0, card: 6500, bankTransfer: 0, paid: 6500, change: 0 },
      waiter: null,
      driver: seededDrivers[1], // Nimal
      place: "Nugegoda",
      delCharge: 300,
      status: "Completed"
    },
    {
      date: "2026-06-25T12:00:00Z",
      customer: seededCustomers[1], // Bob
      type: "Dine-In",
      table: "Table 1",
      items: [
        { menu: seededMenus[6], qty: 2 }, // Alfredo Pasta
        { menu: seededMenus[14], qty: 2 } // Fudge brownie
      ],
      payment: { cash: 5000, card: 0, bankTransfer: 0, paid: 5000, change: 0 },
      waiter: seededEmployees[2],
      status: "Completed"
    },

    // --- JULY (Current Month) ---
    {
      date: "2026-07-01T13:30:00Z",
      customer: seededCustomers[2], // Charlie
      type: "Dine-In",
      table: "Table 5",
      items: [
        { menu: seededMenus[0], qty: 3 }, // Beef Burger
        { menu: seededMenus[7], qty: 2 }, // Loaded fries
        { menu: seededMenus[13], qty: 3 } // Coke
      ],
      payment: { cash: 6000, card: 0, bankTransfer: 0, paid: 6000, change: 150 },
      waiter: seededEmployees[3],
      status: "Completed"
    },
    {
      date: "2026-07-02T19:00:00Z",
      customer: seededCustomers[3], // Diana
      type: "Delivery",
      table: "Takeaway",
      items: [
        { menu: seededMenus[3], qty: 2 }, // Margherita Pizza
        { menu: seededMenus[10], qty: 1 } // Caesar salad
      ],
      payment: { cash: 5000, card: 0, bankTransfer: 0, paid: 5000, change: 0 },
      waiter: null,
      driver: seededDrivers[0],
      place: "Dehiwala-Mount Lavinia",
      delCharge: 350,
      status: "Completed"
    },
    {
      date: "2026-07-03T18:00:00Z",
      customer: seededCustomers[0], // Alice
      type: "Takeaway",
      table: "Takeaway",
      items: [
        { menu: seededMenus[1], qty: 2 }, // Crispy chicken burger
        { menu: seededMenus[14], qty: 1 } // Fudge brownie
      ],
      payment: { cash: 0, card: 2950, bankTransfer: 0, paid: 2950, change: 0 },
      waiter: null,
      status: "Completed"
    },
    {
      date: "2026-07-04T11:15:00Z",
      customer: seededCustomers[1], // Bob
      type: "Dine-In",
      table: "Table 3",
      items: [
        { menu: seededMenus[5], qty: 2 }, // Spaghetti Bolognese
        { menu: seededMenus[15], qty: 2 } // Cheesecake
      ],
      payment: { cash: 5000, card: 0, bankTransfer: 0, paid: 5000, change: 0 },
      waiter: seededEmployees[2],
      status: "Completed"
    },
    {
      date: "2026-07-04T12:00:00Z", // Very recent
      customer: seededCustomers[2], // Charlie
      type: "Dine-In",
      table: "Table 8",
      items: [
        { menu: seededMenus[0], qty: 1 }, // Beef Burger
        { menu: seededMenus[11], qty: 1 } // Orange juice
      ],
      payment: { cash: 0, card: 0, bankTransfer: 0, paid: 0, change: 0 },
      waiter: seededEmployees[3],
      status: "Pending" // Still pending to show in cashier dashboard
    },
    {
      date: "2026-07-04T12:10:00Z", // Very recent
      customer: seededCustomers[3], // Diana
      type: "Delivery",
      table: "Takeaway",
      items: [
        { menu: seededMenus[2], qty: 1 } // Pepperoni pizza
      ],
      payment: { cash: 0, card: 0, bankTransfer: 0, paid: 0, change: 0 },
      waiter: null,
      driver: seededDrivers[1],
      place: "Rajagiriya",
      delCharge: 400,
      status: "Pending" // Still pending
    }
  ];

  // Helper to get sequence number for invoiceNo
  const dateSeqMap = {};

  for (const profile of orderProfiles) {
    const d = new Date(profile.date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dateKey = `${yyyy}${mm}${dd}`;

    if (!dateSeqMap[dateKey]) {
      dateSeqMap[dateKey] = 0;
    }
    dateSeqMap[dateKey] += 1;
    const seq = dateSeqMap[dateKey];
    const invoiceNo = `INV-${dateKey}-${String(seq).padStart(2, "0")}`;

    // Calculate subtotal
    let subtotal = 0;
    const items = profile.items.map(item => {
      const itemPrice = item.menu.price;
      const itemCost = item.menu.cost;
      const itemNetProfit = itemPrice - itemCost;
      const totalItemPrice = itemPrice * item.qty;
      subtotal += totalItemPrice;

      return {
        menuId: item.menu._id,
        name: item.menu.name,
        price: itemPrice,
        netProfit: itemNetProfit,
        quantity: item.qty,
        imageUrl: item.menu.imageUrl
      };
    });

    // Calculate service charge (10% of subtotal if Dine-in)
    const serviceCharge = profile.type === "Dine-In" ? Math.round(subtotal * 0.1) : 0;
    // Delivery charge
    const deliveryCharge = profile.type === "Delivery" ? (profile.delCharge || 0) : 0;
    // Total price
    const totalPrice = subtotal + serviceCharge + deliveryCharge;

    // Adjust payment totalPaid and changeDue
    const payment = {
      cash: profile.payment.cash,
      card: profile.payment.card,
      bankTransfer: profile.payment.bankTransfer,
      totalPaid: profile.payment.paid === 0 ? 0 : totalPrice, // Match exact total if paid
      changeDue: profile.payment.change,
      notes: ""
    };

    const newOrder = new Order({
      invoiceNo,
      customerName: profile.customer.name,
      customerPhone: profile.customer.phone,
      tableNo: profile.table,
      items,
      subtotal,
      serviceCharge,
      deliveryType: profile.type === "Delivery" ? "Delivery Service" : "Customer Pickup",
      deliveryPlaceName: profile.type === "Delivery" ? (profile.place || null) : null,
      deliveryCharge,
      deliveryNote: profile.type === "Delivery" ? "Deliver quickly" : "",
      deliveryStatus: profile.type === "Delivery" ? (profile.status === "Completed" ? "Order Delivered" : "Driver Pending") : (profile.status === "Completed" ? "Customer Picked Up" : "Customer Pending"),
      driverId: profile.driver ? profile.driver._id : null,
      totalPrice,
      payment,
      cashierId: cashierUser._id,
      waiterId: profile.waiter ? profile.waiter._id : null,
      waiterName: profile.waiter ? profile.waiter.name : null,
      status: profile.status,
      createdAt: d,
      statusUpdatedAt: d
    });

    await newOrder.save();
  }

  // Populate InvoiceCounter collections based on our date sequences
  for (const [dateStr, seq] of Object.entries(dateSeqMap)) {
    await new InvoiceCounter({
      date: dateStr,
      seq: seq
    }).save();
  }

  console.log("Orders and Invoice Counters seeded successfully.");

  console.log("All data seeded successfully! System is ready.");
  process.exit(0);
};

seed();
