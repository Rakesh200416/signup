"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  FaGraduationCap,
  FaSyncAlt,
  FaChartLine,
  FaRocket,
  FaLightbulb,
  FaUsers,
  FaMobileAlt,
  FaTools,
  FaShieldAlt,
  FaBullhorn,
  FaCogs,
  FaChartBar,
} from "react-icons/fa";

export default function Home() {
  const slides = [
    {
      image: "/heroLMS.jpg",
      title: "Advanced Learning Record Store",
      desc: "Capture and analyze all learning activities across multiple platforms with neuroLxp's LRS. Our platform ensures you have a comprehensive view of your learners’ progress and performance, enabling data-driven decisions.",
    },
    {
      image: "/heroLMS.jpg",
      title: "Comprehensive Learning Management System",
      desc: "Manage all your learning activities seamlessly with neuroLxp's robust LMS capabilities. From course creation to learner tracking, our platform provides all the tools you need to deliver effective education and training.",
    },
    {
      image: "/heroLMS.jpg",
      title: "Personalized Learning Experience",
      desc: "Enhance learner engagement with neuroLxp's LXP features. Our platform delivers personalized learning paths, tailored content, and interactive experiences to meet each learner's unique needs and preferences.",
    },
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="home-page">
      {/* HERO SLIDER */}
      <section className="hero-slider">
        <div className="hero-card">
          <div
            className="hero-bg"
            style={{ backgroundImage: `url(${slides[current].image})` }}
          >
            <div className="hero-overlay">
              <h2>{slides[current].title}</h2>
              <p>{slides[current].desc}</p>

              <div className="hero-dots">
                {slides.map((_, index) => (
                  <span
                    key={index}
                    className={current === index ? "dot active" : "dot"}
                    onClick={() => setCurrent(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="platform-features">
        <div className="feature-box">
          <div className="icon-circle">
            <FaRocket />
          </div>
          <h3>AI-Powered Learning</h3>
          <p>
            Our AI algorithms personalize learning experiences by adapting to
            each learner&apos;s pace, style, and preferences, ensuring
            effective and engaging education.
          </p>
        </div>

        <div className="feature-box">
          <div className="icon-circle">
            <FaLightbulb />
          </div>
          <h3>Interactive Content</h3>
          <p>
            Engage with immersive and interactive content including videos,
            quizzes, simulations, and gamified elements that make learning fun
            and effective.
          </p>
        </div>

        <div className="feature-box">
          <div className="icon-circle">
            <FaUsers />
          </div>
          <h3>Collaborative Learning</h3>
          <p>
            Enhance learning experiences through collaboration with peers,
            mentors, and industry experts using our integrated communication
            tools.
          </p>
        </div>

        <div className="feature-box">
          <div className="icon-circle">
            <FaGraduationCap />
          </div>
          <h3>Skill Development</h3>
          <p>
            Focus on practical skill-building with courses and modules designed
            to enhance real-world competencies, preparing learners for future
            careers.
          </p>
        </div>

        <div className="feature-box">
          <div className="icon-circle">
            <FaSyncAlt />
          </div>
          <h3>Continuous Learning</h3>
          <p>
            Stay ahead with continuous learning opportunities including
            up-to-date content and resources evolving with industry trends.
          </p>
        </div>

        <div className="feature-box">
          <div className="icon-circle">
            <FaChartLine />
          </div>
          <h3>Career Pathways</h3>
          <p>
            Track progress and explore career opportunities connecting learning
            outcomes to potential job roles and industries.
          </p>
        </div>

        <div className="feature-box">
          <div className="icon-circle">
            <FaMobileAlt />
          </div>
          <h3>Mobile-First Design</h3>
          <p>
            Access learning anytime, anywhere with our mobile-first design,
            ensuring a seamless experience across all devices.
          </p>
        </div>

        <div className="feature-box">
          <div className="icon-circle">
            <FaTools />
          </div>
          <h3>Customizable Interface</h3>
          <p>
            Personalize your learning environment with customizable interfaces
            aligned with your preferences.
          </p>
        </div>

        <div className="feature-box">
          <div className="icon-circle">
            <FaShieldAlt />
          </div>
          <h3>Secure and Scalable</h3>
          <p>
            Benefit from a platform prioritizing security and scalability,
            ensuring your data remains protected.
          </p>
        </div>
      </section>

      <section className="digital-section">
        <div className="digital-header">
          <h2>
            Unlocking Seamless <strong>Digital Narratives.</strong>
          </h2>

          <p>
            With our neuroLxps&apos; advanced eLearning, accessibility, and
            content development services, we&apos;re redefining excellence in
            learning and reshaping the future of education. Embark on a journey
            of learning that&apos;s as seamless as it is enlightening.
          </p>
        </div>

        <div className="digital-card">
          <div className="digital-grid">
            <div className="digital-item">
              <div className="icon-circle">
                <FaBullhorn />
              </div>
              <h3>Get Discovered</h3>
              <p>
                Increase your brand&apos;s visibility with our white label
                neuroLxp solution tailored for your L&amp;D requirements.
              </p>
            </div>

            <div className="digital-item">
              <div className="icon-circle">
                <FaCogs />
              </div>
              <h3>Deliver Excellence</h3>
              <p>
                neuroLxp delivers excellence by offering cutting-edge learning
                tools and personalized experiences.
              </p>
            </div>

            <div className="digital-item">
              <div className="icon-circle">
                <FaUsers />
              </div>
              <h3>Engage Learners</h3>
              <p>
                Drive learner engagement to new heights with multi-channel
                notifications and better learning interaction.
              </p>
            </div>

            <div className="digital-item">
              <div className="icon-circle">
                <FaChartBar />
              </div>
              <h3>Insightful Analytics</h3>
              <p>
                Leverage powerful analytics and insights to refine course
                offerings and enhance learner engagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="ld-section">
        <div className="ld-container">
          <div className="ld-image">
            <Image
              src="/heroLMS.jpg"
              alt="L&D with neuroLxp"
              width={420}
              height={420}
            />
          </div>

          <div className="ld-content">
            <h2>L&amp;D with neuroLxp.</h2>

            <p>
              Leverage the domain and technical expertise of neuroLxp in
              enhancing your organization&apos;s learning and development
              endeavors.
            </p>

            <p>
              Experience the rich tapestry of our dynamic L&amp;D associates for
              whom innovation is at the forefront and positivity permeates every
              interaction. Join us in charting a new course for the advancement
              of learning. Together, we&apos;ll shape the future of educational
              endeavors.
            </p>

            <span className="ld-sign">Parankumar C.</span>
          </div>
        </div>
      </section>

      <section className="modules-section">
        <div className="modules-container">
          <h2>
            Future Ready <strong>neuroLxp Modules.</strong>
          </h2>

          <p>
            Our advanced and adaptable modules within the neuroLxp platform are
            designed to ensure organizations stay ahead in the rapidly evolving
            landscape of learning and development.
          </p>

          <p>
            These modules are meticulously crafted to meet the dynamic needs of
            tomorrow&apos;s workforce, empowering businesses to cultivate a
            culture of continuous learning and innovation.
          </p>
        </div>
      </section>

      <section className="learning-cards">
        <div className="cards-container">
          <div className="learning-card">
            <div className="card-image">
              <Image
                src="/heroLMS.jpg"
                alt="Learning Journey"
                width={90}
                height={90}
              />
            </div>

            <h3>Learning Journey</h3>

            <p>
              Embark on a personalized learning journey with our neuroLxp
              platform. Discover your unique learning style through
              comprehensive analytics, set personalized goals, and navigate
              through tailored learning paths to achieve your objectives.
            </p>

            <button className="learn-btn">Learn More</button>
          </div>

          <div className="learning-card">
            <div className="card-image">
              <Image
                src="/heroLMS.jpg"
                alt="Learning Augmentation"
                width={90}
                height={90}
              />
            </div>

            <h3>Learning Augmentation</h3>

            <p>
              Experience an enhanced learning journey thru neuroLxp&apos;s
              custom modules. Engage in gamified experiences, interactive
              activities, and collaborative social learning opportunities with
              curated content and features designed to augment your learning
              experience.
            </p>

            <button className="learn-btn">Learn More</button>
          </div>

          <div className="learning-card">
            <div className="card-image">
              <Image
                src="/heroLMS.jpg"
                alt="Learning Ecosystem"
                width={90}
                height={90}
              />
            </div>

            <h3>Learning Ecosystem</h3>

            <p>
              Dive into a comprehensive learning ecosystem with neuroLxp&apos;s
              custom assessment and personalization modules. Explore skills and
              career development opportunities, chart your career path, and
              undergo assessments for continuous growth and development.
            </p>

            <button className="learn-btn">Learn More</button>
          </div>
        </div>
      </section>

      <section className="training-section">
        <div className="training-container">
          <div className="training-card">
            <Image
              src="/heroLMS.jpg"
              alt="Blended Learning"
              width={400}
              height={200}
            />
            <h3>Blended Learning</h3>
            <p>
              Integrate the best of both worlds with neuroLxp&apos;s Blended
              Learning module. Combine online and in-person learning to provide
              a flexible and comprehensive learning experience.
            </p>
            <button className="learn-btn">Learn More</button>
          </div>

          <div className="training-card">
            <Image
              src="/heroLMS.jpg"
              alt="Onboarding"
              width={400}
              height={200}
            />
            <h3>Onboarding &amp; Induction</h3>
            <p>
              Ensure a smooth induction and transition for new hires. Streamline
              the onboarding process and help new employees integrate seamlessly
              into your organization.
            </p>
            <button className="learn-btn">Learn More</button>
          </div>

          <div className="training-card">
            <Image
              src="/heroLMS.jpg"
              alt="Standards Training"
              width={400}
              height={200}
            />
            <h3>Standards Training</h3>
            <p>
              Maintain high standards with neuroLxp&apos;s Standards Training
              module. Equip your team with the knowledge and skills necessary to
              meet industry standards and regulations effectively.
            </p>
            <button className="learn-btn">Learn More</button>
          </div>
        </div>
      </section>

      <section className="contact-section">
        <div className="contact-card">
          <div className="contact-text">
            <h2>Get in touch</h2>
            <p>
              If you need any help with our products or services, choose one of
              the following ways to contact us.
            </p>
          </div>

          <button className="contact-btn">
            <span className="contact-icon">🎧</span>
            Contact Us
          </button>
        </div>
      </section>

      <section className="download-section">
        <h2>Ready to change your learning life?</h2>

        <p>
          Download neuroLxp today and take the first step to organize your
          learning, achieve your personal goals and reflect on your career.
        </p>

        <div className="store-buttons">
          <button className="store-btn">
            <span className="icon"></span>
            <div>
              <small>Download on the</small>
              <strong>App Store</strong>
            </div>
          </button>

          <button className="store-btn">
            <span className="icon">▶</span>
            <div>
              <small>Download on the</small>
              <strong>Google Play</strong>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}