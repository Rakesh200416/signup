"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import InputField from "../components/InputField";
import PasswordStrength from "../components/PasswordStrength";
import Alert from "../components/Alert";
import Modal from "../components/Modal";
import styles from "../styles.module.css";

// ✅ FIX: Proper alert typing
type AlertType = "error" | "success" | "warning";

type AlertState = {
  type: AlertType;
  message: string;
};

type FormType = {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirm: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormType>({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirm: "",
    acceptTerms: false,
    acceptPrivacy: false,
  });

  // ✅ FIXED HERE
  const [alert, setAlert] = useState<AlertState>({
    type: "error",
    message: "",
  });

  const [loading, setLoading] = useState(false);
const [showDeclaration, setShowDeclaration] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // ================= VALIDATION =================
  const validate = () => {
    if (!form.name) return "Name cannot be empty.";
    if (!form.email) return "Email cannot be empty.";
    if (!form.email.includes("@"))
      return "This email does not look valid.";

    if (!form.phone.trim()) return "Phone number cannot be empty.";

    const allowedDomains = [".com", ".org", ".edu", ".ac.in", ".edu.in"];
    

    if (!allowedDomains.some((d) => form.email.toLowerCase().endsWith(d))) {
      return "Please use a valid email.";
    }

    if (!form.password) return "Password cannot be empty.";
    if (form.password.length < 8)
      return "Use at least 8 characters.";

    if (!/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password))
      return "Add letters, numbers and symbols.";

    if (form.password !== form.confirm)
      return "Passwords do not match.";

    if (!form.acceptTerms)
      return "You must accept Terms & Conditions.";

    if (!form.acceptPrivacy)
      return "You must accept Privacy Policy.";

    return "";
  };

  const handleSignup = async () => {
    const error = validate();

    if (error) {
      setAlert({ type: "error", message: error });
      return;
    }

    try {
      setLoading(true);

      const fullName = form.name.trim();
      const [firstName, ...restName] = fullName.split(/\s+/);
      const lastName = restName.join(" ");

      if (!firstName || !lastName) {
        setAlert({
          type: "error",
          message: "Enter both first and last name.",
        });
        return;
      }

      const res = await fetch(`${API_BASE_URL}/auth/coordinator/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          officialEmail: form.email.trim(),
          officialPhone: form.phone.trim(),
          password: form.password,
          confirmPassword: form.confirm,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setAlert({
          type: "error",
          message:
            typeof data.message === "string"
              ? data.message
              : "Signup failed.",
        });
        return;
      }

      setAlert({
        type: "success",
        message: "Signup complete. Verify your email to continue.",
      });

      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(form.email.trim())}`);
      }, 1000);

    } catch {
      setAlert({
        type: "error",
        message: "Network issue.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ================= CONTENT =================

 const privacyContent = `PRIVACY POLICY ACCEPTANCE
By accessing or using the Platform, I hereby provide my explicit, informed, and unconditional consent to PRGEEQ GLOBAL SOLUTIONS PRIVATE LIMITED for the following:
1. ACKNOWLEDGMENT
I confirm that I have read and understood the Privacy Policy and agree to its terms.
2. DATA COLLECTION AND USAGE CONSENT
I consent to the collection and processing of my personal data, including but not limited to:
Identification details
Contact information
Usage data and activity logs
Device and technical data
3. PURPOSE OF DATA PROCESSING
My data may be used for:
Account management and authentication
Service delivery and personalization
Communication and notifications
Legal and regulatory compliance
Security monitoring and fraud prevention
4. DATA SECURITY DISCLAIMER
The Company implements reasonable technical and organizational safeguards
However, I acknowledge that no digital system is completely secure
The Company shall not be liable for data breaches resulting from sophisticated cyber-attacks beyond reasonable control
5. PAYMENT AND FRAUD PREVENTION DISCLAIMER
I understand that payment-related communications must be verified through official Company channels
The Company does not accept responsibility for losses due to fraudulent payment requests or impersonation
6. USER RIGHTS
Subject to applicable laws, I understand I may:
Access my data
Request correction or deletion
Withdraw consent where permissible
7. THIRD-PARTY SERVICES
I acknowledge that certain services may involve third-party providers, and the Company is not responsible for their independent practices.
8. CONSENT VALIDITY
This consent:
Is legally binding
Remains valid until withdrawn (subject to legal obligations)
Applies to all Platform interactions
MANDATORY CONSENT ACTIONS (IMPLEMENTATION):
I agree to the Privacy Policy
I consent to data processing as described
OPTIONAL CONSENTS:
I agree to receive marketing communications
I accept use of cookies and tracking technologies

COMPANY DETAILS
PRGEEQ GLOBAL SOLUTIONS PRIVATE LIMITED
Email: contact@prgeeq.com`;

const termsDeclContent = `TERMS ACCEPTANCE DECLARATION
By proceeding to access or use the Platform, I hereby declare and confirm that:
I have carefully read, fully understood, and voluntarily agree to be bound by the Terms and Conditions of PRGEEQ GLOBAL SOLUTIONS PRIVATE LIMITED.
I acknowledge that this acceptance constitutes a legally binding agreement enforceable under applicable laws.
I agree to comply with all obligations, restrictions, and responsibilities outlined in the Terms.
I understand that:
Any violation may result in suspension or termination
Legal action may be initiated where necessary
Payment Awareness and Risk Acknowledgment:
I understand that the Company does not request payments through unauthorized channels
I agree to verify all payment instructions through official Company communication before making any payment
I accept full responsibility for any payments made without such verification
Cyber Risk Acknowledgment:
I acknowledge risks associated with online platforms including hacking, phishing, and fraud
I agree that the Company shall not be liable for losses arising from unauthorized transactions due to such events
I consent to electronic record-keeping of this acceptance, including timestamp, IP address, and system logs, as valid legal evidence.

MANDATORY USER ACTION (IMPLEMENTATION REQUIREMENT):
I have read and agree to the Terms and Conditions
Acceptance shall not be valid unless explicitly confirmed via the above mechanism.`;

 const termsContent = `TERMS AND CONDITIONS 
PRGEEQ GLOBAL SOLUTIONS PRIVATE LIMITED

1. DEFINITIONS
“Company” refers to PRGEEQ GLOBAL SOLUTIONS PRIVATE LIMITED.
“Platform” refers to the Learning Management System (LMS), Learning Experience Platform (LXP) and all associated services.
“User” refers to any individual or entity accessing or using the Platform.
“Content” includes all materials, courses, data, text, media, and software.

2. ACCEPTANCE OF TERMS
By accessing, registering, or using the Platform, the User irrevocably agrees to be bound by these Terms. If the User does not agree, they must immediately cease use of the Platform.

3. ELIGIBILITY AND AUTHORITY
The User represents that:
They are legally competent to enter into binding agreements
If acting on behalf of an entity, they possess full authority to bind such entity

4. PERMITTED USE
The User agrees to:
Use the Platform strictly for lawful and authorized purposes
Comply with all applicable laws and institutional policies
Not misuse, exploit, or interfere with Platform functionality

5. PROHIBITED ACTIVITIES
Users shall not:
Attempt unauthorized access to systems, servers, or data
Introduce malware, viruses, or harmful code
Reverse engineer or replicate the Platform
Engage in fraudulent, deceptive, or illegal transactions

6. ACCOUNT SECURITY
Users are solely responsible for safeguarding their credentials
Any activity under the User account is deemed authorized by the User
The Company is not liable for losses due to compromised credentials

7. PAYMENTS AND FINANCIAL TRANSACTIONS
7.1 All payments must be made only through officially authorized payment channels explicitly provided by PRGEEQ GLOBAL SOLUTIONS PRIVATE LIMITED.
7.2 The Company does not solicit or accept payments through unofficial, unauthorized, or third-party channels.

7.3 User Responsibility for Payment Verification:
Users are strictly advised to verify any payment request with the Company through official communication channels before making any payment.

7.4 Disclaimer on Unauthorized Payment Requests:
The Company shall not be held responsible or liable for:
Any loss arising from payments made to unauthorized individuals or entities
Any fraudulent communication impersonating the Company

7.5 Cybersecurity and Hacking Disclaimer:
In the event of system compromise, hacking, phishing, or unauthorized intrusion:
The Company shall not be liable for any financial loss incurred due to such unauthorized transactions
Users acknowledge inherent risks of digital transactions and agree to exercise due diligence

8. INTELLECTUAL PROPERTY RIGHTS
All Platform Content is owned by or licensed to the Company
Unauthorized reproduction, distribution, or modification is strictly prohibited
Users are granted a limited, non-transferable license for personal or institutional use only

9. USER-GENERATED CONTENT
Users retain ownership of submitted content
Users grant the Company a perpetual, worldwide, royalty-free license to use such content for operational purposes
The Company reserves the right to remove content violating policies or laws

10. DATA PRIVACY AND SECURITY
User data is processed in accordance with the Privacy Policy
While reasonable security measures are implemented, absolute security cannot be guaranteed

11. SERVICE AVAILABILITY
The Platform is provided on an “as available” basis
The Company does not guarantee uninterrupted or error-free service

12. LIMITATION OF LIABILITY
To the maximum extent permitted by law, the Company shall not be liable for:
Indirect, incidental, special, or consequential damages
Loss of revenue, profits, data, or goodwill
Unauthorized access, hacking incidents, or security breaches

13. INDEMNIFICATION
The User agrees to indemnify and hold harmless the Company from any claims, damages, liabilities, or expenses arising from:
Violation of these Terms
Misuse of the Platform
Unauthorized or illegal activities

14. TERMINATION
The Company reserves the right to suspend or terminate access:
For breach of Terms
For legal or security reasons
Without prior notice where necessary

15. GOVERNING LAW AND JURISDICTION
These Terms shall be governed by the laws of India. Courts in Bengaluru, Karnataka shall have exclusive jurisdiction.

16. AMENDMENTS
The Company may revise these Terms at its sole discretion. Continued use constitutes acceptance.

17. CONTACT INFORMATION
PRGEEQ GLOBAL SOLUTIONS PRIVATE LIMITED
Email: contact@prgeeq.com`;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Coordinator Signup</h2>

        <Alert type={alert.type} message={alert.message} />

        <InputField
          placeholder="Full Name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <InputField
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <InputField
          placeholder="Phone Number"
          value={form.phone}
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
          }
        />

        <InputField
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
        />

        <PasswordStrength password={form.password} />

        <InputField
          type="password"
          placeholder="Confirm Password"
          value={form.confirm}
          onChange={(e) =>
            setForm({ ...form, confirm: e.target.value })
          }
        />

       {/* CHECKBOXES */}
<div style={{ marginTop: 10 }}>

  {/* Terms & Conditions */}
  <label>
    <input
      type="checkbox"
      checked={form.acceptTerms}
      onChange={(e) =>
        setForm({
          ...form,
          acceptTerms: e.target.checked,
        })
      }
    />{" "}
    I agree to{" "}
    <span
      onClick={() => setShowTerms(true)}
      style={{ color: "blue", cursor: "pointer" }}
    >
      Terms & Conditions
    </span>
  </label>

  <br />

  {/* Terms Acceptance Declaration (NEW) */}
  <label>
    <input
      type="checkbox"
      onChange={() => setShowDeclaration(true)} // opens modal
    />{" "}
    I confirm{" "}
    <span
      onClick={() => setShowDeclaration(true)}
      style={{ color: "blue", cursor: "pointer" }}
    >
      Terms Acceptance Declaration
    </span>
  </label>

  <br />

  {/* Privacy Policy */}
  <label>
    <input
      type="checkbox"
      checked={form.acceptPrivacy}
      onChange={(e) =>
        setForm({
          ...form,
          acceptPrivacy: e.target.checked,
        })
      }
    />{" "}
    I accept{" "}
    <span
      onClick={() => setShowPrivacy(true)}
      style={{ color: "blue", cursor: "pointer" }}
    >
      Privacy Policy
    </span>
  </label>

</div>

        <button
          className={styles.button}
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>

        {/* MODALS */}
        {showPrivacy && (
          <Modal
            title="Privacy Policy"
            content={privacyContent}
            onClose={() => setShowPrivacy(false)}
          />
        )}

        {showTerms && (
          <Modal
            title="Terms & Conditions"
            content={termsContent}
            onClose={() => setShowTerms(false)}
          />
        )}

        {showDeclaration && (
          <Modal
            title="Terms Acceptance Declaration"
            content={termsDeclContent}
            onClose={() => setShowDeclaration(false)}
        />
        )}
      </div>
    </div>
  );
}
