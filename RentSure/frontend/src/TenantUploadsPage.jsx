
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Download,
  ImagePlus,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";

import api from "./api";
import "./TenantUploadsPage.css";

const categories = [
  { value: "move_in", label: "Move-in condition" },
  { value: "periodic", label: "Condition update" },
  { value: "move_out", label: "Move-out condition" },
];

const DEMO_PROPERTY = {
  title: "The Lavender Residence",
  location: "Sector 34, Chandigarh",
  monthlyRent: 16000,
};

const DEMO_EVIDENCE = [
  {
    id: "demo-evidence-1",
    evidence_type: "move_in",
    room: "Living room",
    notes:
      "Sample record: inspect the walls, flooring, windows and furniture.",
    created_at: "2026-10-01T10:00:00",
    image_url:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "demo-evidence-2",
    evidence_type: "move_in",
    room: "Bedroom",
    notes:
      "Sample record: check the wardrobe, door locks and wall condition.",
    created_at: "2026-10-01T10:30:00",
    image_url:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "demo-evidence-3",
    evidence_type: "periodic",
    room: "Kitchen",
    notes:
      "Sample record: check taps, cabinets and visible signs of leakage.",
    created_at: "2026-10-15T11:00:00",
    image_url:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
  },
];

const DEMO_CHECKLIST = [
  "Inspect walls, ceilings and paint",
  "Check doors, windows and locks",
  "Test lights and electrical switches",
  "Inspect bathroom taps and drainage",
  "Photograph existing damage",
];

