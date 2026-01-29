// BCA "campus anchors" (add more points if you want)
// These do NOT need to be perfect—just around the campus/building.
const BCA_POINTS = [
  { latitude: 40.9137, longitude: -74.0789 }, // your original
  // Add a couple more anchors (replace these if you pull exact points from Maps)
  { latitude: 40.9142, longitude: -74.0782 },
  { latitude: 40.9133, longitude: -74.0776 },
  { latitude: 40.9129, longitude: -74.0794 },
];

// Allowed distance from campus (meters)
const ALLOWED_RADIUS_METERS = 400;

// Require reasonable accuracy (meters)
// On phones you often get 10–50m. On laptops it can be 500–5000m.
const MAX_ACCEPTED_ACCURACY_METERS = 200;

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const validateLocation = (req, res, next) => {
  const { latitude, longitude, accuracy } = req.body;

  if (latitude == null || longitude == null) {
    return res.status(400).json({
      error: "Location is required. Please enable location services.",
    });
  }

  const lat = Number(latitude);
  const lon = Number(longitude);
  const acc = Number(accuracy || 0);

  // If accuracy is missing or too big, reject with a helpful message.
  // This prevents “I’m 4km away but the place name looks right” situations.
  if (!acc || acc > MAX_ACCEPTED_ACCURACY_METERS) {
    return res.status(400).json({
      error: `Location accuracy too low (${Math.round(acc || 0)}m). Try: enable precise location, connect to Wi-Fi, step near a window/outside, or use a phone.`,
    });
  }

  // Compute minimum distance to any anchor point
  const minDistance = Math.min(
    ...BCA_POINTS.map((p) => calculateDistance(lat, lon, p.latitude, p.longitude))
  );

  console.log(
    `Min distance from BCA: ${minDistance.toFixed(0)}m (allowed: ${ALLOWED_RADIUS_METERS}m), accuracy: ${Math.round(
      acc
    )}m`
  );

  if (minDistance > ALLOWED_RADIUS_METERS) {
    return res.status(403).json({
      error: `You must be at Bergen County Academies to clock in. Current distance: ${minDistance.toFixed(
        0
      )}m`,
    });
  }

  next();
};

export const validateClockIn = (req, res, next) => {
  const { ta_id } = req.body;
  if (!ta_id) {
    return res.status(400).json({ error: "TA ID is required" });
  }
  next();
};

export const validateCreateAccount = (req, res, next) => {
  const { first_name, last_name, email, ta_code, session_day } = req.body;

  if (!first_name || !last_name || !email || !ta_code || !session_day) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  next();
};

export const validateShift = (req, res, next) => {
  const { ta_id, clock_in } = req.body;

  if (!ta_id || !clock_in) {
    return res
      .status(400)
      .json({ error: "TA ID and clock in time are required" });
  }

  next();
};
