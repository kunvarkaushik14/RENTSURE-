
const axios = require("axios");

const SCRAPPA_API_URL = "https://scrappa.co/api/magicbricks/v1/search";

const searchExternalProperties = async (req, res) => {
  try {
    const {
      city = "Delhi",
      propertyType = "flat",
      keyword = "",
      page = "1",
      limit = "18",
    } = req.query;

    const apiKey = process.env.SCRAPPA_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        success: false,
        message: "SCRAPPA_API_KEY is missing from the backend .env file.",
      });
    }

    if (!String(city).trim() || !String(propertyType).trim()) {
      return res.status(400).json({
        success: false,
        message: "City and propertyType are required.",
      });
    }

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
        message: "page must be positive and limit must be between 1 and 50.",
      });
    }

    const params = {
      city: String(city).trim(),
      category: "rent",
      property_type: String(propertyType).trim(),
      page: pageNumber,
      limit: pageSize,
    };

    if (String(keyword).trim()) {
      params.keyword = String(keyword).trim();
    }

    const response = await axios.get(SCRAPPA_API_URL, {
      params,
      headers: {
        "X-API-KEY": apiKey,
        Accept: "application/json",
      },
      timeout: 20000,
    });

    const payload = response.data;

    // Scrappa returns listings inside data.items.
    const listings = Array.isArray(payload?.data?.items)
      ? payload.data.items
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.results)
            ? payload.results
            : [];

    const properties = listings.map((item) => ({
      id: String(item.id),
      source: "external",
      title: item.title || "Rental Property",
      description: item.description || "",
      rent: item.price ?? null,
      priceDisplay: item.price_display || null,
      currency: item.currency || "INR",
      city: item.city || params.city,
      locality: item.locality || "",
      propertyType: item.property_type || params.property_type,
      bedrooms: item.bedrooms ?? null,
      bathrooms: item.bathrooms ?? null,
      area: item.carpet_area ?? item.covered_area ?? null,
      areaUnit: item.area_unit || "sqft",
      furnishing: item.furnishing || null,
      floor: item.floor || null,
      image:
        item.images?.[0] ||
        item.image ||
        item.image_url ||
        null,
      images: Array.isArray(item.images) ? item.images : [],
      listingUrl: item.url || null,
    }));

    return res.status(200).json({
      success: payload?.success !== false,
      source: "scrappa",
      city: params.city,
      page: payload?.data?.page ?? pageNumber,
      limit: payload?.data?.limit ?? pageSize,
      total: payload?.data?.total ?? properties.length,
      hasMore: payload?.data?.has_more ?? false,
      properties,
    });
  } catch (error) {
    const status = error.response?.status;

    // Keep detailed provider errors in the backend terminal for debugging.
    console.error(
      "Scrappa API error:",
      status || error.code || error.message,
      error.response?.data || ""
    );

    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        success: false,
        message: "Scrappa request timed out. Please try again.",
      });
    }

    if (status === 422) {
      return res.status(400).json({
        success: false,
        message:
          "Scrappa rejected the search parameters. Check the city and propertyType values.",
        providerError: error.response?.data,
      });
    }

    if (status === 401 || status === 403) {
      return res.status(502).json({
        success: false,
        message: "Scrappa rejected the API key or request.",
      });
    }

    if (status === 503) {
      return res.status(502).json({
        success: false,
        message: "Scrappa's property service is temporarily unavailable.",
      });
    }

    return res.status(502).json({
      success: false,
      message: "Unable to fetch external properties.",
      providerStatus: status || null,
    });
  }
};

module.exports = {
  searchExternalProperties,
};
