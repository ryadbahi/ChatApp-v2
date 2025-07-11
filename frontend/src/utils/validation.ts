interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  custom?: (value: any) => string | undefined;
}

interface ValidationSchema {
  [key: string]: ValidationRule;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateForm = (
  data: Record<string, any>,
  schema: ValidationSchema
): ValidationResult => {
  const errors: Record<string, string> = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Required validation
    if (
      rules.required &&
      (!value || (typeof value === "string" && !value.trim()))
    ) {
      errors[field] = "This field is required";
      continue;
    }

    // Skip other validations if field is empty and not required
    if (!value && !rules.required) continue;

    // String validations
    if (typeof value === "string") {
      // Min length
      if (rules.minLength && value.length < rules.minLength) {
        errors[field] = `Must be at least ${rules.minLength} characters`;
        continue;
      }

      // Max length
      if (rules.maxLength && value.length > rules.maxLength) {
        errors[field] = `Must be no more than ${rules.maxLength} characters`;
        continue;
      }

      // Email validation
      if (rules.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors[field] = "Please enter a valid email address";
          continue;
        }
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        errors[field] = "Invalid format";
        continue;
      }
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        errors[field] = customError;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Common validation schemas
export const authValidationSchemas = {
  login: {
    email: { required: true, email: true },
    password: { required: true, minLength: 1 },
  },
  register: {
    username: {
      required: true,
      minLength: 3,
      maxLength: 20,
      pattern: /^[a-zA-Z0-9_]+$/,
      custom: (value: string) => {
        if (value && value.includes(" ")) {
          return "Username cannot contain spaces";
        }
      },
    },
    email: { required: true, email: true },
    password: {
      required: true,
      minLength: 8,
      custom: (value: string) => {
        if (value && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return "Password must contain at least one uppercase letter, one lowercase letter, and one number";
        }
      },
    },
  },
};

export const messageValidationSchema = {
  content: {
    required: true,
    maxLength: 1000,
    custom: (value: string) => {
      if (value && value.trim().length === 0) {
        return "Message cannot be empty";
      }
    },
  },
};

export const roomValidationSchema = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-_]+$/,
  },
  description: {
    maxLength: 200,
  },
};
