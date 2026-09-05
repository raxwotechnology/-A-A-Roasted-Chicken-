// backend/controllers/printerController.js
const Printer = require("../models/Printer");
const { sendToWifiPrinter } = require("../utils/kitchenPrinterService");

// Get all printers
exports.getPrinters = async (req, res) => {
  try {
    const printers = await Printer.find().sort({ createdAt: -1 });
    res.json(printers);
  } catch (err) {
    res.status(500).json({ error: "Failed to load printers" });
  }
};

// Add or update a printer
exports.upsertPrinter = async (req, res) => {
  const { id, name, ipAddress, port, type, role } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: "Printer name is required" });
  }

  try {
    const count = await Printer.countDocuments();
    if (!id && count >= 5) {
      return res.status(400).json({ error: "Maximum of 5 printers allowed" });
    }

    const printerData = {
      name: name.trim(),
      ipAddress: ipAddress ? ipAddress.trim() : "",
      port: port ? parseInt(port, 10) : 9100,
      type: type || "wifi_network",
      role: role || "kitchen"
    };

    let printer;
    if (id) {
      printer = await Printer.findByIdAndUpdate(id, printerData, { new: true, runValidators: true });
    } else {
      printer = new Printer(printerData);
      await printer.save();
    }

    res.json(printer);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Printer name already exists" });
    }
    res.status(500).json({ error: "Failed to save printer" });
  }
};

// Delete a printer
exports.deletePrinter = async (req, res) => {
  const { id } = req.params;

  try {
    await Printer.findByIdAndDelete(id);
    res.json({ message: "Printer deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete printer" });
  }
};

// Test print to Wi-Fi Printer
exports.testPrinter = async (req, res) => {
  const { id } = req.params;

  try {
    const printer = await Printer.findById(id);
    if (!printer) {
      return res.status(404).json({ error: "Printer not found" });
    }

    const testOrder = {
      orderId: "TEST-001",
      orderType: "Test Print",
      createdAt: new Date(),
      items: [
        { name: "Sample Chicken Roast", quantity: 1, specialNotes: "Extra Spicy" },
        { name: "Sample Fried Rice", quantity: 2 }
      ]
    };

    const success = await sendToWifiPrinter(printer, testOrder);
    if (success) {
      res.json({ message: `Successfully printed test ticket to ${printer.name} (${printer.ipAddress})` });
    } else {
      res.status(400).json({ error: `Could not connect to Wi-Fi Printer at ${printer.ipAddress}:${printer.port}` });
    }
  } catch (err) {
    res.status(500).json({ error: "Test print failed: " + err.message });
  }
};