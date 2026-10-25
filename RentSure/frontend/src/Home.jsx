
import { useState } from "react";
import { Link } from "react-router-dom";
import HeroVisual from "./components/HeroVisual";
import {
  ArrowRight,
  ArrowUpRight,
  Bath,
  BedDouble,
  Check,
  CheckCircle2,
  Heart,
  House,
  KeyRound,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
  Users,
  FileText,
  ChartNoAxesColumnIncreasing,
} from "lucide-react";
import "./Home.css";

const properties = [
  {
    id: 1,
    title: "Modern 2 BHK Apartment",
    location: "Hinjawadi, Pune",
    rent: "₹18,000",
    beds: "2 Beds",
    baths: "2 Baths",
    area: "950 sq ft",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85",
    tag: "Popular choice",
  },
  {
    id: 2,
    title: "Spacious Family Villa",
    location: "Kharadi, Pune",
    rent: "₹25,000",
    beds: "3 Beds",
    baths: "3 Baths",
    area: "1,450 sq ft",
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=85",
    tag: "Verified home",
  },
  {
    id: 3,
    title: "Contemporary City Home",
    location: "Wakad, Pune",
    rent: "₹15,000",
    beds: "1 Bed",
    baths: "1 Bath",
    area: "650 sq ft",
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85",
    tag: "Great value",
  },
];

const features = [
  {
    icon: House,
    title: "Find your next home",
    description: "Explore homes that fit your lifestyle and budget.",
    color: "berry",
  },
  {
    icon: ShieldCheck,
    title: "Verified properties",
    description: "Discover listings with clear, useful information.",
    color: "violet",
  },
  {
    icon: Wallet,
    title: "Flexible deposit planning",
    description: "Understand your upfront costs before moving in.",
    color: "green",
  },
  {
    icon: Users,
    title: "Built for everyone",
    description: "A smoother rental journey for tenants and landlords.",
    color: "pink",
  },
];

const steps = [
  {
    icon: Search,
    title: "Explore",
    description: "Find homes that match your needs and budget.",
  },
  {
    icon: FileText,
    title: "Apply",
    description: "Keep your rental application journey organised.",
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    title: "Plan your deposit",
    description: "Estimate upfront costs and monthly instalments.",
  },
  {
    icon: KeyRound,
    title: "Move in",
    description: "Take your next step with greater confidence.",
  },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="rs-navbar">
      <div className="rs-nav-inner">
        <Link to="/" className="rs-brand" onClick={closeMenu}>
          <span className="rs-brand-icon">
            <House size={29} strokeWidth={2.7} />
          </span>
          <span>
            Rent<span>Sure</span>
          </span>
        </Link>

        <button
          type="button"
          className="rs-menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <nav className={`rs-nav-links ${menuOpen ? "rs-nav-open" : ""}`}>
          <a href="#how-it-works" onClick={closeMenu}>
            How it works
          </a>
          <a href="#properties" onClick={closeMenu}>
            Properties
          </a>
          <a href="#landlords" onClick={closeMenu}>
            For landlords
          </a>
          <a href="#benefits" onClick={closeMenu}>
            Why RentSure
          </a>

          <div className="rs-mobile-actions">
            <Link to="/login" className="rs-button rs-button-outline" onClick={closeMenu}>
              Log in
            </Link>
            <Link to="/register" className="rs-button rs-button-primary" onClick={closeMenu}>
              Get started <ArrowRight size={17} />
            </Link>
          </div>
        </nav>

        <div className="rs-nav-actions">
          <Link to="/login" className="rs-login-link">
            Log in
          </Link>
          <Link to="/register" className="rs-button rs-button-primary rs-nav-cta">
            Get started <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="rs-hero">
      <div className="rs-hero-copy">
        <div className="rs-eyebrow">
          <Sparkles size={15} fill="currentColor" />
          A flexible way to rent
        </div>

        <h1>
          Find your
          <br />
          next <span className="rs-gradient-text">home</span>
          <br />
          with ease.
        </h1>

        <p className="rs-hero-description">
          Explore properties, organise rental applications, and plan
          your deposit — all in one place.
        </p>

        <div className="rs-hero-actions">
          <Link to="/register" className="rs-button rs-button-primary rs-button-large">
            Get started <ArrowRight size={20} />
          </Link>
          <a href="#properties" className="rs-button rs-button-outline rs-button-large">
            Explore properties
          </a>
        </div>

        <div className="rs-hero-trust">
          <div className="rs-trust-avatars">
            <span>R</span>
            <span>S</span>
            <span>H</span>
          </div>
          <div>
            <strong>A better way to rent</strong>
            <small>Designed for tenants and landlords</small>
          </div>
        </div>
      </div>

      <div className="rs-hero-visual">
        {/* HeroVisual already contains the floating cards; do not add another photo card here. */}
        <HeroVisual />
      </div>

      <div className="rs-hero-bottom-note">
        <span className="rs-note-dot" />
        Your next chapter starts here
      </div>
    </section>
  );
}

