import { createBrowserRouter, RouterProvider } from "react-router";
import { HydrateFallback } from "./components/HydrateFallback";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { lazify } from "./shared/lazify";

const router = createBrowserRouter([{
  HydrateFallback : HydrateFallback,
  ErrorBoundary : ErrorBoundary,
  path : "/",
  children : [
    { index: true, lazy : () => import( './App' ).then( lazify ) }
  ]
}], { basename: import.meta.env.VITE_BASE });

export default function Router() {
  return <RouterProvider router={router} />
}