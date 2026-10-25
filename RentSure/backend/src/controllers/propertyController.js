
const { pool } = require("../config/db");

function parsePositiveId(value) {
  if (!/^[1-9]\d*$/.test(String(value))) return null;

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function validateProperty(body) {
  const errors = [];

  const title =
    typeof body.title === "string" ? body.title.trim() : "";

  const address =
    typeof body.address === "string" ? body.address.trim() : "";

  const city =
    typeof body.city === "string" ? body.city.trim() : "";

  const description =
    typeof body.description === "string"
      ? body.description.trim()
      : "";

  const propertyType =
    typeof body.propertyType === "string"
      ? body.propertyType.trim().toLowerCase()
      : "flat";

  const furnishing =
    typeof body.furnishing === "string"
      ? body.furnishing.trim().toLowerCase()
      : "unfurnished";

  const monthlyRent = body.monthlyRent;
  const securityDeposit = body.securityDeposit;

  const bedrooms =
    body.bedrooms === "" ||
    body.bedrooms === undefined ||
    body.bedrooms === null
      ? null
      : body.bedrooms;

  const bathrooms =
    body.bathrooms === "" ||
    body.bathrooms === undefined ||
    body.bathrooms === null
      ? null
      : body.bathrooms;

  const area =
    body.area === "" ||
    body.area === undefined ||
    body.area === null
      ? null
      : body.area;

  const amenities = Array.isArray(body.amenities)
    ? body.amenities
        .map((item) => String(item).trim())
        .filter(Boolean)
        .slice(0, 50)
    : typeof body.amenities === "string"
      ? body.amenities
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 50)
      : [];

  if (!title || title.length > 160) {
    errors.push(
      "Title is required and must be at most 160 characters."
    );
  }

  if (!address || address.length > 2000) {
    errors.push(
      "Address is required and must be at most 2000 characters."
    );
  }

  if (!city || city.length > 100) {
    errors.push(
      "City is required and must be at most 100 characters."
    );
  }

  if (
    !["pg", "flat", "house", "villa", "other"].includes(
      propertyType
    )
  ) {
    errors.push(
      "Property type must be PG, flat, house, villa, or other."
    );
  }

  if (description.length > 5000) {
    errors.push(
      "Description must be at most 5000 characters."
    );
  }

  if (
    typeof monthlyRent !== "number" ||
    !Number.isFinite(monthlyRent) ||
    monthlyRent <= 0 ||
    monthlyRent > 1000000000
  ) {
    errors.push("Monthly rent must be a positive number.");
  }

  if (
    typeof securityDeposit !== "number" ||
    !Number.isFinite(securityDeposit) ||
    securityDeposit < 0 ||
    securityDeposit > 1000000000
  ) {
    errors.push(
      "Security deposit must be a non-negative number."
    );
  }

  for (const [label, value] of [
    ["Bedrooms / rooms", bedrooms],
    ["Bathrooms", bathrooms],
    ["Area", area],
  ]) {
    if (
      value !== null &&
      (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 1000000
      )
    ) {
      errors.push(
        `${label} must be a non-negative number.`
      );
    }
  }

  if (
    bedrooms !== null &&
    !Number.isInteger(bedrooms)
  ) {
    errors.push(
      "Bedrooms / rooms must be a whole number."
    );
  }

  if (
    bathrooms !== null &&
    !Number.isInteger(bathrooms)
  ) {
    errors.push(
      "Bathrooms must be a whole number."
    );
  }

  if (
    ![
      "unfurnished",
      "semi-furnished",
      "furnished",
    ].includes(furnishing)
  ) {
    errors.push(
      "Furnishing must be unfurnished, semi-furnished, or furnished."
    );
  }

  return {
    errors,
    value: {
      title,
      address,
      city,
      monthlyRent,
      securityDeposit,
      propertyType,
      description,
      bedrooms,
      bathrooms,
      area,
      furnishing,
      amenities,
    },
  };
}

