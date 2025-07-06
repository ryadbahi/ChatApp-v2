import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import { RoomProvider } from "./context/RoomContext.tsx";
import { InactivityProvider } from "./context/InactivityContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RoomProvider>
          <InactivityProvider>
            <App />
          </InactivityProvider>
        </RoomProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
