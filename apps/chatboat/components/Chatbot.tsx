'use client';

import React, { useState, useEffect, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Sender = 'bot' | 'user';
type InputMode = 'text' | 'radio' | 'buttons' | 'none';
type Step =
  | 'college-name'
  | 'secret-role'
  | 'secret-auth'
  | 'college-code'
  | 'role-select'
  | 'auth-select'
  | 'done';

interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
}

interface InputConfig {
  mode: InputMode;
  options: { label: string; value: string }[];
  placeholder: string;
  selected: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const COLLEGES = [
  {
    name: 'Shridevi Institute of Engineering and Technology',
    code: 'GCC001',
    aliases: ['siet', 'shridevi', 'tm001', 'tm-001', 'siet-tmk-001'],
  },
  {
    name: 'Siddaganga Institute of Technology',
    code: 'GCC002',
    aliases: ['ssit', 'sit', 'siddaganga', 'tm002', 'tm-002', 'ssit-tmk-002'],
  },
  {
    name: 'PES Institute of Technology (PES University)',
    code: 'GCC003',
    aliases: ['pes', 'pesit', 'pes university', 'blr003', 'blr-003', 'pes-blr-003'],
  },
  {
    name: 'Dayananda Sagar College of Engineering',
    code: 'GCC004',
    aliases: ['dsce', 'dayananda', 'dayananda sagar', 'blr004', 'blr-004', 'dsce-blr-004'],
  },
  {
    name: 'Jain University Faculty of Engineering and Technology',
    code: 'GCC005',
    aliases: ['jain', 'jain university', 'blr005', 'blr-005', 'jain-blr-005'],
  },
  {
    name: 'MS Ramaiah Institute of Technology',
    code: 'GCC006',
    aliases: ['msrit', 'ramaiah', 'ms ramaiah', 'blr006', 'blr-006', 'msrit-blr-006'],
  },
  {
    name: 'RV College of Engineering',
    code: 'GCC007',
    aliases: ['rvce', 'rv college', 'rv', 'blr007', 'blr-007', 'rvce-blr-007'],
  },
  {
    name: 'REVA University',
    code: 'GCC008',
    aliases: ['reva', 'reva university', 'blr008', 'blr-008', 'reva-blr-008'],
  },
];
const SECRET_CODE = '#prgeeq#';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Hey, Good Morning! ☀️ Ready to start your day?";
  if (h >= 12 && h < 16) return "Good Afternoon! Hope your day is going great 😊";
  if (h >= 16 && h < 21) return "Good Evening! How was your day? 🌇";
  return "Late night studying? Keep going, you're doing great! 🌙";
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<Step>('college-name');
  const [inputCfg, setInputCfg] = useState<InputConfig>({
    mode: 'none',
    options: [],
    placeholder: '',
    selected: '',
  });
  const [textVal, setTextVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [foundCollege, setFoundCollege] = useState<{ name: string; code: string; aliases: string[] } | null>(null);
  const [showNotFound, setShowNotFound] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initDone = useRef(false);
  const stepRef = useRef<Step>('college-name');
  const selectedRoleRef = useRef<string>('');

  // Keep stepRef in sync with step state
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Messaging helpers ──
  const botSay = (text: string, delay = 900): Promise<void> =>
    new Promise((resolve) => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, { id: makeId(), sender: 'bot', text }]);
        resolve();
      }, delay);
    });

  const userSay = (text: string) => {
    setMessages((prev) => [...prev, { id: makeId(), sender: 'user', text }]);
  };

  const showTextInput = (placeholder: string) => {
    setInputCfg({ mode: 'text', options: [], placeholder, selected: '' });
  };

  const showRadio = (options: { label: string; value: string }[]) => {
    setInputCfg({ mode: 'radio', options, placeholder: '', selected: '' });
  };

  const showButtons = (options: { label: string; value: string }[]) => {
    setInputCfg({ mode: 'buttons', options, placeholder: '', selected: '' });
  };

  const hideInput = () => {
    setInputCfg({ mode: 'none', options: [], placeholder: '', selected: '' });
  };

  // ── Initialisation ──
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    (async () => {
      await botSay(getTimeGreeting(), 600);
      await botSay("I'm NeuroLXP Assistant! I'm here to help you get started 🤖", 1300);
      await botSay("Enter your College / Institution / University name", 1300);
      showTextInput('Type your college / institution name...');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Text submit ──
  const handleTextSend = async () => {
    const val = textVal.trim();
    if (!val) return;

    const currentStep = stepRef.current;
    setTextVal('');
    hideInput();
    userSay(val);

    if (currentStep === 'college-name') {
      if (val === SECRET_CODE) {
        await botSay('Welcome, privileged user! 🔐 Please select your role:', 1000);
        setStep('secret-role');
        showRadio([
          { label: 'Super Admin', value: 'super-admin' },
          { label: 'Platform Admin', value: 'platform-admin' },
        ]);
      } else {
        const match = COLLEGES.find((c) => {
          const iv = val.toLowerCase().trim();
          const cn = c.name.toLowerCase();
          return (
            cn.includes(iv) ||
            iv.includes(cn) ||
            c.aliases.some((a) => a === iv || a.includes(iv) || iv.includes(a))
          );
        });
        if (match) {
          setFoundCollege(match);
          await botSay(`Great! I found "${match.name}" in our system ✅`, 1000);
          await botSay('Please enter your College Code to continue:', 1300);
          setStep('college-code');
          showTextInput(`Enter your college code...`);
        } else {
          setShowNotFound(true);
          setStep('done');
        }
      }
    } else if (currentStep === 'college-code') {
      if (foundCollege && val === foundCollege.code) {
        await botSay("Nice! You're one step away 🎉", 1000);
        await botSay('Please select your role:', 1300);
        setStep('role-select');
        showRadio([
          { label: 'Institution Admin', value: 'institution-admin' },
          { label: 'Coordinator', value: 'coordinator' },
          { label: 'Faculty', value: 'faculty' },
          { label: 'Student', value: 'student' },
        ]);
      } else {
        await botSay('❌ Invalid code. Please try again:', 900);
        showTextInput('Enter college code...');
      }
    }
  };

  // ── Radio confirm ──
  const handleRadioConfirm = async () => {
    const val = inputCfg.selected;
    if (!val) return;

    const currentStep = stepRef.current;
    const label = inputCfg.options.find((o) => o.value === val)?.label ?? val;
    hideInput();
    userSay(label);

    selectedRoleRef.current = val;
    await botSay(`Got it! You selected: ${label} 👤`, 800);
    await botSay('Do you want to Sign In or Sign Up?', 1000);

    const nextStep: Step = currentStep === 'secret-role' ? 'secret-auth' : 'auth-select';
    setStep(nextStep);
    showButtons([
      { label: '🔐 Sign In', value: 'signin' },
      { label: '✍️ Sign Up', value: 'signup' },
    ]);
  };

  // ── Button select ──
  const handleButtonClick = async (value: string, label: string) => {
    const currentStep = stepRef.current;
    hideInput();
    userSay(label.replace(/^[\S]*\s/, '').trim()); // strip leading emoji

    let url = '';
    if (currentStep === 'secret-auth') {
      // Platform Admin
      if (stepRef.current === 'secret-auth' && inputCfg.selected === 'platform-admin') {
        url = value === 'signin'
          ? 'https://adminweb-spkr.onrender.com/platform-admin/signin'
          : 'https://adminweb-spkr.onrender.com/platform-admin/signup';
      } else {
        // Super Admin
        url = value === 'signin'
          ? 'https://adminweb-spkr.onrender.com/'
          : 'https://adminweb-spkr.onrender.com/signup';
      }
    } else {
      const role = selectedRoleRef.current;
      if (role === 'institution-admin') {
        url = value === 'signin'
          ? 'https://faculty-7g74.onrender.com/login'
          : 'https://faculty-7g74.onrender.com/signup';
      } else if (role === 'coordinator') {
        url = value === 'signin'
          ? 'https://faculty-7g74.onrender.com/coordinator/login'
          : 'https://faculty-7g74.onrender.com/coordinator/signup';
      } else if (role === 'faculty') {
        url = value === 'signin'
          ? 'https://faculty-7g74.onrender.com/faculty/auth/signin'
          : 'https://faculty-7g74.onrender.com/faculty/auth/signup';
      } else if (role === 'student') {
        url = value === 'signin'
          ? 'https://learner-2adk.onrender.com/signin'
          : 'https://learner-2adk.onrender.com/signup';
      } else {
        url = value === 'signin'
          ? 'https://app.neurolxp.com/signin'
          : 'https://app.neurolxp.com/signup';
      }
    }

    window.location.href = url;
    // Optionally, you can keep the botSay for accessibility or fallback:
    // await botSay(
    //   `Redirecting you to your ${value === 'signin' ? 'Sign In' : 'Sign Up'} page...`,
    //   1000
    // );
    setStep('done');
  };

  // ── Render helpers ──
  const renderText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) =>
      urlRegex.test(part) ? (
        <a
          key={i}
          href={part}
          className="msg-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {part}
        </a>
      ) : (
        <span key={i}>
          {part.split('\n').map((line, j, arr) => (
            <span key={j}>
              {line}
              {j < arr.length - 1 && <br />}
            </span>
          ))}
        </span>
      )
    );
  };

  // ── JSX ──
  return (
    <div className="chatbot-wrapper">
      <div className="chatbot-container">
        {/* Header */}
        <div className="chatbot-header">
          <div className="avatar">🤖</div>
          <div className="header-text">
            <span className="bot-name">NeuroLXP Assistant</span>
            <span className="bot-status">● Online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="messages-area">
          {messages.map((msg) => (
            <div key={msg.id} className={`msg-row ${msg.sender}`}>
              {msg.sender === 'bot' && (
                <div className="msg-avatar">🤖</div>
              )}
              <div className={`bubble ${msg.sender}`}>
                {renderText(msg.text)}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="msg-row bot">
              <div className="msg-avatar">🤖</div>
              <div className="bubble bot typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          <div ref={bottomRef} />

          {/* College not found card */}
          {showNotFound && (
            <div className="not-found-card">
              <div className="nf-row">
                <span className="nf-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="11" y1="8" x2="11" y2="11"/>
                    <circle cx="11" cy="14" r="0.5" fill="currentColor"/>
                  </svg>
                </span>
                <span>Investigation complete…</span>
              </div>
              <div className="nf-row">
                <span className="nf-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 15s1.5-2 4-2 4 2 4 2"/>
                    <line x1="9" y1="9" x2="9.01" y2="9"/>
                    <line x1="15" y1="9" x2="15.01" y2="9"/>
                  </svg>
                </span>
                <span>Your college is currently missing from our system</span>
              </div>
              <div className="nf-row">
                <span className="nf-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                </span>
                <span>Not onboarded yet</span>
              </div>
              <div className="nf-row nf-cta">
                <span className="nf-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </span>
                <span>Ask your college to join <strong>NeuroLXP</strong> and unlock everything!</span>
              </div>
            </div>
          )}
        </div>

        {/* Input panel */}
        <div className="input-panel">
          {/* Text input */}
          {inputCfg.mode === 'text' && (
            <div className="text-row">
              <input
                className="neu-input"
                type="text"
                value={textVal}
                placeholder={inputCfg.placeholder}
                onChange={(e) => setTextVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTextSend();
                }}
                autoFocus
              />
              <button className="send-btn" onClick={handleTextSend} aria-label="Send">
                ➤
              </button>
            </div>
          )}

          {/* Radio options */}
          {inputCfg.mode === 'radio' && (
            <div className="radio-panel">
              {inputCfg.options.map((opt) => (
                <label
                  key={opt.value}
                  className={`neu-radio ${inputCfg.selected === opt.value ? 'checked' : ''}`}
                >
                  <input
                    type="radio"
                    name="chatOption"
                    value={opt.value}
                    checked={inputCfg.selected === opt.value}
                    onChange={() =>
                      setInputCfg((prev) => ({ ...prev, selected: opt.value }))
                    }
                  />
                  <div className="radio-dot">
                    <div className="radio-dot-inner" />
                  </div>
                  {opt.label}
                </label>
              ))}
              <button
                className="confirm-btn"
                onClick={handleRadioConfirm}
                disabled={!inputCfg.selected}
              >
                Confirm →
              </button>
            </div>
          )}

          {/* Action buttons */}
          {inputCfg.mode === 'buttons' && (
            <div className="btn-panel">
              {inputCfg.options.map((opt) => (
                <button
                  key={opt.value}
                  className="choice-btn"
                  onClick={() => handleButtonClick(opt.value, opt.label)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Done state */}
          {inputCfg.mode === 'none' && step === 'done' && (
            <p className="done-note">✅ Session complete. Refresh the page to start over.</p>
          )}
        </div>
      </div>
    </div>
  );
}
