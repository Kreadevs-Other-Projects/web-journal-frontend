import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
  const headers = new Headers(init.headers);
  headers.delete("Authorization");
  return nativeFetch(input, { ...init, headers, credentials: "include" });
};

createRoot(document.getElementById("root")!).render(<App />);
