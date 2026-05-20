# ⚡ SPARK FITNESS

Welcome to the official repository for **SPARK FITNESS** — Kalyanpur's premier fitness center. This repository contains the complete codebase for a modern, responsive, and high-performance Single Page Application (SPA) landing page designed to wow users and capture leads.

Live Repository: [https://github.com/nandkumarcoder/spark-fitness](https://github.com/nandkumarcoder/spark-fitness)

---

## ✨ Features

### 1. Dynamic Media Gallery (IndexedDB Storage)
* **Photos & Videos Support**: Drag-and-drop or browse files (up to 15MB).
* **Local Persistence**: Saves all uploads client-side via the browser's **IndexedDB engine**, bypassing the standard 5MB `localStorage` limit.
* **Smart Compression**: Automatically resizes and scales uploaded photos using an HTML5 Canvas helper to keep storage footprint optimized.
* **Hover-to-Play**: Hovering over a video card initiates a silent loop preview.
* **Lightbox Preview**: Click on any image or video to view it in full screen with built-in controls and keyboard support (`Left/Right Arrow`, `Escape`).

### 2. Daily Motivation Quote Engine
* Generates a daily motivational quote dynamically matched to the calendar date.
* Features an **"Inspire Me"** button with a smooth fade micro-animation to shuffle random quotes.

### 3. Integrated WhatsApp Inquiries
* Direct conversion channel connecting prospects to the official gym number: `+91 89604 79446`.
* Customized inquiry form template that automatically formats inputs into a neat markdown template before opening in WhatsApp.

### 4. Interactive Maps & Info
* Fully integrated interactive dark-themed Google Maps location at **JVS Tower, Awas Vikas Ambedkar Puram, Kalyanpur, Kanpur**.
* Embedded operational schedule (Gym Hours) and navigation sections.

---

## 🛠️ Technology Stack

* **Core Structure**: HTML5 (Semantic elements)
* **Design & Styling**: Custom CSS3 variables, responsive grid systems, and glassmorphism.
* **Logic & Engine**: Vanilla JavaScript (ES6)
* **Database & Storage**: Client-side IndexedDB API

---

## 🚀 How to Run Locally

Since this is a client-side static application, you don't need any complex server setup:

1. Clone this repository:
   ```bash
   git clone https://github.com/nandkumarcoder/spark-fitness.git
   ```
2. Navigate into the directory:
   ```bash
   cd spark-fitness
   ```
3. Open `index.html` directly in any modern web browser.

---

## 🌐 Deploy to GitHub Pages

To host this website online for free using GitHub Pages:
1. Go to your repository settings on GitHub.
2. Navigate to **Pages** in the sidebar.
3. Under *Build and deployment*, set the source branch to **main** and path to `/ (root)`.
4. Click **Save** and wait 1 minute for the deployment to finish!

---

*Designed for Kanpur's Champions. Spark Change. Train Hard.*