function readTenancies(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.tenancies)) return result.tenancies;
  if (Array.isArray(result?.data?.tenancies)) {
    return result.data.tenancies;
  }
  return [];
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], {
    type: "text/plain;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

export default function TenantUploadsPage() {
  // IMPORTANT: Hooks must be called inside the component.
  const navigate = useNavigate();

  const [tenancies, setTenancies] = useState([]);
  const [selectedTenancy, setSelectedTenancy] = useState("");
  const [evidenceType, setEvidenceType] = useState("move_in");
  const [room, setRoom] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [demoChecklist, setDemoChecklist] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load the user's real tenancy information.
  useEffect(() => {
    let active = true;

    async function loadTenancies() {
      setLoading(true);
      setError("");

      try {
        const result = await api.get("/condition-evidence/mine");

        if (!active) return;

        const rows = readTenancies(result);

        setTenancies(rows);

        if (rows.length > 0) {
          const first = rows[0];

          setSelectedTenancy(String(first.id));
          setEvidence(
            Array.isArray(first.evidence) ? first.evidence : []
          );
          setDemoMode(false);
        } else {
          setSelectedTenancy("");
          setEvidence([]);
          setDemoMode(true);
        }
      } catch (err) {
        if (!active) return;

        setTenancies([]);
        setSelectedTenancy("");
        setEvidence([]);
        setDemoMode(true);

        setError(
          err.message ||
            "Could not load real tenancies. Demo Mode is available."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTenancies();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  // Create and clean up the local photo preview.
  useEffect(() => {
    if (!file) {
      setPreview("");
      return undefined;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  function selectTenancy(value) {
    setSelectedTenancy(value);

    const tenancy = tenancies.find(
      (item) => String(item.id) === value
    );

    setEvidence(
      Array.isArray(tenancy?.evidence) ? tenancy.evidence : []
    );

    setError("");
    setNotice("");
  }

  function handleFile(event) {
    const selected = event.target.files?.[0];

    setError("");
    setNotice("");

    if (!selected) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(selected.type)) {
      setError("Please choose a JPEG, PNG or WebP image.");
      event.target.value = "";
      setFile(null);
      return;
    }

    if (selected.size > 8 * 1024 * 1024) {
      setError("The image must be smaller than 8 MB.");
      event.target.value = "";
      setFile(null);
      return;
    }

    setFile(selected);
  }

  async function handleUpload(event) {
    event.preventDefault();

    setError("");
    setNotice("");

    if (demoMode) {
      setError(
        "Demo Mode is view-only. Switch to real evidence mode and select a linked tenancy before uploading."
      );
      return;
    }

    if (!selectedTenancy) {
      setError(
        "You need an active tenancy before uploading evidence."
      );
      return;
    }

    if (!file) {
      setError("Please choose a photo first.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("image", file);
      formData.append("tenancyId", selectedTenancy);
      formData.append("evidenceType", evidenceType);
      formData.append("room", room.trim());
      formData.append("notes", notes.trim());

      const token = localStorage.getItem("rentsure_token");

      const base = (
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api"
      ).replace(/\/+$/, "");

      const response = await fetch(
        `${base}/condition-evidence`,
        {
          method: "POST",
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
          body: formData,
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || "The photo could not be uploaded."
        );
      }

      if (result.evidence) {
        setEvidence((current) => [
          result.evidence,
          ...current,
        ]);
      } else {
        const updated = await api.get(
          "/condition-evidence/mine"
        );

        const rows = readTenancies(updated);

        const tenancy = rows.find(
          (item) => String(item.id) === selectedTenancy
        );

        setEvidence(
          Array.isArray(tenancy?.evidence)
            ? tenancy.evidence
            : []
        );
      }

      setFile(null);
      setRoom("");
      setNotes("");

      setNotice(
        "Your condition photo has been saved to your real tenancy."
      );

      setRefreshKey((current) => current + 1);
    } catch (err) {
      setError(
        err.message || "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  function toggleChecklist(index) {
    setDemoChecklist((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index]
    );
  }

  function downloadDemoReport() {
    const lines = [
      "RENTSURE — PROPERTY CONDITION DEMO REPORT",
      "DEMO DATA ONLY — NOT A REAL TENANCY OR INSPECTION RECORD",
      "",
      `Sample property: ${DEMO_PROPERTY.title}`,
      `Location: ${DEMO_PROPERTY.location}`,
      `Sample monthly rent: INR ${DEMO_PROPERTY.monthlyRent}`,
      `Generated: ${new Date().toLocaleString("en-IN")}`,
      "",
      "SAMPLE CONDITION TIMELINE",
      ...DEMO_EVIDENCE.map((item) => {
        const label =
          categories.find(
            (category) =>
              category.value === item.evidence_type
          )?.label || "Condition photo";

        return `${label} | ${item.room} | ${item.notes}`;
      }),
      "",
      "DEMO INSPECTION CHECKLIST",
      ...DEMO_CHECKLIST.map(
        (item, index) =>
          `${demoChecklist.includes(index) ? "[x]" : "[ ]"} ${item}`
      ),
      "",
      `Checklist progress: ${demoChecklist.length}/${DEMO_CHECKLIST.length}`,
      "",
      "This report is generated from sample data in the browser.",
      "It does not create, upload or modify real tenancy evidence.",
    ];

    downloadTextFile(
      "RentSure-Demo-Condition-Report.txt",
      lines.join("\n")
    );

    setNotice("Your sample condition report has been downloaded.");
  }

  function toggleDemoMode() {
    setDemoMode((current) => !current);
    setError("");
    setNotice("");
    setFile(null);
  }

  const displayedEvidence = demoMode
    ? DEMO_EVIDENCE
    : evidence;

  return (
    <main className="evidence-page">
      <div className="evidence-container">
        {/* Single Back to Dashboard button */}
        <button
          type="button"
          className="evidence-back-button"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={18} />
          <span>Back to Dashboard</span>
        </button>

        <header className="evidence-header">
          <div className="evidence-heading-icon">
            <ShieldCheck size={25} />
          </div>

          <div>
            <p className="evidence-eyebrow">
              RENT SURE · TENANT SPACE
            </p>

            <h1>Property Evidence</h1>

            <p>
              Document your property&apos;s condition with photos
              and notes throughout your tenancy.
            </p>
          </div>
        </header>

        <section className="evidence-info">
          <ShieldCheck size={21} />

          <div>
            <strong>Keep a clear condition record</strong>

            <p>
              Take well-lit photos and include the room, date,
              and any existing damage. Records help both parties
              review changes.
            </p>
          </div>
        </section>

        {/* Demo and real-data mode switch */}
        <section className="evidence-mode-bar">
          <div className="evidence-mode-copy">
            <span className="evidence-mode-dot" />

            <div>
              <strong>
                {demoMode
                  ? "Classroom Demo Mode"
                  : "Real tenancy evidence"}
              </strong>

              <p>
                {demoMode
                  ? "Sample property photos and checklist. Nothing here is saved to your database."
                  : "Uploads are submitted to your backend for the selected linked tenancy."}
              </p>
            </div>
          </div>

          <div className="evidence-mode-actions">
            <button
              type="button"
              className="evidence-mode-button"
              onClick={toggleDemoMode}
            >
              {demoMode
                ? "Switch to real mode"
                : "Open demo mode"}
            </button>

            <button
              type="button"
              className="evidence-refresh-button"
              onClick={() =>
                setRefreshKey((current) => current + 1)
              }
              disabled={loading}
              aria-label="Refresh tenancy data"
              title="Refresh tenancy data"
            >
              <RefreshCw
                size={16}
                className={loading ? "evidence-spin" : ""}
              />
            </button>
          </div>
        </section>

        {error && (
          <div className="evidence-alert error" role="alert">
            {error}
          </div>
        )}

        {notice && (
          <div
            className="evidence-alert success"
            role="status"
          >
            {notice}
          </div>
        )}

        {/* Sample property information */}
        {demoMode && (
          <section className="evidence-demo-banner">
            <div className="evidence-demo-banner-icon">
              <CheckCircle2 size={23} />
            </div>

            <div>
              <span className="evidence-demo-label">
                SAMPLE SCENARIO
              </span>

              <h2>{DEMO_PROPERTY.title}</h2>

              <p>{DEMO_PROPERTY.location}</p>

              <strong>
                ₹
                {DEMO_PROPERTY.monthlyRent.toLocaleString("en-IN")}{" "}
                <span>/ month</span>
              </strong>
            </div>

            <div className="evidence-demo-stamp">
              DEMO DATA
            </div>
          </section>
        )}

        <div className="evidence-layout">
          {/* Inspection and upload panel */}
          <section className="evidence-card">
            <div className="evidence-card-heading">
              <span className="evidence-icon">
                <Camera size={20} />
              </span>

              <div>
                <h2>
                  {demoMode
                    ? "Demo inspection"
                    : "Add condition photos"}
                </h2>

                <p>
                  {demoMode
                    ? "Try the sample inspection checklist"
                    : "JPEG, PNG or WebP · Maximum 8 MB"}
                </p>
              </div>
            </div>

            {loading && !demoMode ? (
              <div className="evidence-empty">
                <LoaderCircle
                  className="evidence-spin"
                  size={24}
                />
                <p>Loading your tenancies…</p>
              </div>
            ) : demoMode ? (
              <div className="evidence-demo-inspection">
                <div className="evidence-demo-intro">
                  <ClipboardCheck size={28} />

                  <h3>Move-in inspection checklist</h3>

                  <p>
                    Tick the items to simulate completing a
                    property inspection during your presentation.
                  </p>
                </div>

                <div className="evidence-demo-checklist">
                  {DEMO_CHECKLIST.map((item, index) => (
                    <label
                      key={item}
                      className="evidence-demo-check"
                    >
                      <input
                        type="checkbox"
                        checked={demoChecklist.includes(index)}
                        onChange={() =>
                          toggleChecklist(index)
                        }
                      />

                      <span>{item}</span>

                      {demoChecklist.includes(index) && (
                        <CheckCircle2 size={17} />
                      )}
                    </label>
                  ))}
                </div>

                <div className="evidence-demo-progress">
                  <div>
                    <span>Inspection progress</span>

                    <strong>
                      {demoChecklist.length}/
                      {DEMO_CHECKLIST.length}
                    </strong>
                  </div>

                  <div className="evidence-demo-progress-track">
                    <div
                      className="evidence-demo-progress-fill"
                      style={{
                        width: `${
                          (demoChecklist.length /
                            DEMO_CHECKLIST.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="evidence-submit evidence-download-button"
                  onClick={downloadDemoReport}
                >
                  <Download size={18} />
                  Download demo report
                </button>
              </div>
            ) : tenancies.length === 0 ? (
              <div className="evidence-empty">
                <ClipboardCheck size={28} />

                <h3>No tenancy linked yet</h3>

                <p>
                  Once a landlord creates and confirms your
                  tenancy, it will appear here. A public property
                  listing alone is not enough to authorize
                  private evidence uploads.
                </p>

                <button
                  type="button"
                  className="evidence-mode-button"
                  onClick={() => setDemoMode(true)}
                >
                  Try the classroom demo
                </button>
              </div>
            ) : (
              <form
                className="evidence-form"
                onSubmit={handleUpload}
              >
                <label>
                  Rental property

                  <select
                    value={selectedTenancy}
                    onChange={(event) =>
                      selectTenancy(event.target.value)
                    }
                    required
                  >
                    {tenancies.map((tenancy) => (
                      <option
                        key={tenancy.id}
                        value={tenancy.id}
                      >
                        {tenancy.property_title ||
                          tenancy.title ||
                          `Property #${tenancy.property_id || tenancy.id}`}
                        {tenancy.city ? ` · ${tenancy.city}` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Evidence category

                  <select
                    value={evidenceType}
                    onChange={(event) =>
                      setEvidenceType(event.target.value)
                    }
                  >
                    {categories.map((category) => (
                      <option
                        key={category.value}
                        value={category.value}
                      >
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Room or area

                  <input
                    value={room}
                    onChange={(event) =>
                      setRoom(event.target.value)
                    }
                    placeholder="e.g. Bedroom, kitchen, bathroom"
                    maxLength={100}
                  />
                </label>

                <label>
                  Condition notes

                  <textarea
                    value={notes}
                    onChange={(event) =>
                      setNotes(event.target.value)
                    }
                    placeholder="Describe what the photo shows…"
                    maxLength={1000}
                    rows={3}
                  />
                </label>

                <label className="evidence-dropzone">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFile}
                  />

                  <ImagePlus size={30} />

                  <strong>
                    {file
                      ? file.name
                      : "Choose a condition photo"}
                  </strong>

                  <span>
                    Browse your device to select an image
                  </span>
                </label>

                {preview && (
                  <div className="evidence-preview">
                    <img
                      src={preview}
                      alt="Selected condition preview"
                    />

                    <button
                      type="button"
                      className="evidence-remove"
                      onClick={() => setFile(null)}
                      aria-label="Remove selected photo"
                    >
                      <X size={17} />
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  className="evidence-submit"
                  disabled={uploading || !file}
                >
                  {uploading ? (
                    <LoaderCircle
                      className="evidence-spin"
                      size={18}
                    />
                  ) : (
                    <Upload size={18} />
                  )}

                  {uploading
                    ? "Uploading…"
                    : "Save condition photo"}
                </button>
              </form>
            )}
          </section>

          {/* Condition timeline */}
          <section className="evidence-card evidence-history">
            <div className="evidence-card-heading">
              <span className="evidence-icon">
                <ClipboardCheck size={20} />
              </span>

              <div>
                <h2>Condition timeline</h2>

                <p>
                  {demoMode
                    ? "Sample records for your presentation"
                    : "Your saved property evidence"}
                </p>
              </div>
            </div>

            {displayedEvidence.length === 0 ? (
              <div className="evidence-empty">
                <ImagePlus size={27} />

                <p>
                  Photos saved for this tenancy will appear here.
                </p>
              </div>
            ) : (
              <>
                {demoMode && (
                  <div className="evidence-demo-timeline-note">
                    These are example records, not real
                    inspection evidence.
                  </div>
                )}

                <div className="evidence-gallery">
                  {displayedEvidence.map((item) => (
                    <article
                      className="evidence-item"
                      key={item.id}
                    >
                      <a
                        href={item.image_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={item.image_url}
                          alt={
                            item.room || "Condition evidence"
                          }
                          loading="lazy"
                        />
                      </a>

                      <div className="evidence-item-copy">
                        <strong>
                          {categories.find(
                            (category) =>
                              category.value ===
                              item.evidence_type
                          )?.label || "Condition photo"}
                        </strong>

                        {item.room && (
                          <span>{item.room}</span>
                        )}

                        {item.notes && <p>{item.notes}</p>}

                        <small>
                          {item.created_at
                            ? new Date(
                                item.created_at
                              ).toLocaleString("en-IN")
                            : "Recently added"}
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>

        <footer className="evidence-demo-footer">
          <ShieldCheck size={19} />

          <p>
            <strong>
              Keep your rental records organised.
            </strong>

            <span>
              {demoMode
                ? " Demo changes stay on this page and are not uploaded to your account."
                : " Real evidence uploads require an authenticated, linked tenancy."}
            </span>
          </p>
        </footer>
      </div>
    </main>
  );
}
