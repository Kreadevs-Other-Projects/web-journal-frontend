type ApiErrorShape = {
  message?: unknown;
  error?: unknown;
  errors?: unknown;
};

const extractValidationMessage = (errors: unknown) => {
  if (!Array.isArray(errors)) return null;
  const first = errors[0];
  if (first && typeof first === "object" && "message" in first) {
    const message = (first as { message?: unknown }).message;
    return typeof message === "string" ? message : null;
  }
  if (typeof first === "string") return first;
  return null;
};

export const extractApiErrorMessage = (
  error: unknown,
  fallback = "Unable to complete the request. Please try again.",
) => {
  if (error instanceof TypeError) {
    return "Unable to connect to the server. Check your connection and try again.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const data = error as ApiErrorShape;
    const validationMessage = extractValidationMessage(data.errors);
    if (validationMessage) return validationMessage;
    if (typeof data.message === "string") return data.message;
    if (typeof data.error === "string") return data.error;
  }

  return fallback;
};

export const readApiError = async (
  response: Response,
  fallback = "Unable to complete the request. Please try again.",
) => {
  try {
    const data = await response.json();
    return extractApiErrorMessage(data, fallback);
  } catch {
    if (response.status === 401) return "Your session has expired. Please sign in again.";
    if (response.status === 403) return "You do not have permission to perform this action.";
    if (response.status >= 500) return "Server error. Please try again.";
    return fallback;
  }
};