// GET /api/properties
// Public property listings with search, city filter, and pagination.
async function listProperties(req, res) {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim().slice(0, 100)
        : "";

    const city =
      typeof req.query.city === "string"
        ? req.query.city.trim().slice(0, 100)
        : "";

    const page = Math.max(
      1,
      Math.min(100000, Number(req.query.page) || 1)
    );

    const limit = Math.max(
      1,
      Math.min(50, Number(req.query.limit) || 12)
    );

    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT
         p.id,
         p.landlord_id AS "landlordId",
         p.title,
         p.address,
         p.city,
         p.monthly_rent AS "monthlyRent",
         p.security_deposit AS "securityDeposit",
         p.property_type AS "propertyType",
         p.description,
         p.bedrooms,
         p.bathrooms,
         p.area,
         p.furnishing,
         p.amenities,
         p.created_at AS "createdAt",
         u.full_name AS "landlordName"
       FROM properties p
       JOIN users u ON u.id = p.landlord_id
       WHERE (
         $1 = ''
         OR p.title ILIKE '%' || $1 || '%'
         OR p.address ILIKE '%' || $1 || '%'
         OR p.city ILIKE '%' || $1 || '%'
       )
       AND ($2 = '' OR p.city ILIKE '%' || $2 || '%')
       ORDER BY p.created_at DESC, p.id DESC
       LIMIT $3 OFFSET $4`,
      [search, city, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM properties p
       WHERE (
         $1 = ''
         OR p.title ILIKE '%' || $1 || '%'
         OR p.address ILIKE '%' || $1 || '%'
         OR p.city ILIKE '%' || $1 || '%'
       )
       AND ($2 = '' OR p.city ILIKE '%' || $2 || '%')`,
      [search, city]
    );

    const total = countResult.rows[0].total;

    return res.json({
      success: true,
      properties: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List properties error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve properties.",
    });
  }
}

// GET /api/properties/:id
// Retrieve one property.
async function getProperty(req, res) {
  const id = parsePositiveId(req.params.id);

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Invalid property ID.",
    });
  }

  try {
    const result = await pool.query(
      `SELECT
         p.id,
         p.landlord_id AS "landlordId",
         p.title,
         p.address,
         p.city,
         p.monthly_rent AS "monthlyRent",
         p.security_deposit AS "securityDeposit",
         p.property_type AS "propertyType",
         p.description,
         p.bedrooms,
         p.bathrooms,
         p.area,
         p.furnishing,
         p.amenities,
         p.created_at AS "createdAt",
         u.full_name AS "landlordName"
       FROM properties p
       JOIN users u ON u.id = p.landlord_id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    return res.json({
      success: true,
      property: result.rows[0],
    });
  } catch (error) {
    console.error("Get property error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve the property.",
    });
  }
}

// GET /api/properties/mine
// Retrieve properties belonging to the logged-in landlord.
async function listMyProperties(req, res) {
  try {
    const result = await pool.query(
      `SELECT
         id,
         landlord_id AS "landlordId",
         title,
         address,
         city,
         monthly_rent AS "monthlyRent",
         security_deposit AS "securityDeposit",
         property_type AS "propertyType",
         description,
         bedrooms,
         bathrooms,
         area,
         furnishing,
         amenities,
         created_at AS "createdAt"
       FROM properties
       WHERE landlord_id = $1
       ORDER BY created_at DESC, id DESC`,
      [req.user.sub]
    );

    return res.json({
      success: true,
      properties: result.rows,
    });
  } catch (error) {
    console.error(
      "List landlord properties error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your properties.",
    });
  }
}

// POST /api/properties
// Create a property for the authenticated landlord.
async function createProperty(req, res) {
  const { errors, value } = validateProperty(
    req.body || {}
  );

  if (errors.length) {
    return res.status(400).json({
      success: false,
      message: "Please correct the property details.",
      errors,
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO properties (
         landlord_id,
         title,
         address,
         city,
         monthly_rent,
         security_deposit,
         property_type,
         description,
         bedrooms,
         bathrooms,
         area,
         furnishing,
         amenities
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7,
         $8, $9, $10, $11, $12, $13
       )
       RETURNING
         id,
         landlord_id AS "landlordId",
         title,
         address,
         city,
         monthly_rent AS "monthlyRent",
         security_deposit AS "securityDeposit",
         property_type AS "propertyType",
         description,
         bedrooms,
         bathrooms,
         area,
         furnishing,
         amenities,
         created_at AS "createdAt"`,
      [
        req.user.sub,
        value.title,
        value.address,
        value.city,
        value.monthlyRent,
        value.securityDeposit,
        value.propertyType,
        value.description,
        value.bedrooms,
        value.bathrooms,
        value.area,
        value.furnishing,
        JSON.stringify(value.amenities),
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Property created successfully.",
      property: result.rows[0],
    });
  } catch (error) {
    console.error("Create property error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create the property.",
    });
  }
}

