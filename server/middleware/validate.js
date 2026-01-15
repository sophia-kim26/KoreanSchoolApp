// Bergen County Academies coordinates
const BCA_LOCATION = {
  latitude: 40.9137,
  longitude: -74.0789,
  radiusMeters: 100 // Allow 100 meter radius around the school
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export const validateLocation = (req, res, next) => {
  const { latitude, longitude } = req.body;
  
  if (!latitude || !longitude) {
    return res.status(400).json({ 
      error: 'Location is required. Please enable location services.' 
    });
  }

  const distance = calculateDistance(
    latitude,
    longitude,
    BCA_LOCATION.latitude,
    BCA_LOCATION.longitude
  );

  console.log(`Distance from BCA: ${distance.toFixed(2)} meters`);

  if (distance > BCA_LOCATION.radiusMeters) {
    return res.status(403).json({ 
      error: `You must be at Bergen County Academies to clock in. Current distance: ${distance.toFixed(0)}m` 
    });
  }

  next();
};

export const validateClockIn = (req, res, next) => {
  const { ta_id } = req.body;
  if (!ta_id) {
    return res.status(400).json({ error: 'TA ID is required' });
  }
  next();
};

export const validateCreateAccount = (req, res, next) => {
  const { first_name, last_name, email, ta_code, session_day } = req.body;
  
  if (!first_name || !last_name || !email || !ta_code || !session_day) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  // Basic email validation
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  next();
};

export const validateShift = (req, res, next) => {
  const { ta_id, clock_in } = req.body;
  
  if (!ta_id || !clock_in) {
    return res.status(400).json({ error: 'TA ID and clock in time are required' });
  }
  
  next();
};