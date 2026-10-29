
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Calculator,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Home,
  Image as ImageIcon,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import api from "./api";
import "./TenantHomePage.css";

const DEMO_PROPERTY = {
  id: "demo-property",
  title: "The Lavender Residence",
  city: "Chandigarh",
  locality: "Sector 34",
  address: "Sector 34, Chandigarh",
  propertyType: "Fully furnished apartment",
  bedrooms: 2,
  bathrooms: 2,
  furnishing: "Fully furnished",
  monthlyRent: 16000,
  securityDeposit: 32000,
  startDate: "2026-10-01",
  endDate: "2027-09-30",
  landlord: "Demo Landlord",
  images: [
    {
      id: "demo-1",
      image_url:
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85",
      alt_text: "Bright, furnished living room",
      is_cover: true,
    },
    {
      id: "demo-2",
      image_url:
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85",
      alt_text: "Modern apartment interior",
    },
    {
      id: "demo-3",
      image_url:
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85",
      alt_text: "Contemporary home design",
    },
    {
      id: "demo-4",
      image_url:
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85",
      alt_text: "Apartment dining and living space",
    },
  ],
};

const DEMO_CHECKLIST = [
  "Inspect walls and paint",
  "Check doors and window locks",
  "Test lights and electrical switches",
  "Inspect bathroom and water taps",
  "Photograph existing damage",
];

