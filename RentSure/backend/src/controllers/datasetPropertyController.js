
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const CSV_PATH = path.resolve(
  __dirname,
  "../../data/House_Rent_Dataset.csv"
);

let cachedProperties = null;
let loadingPromise = null;

function loadDataset() {
  if (cachedProperties) {
    return Promise.resolve(cachedProperties);
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    if (!fs.existsSync(CSV_PATH)) {
      return reject(
        new Error(`Dataset file not found: ${CSV_PATH}`)
      );
    }

    const properties = [];
    let rowNumber = 0;

    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on("data", (row) => {
        rowNumber++;

        const rent = Number(row["Rent"]);
        const bhk = Number(row["BHK"]);
        const size = Number(row["Size"]);
        const bathrooms = Number(row["Bathroom"]);

        if (!Number.isFinite(rent) || rent <= 0) {
          return;
        }

        properties.push({
          id: `dataset-${rowNumber}`,
          source: "dataset",
          title: `${Number.isFinite(bhk) ? bhk : "N/A"} BHK Rental in ${
            row["Area Locality"] || row["City"] || "India"
          }`,
          description:
            "Rental record from RentSure's imported house rent dataset. Verify current availability before making rental decisions.",
          rent,
          priceDisplay: `₹${rent.toLocaleString("en-IN")}`,
          currency: "INR",
          city: row["City"] || "",
          locality: row["Area Locality"] || "",
          propertyType: "Residential",
          bedrooms: Number.isFinite(bhk) ? bhk : null,
          bathrooms: Number.isFinite(bathrooms)
            ? bathrooms
            : null,
          area: Number.isFinite(size) ? size : null,
          areaType: row["Area Type"] || "",
          floor: row["Floor"] || "",
          furnishing: row["Furnishing Status"] || "",
          tenantPreferred: row["Tenant Preferred"] || "",
          postedOn: row["Posted On"] || "",
          pointOfContact: row["Point of Contact"] || "",
          image: null,
          listingUrl: null,
        });
      })
      .on("end", () => {
        cachedProperties = properties;
        loadingPromise = null;
        resolve(properties);
      })
      .on("error", (error) => {
        loadingPromise = null;
        reject(error);
      });
  });

  return loadingPromise;
}

async function searchDatasetProperties(req, res) {
  try {
    const {
      city = "",
      keyword = "",
      propertyType = "",
      furnishing = "",
      minRent,
      maxRent,
      bhk,
      page = "1",
      limit = "18",
    } = req.query;

    const pageNumber = Number(page);
    const pageSize = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid page or limit. Limit must be between 1 and 50.",
      });
    }

    const minimumRent =
      minRent !== undefined && minRent !== ""
        ? Number(minRent)
        : null;

    const maximumRent =
      maxRent !== undefined && maxRent !== ""
        ? Number(maxRent)
        : null;

    if (
      (minimumRent !== null &&
        (!Number.isFinite(minimumRent) || minimumRent < 0)) ||
      (maximumRent !== null &&
        (!Number.isFinite(maximumRent) || maximumRent < 0)) ||
      (minimumRent !== null &&
        maximumRent !== null &&
        minimumRent > maximumRent)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid rent range.",
      });
    }

    const requestedBhk =
      bhk !== undefined && bhk !== ""
        ? Number(bhk)
        : null;

    if (
      requestedBhk !== null &&
      (!Number.isInteger(requestedBhk) || requestedBhk < 1)
    ) {
      return res.status(400).json({
        success: false,
        message: "bhk must be a positive integer.",
      });
    }

    const allProperties = await loadDataset();

    const normalizedCity = String(city).trim().toLowerCase();
    const normalizedKeyword = String(keyword).trim().toLowerCase();
    const normalizedType = String(propertyType).trim().toLowerCase();
    const normalizedFurnishing = String(furnishing)
      .trim()
      .toLowerCase();

    const filtered = allProperties.filter((property) => {
      if (
        normalizedCity &&
        !property.city.toLowerCase().includes(normalizedCity)
      ) {
        return false;
      }

      if (
        normalizedKeyword &&
        ![
          property.title,
          property.city,
          property.locality,
          property.furnishing,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedKeyword)
      ) {
        return false;
      }

      if (
        normalizedType &&
        !property.areaType.toLowerCase().includes(normalizedType)
      ) {
        return false;
      }

      if (
        normalizedFurnishing &&
        !property.furnishing.toLowerCase().includes(normalizedFurnishing)
      ) {
        return false;
      }

      if (
        minimumRent !== null &&
        property.rent < minimumRent
      ) {
        return false;
      }

      if (
        maximumRent !== null &&
        property.rent > maximumRent
      ) {
        return false;
      }

      if (
        requestedBhk !== null &&
        property.bedrooms !== requestedBhk
      ) {
        return false;
      }

      return true;
    });

    const startIndex = (pageNumber - 1) * pageSize;
    const properties = filtered.slice(
      startIndex,
      startIndex + pageSize
    );

    return res.status(200).json({
      success: true,
      source: "dataset",
      isHistoricalDataset: true,
      total: filtered.length,
      page: pageNumber,
      limit: pageSize,
      hasMore: startIndex + pageSize < filtered.length,
      properties,
    });
  } catch (error) {
    console.error("Dataset property search failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load dataset properties.",
    });
  }
}

module.exports = {
  searchDatasetProperties,
};