function FeatureStrip() {
  return (
    <section className="rs-feature-strip" id="benefits">
      {features.map(({ icon: Icon, title, description, color }) => (
        <article className="rs-feature-item" key={title}>
          <div className={`rs-feature-icon rs-icon-${color}`}>
            <Icon size={28} strokeWidth={2.2} />
          </div>
          <div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

function PropertyCard({ property }) {
  const [saved, setSaved] = useState(false);

  return (
    <article className="rs-property-card">
      <div className="rs-property-image-wrap">
        <img
          src={property.image}
          alt={property.title}
          className="rs-property-image"
          loading="lazy"
        />
        <span className="rs-property-tag">
          <CheckCircle2 size={14} /> {property.tag}
        </span>
        <button
          type="button"
          className={`rs-favorite-button ${saved ? "rs-favorite-active" : ""}`}
          aria-label={saved ? "Remove from favourites" : "Save property"}
          aria-pressed={saved}
          onClick={() => setSaved(!saved)}
        >
          <Heart size={19} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="rs-property-content">
        <div className="rs-property-title-row">
          <h3>{property.title}</h3>
          <ArrowUpRight size={19} />
        </div>

        <p className="rs-property-location">
          <MapPin size={15} /> {property.location}
        </p>

        <div className="rs-property-price">
          <strong>{property.rent}</strong>
          <span>/ month</span>
        </div>

        <div className="rs-property-details">
          <span><BedDouble size={16} /> {property.beds}</span>
          <span><Bath size={16} /> {property.baths}</span>
          <span><House size={15} /> {property.area}</span>
        </div>

        <Link to="/register" className="rs-property-link">
          Explore this home <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}

function PropertiesSection() {
  const [search, setSearch] = useState("");

  const filteredProperties = properties.filter((property) => {
    const query = search.trim().toLowerCase();
    return (
      property.title.toLowerCase().includes(query) ||
      property.location.toLowerCase().includes(query)
    );
  });

  return (
    <section className="rs-properties-section" id="properties">
      <div className="rs-section-heading">
        <div>
          <div className="rs-eyebrow">
            <House size={15} /> YOUR NEXT HOME
          </div>
          <h2>Spaces you'll <span className="rs-gradient-text">love.</span></h2>
          <p>Explore a few example homes and imagine your next move.</p>
        </div>

        <label className="rs-property-search">
          <Search size={19} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search homes or locations"
            aria-label="Search example properties"
          />
        </label>
      </div>

      <div className="rs-property-grid">
        {filteredProperties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <div className="rs-no-results">
          <Search size={26} />
          <h3>No matching example homes</h3>
          <p>Try searching for Pune, apartment, villa, or home.</p>
        </div>
      )}

      <p className="rs-demo-note">
        Example property cards for the design preview. Live listings will
        appear here once connected to your RentSure properties API.
      </p>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="rs-how-section" id="how-it-works">
      <div className="rs-how-copy">
        <div className="rs-eyebrow">
          <Sparkles size={15} /> HOW IT WORKS
        </div>
        <h2>A simpler <span className="rs-gradient-text">rental journey.</span></h2>
        <p className="rs-how-intro">
          From your first search to planning your deposit, keep your
          rental journey organised in one place.
        </p>

        <div className="rs-steps">
          {steps.map(({ icon: Icon, title, description }, index) => (
            <article className="rs-step" key={title}>
              <div className="rs-step-icon">
                <Icon size={26} />
                <span>{index + 1}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="rs-how-visual">
        <div className="rs-phone-halo" />
        <div className="rs-phone">
          <div className="rs-phone-notch" />
          <div className="rs-phone-screen">
            <div className="rs-phone-top">
              <span className="rs-phone-logo"><House size={18} /> RentSure</span>
              <span className="rs-phone-avatar">K</span>
            </div>
            <p className="rs-phone-greeting">Your next move</p>
            <h3>Find your place.</h3>
            <div className="rs-phone-home-image">
              <img
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=500&q=80"
                alt="Modern house"
                loading="lazy"
              />
            </div>
            <div className="rs-phone-stat">
              <span><Wallet size={18} /></span>
              <div><small>Deposit planner</small><strong>Plan with confidence</strong></div>
              <ArrowRight size={17} />
            </div>
            <div className="rs-phone-stat">
              <span><FileText size={18} /></span>
              <div><small>Applications</small><strong>Keep things organised</strong></div>
              <ArrowRight size={17} />
            </div>
          </div>
        </div>

        <div className="rs-how-checklist">
          <h3>Everything in one place</h3>
          {[
            "Explore property listings",
            "Manage rental applications",
            "Estimate your deposit",
            "Keep your profile updated",
          ].map((item) => (
            <p key={item}><Check size={17} /> {item}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandlordCTA() {
  return (
    <section className="rs-landlord-section" id="landlords">
      <div className="rs-landlord-icon">
        <House size={32} />
      </div>
      <div className="rs-landlord-copy">
        <div className="rs-eyebrow">FOR PROPERTY OWNERS</div>
        <h2>Have a place to rent?</h2>
        <p>
          Organise your listings and make your rental management journey
          easier with RentSure.
        </p>
      </div>
      <Link to="/register" className="rs-button rs-button-light">
        Join as a landlord <ArrowRight size={18} />
      </Link>
    </section>
  );
}

function Footer() {
  return (
    <footer className="rs-footer" id="contact">
      <Link to="/" className="rs-brand">
        <span className="rs-brand-icon"><House size={25} /></span>
        <span>Rent<span>Sure</span></span>
      </Link>

      <p>Make room for a better rental journey.</p>

      <div className="rs-footer-links">
        <a href="#how-it-works">How it works</a>
        <a href="#properties">Properties</a>
        <a href="#landlords">For landlords</a>
        <Link to="/login">Log in</Link>
        <Link to="/register">Create account</Link>
      </div>

      <small>© {new Date().getFullYear()} RentSure. A student project concept.</small>
    </footer>
  );
}

function MovingTextStrip() {
  const [isPaused, setIsPaused] = useState(false);

  const messages = [
    "Find a place that feels like home",
    "Discover rentals that fit your budget",
    "Make your next move with confidence",
    "A smoother journey for tenants and landlords",
  ];

  return (
    <section className="rs-motion-strip" aria-label="RentSure highlights">
      <button
        type="button"
        className="rs-motion-toggle"
        onClick={() => setIsPaused((paused) => !paused)}
        aria-pressed={isPaused}
        aria-label={isPaused ? "Resume moving text" : "Pause moving text"}
      >
        {isPaused ? "▶ Resume" : "Ⅱ Pause"}
      </button>

      <div
        className={`rs-motion-track ${isPaused ? "is-paused" : ""}`}
        onClick={() => setIsPaused((paused) => !paused)}
        title="Click to pause or resume"
      >
        {[0, 1].map((copy) => (
          <div
            className="rs-motion-group"
            key={copy}
            aria-hidden={copy === 1}
          >
            {messages.map((message) => (
              <span className="rs-motion-item" key={message}>
                <span className="rs-motion-star">✦</span>
                {message}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="rs-home">
      <Navbar />
      <div className="rs-page-shell">
  <Hero />
  <MovingTextStrip />
  <FeatureStrip />
        <PropertiesSection />
        <HowItWorks />
        <LandlordCTA />
      </div>
      <Footer />
    </main>
  );
}
