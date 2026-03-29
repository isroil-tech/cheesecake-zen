import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("Build timestamp:", Date.now());

createRoot(document.getElementById("root")!).render(<App />);
