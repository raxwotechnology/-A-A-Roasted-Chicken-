import axios from "axios";

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Marketing",
  "Admin Supplies",
  "Repairs & Maintenance",
  "Software/Subscription",
  "Training",
  "Food & Beverage",
  "Utilities",
  "Petty Cash",
  "Cleaning Supplies",
  "Transport / Fuel",
  "Kitchen Supplies",
  "Gas & Electricity",
  "Staff Meals",
  "Rent",
  "Other"
];

export const DEFAULT_EXPENSE_REASONS = [
  "Office Supplies",
  "Gas Cylinder Refill",
  "Vegetables & Grocery Purchase",
  "Electricity Bill Payment",
  "Water Bill Payment",
  "Internet / Wi-Fi Bill",
  "Staff Meal",
  "Packaging Materials / Bags",
  "Cleaning Equipment",
  "Kitchen Utensils",
  "Customer Refund",
  "Delivery Fuel / Petrol",
  "Equipment Repair",
  "Ice Bags",
  "Drinking Water Refill"
];

const STORAGE_KEY_CATEGORIES = "custom_expense_categories";
const STORAGE_KEY_REASONS = "custom_expense_reasons";

export const getStoredCategories = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.from(new Set([...DEFAULT_EXPENSE_CATEGORIES, ...parsed]));
  } catch (e) {
    return DEFAULT_EXPENSE_CATEGORIES;
  }
};

export const getStoredReasons = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REASONS);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.from(new Set([...DEFAULT_EXPENSE_REASONS, ...parsed]));
  } catch (e) {
    return DEFAULT_EXPENSE_REASONS;
  }
};

export const saveCustomSuggestion = (category, reason) => {
  try {
    if (category && typeof category === "string" && category.trim()) {
      const trimmedCat = category.trim();
      const existingCats = getStoredCategories();
      if (!existingCats.includes(trimmedCat)) {
        const updated = [...existingCats, trimmedCat];
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated));
      }
    }

    if (reason && typeof reason === "string" && reason.trim()) {
      const trimmedReason = reason.trim();
      const existingReasons = getStoredReasons();
      if (!existingReasons.includes(trimmedReason)) {
        const updated = [...existingReasons, trimmedReason];
        localStorage.setItem(STORAGE_KEY_REASONS, JSON.stringify(updated));
      }
    }
  } catch (e) {
    console.error("Failed to save custom expense suggestion:", e);
  }
};

export const fetchExpenseSuggestions = async (apiBaseUrl, token) => {
  let serverCategories = [];
  let serverReasons = [];

  try {
    const res = await axios.get(`${apiBaseUrl}/api/auth/expense/other/suggestions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data) {
      serverCategories = res.data.categories || [];
      serverReasons = res.data.reasons || [];
    }
  } catch (e) {
    // If endpoint fails, fallback to local
  }

  const mergedCategories = Array.from(
    new Set([...getStoredCategories(), ...serverCategories.filter(Boolean)])
  );
  const mergedReasons = Array.from(
    new Set([...getStoredReasons(), ...serverReasons.filter(Boolean)])
  );

  return {
    categories: mergedCategories,
    reasons: mergedReasons
  };
};
