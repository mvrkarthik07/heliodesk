# HelioDesk

**HelioDesk** is a modular, web-based personal productivity dashboard designed to centralise essential tools, data, and workflows into a single, fast, and extensible interface.  
The objective is to reduce context switching and surface high-value information efficiently.

---

## Overview

Modern productivity workflows are fragmented across multiple platforms such as email, calendars, repositories, and task managers. HelioDesk consolidates these into a unified workspace with a clean UI and a scalable, developer-friendly architecture.

The project is built with a strong emphasis on modularity, maintainability, and future extensibility.

---

## Key Features

- **Unified Dashboard**
  - Centralised view for productivity-critical information
  - Designed to scale with additional widgets and integrations

- **Modular Widget System**
  - Widgets are independently developed and maintained
  - New features can be added without modifying core logic

- **Authentication & User Management**
  - Secure authentication powered by Supabase
  - Session-based access control

- **Cloud-Backed Data Layer**
  - Persistent user settings and preferences
  - Clear separation between frontend and backend concerns

- **Modern, Responsive UI**
  - Desktop-first productivity design
  - Responsive layouts across screen sizes

---

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS

### Backend / Infrastructure
- Supabase (Authentication & Database)
- PostgreSQL

### Tooling
- Git & GitHub
- ESLint
- Netlify / Vercel

---

## Architecture (High-Level)

HelioDesk
├── UI Layer (React Components)
│ ├── Dashboard Layout
│ ├── Widgets
│ └── Shared UI Components
│
├── State & Logic
│ ├── Authentication State
│ ├── Widget Configuration
│ └── User Preferences
│
├── Backend Services
│ ├── Supabase Auth
│ └── PostgreSQL Database


This structure ensures:
- Predictable data flow  
- Low coupling between features  
- Long-term maintainability  

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase project

---

### Installation

```bash
git clone https://github.com/<your-username>/heliodesk.git
cd heliodesk
npm install
```

## Current Status

- Core dashboard layout implemented
- Authentication integrated
- Initial widget framework in place

HelioDesk is **actively under development**, with stability and architecture as the current focus.

---

## Roadmap

Planned enhancements:

- Calendar integration
- Email and notification widgets
- Productivity analytics and insights
- User-configurable layouts
- Performance optimisations

---

## Design Philosophy

HelioDesk is not designed to be a superficial dashboard. It prioritises:

- Engineering discipline
- Clean system design
- Scalable frontend architecture
- Practical, real-world usability

---

## License

MIT License

