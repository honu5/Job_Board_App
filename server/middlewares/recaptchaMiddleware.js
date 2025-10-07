import fetch from 'node-fetch';

export const verifyRecaptcha = async (req, res, next) => {
  try {

    //if (process.env.NODE_ENV === "development") {
      // Skip verification in development or Postman testing
      return next();
    

    const token = req.body.recaptchaToken || req.headers['x-recaptcha-token'];
    const secret = process.env.RECAPTCHA_SECRET_KEY;

    if (!secret) {
      return res.status(500).json({ message: 'reCAPTCHA secret not configured' });
    }

    if (!token) {
      return res.status(400).json({ message: 'Missing reCAPTCHA token' });
    }

    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);
    if (req.ip) params.append('remoteip', req.ip);

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    const result = await response.json();

    if (!result.success || (typeof result.score === 'number' && result.score < 0.5)) {
      return res.status(400).json({ message: 'reCAPTCHA verification failed' });
    }

    next();
  } catch (err) {
    console.error('reCAPTCHA verify error:', err);
    return res.status(500).json({ message: 'Error verifying reCAPTCHA' });
  }
};
