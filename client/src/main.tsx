import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./app/App";
import LiteraturePage from "./features/literature/LiteraturePage";
import AIDesignerPage from "./features/aidesigner/AIDesignerPage";
import PhysicsEnginePage from "./features/physics/PhysicsEnginePage";
import "./app/theme.css";

const router = createBrowserRouter([
  { path: "/", element: <App />, children: [
    { index: true, element: <LiteraturePage /> },
    { path: "literature-review", element: <LiteraturePage /> },
    { path: "ai-designer", element: <AIDesignerPage /> },
    { path: "physics-engine", element: <PhysicsEnginePage /> }
  ]}
]);

const qc = new QueryClient();
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
