
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  Calculator,
  CheckCircle2,
  ClipboardList,
  Compass,
  Eye,
  Heart,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  MoreVertical,
  PlusCircle,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
  ChartNoAxesColumnIncreasing,
  Send,
  Clock3,
  CheckCircle,
  UserRound,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import api from "./api";
import "./DashboardPage.css";

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "—";

  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getPropertyTitle(property) {
  return property.title || property.name || "Untitled property";
}

function getPropertyRent(property) {
  return property.monthlyRent ?? property.monthly_rent ?? property.rent;
}

function getPropertyCity(property) {
  return property.city || property.address || "Location not specified";
}

function PropertyViewsPanel() {
  const [period, setPeriod] = useState("30");
  const analytics = {
    "7": {
      total: 86,
      change: "+12%",
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      values: [8, 13, 10, 17, 12, 15, 11],
    },
    "30": {
      total: 342,
      change: "+18%",
      labels: ["Wk 1", "Wk 2", "Wk 3", "Wk 4"],
      values: [58, 76, 91, 117],
    },
    "90": {
      total: 968,
      change: "+24%",
      labels: ["Month 1", "Month 2", "Month 3"],
      values: [260, 318, 390],
    },
  }[period];

  const maxValue = Math.max(...analytics.values);
  const average = Math.round(analytics.total / analytics.values.length);

  return (
    <section id="analytics" className="dashboard-panel dashboard-views-panel">
      <div className="dashboard-panel-heading">
        <span className="dashboard-panel-icon">
          <ChartNoAxesColumnIncreasing size={21} />
        </span>
        <div>
          <h3>Property views</h3>
          <p>Understand how renters discover your listings</p>
        </div>
        <label className="dashboard-chart-period-select">
          <span className="sr-only">Analytics date range</span>
          <select value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </label>
      </div>

      <div className="dashboard-analytics-summary">
        <div>
          <span>Total property views</span>
          <strong>{analytics.total.toLocaleString("en-IN")}</strong>
          <small className="dashboard-analytics-change">{analytics.change} in this sample period</small>
        </div>
        <div>
          <span>Average per period</span>
          <strong>{average.toLocaleString("en-IN")}</strong>
          <small>{period === "7" ? "views per day" : period === "30" ? "views per week" : "views per month"}</small>
        </div>
      </div>

      <div className="dashboard-analytics-chart" role="img" aria-label={`Sample property views for the last ${period} days`}>
        <div className="dashboard-analytics-y-axis" aria-hidden="true">
          <span>{maxValue}</span>
          <span>{Math.round(maxValue * 0.75)}</span>
          <span>{Math.round(maxValue * 0.5)}</span>
          <span>{Math.round(maxValue * 0.25)}</span>
          <span>0</span>
        </div>
        <div className="dashboard-analytics-bars">
          {[...analytics.values].map((value, index) => (
            <div className="dashboard-analytics-bar-column" key={`${period}-${analytics.labels[index]}`}>
              <div className="dashboard-analytics-bar-track">
                <div
                  className="dashboard-analytics-bar"
                  style={{ height: `${Math.max(5, (value / maxValue) * 100)}%` }}
                  title={`${value} sample views`}
                />
              </div>
              <span>{analytics.labels[index]}</span>
              <small>{value}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-chart-footer">
        <span>
          <span className="dashboard-chart-legend-dot" />
          Property listing views
        </span>
        <span>Interactive sample analytics</span>
      </div>
      <p className="dashboard-analytics-disclaimer">
        Demo data for the prototype. Real view counts will require property-view tracking in the backend.
      </p>
    </section>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();

  const [myProperties, setMyProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertiesError, setPropertiesError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prototypeNotice, setPrototypeNotice] = useState("");
  const [workspaceView, setWorkspaceView] = useState("overview");
  const [activeConversation, setActiveConversation] = useState("maya");
  const [messageDraft, setMessageDraft] = useState("");
  const [demoMessages, setDemoMessages] = useState([
    { id: 1, conversation: "maya", from: "Maya Sharma", text: "Hi! Is the apartment still available for a visit this weekend?", time: "10:12 AM", own: false },
    { id: 2, conversation: "maya", from: "You", text: "Hi Maya, yes. Saturday afternoon works well. I can share the viewing details shortly.", time: "10:18 AM", own: true },
    { id: 3, conversation: "arjun", from: "Arjun Mehta", text: "Could you please confirm whether parking is included in the rent?", time: "Yesterday", own: false },
  ]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [depositInputs, setDepositInputs] = useState({
    monthlyRent: "15000",
    securityDeposit: "30000",
    advanceMonths: "1",
    brokerage: "0",
    movingCosts: "3000",
    otherCosts: "0",
    availableBudget: "",
  });

  const role = String(user?.role || "tenant").toLowerCase();
  const isLandlord = role === "landlord";
  const name = user?.fullName || user?.full_name || "RentSure User";
  const firstName = name.trim().split(/\s+/)[0] || "there";
  const isNavActive = (path) => pathname === path || (path === "/properties" && pathname.startsWith("/properties/"));

  useEffect(() => {
    let active = true;

    async function loadProperties() {
      if (!isLandlord) {
        setPropertiesLoading(false);
        return;
      }

      setPropertiesLoading(true);
      setPropertiesError(false);

      try {
        const result = await api.get("/properties/mine");
        const rows = Array.isArray(result)
          ? result
          : result?.properties ||
            result?.data?.properties ||
            result?.data ||
            [];

        if (active) {
          setMyProperties(Array.isArray(rows) ? rows : []);
        }
      } catch {
        if (active) {
          setMyProperties([]);
          setPropertiesError(true);
        }
      } finally {
        if (active) setPropertiesLoading(false);
      }
    }

    loadProperties();

    return () => {
      active = false;
    };
  }, [isLandlord]);

  useEffect(() => {
    if (!hash) return;

    const targetId = hash.slice(1);
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [hash, workspaceView]);

  const savedCount = useMemo(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("rentsure_favorites") || "[]"
      );
      return Array.isArray(saved) ? saved.length : 0;
    } catch {
      return 0;
    }
  }, []);

  const filteredProperties = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return myProperties.slice(0, 5);

    return myProperties
      .filter((property) => {
        const searchable = [
          getPropertyTitle(property),
          getPropertyCity(property),
          property.address,
          property.propertyType,
          property.property_type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      })
      .slice(0, 5);
  }, [myProperties, searchTerm]);

function handleLogout() {
  logout();
  navigate("/login", { replace: true });
}
  function handlePropertySearch(event) {
    event.preventDefault();
    const query = searchTerm.trim();

    navigate(
      query
        ? `/properties?search=${encodeURIComponent(query)}`
        : "/properties"
    );
  }

  function updateDepositInput(event) {
    const { name, value } = event.target;
    if (value !== "" && Number(value) < 0) return;
    setDepositInputs((current) => ({ ...current, [name]: value }));
  }

  const monthlyRentAmount = Math.max(0, Number(depositInputs.monthlyRent) || 0);
  const securityDepositAmount = Math.max(0, Number(depositInputs.securityDeposit) || 0);
  const advanceRentAmount =
    monthlyRentAmount * Math.max(0, Number(depositInputs.advanceMonths) || 0);
  const brokerageAmount = Math.max(0, Number(depositInputs.brokerage) || 0);
  const movingCostsAmount = Math.max(0, Number(depositInputs.movingCosts) || 0);
  const otherCostsAmount = Math.max(0, Number(depositInputs.otherCosts) || 0);
  const upfrontTotal =
    securityDepositAmount +
    advanceRentAmount +
    brokerageAmount +
    movingCostsAmount +
    otherCostsAmount;
  const budgetAmount =
    depositInputs.availableBudget === ""
      ? null
      : Math.max(0, Number(depositInputs.availableBudget) || 0);
  const budgetDifference =
    budgetAmount === null ? null : budgetAmount - upfrontTotal;
  const stats = isLandlord
    ? [
        {
          label: "Your listings",
          value: propertiesLoading ? "…" : myProperties.length,
          note: "Properties in your workspace",
          icon: Building2,
          tone: "violet",
          to: "/my-properties",
        },
        {
          label: "Applications",
          value: "3",
          note: "Sample enquiries in this prototype",
          icon: ClipboardList,
          tone: "green",
          to: null,
          action: "applications",
        },
        {
          label: "Rental income",
          value: formatCurrency(myProperties.reduce((sum, property) => sum + (Number(property.monthly_rent ?? property.monthlyRent ?? property.rent) || 0), 0)),
          note: "Potential monthly rent from your listings",
          icon: Wallet,
          tone: "peach",
          to: null,
          action: "income",
        },
        {
          label: "Profile views",
          value: "View",
          note: "Open your listing performance overview",
          icon: Eye,
          tone: "pink",
          to: null,
          action: "analytics",
        },
      ]
    : [
        {
          label: "Saved properties",
          value: savedCount,
          note: "Homes saved in this browser",
          icon: Heart,
          tone: "violet",
          to: "/properties",
        },
        {
          label: "Applications",
          value: "3",
          note: "Sample enquiries in this prototype",
          icon: ClipboardList,
          tone: "green",
          to: null,
          action: "applications",
        },
        {
          label: "Deposit planning",
          value: "Ready",
          note: "Estimate your upfront rental costs",
          icon: Wallet,
          tone: "peach",
          to: "/dashboard#deposit-plans",
        },
        {
          label: "Rental search",
          value: "Explore",
          note: "Find a place that suits you",
          icon: Compass,
          tone: "pink",
          to: "/properties",
        },
      ];

  const quickActions = isLandlord
    ? [
        {
          title: "Add a new property",
          detail: "List a rental property",
          icon: PlusCircle,
          to: "/my-properties",
        },
        {
          title: "Manage my properties",
          detail: "Edit or remove listings",
          icon: Building2,
          to: "/my-properties",
        },
        {
          title: "Find properties",
          detail: "Preview the public marketplace",
          icon: Search,
          to: "/properties",
        },
        {
          title: "View analytics",
          detail: "Review property view trends",
          icon: TrendingUp,
          to: "/dashboard#analytics",
        },
      ]
    : [
        {
          title: "Find a property",
          detail: "Browse available rentals",
          icon: Search,
          to: "/properties",
        },
        {
          title: "Saved properties",
          detail: "Return to homes you like",
          icon: Heart,
          to: "/properties",
        },
        {
          title: "Plan your deposit",
          detail: "Estimate your upfront costs",
          icon: Wallet,
          to: "/dashboard#deposit-plans",
        },
        {
          title: "My applications",
          detail: "Application tracking coming soon",
          icon: ClipboardList,
          to: null,
        },
      ];

  return (
    <main
      className={`dashboard-page ${
        isLandlord ? "dashboard-landlord" : "dashboard-tenant"
      }`}
    >
      {sidebarOpen && (
        <button
          className="dashboard-sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`dashboard-sidebar ${
          sidebarOpen ? "dashboard-sidebar-open" : ""
        }`}
        aria-label="Main navigation"
      >
        <div className="dashboard-sidebar-top">
          <Link
            to="/dashboard"
            className="dashboard-brand"
            aria-label="RentSure dashboard"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="dashboard-brand-icon">
              <Home size={22} strokeWidth={2.3} />
            </span>
            <span className="dashboard-brand-word">
              Rent<span>Sure</span>
            </span>
          </Link>

          <button
            className="dashboard-mobile-close"
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="dashboard-sidebar-label">YOUR WORKSPACE</div>

        <nav className="dashboard-nav" aria-label="Workspace">
          <Link
            to="/dashboard"
            className={`dashboard-nav-item ${workspaceView === "overview" && isNavActive("/dashboard") ? "active" : ""}`}
            aria-current={workspaceView === "overview" && isNavActive("/dashboard") ? "page" : undefined}
            onClick={() => {
              setSidebarOpen(false);
              setPrototypeNotice("");
              setWorkspaceView("overview");
            }}
          >
            <Building2 size={18} />
            <span>Overview</span>
          </Link>

          <Link
            to="/properties"
            className={`dashboard-nav-item ${isNavActive("/properties") ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Search size={18} />
            <span>Find Properties</span>
            <ArrowUpRight
              size={15}
              className="dashboard-property-arrow"
            />
          </Link>

          {isLandlord ? (
            <Link
              to="/my-properties"
              className={`dashboard-nav-item ${isNavActive("/my-properties") || isNavActive("/landlord/properties") ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Home size={18} />
              <span>My properties</span>
              <ArrowUpRight
                size={15}
                className="dashboard-property-arrow"
              />
            </Link>
          ) : (
            <Link
              to="/dashboard#saved-homes"
              className={`dashboard-nav-item ${pathname === "/dashboard" && hash === "#saved-homes" ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Heart size={18} />
              <span>Saved properties</span>
            </Link>
          )}

          <button
            type="button"
            className={`dashboard-nav-item dashboard-nav-button ${workspaceView === "applications" ? "active" : ""}`}
            onClick={() => {
              setSidebarOpen(false);
              setPrototypeNotice("");
              setWorkspaceView("applications");
            }}
          >
            <ClipboardList size={18} />
            <span>Applications</span>
            <span className="dashboard-coming-soon">3</span>
          </button>

          <button
            type="button"
            className={`dashboard-nav-item dashboard-nav-button ${workspaceView === "messages" ? "active" : ""}`}
            onClick={() => {
              setSidebarOpen(false);
              setPrototypeNotice("");
              setWorkspaceView("messages");
            }}
          >
            <MessageSquare size={18} />
            <span>Messages</span>
            <span className="dashboard-coming-soon">2</span>
          </button>

          <button
            type="button"
            className={`dashboard-nav-item dashboard-nav-button ${workspaceView === "deposit" ? "active" : ""}`}
            onClick={() => {
              setSidebarOpen(false);
              setPrototypeNotice("");
              setWorkspaceView("deposit");
            }}
          >
            <Wallet size={18} />
            <span>Deposit plans</span>
          </button>

          {isLandlord && (
            <button
              type="button"
              className={`dashboard-nav-item dashboard-nav-button ${workspaceView === "analytics" ? "active" : ""}`}
              aria-current={workspaceView === "analytics" ? "page" : undefined}
              onClick={() => {
                setSidebarOpen(false);
                setPrototypeNotice("");
                setWorkspaceView("analytics");
              }}
            >
              <TrendingUp size={18} />
              <span>Analytics</span>
            </button>
          )}
        </nav>

        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-upgrade-card">
            <span className="dashboard-upgrade-icon">
              <Sparkles size={18} />
            </span>
            <strong>
              {isLandlord ? "Grow your rentals" : "Find your next home"}
            </strong>
            <p>
              {isLandlord
                ? "Keep your listings up to date and easy to discover."
                : "Explore rentals and save the places you love."}
            </p>
            <Link
              to={isLandlord ? "/my-properties" : "/properties"}
              className="dashboard-upgrade-link"
            >
              {isLandlord ? "Manage listings" : "Explore homes"}
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="dashboard-security">
            <span className="dashboard-security-icon">
              <ShieldCheck size={19} />
            </span>
            <div>
              <strong>Account secured</strong>
              <span>Your session is protected</span>
            </div>
          </div>

          <button
            className="dashboard-logout"
            onClick={handleLogout}
            type="button"
          >
            <LogOut size={17} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <section className="dashboard-main">
        {prototypeNotice && (
          <div className="dashboard-prototype-notice" role="status">
            <span>{prototypeNotice}</span>
            <button type="button" onClick={() => setPrototypeNotice("")} aria-label="Dismiss notice">
              <X size={16} />
            </button>
          </div>
        )}
        <header className="dashboard-topbar">
          <button
            className="dashboard-mobile-menu"
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={21} />
          </button>

          <div className="dashboard-heading">
            <span className="dashboard-breadcrumb">
              WORKSPACE <span>/</span> {isLandlord ? "LANDLORD" : "TENANT"}
            </span>
            <h1>
              {workspaceView === "applications"
                ? "My applications"
                : workspaceView === "messages"
                  ? "Messages"
                  : workspaceView === "deposit"
                    ? "Deposit plans"
                    : workspaceView === "income"
                      ? "Rental income"
                      : workspaceView === "analytics"
                        ? "Listing analytics"
                        : isLandlord
                          ? "Landlord dashboard"
                          : "Tenant dashboard"}
            </h1>
            <p className="dashboard-topbar-subtitle">
              {workspaceView === "applications"
                ? "Track your rental enquiries and application progress."
                : workspaceView === "messages"
                  ? "Keep conversations with renters and landlords organised."
                  : workspaceView === "deposit"
                    ? "Estimate upfront move-in costs and compare them with your budget."
                    : workspaceView === "income"
                      ? "Estimate potential monthly rent from your current listings."
                      : workspaceView === "analytics"
                        ? "Review listing performance and practical next steps."
                        : isLandlord
                          ? "Your properties, organised in one place."
                          : "Your search for a better rental starts here."}
            </p>
          </div>

          <div className="dashboard-topbar-tools">
            <form className="dashboard-search" onSubmit={handlePropertySearch}>
              <Search size={17} />
              <input
                type="search"
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label="Search properties or cities"
              />
              <button type="submit" className="dashboard-search-submit">
                Search
              </button>
            </form>

            <button
              type="button"
              className="dashboard-notification-button"
              title="Notifications coming soon"
              aria-label="Notifications coming soon"
            >
              <Bell size={19} />
              <span />
            </button>

            <div className="dashboard-user">
              <div className="dashboard-avatar" aria-hidden="true">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="dashboard-user-info">
                <strong>{name}</strong>
                <span>{isLandlord ? "Landlord" : "Tenant"}</span>
              </div>
              <span className="dashboard-user-status" title="Signed in" />
            </div>
          </div>
        </header>

        {workspaceView === "applications" ? (
          <section className="workspace-page-content">
            <div className="workspace-page-intro">
              <div>
                <span className="dashboard-eyebrow">RENTAL ACTIVITY</span>
                <h2>Applications & enquiries</h2>
                <p>Review the status of your recent rental applications. These are prototype examples for your demo.</p>
              </div>
              <Link to="/properties" className="dashboard-primary-link">
                Find a property <ArrowRight size={16} />
              </Link>
            </div>

            <div className="workspace-stat-grid">
              <article className="workspace-stat-card">
                <span className="workspace-stat-icon purple"><ClipboardList size={20} /></span>
                <span>Total applications</span>
                <strong>3</strong>
                <small>Across your recent enquiries</small>
              </article>
              <article className="workspace-stat-card">
                <span className="workspace-stat-icon peach"><Clock3 size={20} /></span>
                <span>Awaiting response</span>
                <strong>1</strong>
                <small>Follow up when you're ready</small>
              </article>
              <article className="workspace-stat-card">
                <span className="workspace-stat-icon green"><CheckCircle size={20} /></span>
                <span>Viewing scheduled</span>
                <strong>1</strong>
                <small>A visit is being planned</small>
              </article>
            </div>

            <section className="dashboard-panel workspace-list-panel">
              <div className="dashboard-panel-heading">
                <span className="dashboard-panel-icon"><ClipboardList size={21} /></span>
                <div><h3>Recent applications</h3><p>Sample activity for the RentSure prototype</p></div>
                <span className="workspace-demo-pill">Demo data</span>
              </div>
              <div className="workspace-application-list">
                {[
                  { title: "Modern 2 BHK Apartment", location: "Sector 35, Chandigarh", date: "Applied 22 Oct 2026", status: "Viewing requested", kind: "purple", initials: "M2" },
                  { title: "Sunny Studio Apartment", location: "Kharar, Punjab", date: "Applied 20 Oct 2026", status: "Awaiting response", kind: "peach", initials: "SS" },
                  { title: "Family Home with Balcony", location: "Mohali, Punjab", date: "Applied 18 Oct 2026", status: "Shortlisted", kind: "green", initials: "FH" },
                ].map((item) => (
                  <article className="workspace-application-row" key={item.title}>
                    <div className={`workspace-property-thumb ${item.kind}`}><Home size={23} /><span>{item.initials}</span></div>
                    <div className="workspace-application-info">
                      <strong>{item.title}</strong>
                      <span>{item.location}</span>
                      <small>{item.date}</small>
                    </div>
                    <span className={`workspace-status-pill ${item.kind}`}>{item.status}</span>
                    <Link to="/properties" className="workspace-row-action">View listings <ArrowRight size={14} /></Link>
                  </article>
                ))}
              </div>
            </section>
            <p className="workspace-demo-disclaimer">Prototype view: these sample applications are not submitted to or stored by the backend.</p>
          </section>
        ) : workspaceView === "messages" ? (
          <section className="workspace-page-content">
            <div className="workspace-page-intro">
              <div>
                <span className="dashboard-eyebrow">YOUR INBOX</span>
                <h2>Conversations</h2>
                <p>Choose a conversation and send a demo reply. Messages stay in this page session.</p>
              </div>
              <span className="workspace-demo-pill">Interactive demo</span>
            </div>

            <section className="workspace-messages-shell">
              <aside className="workspace-conversation-list">
                <div className="workspace-inbox-heading"><strong>Inbox</strong><span>2 conversations</span></div>
                {[
                  { id: "maya", name: "Maya Sharma", property: "Modern 2 BHK Apartment", preview: "Saturday afternoon works well...", time: "10:18 AM", initial: "M" },
                  { id: "arjun", name: "Arjun Mehta", property: "Sunny Studio Apartment", preview: "Is parking included in the rent?", time: "Yesterday", initial: "A" },
                ].map((person) => (
                  <button
                    type="button"
                    key={person.id}
                    className={`workspace-conversation-item ${activeConversation === person.id ? "selected" : ""}`}
                    onClick={() => setActiveConversation(person.id)}
                  >
                    <span className="workspace-conversation-avatar">{person.initial}</span>
                    <span className="workspace-conversation-summary"><strong>{person.name}</strong><small>{person.property}</small><span>{person.preview}</span></span>
                    <time>{person.time}</time>
                  </button>
                ))}
              </aside>

              <div className="workspace-chat-panel">
                <div className="workspace-chat-header">
                  <span className="workspace-conversation-avatar">{activeConversation === "maya" ? "M" : "A"}</span>
                  <div><strong>{activeConversation === "maya" ? "Maya Sharma" : "Arjun Mehta"}</strong><span>{activeConversation === "maya" ? "Modern 2 BHK Apartment" : "Sunny Studio Apartment"}</span></div>
                  <span className="workspace-online-indicator">Prototype chat</span>
                </div>
                <div className="workspace-chat-messages" aria-live="polite">
                  {demoMessages.filter((message) => message.conversation === activeConversation).map((message) => (
                    <div key={message.id} className={`workspace-chat-message ${message.own ? "own" : ""}`}>
                      <span>{message.text}</span>
                      <small>{message.time}</small>
                    </div>
                  ))}
                </div>
                <form
                  className="workspace-chat-compose"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const text = messageDraft.trim();
                    if (!text) return;
                    setDemoMessages((current) => [...current, {
                      id: Date.now(),
                      conversation: activeConversation,
                      from: "You",
                      text,
                      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                      own: true,
                    }]);
                    setMessageDraft("");
                  }}
                >
                  <input
                    aria-label="Write a demo message"
                    value={messageDraft}
                    onChange={(event) => setMessageDraft(event.target.value)}
                    placeholder="Write a message..."
                    maxLength={500}
                  />
                  <button type="submit" aria-label="Send demo message" disabled={!messageDraft.trim()}><Send size={17} /> Send</button>
                </form>
                <p className="workspace-chat-disclaimer">Demo only — replies are stored in local page state and are not sent to another user.</p>
              </div>
            </section>
          </section>
        ) : workspaceView === "deposit" ? (
          <section className="workspace-page-content">
            <div className="workspace-page-intro">
              <div>
                <span className="dashboard-eyebrow">MOVE-IN BUDGET</span>
                <h2>Plan your deposit with confidence</h2>
                <p>Adjust the amounts below. Your estimated upfront total and budget gap update instantly.</p>
              </div>
              <button type="button" className="dashboard-primary-link workspace-reset-link" onClick={() => setDepositInputs({ monthlyRent: "15000", securityDeposit: "30000", advanceMonths: "1", brokerage: "0", movingCosts: "3000", otherCosts: "0", availableBudget: "" })}>Reset estimate</button>
            </div>
            <div className="deposit-calculator-layout workspace-deposit-layout">
              <div className="deposit-calculator-fields workspace-deposit-fields">
                <label>Monthly rent (₹)<input type="number" name="monthlyRent" min="0" step="500" value={depositInputs.monthlyRent} onChange={updateDepositInput} /></label>
                <label>Security deposit (₹)<input type="number" name="securityDeposit" min="0" step="500" value={depositInputs.securityDeposit} onChange={updateDepositInput} /></label>
                <label>Advance rent (months)<input type="number" name="advanceMonths" min="0" max="24" step="1" value={depositInputs.advanceMonths} onChange={updateDepositInput} /></label>
                <label>Brokerage (₹)<input type="number" name="brokerage" min="0" step="500" value={depositInputs.brokerage} onChange={updateDepositInput} /></label>
                <label>Moving costs (₹)<input type="number" name="movingCosts" min="0" step="500" value={depositInputs.movingCosts} onChange={updateDepositInput} /></label>
                <label>Other expenses (₹)<input type="number" name="otherCosts" min="0" step="500" value={depositInputs.otherCosts} onChange={updateDepositInput} /></label>
                <label className="deposit-budget-input">Available budget (₹) — optional<input type="number" name="availableBudget" min="0" step="500" placeholder="Enter your budget" value={depositInputs.availableBudget} onChange={updateDepositInput} /></label>
              </div>
              <aside className="deposit-calculator-result">
                <span className="deposit-result-kicker">ESTIMATED UPFRONT COST</span>
                <strong className="deposit-result-total">{formatCurrency(upfrontTotal)}</strong>
                <div className="deposit-result-breakdown">
                  <div><span>Security deposit</span><strong>{formatCurrency(securityDepositAmount)}</strong></div>
                  <div><span>Advance rent</span><strong>{formatCurrency(advanceRentAmount)}</strong></div>
                  <div><span>Brokerage</span><strong>{formatCurrency(brokerageAmount)}</strong></div>
                  <div><span>Moving costs</span><strong>{formatCurrency(movingCostsAmount)}</strong></div>
                  <div><span>Other expenses</span><strong>{formatCurrency(otherCostsAmount)}</strong></div>
                </div>
                {budgetDifference !== null && <div className={`deposit-budget-status ${budgetDifference >= 0 ? "is-covered" : "is-short"}`} role="status"><strong>{budgetDifference >= 0 ? "Budget covers your estimate" : "Additional savings needed"}</strong><span>{budgetDifference >= 0 ? `${formatCurrency(budgetDifference)} remaining` : `${formatCurrency(Math.abs(budgetDifference))} more needed`}</span></div>}
                <p className="deposit-calculator-note">Estimate only. Actual amounts depend on your rental agreement and fees.</p>
              </aside>
            </div>
            <div className="workspace-plan-method">
              <h3>How this estimate works</h3>
              <p><strong>Upfront total =</strong> security deposit + (monthly rent × advance months) + brokerage + moving costs + other expenses.</p>
              <p>Enter your available budget to see whether it covers the estimate. This calculator is for planning only; it does not approve financing or collect payments.</p>
            </div>
          </section>
        ) : workspaceView === "income" ? (
          <section className="workspace-page-content">
            <div className="workspace-page-intro"><div><span className="dashboard-eyebrow">LANDLORD SUMMARY</span><h2>Potential rental income</h2><p>Calculated from the monthly rent values on your current property listings.</p></div><Link to="/my-properties" className="dashboard-primary-link">Manage listings <ArrowRight size={16} /></Link></div>
            <div className="workspace-stat-grid"><article className="workspace-stat-card"><span className="workspace-stat-icon peach"><Wallet size={20} /></span><span>Potential monthly rent</span><strong>{formatCurrency(myProperties.reduce((sum, property) => sum + (Number(property.monthly_rent ?? property.monthlyRent ?? property.rent) || 0), 0))}</strong><small>Sum of listed monthly rents</small></article><article className="workspace-stat-card"><span className="workspace-stat-icon purple"><Building2 size={20} /></span><span>Listed properties</span><strong>{myProperties.length}</strong><small>{propertiesLoading ? "Loading listings…" : "Current landlord listings"}</small></article><article className="workspace-stat-card"><span className="workspace-stat-icon green"><Calculator size={20} /></span><span>Annualised estimate</span><strong>{formatCurrency(myProperties.reduce((sum, property) => sum + (Number(property.monthly_rent ?? property.monthlyRent ?? property.rent) || 0), 0) * 12)}</strong><small>Before vacancy, tax and expenses</small></article></div>
            <p className="workspace-demo-disclaimer">This is an estimate based on listed rents, not actual collected income or an accounting report.</p>
          </section>
        ) : workspaceView === "analytics" ? (
          <section className="workspace-page-content"><div className="workspace-page-intro"><div><span className="dashboard-eyebrow">LISTING PERFORMANCE</span><h2>Listing analytics</h2><p>View-tracking data isn't connected to the backend yet, so these cards show useful actions instead of invented view counts.</p></div><Link to="/my-properties" className="dashboard-primary-link">Review listings <ArrowRight size={16} /></Link></div><div className="workspace-stat-grid"><article className="workspace-stat-card"><span className="workspace-stat-icon purple"><Eye size={20} /></span><span>Listings published</span><strong>{myProperties.length}</strong><small>Current properties in your account</small></article><article className="workspace-stat-card"><span className="workspace-stat-icon peach"><Search size={20} /></span><span>Improve discoverability</span><strong>1</strong><small>Keep titles, rent and photos up to date</small></article><article className="workspace-stat-card"><span className="workspace-stat-icon green"><CheckCircle2 size={20} /></span><span>Next recommended action</span><strong>Review</strong><small>Check each listing's details for completeness</small></article></div><section className="dashboard-panel workspace-list-panel"><div className="dashboard-panel-heading"><span className="dashboard-panel-icon"><Eye size={21} /></span><div><h3>Performance checklist</h3><p>Practical steps to improve your listing</p></div></div><ul className="workspace-checklist"><li>Use a clear title and accurate address.</li><li>Set the monthly rent and security deposit correctly.</li><li>Add a detailed description and available amenities.</li><li>Keep property details up to date.</li></ul></section></section>
        ) : (
          <>
        <motion.section
          className="dashboard-welcome"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="dashboard-welcome-copy">
            <div className="dashboard-welcome-tag">
              <span className="dashboard-status-dot" />
              {isLandlord ? "LANDLORD WORKSPACE" : "YOUR RENTAL JOURNEY"}
            </div>

            <h2>
              {isLandlord ? (
                <>
                  Welcome back,
                  <br />
                  <span>{firstName}.</span>
                </>
              ) : (
                <>
                  Your next home
                  <br />
                  <span>starts here, {firstName}.</span>
                </>
              )}
            </h2>

            <p>
              {isLandlord
                ? "Manage your published listings, keep property information up to date, and preview what renters can see."
                : "Discover places that fit your lifestyle, save promising listings, and plan your move with more confidence."}
            </p>

            <Link
              to={isLandlord ? "/my-properties" : "/properties"}
              className="dashboard-primary-link"
            >
              {isLandlord ? "Manage my properties" : "Explore properties"}
              <ArrowRight size={17} />
            </Link>

            <div className="dashboard-welcome-note">
              <ShieldCheck size={15} />
              Your {isLandlord ? "landlord" : "tenant"} workspace is active
            </div>
          </div>

          <div className="dashboard-welcome-graphic" aria-hidden="true">
            <div className="dashboard-graphic-orbit orbit-one" />
            <div className="dashboard-graphic-orbit orbit-two" />
            <div className="dashboard-graphic-orbit orbit-three" />

            <motion.div
              className="dashboard-house-icon"
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {isLandlord ? (
                <Building2 size={46} strokeWidth={1.6} />
              ) : (
                <Home size={48} strokeWidth={1.55} />
              )}
            </motion.div>

            <div className="dashboard-graphic-chip">
              <Sparkles size={15} />
              {isLandlord
                ? "Your listings, your control"
                : "Find a place to belong"}
            </div>

            <span className="dashboard-graphic-spark spark-one">✦</span>
            <span className="dashboard-graphic-spark spark-two">✧</span>
          </div>
        </motion.section>

        <section className="dashboard-overview-section">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-eyebrow">AT A GLANCE</span>
              <h2>
                {isLandlord ? "Your property overview" : "Your rental overview"}
              </h2>
              <p>
                {isLandlord
                  ? "A quick look at the listings you manage."
                  : "A quick look at your saved places and next steps."}
              </p>
            </div>

            <span className="dashboard-live-status">
              <span className="dashboard-status-dot" />
              ACCOUNT ACTIVE
            </span>
          </div>

          <div className="dashboard-stats dashboard-stats-four">
            {stats.map((stat, index) => {
              const Icon = stat.icon;

              return (
                <motion.article
                  className={`dashboard-stat-card ${stat.action ? "dashboard-stat-card-clickable" : ""}`}
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.07 }}
                  whileHover={{ y: -4 }}
                  onClick={stat.action ? () => setWorkspaceView(stat.action) : undefined}
                  role={stat.action ? "button" : undefined}
                  tabIndex={stat.action ? 0 : undefined}
                  onKeyDown={stat.action ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setWorkspaceView(stat.action); } } : undefined}
                >
                  <div className="dashboard-stat-top">
                    <span className={`dashboard-stat-icon tone-${stat.tone}`}>
                      <Icon size={20} />
                    </span>

                    {stat.to ? (
                      <Link
                        to={stat.to}
                        className="dashboard-stat-arrow"
                        aria-label={`Open ${stat.label}`}
                      >
                        <ArrowUpRight size={17} />
                      </Link>
                    ) : (
                      <ArrowUpRight
                        size={17}
                        className="dashboard-stat-arrow"
                      />
                    )}
                  </div>

                  <p>{stat.label}</p>
                  <strong className="dashboard-stat-value">{stat.value}</strong>
                  <small>{stat.note}</small>
                </motion.article>
              );
            })}
          </div>
        </section>

        {isLandlord ? (
          <>
            <section className="dashboard-middle-grid">
              <PropertyViewsPanel />

              <section className="dashboard-panel dashboard-quick-panel">
                <div className="dashboard-panel-heading">
                  <span className="dashboard-panel-icon">
                    <Sparkles size={21} />
                  </span>
                  <div>
                    <h3>Quick actions</h3>
                    <p>Get things done faster</p>
                  </div>
                </div>

                <div className="dashboard-quick-grid">
                  {quickActions.map((action) => {
                    const Icon = action.icon;

                    const content = (
                      <>
                        <span className="dashboard-quick-icon">
                          <Icon size={20} />
                        </span>
                        <span className="dashboard-quick-copy">
                          <strong>{action.title}</strong>
                          <small>{action.detail}</small>
                        </span>
                        <ArrowRight
                          size={15}
                          className="dashboard-quick-arrow"
                        />
                      </>
                    );

                    return action.to ? (
                      <Link
                        key={action.title}
                        to={action.to}
                        className="dashboard-quick-action"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div
                        key={action.title}
                        className="dashboard-quick-action dashboard-quick-disabled"
                        title={action.detail}
                      >
                        {content}
                      </div>
                    );
                  })}
                </div>
              </section>
            </section>

            <section className="dashboard-panel dashboard-recent-panel">
              <div className="dashboard-panel-heading dashboard-recent-heading">
                <span className="dashboard-panel-icon">
                  <Building2 size={21} />
                </span>
                <div>
                  <h3>Recent properties</h3>
                  <p>Your latest listings</p>
                </div>

                <Link to="/my-properties" className="dashboard-view-all">
                  View all <ArrowRight size={15} />
                </Link>
              </div>

              {propertiesError && (
                <div className="dashboard-inline-message" role="status">
                  We couldn't load your properties. Please refresh or open My
                  Properties to try again.
                </div>
              )}

              <div className="dashboard-table-wrap">
                <table className="dashboard-property-table">
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Location</th>
                      <th>Rent</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {propertiesLoading ? (
                      <tr>
                        <td colSpan={5} className="dashboard-table-empty">
                          Loading your listings…
                        </td>
                      </tr>
                    ) : filteredProperties.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="dashboard-table-empty">
                          {searchTerm
                            ? "No listings match your search."
                            : "You haven't added any properties yet."}
                          <div>
                            <Link to="/my-properties">
                              {searchTerm
                                ? "Clear your search on this page"
                                : "Add your first property"}
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredProperties.map((property) => {
                        const id = property.id ?? property.property_id;
                        const title = getPropertyTitle(property);
                        const rent = getPropertyRent(property);
                        const city = getPropertyCity(property);

                        return (
                          <tr key={id ?? title}>
                            <td>
                              <div className="dashboard-table-property">
                                <span className="dashboard-table-property-icon">
                                  <Home size={19} />
                                </span>
                                <span>
                                  <strong>{title}</strong>
                                  <small>
                                    {property.propertyType ||
                                      property.property_type ||
                                      "Rental property"}
                                  </small>
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className="dashboard-table-location">
                                <Compass size={14} />
                                {city}
                              </span>
                            </td>
                            <td className="dashboard-table-rent">
                              {formatCurrency(rent)}
                              <small>/ month</small>
                            </td>
                            <td>
                              <span className="dashboard-property-status">
                                <span />
                                Listed
                              </span>
                            </td>
                            <td>
                              <div className="dashboard-table-actions">
                                <Link
                                  to="/my-properties"
                                  className="dashboard-edit-link"
                                >
                                  Edit
                                </Link>
                                <div className="dashboard-table-menu-wrap">
                                  <button
                                    type="button"
                                    className="dashboard-table-menu-button"
                                    aria-label={`More actions for ${title}`}
                                    aria-expanded={openMenuId === id}
                                    onClick={() =>
                                      setOpenMenuId(
                                        openMenuId === id ? null : id
                                      )
                                    }
                                  >
                                    <MoreVertical size={17} />
                                  </button>

                                  {openMenuId === id && (
                                    <div className="dashboard-table-menu">
                                      <Link
                                        to="/my-properties"
                                        onClick={() => setOpenMenuId(null)}
                                      >
                                        Manage listing
                                      </Link>
                                      <Link
                                        to={
                                          id
                                            ? `/properties/${id}`
                                            : "/properties"
                                        }
                                        onClick={() => setOpenMenuId(null)}
                                      >
                                        Preview listing
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <>
            
            {/* Tenant saved homes and deposit planning */}
            <section className="tenant-main-grid">
              <section id="saved-homes" className="dashboard-panel tenant-saved-panel">
                <div className="dashboard-panel-heading">
                  <span className="dashboard-panel-icon">
                    <Heart size={21} />
                  </span>
                  <div>
                    <h3>Your saved homes</h3>
                    <p>Keep your favourite places close</p>
                  </div>
                  <Link to="/properties" className="dashboard-view-all">
                    Explore <ArrowRight size={15} />
                  </Link>
                </div>

                <div className="tenant-saved-content">
                  <div className="tenant-saved-number">{savedCount}</div>
                  <div>
                    <strong>Saved properties</strong>
                    <p>
                      Your saved-home count is based on this browser. Browse
                      available rentals to find your next home.
                    </p>
                  </div>
                </div>

                <Link to="/properties" className="tenant-outline-link">
                  Find a place to live <ArrowRight size={16} />
                </Link>
              </section>

              <section className="dashboard-panel tenant-plan-panel">
                <div className="dashboard-panel-heading">
                  <span className="dashboard-panel-icon tone-peach">
                    <Wallet size={21} />
                  </span>
                  <div>
                    <h3>Plan your deposit</h3>
                    <p>Prepare for your next move</p>
                  </div>
                </div>

                <div className="tenant-plan-illustration">
                  <div className="tenant-plan-orbit">
                    <Wallet size={34} />
                  </div>
                  <div>
                    <strong>Move with confidence</strong>
                    <p>Plan your rental costs before you commit.</p>
                  </div>
                </div>

                <Link to="/dashboard#deposit-plans" className="tenant-outline-link">
                  Explore deposit planning <ArrowRight size={16} />
                </Link>
              </section>
            </section>

            <section
              id="deposit-plans"
              className="dashboard-panel deposit-calculator-panel"
              aria-labelledby="deposit-calculator-title"
            >
              <div className="dashboard-panel-heading">
                <span className="dashboard-panel-icon tone-peach">
                  <Wallet size={21} />
                </span>
                <div className="deposit-calculator-heading-copy">
                  <h3 id="deposit-calculator-title">Deposit plans calculator</h3>
                  <p>Estimate how much you need before moving in</p>
                </div>
                <button
                  type="button"
                  className="deposit-reset-button"
                  onClick={() =>
                    setDepositInputs({
                      monthlyRent: "15000",
                      securityDeposit: "30000",
                      advanceMonths: "1",
                      brokerage: "0",
                      movingCosts: "3000",
                      otherCosts: "0",
                      availableBudget: "",
                    })
                  }
                >
                  Reset calculator
                </button>
              </div>

              <div className="deposit-calculator-layout">
                <div className="deposit-calculator-fields">
                  <label>
                    Monthly rent (₹)
                    <input
                      type="number"
                      name="monthlyRent"
                      min="0"
                      step="500"
                      value={depositInputs.monthlyRent}
                      onChange={updateDepositInput}
                    />
                  </label>
                  <label>
                    Security deposit (₹)
                    <input
                      type="number"
                      name="securityDeposit"
                      min="0"
                      step="500"
                      value={depositInputs.securityDeposit}
                      onChange={updateDepositInput}
                    />
                  </label>
                  <label>
                    Advance rent (months)
                    <input
                      type="number"
                      name="advanceMonths"
                      min="0"
                      max="24"
                      step="1"
                      value={depositInputs.advanceMonths}
                      onChange={updateDepositInput}
                    />
                  </label>
                  <label>
                    Brokerage (₹)
                    <input
                      type="number"
                      name="brokerage"
                      min="0"
                      step="500"
                      value={depositInputs.brokerage}
                      onChange={updateDepositInput}
                    />
                  </label>
                  <label>
                    Moving costs (₹)
                    <input
                      type="number"
                      name="movingCosts"
                      min="0"
                      step="500"
                      value={depositInputs.movingCosts}
                      onChange={updateDepositInput}
                    />
                  </label>
                  <label>
                    Other expenses (₹)
                    <input
                      type="number"
                      name="otherCosts"
                      min="0"
                      step="500"
                      value={depositInputs.otherCosts}
                      onChange={updateDepositInput}
                    />
                  </label>
                  <label className="deposit-budget-input">
                    Available budget (₹) — optional
                    <input
                      type="number"
                      name="availableBudget"
                      min="0"
                      step="500"
                      placeholder="Enter your budget"
                      value={depositInputs.availableBudget}
                      onChange={updateDepositInput}
                    />
                  </label>
                </div>

                <aside className="deposit-calculator-result">
                  <span className="deposit-result-kicker">ESTIMATED UPFRONT COST</span>
                  <strong className="deposit-result-total">
                    {formatCurrency(upfrontTotal)}
                  </strong>
                  <div className="deposit-result-breakdown">
                    <div><span>Security deposit</span><strong>{formatCurrency(securityDepositAmount)}</strong></div>
                    <div><span>Advance rent</span><strong>{formatCurrency(advanceRentAmount)}</strong></div>
                    <div><span>Brokerage</span><strong>{formatCurrency(brokerageAmount)}</strong></div>
                    <div><span>Moving costs</span><strong>{formatCurrency(movingCostsAmount)}</strong></div>
                    <div><span>Other expenses</span><strong>{formatCurrency(otherCostsAmount)}</strong></div>
                  </div>
                  {budgetDifference !== null && (
                    <div className={`deposit-budget-status ${budgetDifference >= 0 ? "is-covered" : "is-short"}`} role="status">
                      <strong>{budgetDifference >= 0 ? "Budget covers your estimate" : "Additional savings needed"}</strong>
                      <span>
                        {budgetDifference >= 0
                          ? `${formatCurrency(budgetDifference)} remaining`
                          : `${formatCurrency(Math.abs(budgetDifference))} more needed`}
                      </span>
                    </div>
                  )}
                  <p className="deposit-calculator-note">
                    This is an estimate. Actual deposits, advance rent, and fees depend on your rental agreement.
                  </p>
                </aside>
              </div>
            </section>

            {/* Tenant rental journey cards */}
            <section className="dashboard-panel tenant-steps-panel">
              <div className="dashboard-panel-heading">
                <span className="dashboard-panel-icon">
                  <Sparkles size={21} />
                </span>
                <div>
                  <h3>Your rental journey</h3>
                  <p>Simple steps to help you get started</p>
                </div>
              </div>

              <div className="tenant-steps-grid">
                <Link to="/properties" className="tenant-step-card">
                  <span className="tenant-step-number">01</span>
                  <span className="tenant-step-icon">
                    <Search size={21} />
                  </span>
                  <strong>Discover properties</strong>
                  <p>Browse rentals and explore available places.</p>
                  <span className="tenant-step-link">
                    Start exploring <ArrowRight size={14} />
                  </span>
                </Link>

                <Link to="/properties" className="tenant-step-card">
                  <span className="tenant-step-number">02</span>
                  <span className="tenant-step-icon tenant-step-icon-pink">
                    <Heart size={21} />
                  </span>
                  <strong>Save your favourites</strong>
                  <p>Keep the homes you like easy to find.</p>
                  <span className="tenant-step-link">
                    Browse homes <ArrowRight size={14} />
                  </span>
                </Link>

                <Link to="/dashboard#deposit-plans" className="tenant-step-card">
                  <span className="tenant-step-number">03</span>
                  <span className="tenant-step-icon tenant-step-icon-green">
                    <Wallet size={21} />
                  </span>
                  <strong>Plan your budget</strong>
                  <p>Estimate the upfront cost of your move.</p>
                  <span className="tenant-step-link">
                    Plan your deposit <ArrowRight size={14} />
                  </span>
                </Link>
              </div>
            </section>
          </>
        )}

        <section className="dashboard-next-card">
          <div className="dashboard-next-icon">
            <CheckCircle2 size={23} />
          </div>
          <div className="dashboard-next-copy">
            <span className="dashboard-eyebrow">YOUR WORKSPACE</span>
            <h3>
              {isLandlord
                ? "Your listings are within reach"
                : "Your rental search starts here"}
            </h3>
            <p>
              {isLandlord
                ? "Manage your properties, update listing details, and preview what renters can see."
                : "Browse available properties, save the ones you like, and return to your dashboard whenever you need."}
            </p>
          </div>
          <Link className="dashboard-back-link" to="/dashboard">
            Dashboard home
          </Link>
        </section>

          </>
        )}

        <footer className="dashboard-footer">
          <span>© {new Date().getFullYear()} RentSure</span>
          <span>Rent smarter. Move forward.</span>
        </footer>
      </section>
    </main>
  );
}
