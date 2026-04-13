import "./Footer.css";
import {
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaLinkedinIn,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        {/* Column 1: Brand Info */}
        <div className="footer-column">
          <h3 className="column-title">NeuroLXP LMS</h3>
          <p className="column-text">
            NeuroLXP LMS provides a holistic and future-ready learning
            environment, catering to diverse educational needs and fostering
            growth in the digital age.
          </p>

          <button className="start-btn">Why Wait. Let&apos;s Start</button>

          <div className="social-icons">
            <div className="icon-box">
              <FaInstagram />
            </div>
            <div className="icon-box">
              <FaFacebookF />
            </div>
            <div className="icon-box">
              <FaYoutube />
            </div>
            <div className="icon-box">
              <FaLinkedinIn />
            </div>
          </div>
        </div>

        {/* Column 2: Company Links */}
        <div className="footer-column">
          <h3 className="column-title">NeuroLXP</h3>
          <ul className="footer-links">
            <li>Our NeuroLXP Team</li>
            <li>About NeuroLXP LMS</li>
            <li>AI-Powered Content Curation</li>
            <li>Our Adaptive Learning Pathways</li>
            <li>Inclusivity and Accessibility</li>
          </ul>
        </div>

        {/* Column 3: Quick Links */}
        <div className="footer-column">
          <h3 className="column-title">Quick Links</h3>
          <ul className="footer-links">
            <li>Privacy Policy</li>
            <li>Terms of Use</li>
            <li>Support</li>
            <li>Contact</li>
          </ul>
        </div>

        {/* Column 4: Map */}
        <div className="footer-column map-column">
          <div className="map-wrapper">
            <iframe
              title="location-map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3889.023456789!2d77.6321!3d12.8901!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTLCsDUzJzI0LjQiTiA3N8KwMzcnNTUuNiJF!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin"
              width="100%"
              height="200"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>

      <div className="copyright-bar">
        Copyright © 2026 | Prgeeq Global Solutions Pvt. Ltd. | All rights
        reserved.
      </div>
    </footer>
  );
}