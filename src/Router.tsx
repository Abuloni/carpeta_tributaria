import { createBrowserRouter, RouterProvider } from "react-router";
import { HydrateFallback } from "./components/HydrateFallback";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { lazify } from "./shared/lazify";

const router = createBrowserRouter([{
  HydrateFallback : HydrateFallback,
  ErrorBoundary : ErrorBoundary,
  path : "/",
  children : [
    { index: true, lazy : () => import( './pages/App' ).then( lazify ) },
    { path : "login",  lazy : () => import( './pages/Login' ).then( lazify ) }
  ]
}], { basename: '/carpeta_tributaria/' });

export default function Router() {
  return <RouterProvider router={router} />
}