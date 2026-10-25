
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Database,
  ExternalLink,
  Heart,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import api from "./api";
import "./PropertiesPage.css";

const PAGE_SIZE = 18;
const FAVORITES_KEY = "rentsure_favorites";

const propertyTypes = [
  { value: "flat", label: "Flat / Apartment" },
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
  { value: "builder floor", label: "Builder floor" },
  { value: "studio", label: "Studio" },
];

function parseRent(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const amount = Number(String(value).replace(/[₹,\s]/g, ""));
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function money(value) {
  const amount = parseRent(value);

  if (amount === null) return "Not available";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function normalizeProperty(property, source) {
  return {
    ...property,
    id: String(property.id ?? `${source}-unknown`),
    source,
    title: property.title || "Rental property",
    city: property.city || "",
    locality: property.locality || "",
    address: property.address || property.locality || "",
    monthlyRent:
      property.monthlyRent ??
      property.rent ??
      property.price ??
      property.priceDisplay ??
      null,
    securityDeposit: property.securityDeposit ?? null,
    imageUrl:
      property.imageUrl ||
      property.image ||
      property.images?.[0] ||
      null,
    listingUrl:
      property.listingUrl ||
      property.listing_url ||
      property.url ||
      null,
    bedrooms: property.bedrooms ?? property.bhk ?? null,
    bathrooms: property.bathrooms ?? null,
    area: property.area ?? property.size ?? null,
    areaUnit: property.areaUnit || "sqft",
    furnishing: property.furnishing || "",
    propertyType: property.propertyType || "Rental",
  };
}

function getFavorites() {
  try {
    const value = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function favoriteKey(property) {
  return `${property.source || "rentsure"}:${property.id}`;
}

export default function PropertiesPage() {
  const [source, setSource] = useState("rentsure");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [propertyType, setPropertyType] = useState("flat");
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    city: "",
    propertyType: "flat",
    minRent: "",
    maxRent: "",
  });

  const [properties, setProperties] = useState([]);
  const [favorites, setFavorites] = useState(getFavorites);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [sortBy, setSortBy] = useState("default");

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (err) {
      console.error("Could not save RentSure favourites:", err);
    }
  }, [favorites]);

  // Keep favourites in sync when the details page changes them.
  useEffect(() => {
    function syncFavorites() {
      const saved = getFavorites();
      setFavorites(saved);

      if (source === "saved") {
        setProperties(saved);
        setTotal(saved.length);
      }
    }

    function handleStorage(event) {
      if (event.key === FAVORITES_KEY) {
        syncFavorites();
      }
    }

    window.addEventListener("rentsure:favorites-updated", syncFavorites);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("rentsure:favorites-updated", syncFavorites);
      window.removeEventListener("storage", handleStorage);
    };
  }, [source]);

  useEffect(() => {
    let cancelled = false;

    async function loadProperties() {
      const filters = appliedFilters;
      const query = filters.search.trim();
      const selectedCity = filters.city.trim();
      const minimum = filters.minRent === "" ? null : Number(filters.minRent);
      const maximum = filters.maxRent === "" ? null : Number(filters.maxRent);

      if (
        (minimum !== null && (!Number.isFinite(minimum) || minimum < 0)) ||
        (maximum !== null && (!Number.isFinite(maximum) || maximum < 0)) ||
        (minimum !== null && maximum !== null && minimum > maximum)
      ) {
        setError("Please enter a valid rent range.");
        setProperties([]);
        setLoading(false);
        return;
      }

      if (source === "saved") {
        setLoading(false);
        setError("");
        setProperties(getFavorites());
        setTotal(getFavorites().length);
        setHasMore(false);
        return;
      }

      if (source === "external" && !selectedCity) {
        setProperties([]);
        setTotal(0);
        setHasMore(false);
        setError("");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        });

        let endpoint;

        if (source === "external") {
          endpoint = "/properties/external/search";
          params.set("city", selectedCity);
          params.set("propertyType", filters.propertyType);

          if (query) params.set("keyword", query);
          if (minimum !== null) params.set("minRent", String(minimum));
          if (maximum !== null) params.set("maxRent", String(maximum));
        } else if (source === "dataset") {
          endpoint = "/properties/dataset/search";

          if (selectedCity) params.set("city", selectedCity);
          if (query) params.set("keyword", query);
          if (minimum !== null) params.set("minRent", String(minimum));
          if (maximum !== null) params.set("maxRent", String(maximum));
        } else {
          endpoint = "/properties";

          if (selectedCity) params.set("city", selectedCity);
          if (query) params.set("search", query);
        }

        const result = await api.get(`${endpoint}?${params.toString()}`);

        if (cancelled) return;

        const records = Array.isArray(result.properties)
          ? result.properties
          : [];

        const normalized = records.map((item) =>
          normalizeProperty(item, source)
        );

        const filtered = normalized.filter((property) => {
          const rent = parseRent(property.monthlyRent);

          if (minimum === null && maximum === null) return true;
          if (rent === null) return false;
          if (minimum !== null && rent < minimum) return false;
          if (maximum !== null && rent > maximum) return false;

          return true;
        });

        setProperties(filtered);
        setTotal(Number(result.total ?? result.pagination?.total ?? records.length));
        setHasMore(
          Boolean(result.hasMore ?? result.pagination?.hasMore ?? false)
        );
      } catch (err) {
        if (cancelled) return;

        setError(err.message || "Unable to load properties.");
        setProperties([]);
        setTotal(0);
        setHasMore(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProperties();

    return () => {
      cancelled = true;
    };
  }, [source, page, appliedFilters, refreshKey]);

  function changeSource(nextSource) {
    setSource(nextSource);
    setPage(1);
    setError("");

    setAppliedFilters({
      search,
      city,
      propertyType,
      minRent,
      maxRent,
    });

    if (nextSource === "saved") {
      setProperties(getFavorites());
      setTotal(getFavorites().length);
      setHasMore(false);
    }
  }

  function handleSearch(event) {
    event?.preventDefault();

    setPage(1);
    setAppliedFilters({
      search,
      city,
      propertyType,
      minRent,
      maxRent,
    });
    setRefreshKey((value) => value + 1);
  }

  function resetFilters() {
    setSearch("");
    setCity("");
    setMinRent("");
    setMaxRent("");
    setPropertyType("flat");
    setPage(1);

    setAppliedFilters({
      search: "",
      city: "",
      minRent: "",
      maxRent: "",
      propertyType: "flat",
    });
  }

  function toggleFavorite(property) {
    const key = favoriteKey(property);

    setFavorites((current) => {
      const alreadySaved = current.some(
        (item) => favoriteKey(item) === key
      );

      const next = alreadySaved
        ? current.filter((item) => favoriteKey(item) !== key)
        : [...current, { ...property }];

      if (source === "saved") {
        setProperties(next);
        setTotal(next.length);
      }

      return next;
    });
  }

  const visibleProperties = useMemo(() => {
    const minimum =
      appliedFilters.minRent === "" ? null : Number(appliedFilters.minRent);
    const maximum =
      appliedFilters.maxRent === "" ? null : Number(appliedFilters.maxRent);
    const query = appliedFilters.search.trim().toLowerCase();
    const selectedCity = appliedFilters.city.trim().toLowerCase();

    let list = properties.filter((property) => {
      const rent = parseRent(property.monthlyRent);

      if ((minimum !== null || maximum !== null) && rent === null) {
        return false;
      }
      if (minimum !== null && rent < minimum) return false;
      if (maximum !== null && rent > maximum) return false;

      if (selectedCity) {
        const location = [
          property.city,
          property.locality,
          property.address,
        ].join(" ").toLowerCase();

        if (!location.includes(selectedCity)) return false;
      }

      if (query) {
        const text = [
          property.title,
          property.city,
          property.locality,
          property.address,
          property.propertyType,
        ].join(" ").toLowerCase();

        if (!text.includes(query)) return false;
      }

      return true;
    });

    if (sortBy === "low") {
      list = [...list].sort(
        (a, b) =>
          (parseRent(a.monthlyRent) ?? Infinity) -
          (parseRent(b.monthlyRent) ?? Infinity)
      );
    } else if (sortBy === "high") {
      list = [...list].sort(
        (a, b) =>
          (parseRent(b.monthlyRent) ?? -Infinity) -
          (parseRent(a.monthlyRent) ?? -Infinity)
      );
    }

    return list;
  }, [properties, appliedFilters, sortBy]);

  const sourceLabels = {
    rentsure: "RENTSURE DATABASE",
    external: "LIVE EXTERNAL LISTINGS",
    dataset: "CSV DATASET",
    saved: "SAVED PROPERTIES",
  };

  return (
    <main className="property-page">
      <header className="property-topbar">
        <Link to="/" className="property-brand">
          <span className="property-brand-icon">
            <Building2 size={21} />
          </span>
          <span>Rent<span>Sure</span></span>
        </Link>

        <nav className="property-topbar-actions">
          <Link to="/" className="property-nav-link">
            <ArrowLeft size={15} /> Home
          </Link>
          <Link to="/dashboard" className="property-nav-cta">
            My workspace <ArrowUpRight size={15} />
          </Link>
        </nav>
      </header>

      <section className="property-hero">
        <div className="property-hero-copy">
          <div className="property-eyebrow"><span />FIND YOUR NEXT HOME</div>
          <h1>A better way<br />to find <span>your place.</span></h1>
          <p>Explore rental listings across India, compare rents, and find a place that fits your needs.</p>
          <div className="property-trust">
            <ShieldCheck size={17} /> Compare rental listings from multiple sources
          </div>
        </div>

        <div className="property-hero-art" aria-hidden="true">
          <div className="property-art-ring property-art-ring-one" />
          <div className="property-art-ring property-art-ring-two" />
          <div className="property-art-house">
            <Building2 size={58} strokeWidth={1.4} />
          </div>
          <div className="property-art-caption">
            <MapPin size={14} /> Your next chapter starts here
          </div>
        </div>
      </section>

      <section className="property-content">
        <div className="property-section-heading">
          <div>
            <span className="property-section-kicker">EXPLORE RENTALS</span>
            <h2>{source === "saved" ? "Saved properties" : "Property listings"}</h2>
            <p>
              {source === "saved"
                ? "Your bookmarked homes, all in one place."
                : "Browse RentSure properties, live rental listings, and your imported house rent dataset."}
            </p>
          </div>

          <button
            type="button"
            className="property-refresh"
            onClick={() => {
              if (source === "saved") {
                const saved = getFavorites();
                setFavorites(saved);
                setProperties(saved);
                setTotal(saved.length);
              } else {
                setRefreshKey((value) => value + 1);
              }
            }}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "property-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="property-source-tabs" role="tablist" aria-label="Property source">
          <button type="button" role="tab" aria-selected={source === "rentsure"} className={source === "rentsure" ? "active" : ""} onClick={() => changeSource("rentsure")}>
            <ShieldCheck size={16} /> RentSure listings
          </button>

          <button type="button" role="tab" aria-selected={source === "external"} className={source === "external" ? "active" : ""} onClick={() => changeSource("external")}>
            <ExternalLink size={16} /> Live external listings
          </button>

          <button type="button" role="tab" aria-selected={source === "dataset"} className={source === "dataset" ? "active" : ""} onClick={() => changeSource("dataset")}>
            <Database size={16} /> CSV dataset
          </button>

          <button type="button" role="tab" aria-selected={source === "saved"} className={source === "saved" ? "active" : ""} onClick={() => changeSource("saved")}>
            <Heart size={16} fill={source === "saved" ? "currentColor" : "none"} />
            Saved properties ({favorites.length})
          </button>
        </div>

        {source === "dataset" && (
          <div className="property-source-note">
            <Database size={17} />
            <span>
              House_Rent_Dataset.csv is loaded automatically from the backend.
              These are historical records, not verified current availability.
            </span>
          </div>
        )}

        {source === "external" && (
          <div className="property-source-note">
            <ExternalLink size={15} />
            <span>
              Live listings are provided through Scrappa. Confirm availability
              and rental terms on the original listing website.
            </span>
          </div>
        )}

        {source !== "saved" && (
          <form className="property-filters property-filters-live" onSubmit={handleSearch}>
            <label className="property-search-box">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search property or locality..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <label className="property-city-box">
              <MapPin size={17} />
              <input
                type="text"
                placeholder={source === "external" ? "City (e.g. New Delhi)" : "Filter by city"}
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            </label>

            {source === "external" && (
              <label className="property-filter-select">
                <SlidersHorizontal size={16} />
                <select value={propertyType} onChange={(event) => setPropertyType(event.target.value)} aria-label="Property type">
                  {propertyTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="property-budget-field">
              <span>Min rent ₹</span>
              <input type="number" min="0" placeholder="Any" value={minRent} onChange={(event) => setMinRent(event.target.value)} />
            </label>

            <label className="property-budget-field">
              <span>Max rent ₹</span>
              <input type="number" min="0" placeholder="Any" value={maxRent} onChange={(event) => setMaxRent(event.target.value)} />
            </label>

            <button type="submit" className="property-apply-filters" disabled={loading}>
              Search
            </button>
          </form>
        )}

        <div className="property-results-row">
          <span>
            {loading
              ? "Loading properties..."
              : `${visibleProperties.length} listing${visibleProperties.length === 1 ? "" : "s"} shown`}
            {source !== "saved" && total > 0 ? ` · ${total.toLocaleString("en-IN")} records reported` : ""}
          </span>
          <span className="property-results-status">
            <span /> {sourceLabels[source]}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
          <select
            aria-label="Sort properties"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid #D9C4FF",
              background: "#FFF9F2",
              color: "#7027E8",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <option value="default">Default order</option>
            <option value="low">Rent: Low to High</option>
            <option value="high">Rent: High to Low</option>
          </select>
        </div>

        {error && (
          <div className="property-message property-error" role="alert">
            <strong>Unable to load properties</strong>
            <p>{error}</p>
            <button type="button" onClick={() => setRefreshKey((value) => value + 1)}>Try again</button>
          </div>
        )}

        {loading && (
          <div className="property-grid">
            {[1, 2, 3].map((item) => (
              <div className="property-skeleton" key={item}>
                <div /><span /><span /><span />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && visibleProperties.length > 0 && (
          <div className="property-grid">
            {visibleProperties.map((property, index) => {
              const isFavorite = favorites.some(
                (item) => favoriteKey(item) === favoriteKey(property)
              );

              return (
                <motion.article
                  className="property-card"
                  key={favoriteKey(property)}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.035, 0.25) }}
                >
                  <div className={`property-card-visual ${property.imageUrl ? "property-card-visual-image" : ""}`}>
                    {property.imageUrl ? (
                      <img
                        className="property-card-photo"
                        src={property.imageUrl}
                        alt={property.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="property-card-visual-icon">
                        <Building2 size={35} strokeWidth={1.3} />
                      </div>
                    )}

                    <span className="property-listing-badge">
                      {property.source === "external"
                        ? "LIVE EXTERNAL"
                        : property.source === "dataset"
                          ? "CSV DATASET"
                          : "RENTSURE LISTING"}
                    </span>

                    <button
                      type="button"
                      aria-label={isFavorite ? "Remove from saved properties" : "Save property"}
                      title={isFavorite ? "Remove from saved properties" : "Save property"}
                      onClick={() => toggleFavorite(property)}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: 12,
                        zIndex: 2,
                        width: 40,
                        height: 40,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 13,
                        border: "1px solid #E8D9F5",
                        background: "#FFF9F2",
                        color: isFavorite ? "#A020F0" : "#6D5B7D",
                        cursor: "pointer",
                        boxShadow: "0 5px 18px rgba(55, 24, 82, 0.10)",
                      }}
                    >
                      <Heart size={19} fill={isFavorite ? "currentColor" : "none"} />
                    </button>
                  </div>

                  <div className="property-card-body">
                    <div className="property-card-location">
                      <MapPin size={14} />
                      {[property.locality, property.city].filter(Boolean).join(", ") || "Location unavailable"}
                    </div>

                    <h3>{property.title}</h3>

                    <p className="property-card-address">
                      {property.address || property.city || "Address unavailable"}
                    </p>

                    <div className="property-detail-chips">
                      {property.bedrooms != null && <span>{property.bedrooms} BHK</span>}
                      {property.bathrooms != null && <span>{property.bathrooms} bath</span>}
                      {property.furnishing && <span>{property.furnishing}</span>}
                      {property.area != null && <span>{property.area} {property.areaUnit}</span>}
                    </div>

                    <div className="property-price-row">
                      <div>
                        <span>{property.source === "dataset" ? "Recorded monthly rent" : "Monthly rent"}</span>
                        <strong>{money(property.monthlyRent)}</strong>
                      </div>
                      <div className="property-deposit">
                        <span>{property.source === "rentsure" ? "Security deposit" : "Property type"}</span>
                        <strong>
                          {property.source === "rentsure"
                            ? money(property.securityDeposit)
                            : property.propertyType}
                        </strong>
                      </div>
                    </div>

                    <div className="property-card-footer">
                      {property.source === "external" && property.listingUrl ? (
                        <a href={property.listingUrl} target="_blank" rel="noopener noreferrer" className="property-original-link">
                          View original listing <ExternalLink size={14} />
                        </a>
                      ) : (
                        <span>
                          {property.source === "dataset" ? <Database size={14} /> : <ShieldCheck size={14} />}
                          {property.source === "dataset" ? "Historical dataset record" : property.source === "external" ? "External listing" : "Listed on RentSure"}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}

        {!loading && !error && visibleProperties.length === 0 && (
          <div className="property-empty">
            <div className="property-empty-icon">
              {source === "saved" ? <Heart size={28} /> : <Building2 size={28} />}
            </div>
            <h3>
              {source === "saved"
                ? "No saved properties yet"
                : source === "external" && !appliedFilters.city.trim()
                  ? "Choose a city to search live rentals"
                  : "No properties found"}
            </h3>
            <p>
              {source === "saved"
                ? "Tap the heart on any property card to save it here for later."
                : "Try another city, keyword, or rent range."}
            </p>
            {source !== "saved" && (
              <button type="button" className="property-empty-button" onClick={resetFilters}>
                Clear filters
              </button>
            )}
          </div>
        )}

        {!loading && !error && source !== "saved" && (
          <div className="property-pagination">
            {page > 1 && (
              <button type="button" className="property-refresh" onClick={() => setPage((value) => Math.max(1, value - 1))}>
                Previous page
              </button>
            )}
            <span>Page {page}</span>
            {hasMore && (
              <button type="button" className="property-refresh" onClick={() => setPage((value) => value + 1)}>
                Next page <ArrowUpRight size={15} />
              </button>
            )}
          </div>
        )}
      </section>

      <footer className="property-footer">
        <span>© {new Date().getFullYear()} RentSure</span>
        <span>Rent smarter. Move forward.</span>
      </footer>
    </main>
  );
}
