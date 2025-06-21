# 🚑 Optimized Emergency Response System for Ambulance

[![Live Preview](https://img.shields.io/badge/Live%20Preview-Online-blue?style=for-the-badge&logo=google-chrome)](https://response-system.onrender.com)

This is a Flask-based web application for ambulance path optimization using Dijkstra and A\* algorithms, along with live hospital metadata and user contact management. The system visualizes graphs, allows user interaction with nodes (like hospitals), and tracks usage via a dashboard.

---

## 🧠 Features

- 🚗 **Shortest Path Finder (Dijkstra)** — Find the shortest route between two hospitals or locations.
- 🌐 **A\* Pathfinding** — Grid-based navigation with obstacle avoidance for urban routing.
- 🗺️ **Live Map (Leaflet)** — Visual interface for live mapping and interaction.
- 📊 **Admin Dashboard** — View node clicks, actions, distances, metadata, and user messages.
- 📥 **Contact Form** — Stores visitor messages into a database.
- 🔐 **Admin Login/Logout** — Security for sensitive data views.

---

---

## 🛠️ Requirements

- Python 3.7+
- Flask
- SQLite3

Install dependencies:

```bash
pip install flask
```
