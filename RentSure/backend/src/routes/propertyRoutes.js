
const express = require("express");

const {
  listProperties,
  getProperty,
  listMyProperties,
  createProperty,
  updateProperty,
  deleteProperty,
} = require("../controllers/propertyController");
const {
  searchDatasetProperties,
} = require("../controllers/datasetPropertyController");
const {
  searchExternalProperties,
} = require("../controllers/externalPropertyController");

const {
  authenticateToken,
  allowRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/properties:
 *   get:
 *     tags: [Properties]
 *     summary: Browse available property listings
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search title, address, or city
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *     responses:
 *       200:
 *         description: Property listings returned
 */
router.get("/", listProperties);

/**
 * @swagger
 * /api/properties/external/search:
 *   get:
 *     tags: [Properties]
 *     summary: Search external live rental listings
 *     description: Searches third-party listings through the backend. These listings are not stored in RentSure's property table.
 *     parameters:
 *       - in: query
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *         description: Indian city to search
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *       - in: query
 *         name: propertyType
 *         schema:
 *           type: string
 *           example: flat
 *       - in: query
 *         name: minRent
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxRent
 *         schema:
 *           type: number
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *     responses:
 *       200:
 *         description: External rental listings returned
 *       400:
 *         description: Invalid search parameters
 *       502:
 *         description: External property API request failed
 *       504:
 *         description: External property API timed out
 */
router.get("/external/search", searchExternalProperties);

/**
 * @swagger
 * /api/properties/mine:
 *   get:
 *     tags: [Properties]
 *     summary: List properties owned by the logged-in landlord
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Landlord's listings returned
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Landlord role required
 */
router.get(
  "/mine",
  authenticateToken,
  allowRoles("landlord"),
  listMyProperties
);

/**
 * @swagger
 * /api/properties:
 *   post:
 *     tags: [Properties]
 *     summary: Create a property listing
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/PropertyInput"
 *     responses:
 *       201:
 *         description: Property created
 *       400:
 *         description: Invalid property data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Landlord role required
 */
router.post(
  "/",
  authenticateToken,
  allowRoles("landlord"),
  createProperty
);

/**
 * 
/**
 * @swagger
 * /api/properties/dataset/search:
 *   get:
 *     tags: [Properties]
 *     summary: Search dataset-based properties
 *     responses:
 *       200:
 *         description: Dataset property results returned
 *       500:
 *         description: Dataset search failed
 */
router.get("/dataset/search", searchDatasetProperties);

router.get("/:id", getProperty);


/**
 * @swagger
 * /api/properties/{id}:
 *   put:
 *     tags: [Properties]
 *     summary: Update a property you own
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/PropertyInput"
 *     responses:
 *       200:
 *         description: Property updated
 *       403:
 *         description: You do not own this property
 *       404:
 *         description: Property not found
 */
router.put(
  "/:id",
  authenticateToken,
  allowRoles("landlord"),
  updateProperty
);

/**
 * @swagger
 * /api/properties/{id}:
 *   delete:
 *     tags: [Properties]
 *     summary: Delete a property you own
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Property deleted
 *       403:
 *         description: You do not own this property
 *       404:
 *         description: Property not found
 *       409:
 *         description: Property has related records
 */
router.delete(
  "/:id",
  authenticateToken,
  allowRoles("landlord"),
  deleteProperty
);

module.exports = router;
