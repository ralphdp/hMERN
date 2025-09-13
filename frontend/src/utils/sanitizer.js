import DOMPurify from "dompurify";

const sanitize = (dirty) => {
  return DOMPurify.sanitize(dirty);
};

export const sanitizeObject = (obj) => {
  const sanitizedObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (typeof value === "string") {
        sanitizedObj[key] = sanitize(value);
      } else if (typeof value === "object" && value !== null) {
        sanitizedObj[key] = sanitizeObject(value); // Recursively sanitize nested objects
      } else {
        sanitizedObj[key] = value;
      }
    }
  }
  return sanitizedObj;
};

export default sanitize;
