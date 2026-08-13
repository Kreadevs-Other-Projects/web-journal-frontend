import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
  const headers = new Headers(init.headers);
  const requestUrl =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = sessionStorage.getItem("accessToken");
  const isApiRequest =
    typeof apiUrl === "string" &&
    apiUrl.length > 0 &&
    requestUrl.startsWith(apiUrl);

  if (isApiRequest && token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return nativeFetch(input, { ...init, headers, credentials: "include" });
};

createRoot(document.getElementById("root")!).render(<App />);
