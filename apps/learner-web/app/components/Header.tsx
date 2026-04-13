"use client";

import Image from "next/image";
import { useState } from "react";

type MenuKey =
  | "features"
  | "usecases"
  | "customers"
  | "resources"
  | "neurolabs"
  | "neurolxp";

export default function Header() {
  const [activeMenu, setActiveMenu] = useState<MenuKey | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMenu = (menu: MenuKey) => {
    if (activeMenu === menu) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menu);
    }
  };

  return (
    <header className="header">
      <div className="logo">
        <Image
          src="/PRGEEQ-Logo.png"
          alt="PRGeeQ Logo"
          width={160}
          height={40}
          priority
        />
      </div>

      <div
        className="menu-icon"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        ☰
      </div>

      <nav className={`nav ${mobileOpen ? "mobile-open" : ""}`}>
        <div
          className="nav-item dropdown-parent"
          onClick={() => toggleMenu("features")}
          onMouseEnter={() => setActiveMenu("features")}
        >
          Features
          <span className={`arrow ${activeMenu === "features" ? "rotate" : ""}`}>
            ▾
          </span>

          <div className={`dropdown ${activeMenu === "features" ? "show" : ""}`}>
            <div className="dropdown-item submenu-parent">
              Learning ▶
              <div className="submenu">
                <div className="submenu-item">Learning Style Analysis</div>
                <div className="submenu-item">Goal Setting &amp; Planning</div>
                <div className="submenu-item">Learning Paths</div>
                <div className="submenu-item">Personalization</div>
                <div className="submenu-item">Progress Tracking</div>
              </div>
            </div>

            <div className="dropdown-item submenu-parent">
              Augmentation ▶
              <div className="submenu">
                <div className="submenu-item">Gamification</div>
                <div className="submenu-item">Interactivities</div>
                <div className="submenu-item">Social Learning</div>
                <div className="submenu-item">Content Curation</div>
                <div className="submenu-item">Content Formats</div>
              </div>
            </div>

            <div className="dropdown-item submenu-parent">
              Learning Eco-System ▶
              <div className="submenu">
                <div className="submenu-item">Assessments</div>
                <div className="submenu-item">Analytics &amp; Reporting</div>
                <div className="submenu-item">Career Paths</div>
                <div className="submenu-item">Career &amp; Skills Development</div>
                <div className="submenu-item">Compliances</div>
              </div>
            </div>

            <div className="dropdown-item submenu-parent">
              Add-On Modules ▶
              <div className="submenu">
                <div className="submenu-item">Content Creation &amp; Management</div>
                <div className="submenu-item">User Support &amp; Community</div>
                <div className="submenu-item">Security &amp; Compliances</div>
                <div className="submenu-item">Accessibility &amp; Inclusivity</div>
                <div className="submenu-item">Mobile Learning</div>
                <div className="submenu-item">Interconnectivity</div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="nav-item dropdown-parent"
          onClick={() => toggleMenu("usecases")}
          onMouseEnter={() => setActiveMenu("usecases")}
        >
          Use Cases
          <span className={`arrow ${activeMenu === "usecases" ? "rotate" : ""}`}>
            ▾
          </span>

          <div className={`dropdown ${activeMenu === "usecases" ? "show" : ""}`}>
            <div className="dropdown-item submenu-parent">
              By Challenge ▶
              <div className="submenu">
                <div className="submenu-item">Blended Learning</div>
                <div className="submenu-item">Customer Training</div>
                <div className="submenu-item">Employee Induction</div>
                <div className="submenu-item">Standards Training</div>
                <div className="submenu-item">Extended Enterprise</div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="nav-item dropdown-parent"
          onClick={() => toggleMenu("customers")}
          onMouseEnter={() => setActiveMenu("customers")}
        >
          Our Customers
          <span className={`arrow ${activeMenu === "customers" ? "rotate" : ""}`}>
            ▾
          </span>

          <div className={`dropdown ${activeMenu === "customers" ? "show" : ""}`}>
            <div className="dropdown-item submenu-parent">
              Industries we Serve ▶
              <div className="submenu">
                <div className="submenu-item">Higher Education</div>
                <div className="submenu-item">BFSI</div>
                <div className="submenu-item">Retail &amp; Healthcare</div>
                <div className="submenu-item">States</div>
                <div className="submenu-item">NonProfit</div>
              </div>
            </div>

            <div className="dropdown-item submenu-parent">
              Solutions for ▶
              <div className="submenu">
                <div className="submenu-item">Corporate Training</div>
                <div className="submenu-item">E-Learning</div>
                <div className="submenu-item">Education</div>
                <div className="submenu-item">Government</div>
                <div className="submenu-item">Training Management</div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="nav-item dropdown-parent"
          onClick={() => toggleMenu("resources")}
          onMouseEnter={() => setActiveMenu("resources")}
        >
          Resources
          <span className={`arrow ${activeMenu === "resources" ? "rotate" : ""}`}>
            ▾
          </span>

          <div className={`dropdown ${activeMenu === "resources" ? "show" : ""}`}>
            <div className="submenu-item">Events</div>
            <div className="submenu-item">Media Presence</div>
            <div className="submenu-item">White Papers</div>
            <div className="submenu-item">Blogs</div>
            <div className="submenu-item">Help, Support &amp; FAQs</div>
          </div>
        </div>

        <div className="nav-item">genZgalaxy</div>

        <div
          className="nav-item dropdown-parent"
          onClick={() => toggleMenu("neurolabs")}
          onMouseEnter={() => setActiveMenu("neurolabs")}
        >
          NeuroLabs
          <span className={`arrow ${activeMenu === "neurolabs" ? "rotate" : ""}`}>
            ▾
          </span>

          <div className={`dropdown ${activeMenu === "neurolabs" ? "show" : ""}`}>
            <div className="submenu-item">Coding Labs</div>
            <div className="submenu-item">Coding Bootcamps</div>
            <div className="submenu-item">Coding Challenges</div>
            <div className="submenu-item">Coding Resources</div>
          </div>
        </div>

        <div
          className="nav-item dropdown-parent"
          onClick={() => toggleMenu("neurolxp")}
          onMouseEnter={() => setActiveMenu("neurolxp")}
        >
          NeuroLXP 2.10
          <span className={`arrow ${activeMenu === "neurolxp" ? "rotate" : ""}`}>
            ▾
          </span>

          <div className={`dropdown ${activeMenu === "neurolxp" ? "show" : ""}`}>
            <div className="submenu-item">Digital Literacy</div>
            <div className="submenu-item">Information Literacy</div>
            <div className="submenu-item">Media Literacy</div>
            <div className="submenu-item">Financial Literacy</div>
          </div>
        </div>

        <button className="signin">Sign In</button>
      </nav>
    </header>
  );
}