
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "RentSure API",
      version: "1.0.0",
      description:
        "API documentation for RentSure rental deposit financing and property management.",
    },

    servers: [
      {
        url: "http://localhost:5000",
        description: "Local development server",
      },
    ],

    tags: [
      { name: "Health", description: "Backend and database status" },
      {
        name: "Authentication",
        description: "Registration, login, and profile",
      },
      {
        name: "Calculator",
        description: "Rental deposit estimates",
      },
      {
        name: "Properties",
        description: "Property listing management",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },

      schemas: {
        RegisterRequest: {
          type: "object",
          required: ["fullName", "email", "password"],
          properties: {
            fullName: {
              type: "string",
              minLength: 2,
              maxLength: 120,
              example: "Test Tenant",
            },
            email: {
              type: "string",
              format: "email",
              maxLength: 255,
              example: "tenant@example.com",
            },
            password: {
              type: "string",
              format: "password",
              minLength: 8,
              maxLength: 72,
              example: "TestPass123!",
            },
          },
        },

        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "tenant@example.com",
            },
            password: {
              type: "string",
              format: "password",
              example: "TestPass123!",
            },
          },
        },

        CalculatorRequest: {
          type: "object",
          required: ["deposit", "upfrontPercent", "months"],
          properties: {
            deposit: {
              type: "number",
              example: 60000,
            },
            upfrontPercent: {
              type: "number",
              example: 30,
            },
            months: {
              type: "integer",
              enum: [3, 6, 9],
              example: 6,
            },
          },
        },

        PropertyInput: {
          type: "object",
          required: [
            "title",
            "address",
            "city",
            "monthlyRent",
            "securityDeposit",
          ],
          properties: {
            title: {
              type: "string",
              example: "Modern 2 BHK Apartment",
            },
            address: {
              type: "string",
              example: "Sector 35",
            },
            city: {
              type: "string",
              example: "Chandigarh",
            },
            monthlyRent: {
              type: "number",
              example: 18000,
            },
            securityDeposit: {
              type: "number",
              example: 36000,
            },
          },
        },
      },
    },

    paths: {
      "/api/health": {
        get: {
          tags: ["Health"],
          summary: "Check backend and database health",
          responses: {
            200: {
              description: "Health check successful",
            },
            500: {
              description: "Health check failed",
            },
          },
        },
      },

      "/api/auth/register": {
        post: {
          tags: ["Authentication"],
          summary: "Register a new tenant account",
          description:
            "Creates a tenant account. Public registration cannot assign the landlord role.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/RegisterRequest",
                },
              },
            },
          },
          responses: {
            201: {
              description: "Account created successfully",
            },
            400: {
              description: "Invalid registration input",
            },
            409: {
              description: "Email already registered",
            },
            500: {
              description: "Registration failed",
            },
          },
        },
      },

      "/api/auth/login": {
        post: {
          tags: ["Authentication"],
          summary: "Log in",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/LoginRequest",
                },
              },
            },
          },
          responses: {
            200: {
              description: "Login successful",
            },
            400: {
              description: "Missing or invalid input",
            },
            401: {
              description: "Invalid credentials",
            },
            500: {
              description: "Login failed",
            },
          },
        },
      },

      "/api/auth/me": {
        get: {
          tags: ["Authentication"],
          summary: "Get the current user's profile",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Profile returned successfully",
            },
            401: {
              description: "Authentication required or token invalid",
            },
            404: {
              description: "User account not found",
            },
            500: {
              description: "Profile retrieval failed",
            },
          },
        },
      },

      "/api/calculator/estimate": {
        post: {
          tags: ["Calculator"],
          summary: "Estimate rental deposit payments",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CalculatorRequest",
                },
              },
            },
          },
          responses: {
            200: {
              description: "Estimate calculated",
            },
            400: {
              description: "Invalid calculator input",
            },
          },
        },
      },

      "/api/properties": {
        get: {
          tags: ["Properties"],
          summary: "Browse property listings",
          parameters: [
            {
              in: "query",
              name: "search",
              schema: { type: "string" },
            },
            {
              in: "query",
              name: "city",
              schema: { type: "string" },
            },
            {
              in: "query",
              name: "page",
              schema: {
                type: "integer",
                minimum: 1,
              },
            },
            {
              in: "query",
              name: "limit",
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 50,
              },
            },
          ],
          responses: {
            200: {
              description: "Property listings returned",
            },
          },
        },

        post: {
          tags: ["Properties"],
          summary: "Create a property listing (landlords only)",
          description:
            "Creates a property for the authenticated landlord.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PropertyInput",
                },
              },
            },
          },
          responses: {
            201: {
              description: "Property created",
            },
            400: {
              description: "Invalid property data",
            },
            401: {
              description: "Authentication required",
            },
            403: {
              description: "Landlord role required",
            },
            500: {
              description: "Property creation failed",
            },
          },
        },
      },

      "/api/properties/mine": {
        get: {
          tags: ["Properties"],
          summary: "List your own properties (landlords only)",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Your properties returned",
            },
            401: {
              description: "Authentication required",
            },
            403: {
              description: "Landlord role required",
            },
          },
        },
      },

      "/api/properties/{id}": {
        get: {
          tags: ["Properties"],
          summary: "Get a property by ID",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Property returned",
            },
            400: {
              description: "Invalid property ID",
            },
            404: {
              description: "Property not found",
            },
          },
        },

        put: {
          tags: ["Properties"],
          summary: "Update your property (landlords only)",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PropertyInput",
                },
              },
            },
          },
          responses: {
            200: {
              description: "Property updated",
            },
            400: {
              description: "Invalid property data",
            },
            401: {
              description: "Authentication required",
            },
            403: {
              description: "Landlord role required or property belongs to another landlord",
            },
            404: {
              description: "Property not found",
            },
            500: {
              description: "Property update failed",
            },
          },
        },

        delete: {
          tags: ["Properties"],
          summary: "Delete your property (landlords only)",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Property deleted",
            },
            401: {
              description: "Authentication required",
            },
            403: {
              description: "Landlord role required or property belongs to another landlord",
            },
            404: {
              description: "Property not found",
            },
            409: {
              description: "Property has related records",
            },
            500: {
              description: "Property deletion failed",
            },
          },
        },
      },
    },
  },

  // All endpoint documentation is defined in the paths above.
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

console.log(
  "Swagger discovered endpoints:",
  Object.keys(swaggerSpec.paths || {})
);

module.exports = swaggerSpec;
