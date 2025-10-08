import React, { useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

export default function Recaptcha({ onChange }) {
  const recaptchaRef = useRef(null);
  const siteKey = '6LfN0OErAAAAANkRhy54tdl_12bF84Jn3N4OZPjN';
  return (
    <div style={{margin: '8px 0 12px'}}>
      <ReCAPTCHA ref={recaptchaRef} sitekey={siteKey} onChange={onChange} theme="dark" />
    </div>
  );
}