function getRows(result, key) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.[key])) return result[key];
  if (Array.isArray(result?.data?.[key])) return result.data[key];
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function getPropertyId(tenancy) {
  return (
    tenancy?.property_id ??
    tenancy?.propertyId ??
    tenancy?.property?.id ??
    tenancy?.rental_property_id ??
    null
  );
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

export default function TenantHomePage() {
  const { user } = useAuth();
  const [tenancies, setTenancies] = useState([]);
  const [properties, setProperties] = useState({});
  const [galleries, setGalleries] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [demoMode, setDemoMode] = useState(false);
  const [activePhotos, setActivePhotos] = useState({});
  const [showCalculator, setShowCalculator] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState("50000");
  const [otherExpenses, setOtherExpenses] = useState("12000");
  const [checklist, setChecklist] = useState([]);
  const [notice, setNotice] = useState("");

  const name =
    user?.fullName || user?.full_name || user?.name || "there";
  const firstName = name.trim().split(/\s+/)[0] || "there";

  useEffect(() => {
    let active = true;

    async function loadTenantData() {
      setLoading(true);
      setError("");
      setNotice("");

      try {
        const result = await api.get("/condition-evidence/mine");
        if (!active) return;

        const rows = getRows(result, "tenancies");
        setTenancies(rows);

        if (!rows.length) {
          setProperties({});
          setGalleries({});
          setDemoMode(true);
          return;
        }

        const propertyResult = await api
          .get("/properties?page=1&limit=100")
          .catch(() => null);
        const propertyRows = getRows(propertyResult, "properties");
        const propertyMap = {};
        const galleryMap = {};

        for (const tenancy of rows) {
          const id = getPropertyId(tenancy);
          if (id == null) continue;

          const key = String(id);
          const found = propertyRows.find(
            (item) => String(item.id) === key
          );

          if (found) propertyMap[key] = found;
          else if (tenancy.property) propertyMap[key] = tenancy.property;

          const imageResult = await api
            .get(`/properties/${encodeURIComponent(key)}/images`)
            .catch(() => null);

          galleryMap[key] = getRows(imageResult, "images").sort(
            (a, b) =>
              Number(Boolean(b.is_cover)) - Number(Boolean(a.is_cover))
          );
        }

        if (active) {
          setProperties(propertyMap);
          setGalleries(galleryMap);
          setDemoMode(false);
          setActivePhotos({});
        }
      } catch (err) {
        if (active) {
          setError(
            err.message || "Unable to load your real tenancy data."
          );
          setDemoMode(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTenantData();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const rentals = demoMode
    ? [{ id: "demo-tenancy", property_id: DEMO_PROPERTY.id, ...DEMO_PROPERTY }]
    : tenancies;

  const effectiveRentals = rentals.map((tenancy) => {
    if (demoMode) {
      return {
        tenancy,
        property: DEMO_PROPERTY,
        propertyKey: "demo-property",
        photos: DEMO_PROPERTY.images,
      };
    }

    const id = getPropertyId(tenancy);
    const propertyKey = id == null ? `tenancy-${tenancy.id}` : String(id);
    const property = properties[propertyKey] || tenancy.property || {};
    const photos = galleries[propertyKey] || [];

    return { tenancy, property, propertyKey, photos };
  });

  const demoRent = DEMO_PROPERTY.monthlyRent;
  const income = Math.max(0, Number(monthlyIncome) || 0);
  const expenses = Math.max(0, Number(otherExpenses) || 0);
  const remaining = income - expenses - demoRent;
  const rentRatio = income > 0 ? (demoRent / income) * 100 : 0;

  function toggleChecklist(index) {
    setChecklist((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index]
    );
  }

  function downloadDemoSummary() {
    const summary = [
      "RENTSURE — CLASSROOM DEMO SUMMARY",
      "DEMO DATA ONLY — NOT A REAL TENANCY RECORD",
      "",
      `Property: ${DEMO_PROPERTY.title}`,
      `Location: ${DEMO_PROPERTY.address}`,
      `Monthly rent: ${formatMoney(DEMO_PROPERTY.monthlyRent)}`,
      `Security deposit: ${formatMoney(DEMO_PROPERTY.securityDeposit)}`,
      `Tenancy start: ${formatDate(DEMO_PROPERTY.startDate)}`,
      `Tenancy end: ${formatDate(DEMO_PROPERTY.endDate)}`,
      "",
      "Move-in checklist:",
      ...DEMO_CHECKLIST.map(
        (item, index) =>
          `${checklist.includes(index) ? "[x]" : "[ ]"} ${item}`
      ),
      "",
      "This file contains demonstration data and checklist progress only.",
    ].join("\n");

    const blob = new Blob([summary], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "RentSure-demo-summary.txt";
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Demo summary downloaded.");
  }

  return (
    <main className="tenant-home">
      <header className="tenant-home-topbar">
        <Link to="/dashboard" className="tenant-home-brand">
          <span className="tenant-home-brand-icon">
            <Building2 size={22} />
          </span>
          <span>
            Rent<span>Sure</span>
          </span>
        </Link>

        <nav className="tenant-home-nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/properties">Explore properties</Link>
          <Link to="/tenant/uploads" className="tenant-home-nav-cta">
            <ClipboardCheck size={16} />
            Property evidence
          </Link>
        </nav>
      </header>

      <section className="tenant-home-hero">
        <div className="tenant-home-hero-copy">
          <span className="tenant-home-eyebrow">
            <ShieldCheck size={15} />
            RENTSure TENANT SPACE
          </span>
          <h1>
            Welcome home,
            <br />
            <span>{firstName}.</span>
          </h1>
          <p>
            Explore your rental details, review property photos, plan your
            budget, and organise your move-in checklist.
          </p>
          <div className="tenant-home-hero-actions">
            <a href="#my-rental" className="tenant-home-primary">
              View rental <ArrowRight size={17} />
            </a>
            <button
              type="button"
              className="tenant-home-secondary"
              onClick={() => setShowCalculator(true)}
            >
              <Calculator size={17} />
              Rent calculator
            </button>
          </div>
        </div>

        <div className="tenant-home-hero-art" aria-hidden="true">
          <div className="tenant-home-art-orbit tenant-home-orbit-one" />
          <div className="tenant-home-art-orbit tenant-home-orbit-two" />
          <div className="tenant-home-art-house">
            <Home size={62} strokeWidth={1.35} />
          </div>
          <div className="tenant-home-art-note">
            <CheckCircle2 size={17} />
            Your space, your records
          </div>
          <div className="tenant-home-art-sparkle">✦</div>
        </div>
      </section>

      <section className="tenant-home-content" id="my-rental">
        <div className="tenant-home-section-heading">
          <div>
            <span className="tenant-home-kicker">YOUR RENTAL</span>
            <h2>Your home at a glance</h2>
            <p>
              Review the property details and the photos available to your
              account.
            </p>
          </div>
          <div className="tenant-home-heading-actions">
            <button
              type="button"
              className="tenant-home-refresh"
              onClick={() => setRefreshKey((value) => value + 1)}
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh real data
            </button>
            <button
              type="button"
              className="tenant-home-demo-toggle"
              onClick={() => {
                setDemoMode((value) => !value);
                setNotice("");
              }}
            >
              {demoMode ? "Show real data" : "Show demo"}
            </button>
          </div>
        </div>

        {demoMode && (
          <div className="tenant-home-demo-banner">
            <span className="tenant-home-demo-dot" />
            <div>
              <strong>Classroom Demo Mode</strong>
              <p>
                Sample property data is being shown for demonstration.
                It is not a real tenancy and is not saved to your database.
              </p>
            </div>
            <span className="tenant-home-demo-label">SAMPLE DATA</span>
          </div>
        )}

        {error && (
          <div className="tenant-home-alert" role="alert">
            <strong>Real tenancy data could not be loaded.</strong>
            <p>{error} Demo mode is available so you can continue presenting.</p>
            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
            >
              Try again
            </button>
          </div>
        )}

        {notice && (
          <div className="tenant-home-notice" role="status">
            <CheckCircle2 size={17} />
            {notice}
          </div>
        )}

        {loading && (
          <div className="tenant-home-loading">
            <RefreshCw size={25} className="tenant-home-spin" />
            <p>Checking your linked tenancy…</p>
          </div>
        )}

        {!loading && !demoMode && effectiveRentals.length === 0 && (
          <div className="tenant-home-empty">
            <div className="tenant-home-empty-icon">
              <Home size={30} />
            </div>
            <span className="tenant-home-kicker">YOUR NEXT CHAPTER</span>
            <h3>No tenancy linked yet</h3>
            <p>
              Your real rental details will appear after a landlord links a
              tenancy to your account. You can switch to demo mode for a
              classroom presentation.
            </p>
            <button
              type="button"
              className="tenant-home-primary"
              onClick={() => setDemoMode(true)}
            >
              Launch demo <ArrowRight size={17} />
            </button>
          </div>
        )}

        {!loading && effectiveRentals.length > 0 && (
          <div className="tenant-home-property-list">
            {effectiveRentals.map(({ tenancy, property, propertyKey, photos }) => {
              const title =
                property.title ||
                property.property_title ||
                tenancy.property_title ||
                "Your rented home";

              const location = [
                property.address || tenancy.address,
                property.locality || tenancy.locality,
                property.city || tenancy.city,
              ]
                .filter(Boolean)
                .filter((value, index, values) => values.indexOf(value) === index)
                .join(", ");

              const rent =
                tenancy.monthly_rent ??
                tenancy.monthlyRent ??
                property.monthlyRent ??
                property.monthly_rent ??
                property.rent ??
                property.price ??
                0;

              const selectedIndex = activePhotos[propertyKey] || 0;
              const selectedPhoto = photos[selectedIndex];
              const fallback = property.imageUrl || property.image_url || property.image;
              const heroImage = selectedPhoto?.image_url || fallback;

              return (
                <article className="tenant-home-property-card" key={tenancy.id}>
                  <div className="tenant-home-property-heading">
                    <div>
                      <span className="tenant-home-status">
                        <CheckCircle2 size={14} />
                        {demoMode ? "DEMO RENTAL" : "LINKED TENANCY"}
                      </span>
                      <h3>{title}</h3>
                      <p className="tenant-home-location">
                        <MapPin size={15} />
                        {location || "Location not provided"}
                      </p>
                    </div>
                    <span className="tenant-home-tenancy-tag">
                      <ShieldCheck size={15} />
                      {demoMode ? "Sample record" : "Your rental"}
                    </span>
                  </div>

                  <div className="tenant-home-property-layout">
                    <div className="tenant-home-gallery">
                      <div className="tenant-home-main-photo">
                        {heroImage ? (
                          <img src={heroImage} alt={selectedPhoto?.alt_text || title} />
                        ) : (
                          <div className="tenant-home-no-photo">
                            <ImageIcon size={42} />
                            <strong>No property photos available</strong>
                            <span>
                              Photos uploaded by your landlord will appear here.
                            </span>
                          </div>
                        )}
                        {selectedPhoto?.is_cover && (
                          <span className="tenant-home-cover-label">
                            <CheckCircle2 size={13} /> Cover photo
                          </span>
                        )}
                      </div>

                      {photos.length > 0 && (
                        <div className="tenant-home-thumbnails">
                          {photos.map((photo, index) => (
                            <button
                              type="button"
                              key={photo.id || photo.image_url || index}
                              className={
                                selectedIndex === index
                                  ? "tenant-home-thumbnail active"
                                  : "tenant-home-thumbnail"
                              }
                              onClick={() =>
                                setActivePhotos((current) => ({
                                  ...current,
                                  [propertyKey]: index,
                                }))
                              }
                              aria-label={`View property photo ${index + 1}`}
                              aria-pressed={selectedIndex === index}
                            >
                              <img
                                src={photo.image_url}
                                alt={photo.alt_text || `Property photo ${index + 1}`}
                              />
                            </button>
                          ))}
                        </div>
                      )}

                      <p className="tenant-home-gallery-note">
                        <ShieldCheck size={14} />
                        {demoMode
                          ? "Sample photos for classroom demonstration."
                          : "Property photos are view-only for tenants."}
                      </p>
                    </div>

                    <div className="tenant-home-details">
                      <div className="tenant-home-rent-panel">
                        <span>Monthly rent</span>
                        <strong>{formatMoney(rent)}</strong>
                      </div>
                      <div className="tenant-home-detail-row">
                        <span>Property type</span>
                        <strong>
                          {property.propertyType ||
                            property.property_type ||
                            "Not provided"}
                        </strong>
                      </div>
                      <div className="tenant-home-detail-row">
                        <span>Security deposit</span>
                        <strong>
                          {formatMoney(
                            tenancy.security_deposit ??
                              tenancy.securityDeposit ??
                              property.securityDeposit ??
                              property.security_deposit ??
                              0
                          )}
                        </strong>
                      </div>
                      <div className="tenant-home-detail-row">
                        <span>Tenancy start</span>
                        <strong>
                          {formatDate(
                            tenancy.start_date ??
                              tenancy.startDate ??
                              property.startDate
                          )}
                        </strong>
                      </div>
                      <div className="tenant-home-detail-row">
                        <span>Tenancy end</span>
                        <strong>
                          {formatDate(
                            tenancy.end_date ??
                              tenancy.endDate ??
                              property.endDate
                          )}
                        </strong>
                      </div>
                      <div className="tenant-home-detail-row">
                        <span>Bedrooms</span>
                        <strong>{property.bedrooms ?? "Not provided"}</strong>
                      </div>
                      <div className="tenant-home-detail-row">
                        <span>Furnishing</span>
                        <strong>{property.furnishing || "Not provided"}</strong>
                      </div>
                      {!demoMode && getPropertyId(tenancy) != null && (
                        <Link
                          to={`/properties/${getPropertyId(tenancy)}`}
                          className="tenant-home-detail-link"
                        >
                          View property details <ArrowRight size={16} />
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="tenant-home-property-actions">
                    <Link to="/tenant/uploads">
                      <ClipboardCheck size={18} />
                      <span>
                        <strong>Condition evidence</strong>
                        <small>Record property condition with photos.</small>
                      </span>
                      <ArrowRight size={17} />
                    </Link>
                    <button
                      type="button"
                      className="tenant-home-action-button"
                      onClick={() => setShowCalculator(true)}
                    >
                      <Wallet size={18} />
                      <span>
                        <strong>Rent affordability</strong>
                        <small>Estimate your monthly budget.</small>
                      </span>
                      <ArrowRight size={17} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {demoMode && !loading && (
          <div className="tenant-home-demo-grid">
            <section className="tenant-home-demo-card">
              <div className="tenant-home-demo-card-heading">
                <span className="tenant-home-demo-icon">
                  <ClipboardCheck size={20} />
                </span>
                <div>
                  <h3>Move-in readiness checklist</h3>
                  <p>Click each item as you complete the inspection.</p>
                </div>
              </div>

              <div className="tenant-home-checklist">
                {DEMO_CHECKLIST.map((item, index) => (
                  <label className="tenant-home-check-item" key={item}>
                    <input
                      type="checkbox"
                      checked={checklist.includes(index)}
                      onChange={() => toggleChecklist(index)}
                    />
                    <span>{item}</span>
                    {checklist.includes(index) && (
                      <CheckCircle2 size={17} />
                    )}
                  </label>
                ))}
              </div>

              <div className="tenant-home-check-progress">
                <div>
                  <span>Inspection progress</span>
                  <strong>
                    {checklist.length}/{DEMO_CHECKLIST.length}
                  </strong>
                </div>
                <div className="tenant-home-progress-track">
                  <div
                    className="tenant-home-progress-fill"
                    style={{
                      width: `${(checklist.length / DEMO_CHECKLIST.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                className="tenant-home-primary tenant-home-download"
                onClick={downloadDemoSummary}
              >
                Download demo summary <ArrowRight size={16} />
              </button>
            </section>

            <section className="tenant-home-demo-card tenant-home-budget-card">
              <div className="tenant-home-demo-card-heading">
                <span className="tenant-home-demo-icon">
                  <Calculator size={20} />
                </span>
                <div>
                  <h3>Monthly budget snapshot</h3>
                  <p>Adjust income and expenses in the calculator.</p>
                </div>
              </div>
              <div className="tenant-home-budget-number">
                {formatMoney(DEMO_PROPERTY.monthlyRent)}
                <span>Sample monthly rent</span>
              </div>
              <div className="tenant-home-budget-stat">
                <span>Rent as share of sample income</span>
                <strong>{rentRatio.toFixed(0)}%</strong>
              </div>
              <div className="tenant-home-budget-stat">
                <span>Estimated money remaining</span>
                <strong className={remaining < 0 ? "is-negative" : ""}>
                  {formatMoney(remaining)}
                </strong>
              </div>
              <button
                type="button"
                className="tenant-home-secondary tenant-home-calculator-button"
                onClick={() => setShowCalculator(true)}
              >
                Open affordability calculator <ArrowRight size={16} />
              </button>
            </section>
          </div>
        )}

        <section className="tenant-home-help">
          <div className="tenant-home-help-icon">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3>Keep your rental records organised</h3>
            <p>
              Use condition evidence to record move-in, periodic, and move-out
              observations. Demo checklist progress is local and does not
              create a real evidence record.
            </p>
          </div>
          <Link to="/tenant/uploads">
            Open evidence <ArrowRight size={16} />
          </Link>
        </section>
      </section>

      <footer className="tenant-home-footer">
        <span>© {new Date().getFullYear()} RentSure</span>
        <span>Rent smarter. Move forward.</span>
      </footer>

      {showCalculator && (
        <div
          className="tenant-home-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowCalculator(false);
            }
          }}
        >
          <section
            className="tenant-home-calculator-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tenant-calculator-title"
          >
            <div className="tenant-home-modal-heading">
              <div>
                <span className="tenant-home-kicker">RENT PLANNER</span>
                <h2 id="tenant-calculator-title">Can you afford this rent?</h2>
              </div>
              <button
                type="button"
                className="tenant-home-modal-close"
                aria-label="Close calculator"
                onClick={() => setShowCalculator(false)}
              >
                <X size={20} />
              </button>
            </div>

            <label className="tenant-home-field">
              Monthly take-home income (₹)
              <input
                type="number"
                min="0"
                value={monthlyIncome}
                onChange={(event) => setMonthlyIncome(event.target.value)}
              />
            </label>

            <label className="tenant-home-field">
              Other monthly expenses (₹)
              <input
                type="number"
                min="0"
                value={otherExpenses}
                onChange={(event) => setOtherExpenses(event.target.value)}
              />
            </label>

            <div className="tenant-home-field">
              Monthly rent
              <div className="tenant-home-fixed-rent">
                {formatMoney(DEMO_PROPERTY.monthlyRent)}
                <span>Demo property</span>
              </div>
            </div>

            <div className="tenant-home-calculator-result">
              <span>Estimated amount remaining each month</span>
              <strong className={remaining < 0 ? "is-negative" : ""}>
                {formatMoney(remaining)}
              </strong>
              <p>
                Rent is {rentRatio.toFixed(1)}% of your stated income.
                {income === 0
                  ? " Enter your income to calculate affordability."
                  : remaining < 0
                    ? " Your listed rent and expenses exceed your income."
                    : rentRatio > 30
                      ? " Rent is above 30% of income; review your budget carefully."
                      : " This rent is within a common 30% guideline, but consider your other needs too."}
              </p>
            </div>

            <button
              type="button"
              className="tenant-home-primary tenant-home-modal-done"
              onClick={() => setShowCalculator(false)}
            >
              Done <CheckCircle2 size={17} />
            </button>
            <p className="tenant-home-calculator-disclaimer">
              This is a budgeting estimate, not financial advice. The rent
              amount is sample data while Demo Mode is active.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