// PUT /api/properties/:id
// Update a property only if it belongs to the logged-in landlord.
async function updateProperty(req, res) {
  const id = parsePositiveId(req.params.id);

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Invalid property ID.",
    });
  }

  const { errors, value } = validateProperty(
    req.body || {}
  );

  if (errors.length) {
    return res.status(400).json({
      success: false,
      message: "Please correct the property details.",
      errors,
    });
  }

  try {
    const result = await pool.query(
      `UPDATE properties
       SET title = $1,
           address = $2,
           city = $3,
           monthly_rent = $4,
           security_deposit = $5,
           property_type = $6,
           description = $7,
           bedrooms = $8,
           bathrooms = $9,
           area = $10,
           furnishing = $11,
           amenities = $12
       WHERE id = $13
         AND landlord_id = $14
       RETURNING
         id,
         landlord_id AS "landlordId",
         title,
         address,
         city,
         monthly_rent AS "monthlyRent",
         security_deposit AS "securityDeposit",
         property_type AS "propertyType",
         description,
         bedrooms,
         bathrooms,
         area,
         furnishing,
         amenities,
         created_at AS "createdAt"`,
      [
        value.title,
        value.address,
        value.city,
        value.monthlyRent,
        value.securityDeposit,
        value.propertyType,
        value.description,
        value.bedrooms,
        value.bathrooms,
        value.area,
        value.furnishing,
        JSON.stringify(value.amenities),
        id,
        req.user.sub,
      ]
    );

    if (result.rowCount === 0) {
      const exists = await pool.query(
        "SELECT id FROM properties WHERE id = $1",
        [id]
      );

      if (exists.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Property not found.",
        });
      }

      return res.status(403).json({
        success: false,
        message:
          "You can only update your own properties.",
      });
    }

    return res.json({
      success: true,
      message: "Property updated successfully.",
      property: result.rows[0],
    });
  } catch (error) {
    console.error("Update property error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update the property.",
    });
  }
}

// DELETE /api/properties/:id
// Delete a property only if it belongs to the logged-in landlord.
async function deleteProperty(req, res) {
  const id = parsePositiveId(req.params.id);

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Invalid property ID.",
    });
  }

  try {
    const result = await pool.query(
      `DELETE FROM properties
       WHERE id = $1
         AND landlord_id = $2
       RETURNING id`,
      [id, req.user.sub]
    );

    if (result.rowCount === 0) {
      const exists = await pool.query(
        "SELECT id FROM properties WHERE id = $1",
        [id]
      );

      if (exists.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Property not found.",
        });
      }

      return res.status(403).json({
        success: false,
        message:
          "You can only delete your own properties.",
      });
    }

    return res.json({
      success: true,
      message: "Property deleted successfully.",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error("Delete property error:", error);

    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "This property has related records and cannot be deleted yet.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to delete the property.",
    });
  }
}

module.exports = {
  listProperties,
  getProperty,
  listMyProperties,
  createProperty,
  updateProperty,
  deleteProperty,
};
