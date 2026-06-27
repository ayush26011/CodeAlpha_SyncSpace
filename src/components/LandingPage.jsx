import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Video, Share2, Shield, ArrowRight, Check, Play, 
  HelpCircle, ChevronDown, ChevronUp, Star, Users, Lock, Zap 
} from 'lucide-react';
import Logo from './Logo';
import './LandingPage.css';

export default function LandingPage({ onNavigate }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { type: 'spring', stiffness: 100 } 
    }
  };

  const faqs = [
    {
      q: "What makes SyncSpace different from Slack or Microsoft Teams?",
      a: "SyncSpace is designed around calmness, deep focus, and seamless contextual continuity. Instead of fragmented channels and constant notifications, SyncSpace organizes your chats, calls, files, and updates into beautiful, context-aware work spaces with modern glassmorphic tools designed for 2026."
    },
    {
      q: "Is the video calling feature peer-to-peer or hosted?",
      a: "Our video calls utilize low-latency SFU servers to guarantee HD screensharing and crisp audio streams for teams of up to 500 members simultaneously, with background blur and real-time noise cancellations built-in."
    },
    {
      q: "Can I self-host SyncSpace or is it strictly SaaS?",
      a: "Currently, SyncSpace is offered as a premium cloud SaaS hosted on global edge servers to ensure maximum speed and sub-100ms latency globally. Enterprise tier customers can request custom virtual private cloud (VPC) deployments."
    },
    {
      q: "How secure is communication in SyncSpace?",
      a: "We support end-to-end encryption (E2EE) for direct messages and calls, and use AES-256 for data at rest. You can manage device permissions, active sessions, and multi-factor authorization straight from security settings."
    }
  ];

  return (
    <div className="landing-container">
      {/* Background Blobs */}
      <div className="blob blob-primary" style={{ top: '-100px', left: '-50px' }}></div>
      <div className="blob blob-secondary" style={{ top: '30%', right: '-100px' }}></div>
      <div className="blob blob-highlight" style={{ bottom: '10%', left: '10%' }}></div>

      {/* Navigation */}
      <motion.nav 
        className={`landing-nav ${isScrolled ? 'scrolled' : ''}`}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120 }}
      >
        <Logo size={36} />
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#testimonials">Testimonials</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
        <div className="nav-actions">
          <button className="btn-ghost" onClick={() => onNavigate('login')}>Sign In</button>
          <button className="btn-primary" onClick={() => onNavigate('register')}>Get Started</button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section 
        className="hero-section"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="hero-badge" variants={itemVariants}>
          <Zap size={14} className="text-highlight" /> SyncSpace Platform v2026 is Live
        </motion.div>

        <motion.h1 className="hero-title" variants={itemVariants}>
          The Calm, Premium Workspace For Modern Collaborators
        </motion.h1>

        <motion.p className="hero-subtitle" variants={itemVariants}>
          SyncSpace unifies real-time chat, HD video meetings, and shared assets into a calming environment built for focus, productivity, and privacy.
        </motion.p>

        <motion.div className="flex-center" style={{ gap: '1.25rem' }} variants={itemVariants}>
          <button className="btn-primary flex-center" style={{ gap: '0.5rem' }} onClick={() => onNavigate('register')}>
            Start Free Trial <ArrowRight size={16} />
          </button>
          <button className="btn-ghost flex-center" style={{ gap: '0.5rem' }}>
            <Play size={16} fill="var(--primary-dark)" /> Watch Intro Film
          </button>
        </motion.div>

        {/* Dashboard Preview & Floating Cards */}
        <motion.div 
          className="dashboard-preview-container"
          variants={itemVariants}
          style={{ perspective: 1000 }}
        >
          <motion.div 
            className="dashboard-preview glass"
            whileHover={{ rotateX: 1, rotateY: -1, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <img 
              src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80" 
              alt="SyncSpace Workspace Dashboard" 
              className="preview-img"
            />
          </motion.div>

          {/* Floating Card 1 */}
          <motion.div 
            className="floating-card glass-interactive fc-1"
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          >
            <div className="fc-icon">
              <Video size={18} />
            </div>
            <div className="fc-content">
              <h4>Design Alignment</h4>
              <p>Live Call - 6 Active</p>
            </div>
          </motion.div>

          {/* Floating Card 2 */}
          <motion.div 
            className="floating-card glass-interactive fc-2"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
          >
            <div className="fc-icon" style={{ background: 'var(--highlight)', color: 'var(--white)' }}>
              <MessageSquare size={18} />
            </div>
            <div className="fc-content">
              <h4>Elena Rostova</h4>
              <p>Sent: design_system.css</p>
            </div>
          </motion.div>

          {/* Floating Card 3 */}
          <motion.div 
            className="floating-card glass-interactive fc-3"
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 0.5 }}
          >
            <div className="fc-icon" style={{ background: 'var(--secondary)', color: 'var(--white)' }}>
              <Users size={18} />
            </div>
            <div className="fc-content">
              <h4>Active Spaces</h4>
              <p>4 core teams syncing</p>
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Trusted Companies */}
      <section className="trusted-section">
        <h3>Trusted by teams at forward-thinking builders</h3>
        <div className="company-logos">
          <span className="company-logo">Linear</span>
          <span className="company-logo">Notion</span>
          <span className="company-logo">Figma</span>
          <span className="company-logo">Vercel</span>
          <span className="company-logo">Raycast</span>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2>Everything you need. Integrated beautifully.</h2>
          <p>We built SyncSpace to remove noise and let you focus on what really matters: your ideas and collaborations.</p>
        </div>

        <div className="features-grid">
          {/* Card 1 */}
          <motion.div 
            className="feature-card glass-interactive"
            whileHover={{ y: -8 }}
          >
            <div className="feature-icon-wrapper">
              <MessageSquare size={24} />
            </div>
            <h3>Structured Conversations</h3>
            <p>Direct messages, groups, and focus channels organize thoughts. Clean threads, inline code previews, and emoji reactions enrich chats.</p>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            className="feature-card glass-interactive"
            whileHover={{ y: -8 }}
          >
            <div className="feature-icon-wrapper" style={{ background: 'rgba(var(--highlight-rgb), 0.12)', color: 'var(--highlight)' }}>
              <Video size={24} />
            </div>
            <h3>HD Video Conferencing</h3>
            <p>One-click video meetings directly inside channels. Share screens, raise hands, view live recording states, and keep calls highly organized.</p>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            className="feature-card glass-interactive"
            whileHover={{ y: -8 }}
          >
            <div className="feature-icon-wrapper" style={{ background: 'rgba(var(--primary-dark-rgb), 0.12)', color: 'var(--primary-dark)' }}>
              <Share2 size={24} />
            </div>
            <h3>Seamless Asset Sharing</h3>
            <p>Drag and drop images, PDFs, code files, and videos. Access media galleries, pinned documents, and conversation history context instantly.</p>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-header">
          <h2>Loved by creators & operators</h2>
          <p>Here is what teams are saying about SyncSpace's premium layout and calming colors.</p>
        </div>

        <div className="testimonials-grid">
          <div className="testimonial-card glass">
            <div className="flex-center" style={{ gap: '4px', justifyContent: 'flex-start', marginBottom: '1rem', color: 'var(--highlight)' }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" stroke="none" />)}
            </div>
            <p className="quote-text">"SyncSpace has completely replaced Slack for our studio. The Coastal Retreat palette is so soothing to work in all day."</p>
            <div className="user-profile">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Sarah Jenkins" />
              <div>
                <h4>Sarah Jenkins</h4>
                <p>Creative Director, Studio Nine</p>
              </div>
            </div>
          </div>

          <div className="testimonial-card glass">
            <div className="flex-center" style={{ gap: '4px', justifyContent: 'flex-start', marginBottom: '1rem', color: 'var(--highlight)' }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" stroke="none" />)}
            </div>
            <p className="quote-text">"The Framer Motion animations are incredibly smooth—like using a native Apple app. The UX is so intuitive, it took no training to switch."</p>
            <div className="user-profile">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="Marcus Chen" />
              <div>
                <h4>Marcus Chen</h4>
                <p>Lead Engineer, FlowState</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="section-header">
          <h2>Simple, Calming Pricing</h2>
          <p>Choose the level of connection that matches your team's size and ambitions.</p>
        </div>

        <div className="pricing-grid">
          <div className="pricing-card glass">
            <div className="price-header">
              <h3>Starter</h3>
              <p>For independent creators and small squads.</p>
            </div>
            <div className="price-amount">
              <span className="price-val">$0</span>
              <span className="price-period">/ month</span>
            </div>
            <button className="btn-ghost" onClick={() => onNavigate('register')} style={{ border: '1px solid var(--primary-dark)' }}>Start Free</button>
            <ul className="pricing-features">
              <li><Check size={16} className="text-secondary" /> Up to 10 users</li>
              <li><Check size={16} className="text-secondary" /> Unlimited chat threads</li>
              <li><Check size={16} className="text-secondary" /> 5GB space</li>
              <li><Check size={16} className="text-secondary" /> 40-minute HD meetings</li>
            </ul>
          </div>

          <div className="pricing-card glass popular">
            <div className="popular-badge">Most Calming</div>
            <div className="price-header">
              <h3>Professional</h3>
              <p>For high-performing, remote teams.</p>
            </div>
            <div className="price-amount">
              <span className="price-val">$8</span>
              <span className="price-period">/ user / month</span>
            </div>
            <button className="btn-primary" onClick={() => onNavigate('register')}>Go Professional</button>
            <ul className="pricing-features">
              <li><Check size={16} className="text-secondary" /> Unlimited users</li>
              <li><Check size={16} className="text-secondary" /> Unlimited spaces & channels</li>
              <li><Check size={16} className="text-secondary" /> 100GB space per user</li>
              <li><Check size={16} className="text-secondary" /> 24-hour HD meetings & screen share</li>
              <li><Check size={16} className="text-secondary" /> Advanced integrations</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="faq-section">
        <div className="section-header">
          <h2>Frequently Asked Questions</h2>
        </div>

        <div className="faq-list">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className="faq-item glass-interactive" 
              onClick={() => toggleFaq(idx)}
            >
              <div className="faq-question">
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div 
                    className="faq-answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p>{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <Logo size={36} />
            <p>Connecting minds and workflows in a serene environment designed for the modern creator.</p>
          </div>
          <div className="footer-links-col">
            <h4>Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#">Roadmap</a></li>
            </ul>
          </div>
          <div className="footer-links-col">
            <h4>Support</h4>
            <ul>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">API Docs</a></li>
              <li><a href="#">Status</a></li>
            </ul>
          </div>
          <div className="footer-links-col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Use</a></li>
              <li><a href="#">Security</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} SyncSpace Inc. All rights reserved.</span>
          <span>Designed & built in 2026.</span>
        </div>
      </footer>
    </div>
  );
}
