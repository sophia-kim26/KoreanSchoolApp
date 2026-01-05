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