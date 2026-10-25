
const express = require("express");

const router = express.Router();

router.post("/estimate", (req, res) => {
  const { deposit, upfrontPercent, months } = req.body;

  if (
    typeof deposit !== "number" ||
    typeof upfrontPercent !== "number" ||
    typeof months !== "number" ||
    !Number.isFinite(deposit) ||
    !Number.isFinite(upfrontPercent) ||
    !Number.isFinite(months) ||
    deposit < 10000 ||
    deposit > 200000 ||
    upfrontPercent < 10 ||
    upfrontPercent > 90 ||
    ![3, 6, 9].includes(months)
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide valid deposit plan values.",
    });
  }

  const upfront = Math.round((deposit * upfrontPercent) / 100);
  const financed = deposit - upfront;

  return res.json({
    success: true,
    estimate: {
      deposit,
      upfront,
      financed,
      months,
      monthlyInstalment: Math.round(financed / months),
      disclaimer:
        "Illustrative estimate only. Interest, fees, eligibility and lender terms are not included.",
    },
  });
});

module.exports = router;
