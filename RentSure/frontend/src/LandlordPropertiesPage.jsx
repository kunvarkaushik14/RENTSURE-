import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Check,
  CircleAlert,
  Edit3,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

import api from "./api";
import { useAuth } from "./AuthContext";
import "./PropertiesPage.css";

const emptyForm = {
  title: "",
  propertyType: "flat",
  description: "",
  address: "",
  city: "",
  monthlyRent: "",
  securityDeposit: "",
  bedrooms: "",
  bathrooms: "",
  area: "",
  furnishing: "unfurnished",
  amenities: "",
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const getValue = (property, camelCase, snakeCase) =>
  property?.[camelCase] ?? property?.[snakeCase];

function getRows(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.properties)) return result.properties;
  if (Array.isArray(result?.data?.properties)) return result.data.properties;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

export default function LandlordPropertiesPage() {
  const { user } = useAuth();

  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadProperties = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await api.get("/properties/mine");
      setProperties(getRows(result));
    } catch (err) {
      setError(err.message || "Unable to load your properties.");
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
  }

  function startEditing(property) {
    setEditingId(property.id);

    setForm({
      title: property.title || "",
      propertyType:
        getValue(property, "propertyType", "property_type") || "flat",
      description: property.description || "",
      address: property.address || "",
      city: property.city || "",
      monthlyRent: String(
        getValue(property, "monthlyRent", "monthly_rent") ?? ""
      ),
      securityDeposit: String(
        getValue(property, "securityDeposit", "security_deposit") ?? ""
      ),
      bedrooms: String(property.bedrooms ?? ""),
      bathrooms: String(property.bathrooms ?? ""),
      area: String(property.area ?? ""),
      furnishing: property.furnishing || "unfurnished",
      amenities: Array.isArray(property.amenities)
        ? property.amenities.join(", ")
        : typeof property.amenities === "string"
          ? property.amenities
          : "",
    });

    setError("");
    setNotice("");

    document.getElementById("property-editor")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const monthlyRent = Number(form.monthlyRent);
    const securityDeposit = Number(form.securityDeposit);

    if (!form.title.trim()) {
      setError("Please enter a property title.");
      return;
    }

    if (!form.address.trim() || !form.city.trim()) {
      setError("Please enter the full address and city.");
      return;
    }

    if (!Number.isFinite(monthlyRent) || monthlyRent <= 0) {
      setError("Monthly rent must be greater than zero.");
      return;
    }

    if (!Number.isFinite(securityDeposit) || securityDeposit < 0) {
      setError("Security deposit cannot be negative.");
      return;
    }

    function optionalNumber(value, fieldName) {
      if (value === "") return null;

      const number = Number(value);

      if (!Number.isFinite(number) || number < 0) {
        throw new Error(`${fieldName} must be a non-negative number.`);
      }

      return number;
    }

    let payload;

    try {
      payload = {
        title: form.title.trim(),
        propertyType: form.propertyType,
        description: form.description.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        monthlyRent,
        securityDeposit,
        bedrooms: optionalNumber(form.bedrooms, "Bedrooms"),
        bathrooms: optionalNumber(form.bathrooms, "Bathrooms"),
        area: optionalNumber(form.area, "Area"),
        furnishing: form.furnishing,
        amenities: form.amenities
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };
    } catch (err) {
      setError(err.message);
      return;
    }

    const wasEditing = editingId !== null;
    setSaving(true);

    try {
      const endpoint = wasEditing
        ? `/properties/${editingId}`
        : "/properties";

      const result = wasEditing
        ? await api.put(endpoint, payload)
        : await api.post(endpoint, payload);

      setNotice(
        result?.message ||
          (wasEditing
            ? "Property updated successfully."
            : "Property created successfully.")
      );

      setEditingId(null);
      setForm(emptyForm);

      await loadProperties();
    } catch (err) {
      setError(err.message || "Unable to save the property.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(property) {
    const confirmed = window.confirm(
      `Delete "${property.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");
    setDeletingId(property.id);

    try {
      const result = await api.delete(`/properties/${property.id}`);

      setNotice(result?.message || "Property deleted successfully.");

      if (String(editingId) === String(property.id)) {
        setEditingId(null);
        setForm(emptyForm);
      }

      await loadProperties();
    } catch (err) {
      setError(err.message || "Unable to delete this property.");
    } finally {
      setDeletingId(null);
    }
  }

  const filteredProperties = properties.filter((property) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return [
      property.title,
      property.address,
      property.city,
      property.description,
      getValue(property, "propertyType", "property_type"),
    ].some((value) =>
      String(value || "").toLowerCase().includes(query)
    );
  });

  if (user?.role !== "landlord") {
    return (
      <main className="property-page">
        <header className="property-topbar">
          <Link to="/" className="property-brand">
            <span className="property-brand-icon">
              <Building2 size={21} />
            </span>
            <span>
              Rent<span>Sure</span>
            </span>
          </Link>
        </header>

        <section className="property-content property-access-denied">
          <CircleAlert size={35} />
          <h1>Landlord access required</h1>
          <p>Sign in with a landlord account to manage properties.</p>
          <Link to="/login" className="property-nav-cta">
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="property-page">
      <header className="property-topbar">
        <Link to="/dashboard" className="property-brand">
          <span className="property-brand-icon">
            <Building2 size={21} />
          </span>
          <span>
            Rent<span>Sure</span>
          </span>
        </Link>

        <nav className="property-topbar-actions">
          <Link to="/dashboard" className="property-nav-link">
            <ArrowLeft size={15} />
            Dashboard
          </Link>

          <Link to="/properties" className="property-nav-cta">
            Browse rentals
          </Link>
        </nav>
      </header>

      <section className="landlord-property-hero">
        <div>
          <div className="property-eyebrow">
            <span />
            LANDLORD WORKSPACE
          </div>

          <h1>
            Your properties.
            <br />
            <span>Your control.</span>
          </h1>

          <p>
            Manage rental listings, keep details up to date, and make
            your properties discoverable to tenants.
          </p>

          <Link
            to="/dashboard"
            className="property-nav-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginTop: 12,
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
        </div>

        <div className="landlord-property-count">
          <Building2 size={24} />
          <span>YOUR LISTINGS</span>
          <strong>{properties.length}</strong>
          <small>Properties in your account</small>
        </div>
      </section>

      <section className="property-content landlord-property-content">
        <div className="property-section-heading">
          <div>
            <span className="property-section-kicker">
              PROPERTY MANAGEMENT
            </span>
            <h2>{editingId !== null ? "Edit property" : "Add a property"}</h2>
            <p>
              {editingId !== null
                ? "Update your listing details below."
                : "Enter accurate details to create a rental listing."}
            </p>
          </div>
        </div>

        <div id="property-editor" className="landlord-property-editor">
          <form
            className="landlord-property-form"
            onSubmit={handleSubmit}
          >
            <div className="landlord-form-grid">
              <label className="landlord-form-field">
                <span>Property type</span>
                <select
                  name="propertyType"
                  value={form.propertyType}
                  onChange={updateField}
                  required
                >
                  <option value="pg">PG / Paying Guest</option>
                  <option value="flat">Flat / Apartment</option>
                  <option value="house">Independent house</option>
                  <option value="villa">Villa</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="landlord-form-field">
                <span>Property title</span>
                <input
                  name="title"
                  value={form.title}
                  onChange={updateField}
                  placeholder="e.g. Furnished PG near university"
                  maxLength={160}
                  required
                />
              </label>

              <label className="landlord-form-field landlord-field-full">
                <span>Description</span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  placeholder="Describe the property and its facilities."
                  maxLength={5000}
                  rows={4}
                />
              </label>

              <label className="landlord-form-field landlord-field-full">
                <span>Full address</span>
                <input
                  name="address"
                  value={form.address}
                  onChange={updateField}
                  placeholder="Street, sector, or neighbourhood"
                  maxLength={2000}
                  required
                />
              </label>

              <label className="landlord-form-field">
                <span>City</span>
                <input
                  name="city"
                  value={form.city}
                  onChange={updateField}
                  placeholder="e.g. Chandigarh"
                  maxLength={100}
                  required
                />
              </label>

              <label className="landlord-form-field">
                <span>Monthly rent (₹)</span>
                <input
                  name="monthlyRent"
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.monthlyRent}
                  onChange={updateField}
                  placeholder="18000"
                  required
                />
              </label>

              <label className="landlord-form-field">
                <span>Security deposit (₹)</span>
                <input
                  name="securityDeposit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.securityDeposit}
                  onChange={updateField}
                  placeholder="36000"
                  required
                />
              </label>

              <label className="landlord-form-field">
                <span>Bedrooms / rooms</span>
                <input
                  name="bedrooms"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={form.bedrooms}
                  onChange={updateField}
                  placeholder="e.g. 2"
                />
              </label>

              <label className="landlord-form-field">
                <span>Bathrooms</span>
                <input
                  name="bathrooms"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={form.bathrooms}
                  onChange={updateField}
                  placeholder="e.g. 2"
                />
              </label>

              <label className="landlord-form-field">
                <span>Area (sq ft)</span>
                <input
                  name="area"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.area}
                  onChange={updateField}
                  placeholder="e.g. 850"
                />
              </label>

              <label className="landlord-form-field">
                <span>Furnishing</span>
                <select
                  name="furnishing"
                  value={form.furnishing}
                  onChange={updateField}
                >
                  <option value="unfurnished">Unfurnished</option>
                  <option value="semi-furnished">Semi-furnished</option>
                  <option value="furnished">Furnished</option>
                </select>
              </label>

              <label className="landlord-form-field landlord-field-full">
                <span>Amenities (comma-separated)</span>
                <input
                  name="amenities"
                  value={form.amenities}
                  onChange={updateField}
                  placeholder="Wi-Fi, meals, parking, laundry"
                  maxLength={2000}
                />
              </label>
            </div>

            {error && (
              <div className="property-message property-error" role="alert">
                <CircleAlert size={17} />
                {error}
              </div>
            )}

            {notice && (
              <div
                className="property-message property-success"
                role="status"
              >
                <Check size={17} />
                {notice}
              </div>
            )}

            <div className="landlord-form-actions">
              {editingId !== null && (
                <button
                  type="button"
                  className="landlord-secondary-button"
                  onClick={resetForm}
                  disabled={saving}
                >
                  <X size={16} />
                  Cancel edit
                </button>
              )}

              <button
                type="submit"
                className="landlord-submit-button"
                disabled={saving}
              >
                {saving ? (
                  <RefreshCw size={16} className="property-spin" />
                ) : editingId !== null ? (
                  <Save size={16} />
                ) : (
                  <Plus size={17} />
                )}

                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Save changes"
                    : "Create property"}
              </button>
            </div>
          </form>
        </div>

        <div className="property-section-heading landlord-list-heading">
          <div>
            <span className="property-section-kicker">YOUR INVENTORY</span>
            <h2>Managed properties</h2>
            <p>Only listings owned by your account appear here.</p>
          </div>

          <div className="landlord-list-tools">
            <label className="landlord-property-search">
              <Search size={16} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search your properties..."
                aria-label="Search your properties"
              />
            </label>

            <button
              type="button"
              className="property-refresh"
              onClick={loadProperties}
              disabled={loading}
            >
              <RefreshCw
                size={15}
                className={loading ? "property-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="property-message property-error" role="alert">
            <CircleAlert size={17} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="property-loading-line">
            Loading your properties...
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="landlord-managed-list">
            {filteredProperties.map((property) => {
              const rent = getValue(
                property,
                "monthlyRent",
                "monthly_rent"
              );

              const deposit = getValue(
                property,
                "securityDeposit",
                "security_deposit"
              );

              const propertyType = getValue(
                property,
                "propertyType",
                "property_type"
              );

              return (
                <motion.article
                  className="landlord-managed-card"
                  key={property.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="landlord-managed-icon">
                    <Building2 size={23} />
                  </div>

                  <div className="landlord-managed-info">
                    <h3>{property.title}</h3>

                    <p>
                      <MapPin size={13} />
                      {property.address}, {property.city}
                    </p>

                    <p className="landlord-property-meta">
                      {String(propertyType || "flat")
                        .toUpperCase()
                        .replace("-", " ")}
                      {property.bedrooms != null
                        ? ` · ${property.bedrooms} rooms`
                        : ""}
                      {property.furnishing
                        ? ` · ${property.furnishing}`
                        : ""}
                    </p>

                    <div className="landlord-managed-prices">
                      <span>
                        Rent: <strong>{money(rent)}</strong>/month
                      </span>
                      <span>
                        Deposit: <strong>{money(deposit)}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="landlord-managed-actions">
                    <Link
                      to={`/properties/${property.id}`}
                      className="landlord-edit-button"
                    >
                      Preview
                    </Link>

                    <button
                      type="button"
                      className="landlord-edit-button"
                      onClick={() => startEditing(property)}
                    >
                      <Edit3 size={16} />
                      Edit
                    </button>

                    <button
                      type="button"
                      className="landlord-delete-button"
                      onClick={() => handleDelete(property)}
                      disabled={deletingId === property.id}
                    >
                      {deletingId === property.id ? (
                        <RefreshCw
                          size={16}
                          className="property-spin"
                        />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      {deletingId === property.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className="property-empty">
            <div className="property-empty-icon">
              <Building2 size={28} />
            </div>

            <h3>
              {properties.length === 0
                ? "Your property list is empty"
                : "No matching properties"}
            </h3>

            <p>
              {properties.length === 0
                ? "Create your first listing using the form above."
                : "Try another search term or clear the search field."}
            </p>
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