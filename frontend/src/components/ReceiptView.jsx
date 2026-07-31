import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../api.js";

const ReceiptView = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [restaurantDetails, setRestaurantDetails] = useState({
    name: "A&A Roasted Chicken",
    address: "337C, Galle Road, Mt. Lavinia",
    phone: "0769 886 887",
    email: "aandafoods2026@gmail.com",
    logo: ""
  });

  const orderId = window.location.pathname.split("/").pop();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch Order
        const orderRes = await axios.get(`${API_BASE_URL}/api/auth/order/${orderId}`, { headers });
        setOrder(orderRes.data);

        // Fetch Restaurant Details
        try {
          const restRes = await axios.get(`${API_BASE_URL}/api/auth/settings/restaurant`, { headers });
          if (restRes.data) {
            setRestaurantDetails({
              name: restRes.data.name || "A&A Roasted Chicken",
              address: restRes.data.address || "337C, Galle Road, Mt. Lavinia",
              phone: restRes.data.phone || "0769 886 887",
              email: restRes.data.email || "aandafoods2026@gmail.com",
              logo: restRes.data.logo || ""
            });
          }
        } catch (e) {
          console.error("Failed to load restaurant details in ReceiptView:", e);
        }

        window.print();
      } catch (err) {
        console.error("Failed to load order:", err.response?.data || err.message);
        setError(err.response?.data?.error || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!order) return null;

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "20px", fontFamily: "Calibri, sans-serif" }}>
      {restaurantDetails.logo && (
        <div style={{ textAlign: "center", marginBottom: "15px" }}>
          <img
            src={restaurantDetails.logo}
            alt="Logo"
            style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }}
          />
        </div>
      )}
      <h3 className="text-center" style={{ margin: "5px 0" }}><strong>{restaurantDetails.name}</strong></h3>
      <p className="text-center" style={{ margin: "2px 0", fontSize: "13px" }}>{restaurantDetails.address}</p>
      <p className="text-center" style={{ margin: "2px 0 10px 0", fontSize: "14px" }}><strong>{restaurantDetails.phone}</strong></p>
      <hr />
      
      <p><strong>Date:</strong> {new Date(order.date).toLocaleString()}</p>
      <p><strong>Customer:</strong> {order.customerName}</p>
      <p><strong>Phone:</strong> {order.customerPhone}</p>
      <p><strong>Table No:</strong> {order.tableNo || "Takeaway"}</p>

      <hr />

      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {order.items.map((item, idx) => (
          <li key={idx}>
            {item.name} x{item.quantity} @ ${item.price?.toFixed(2)}
          </li>
        ))}
      </ul>

      <hr />
      <h5 className="text-end">Total: ${order.totalPrice?.toFixed(2)}</h5>
      <p className="text-center mt-4">Thank you for your visit!</p>
    </div>
  );
};

export default ReceiptView;