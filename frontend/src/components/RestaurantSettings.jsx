import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../api.js";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { updateFavicon, notifySettingsUpdated } from "../utils/updateFavicon";

const RestaurantSettings = () => {
  const [name, setName] = useState("A&A Roasted Chicken");
  const [address, setAddress] = useState("337C, Galle Road, Mt. Lavinia");
  const [phone, setPhone] = useState("0769 886 887");
  const [email, setEmail] = useState("aandafoods2026@gmail.com");
  const [logo, setLogo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/auth/settings/restaurant`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setName(res.data.name || "A&A Roasted Chicken");
        setAddress(res.data.address || "337C, Galle Road, Mt. Lavinia");
        setPhone(res.data.phone || "0769 886 887");
        setEmail(res.data.email || "aandafoods2026@gmail.com");
        const currentLogo = res.data.logo || "";
        setLogo(currentLogo);
        if (currentLogo) updateFavicon(currentLogo);
      } catch (err) {
        console.error("Failed to load restaurant settings:", err.message);
        toast.error("Failed to load restaurant settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo file size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE_URL}/api/auth/settings/restaurant`,
        { name, address, phone, email, logo },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (logo) updateFavicon(logo);
      notifySettingsUpdated();
      toast.success("Restaurant settings updated successfully!");
    } catch (err) {
      console.error("Update failed:", err.response?.data || err.message);
      toast.error("Failed to update restaurant settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: "600px" }}>
      <h2 className="mb-4 fw-bold text-success border-bottom pb-2">🏢 Restaurant Configuration</h2>

      <div className="card shadow-sm p-4">
        <form onSubmit={handleSave}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Restaurant Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. A&A Roasted Chicken"
              className="form-control"
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              rows="2"
              placeholder="e.g. 337C, Galle Road, Mt. Lavinia"
              className="form-control"
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="e.g. 0769 886 887"
              className="form-control"
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. aandafoods2026@gmail.com"
              className="form-control"
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Restaurant Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="form-control mb-3"
            />

            {/* Logo Preview */}
            <div className="text-center mt-3">
              <span className="d-block text-muted mb-2 fw-semibold">Receipt Logo Preview</span>
              <div
                style={{
                  maxWidth: "240px",
                  maxHeight: "120px",
                  borderRadius: "12px",
                  border: "2px dashed #ccc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  padding: "8px",
                  overflow: "hidden",
                  backgroundColor: "#f8f9fa",
                }}
              >
                {logo ? (
                  <img
                    src={logo}
                    alt="Logo Preview"
                    style={{ maxWidth: "100%", maxHeight: "100px", width: "auto", height: "auto", objectFit: "contain" }}
                  />
                ) : (
                  <span className="text-muted" style={{ fontSize: "12px" }}>No Logo Selected</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-success w-100 fw-bold py-2"
            disabled={saving}
          >
            {saving ? "Saving Changes..." : "💾 Save Settings"}
          </button>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
};

export default RestaurantSettings;
