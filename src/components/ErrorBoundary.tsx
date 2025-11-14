import { FaTriangleExclamation } from "react-icons/fa6";
import { isRouteErrorResponse, useRouteError } from "react-router";

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="centerd-alone">
      <div>
        <div className="is-align-items-center has-content-centered">
          <span className="has-text-danger is-size-2">
            <FaTriangleExclamation />
          </span>
          <span className="icon-text is-size-4">
            &nbsp;&nbsp;Ha ocurrido un error
          </span>
        </div>
        <br />
        { isRouteErrorResponse(error) ? 
            <div>
              <p>{error.statusText}</p>
              {error.data?.message && <p>{error.data.message}</p>}
            </div>
          : 
            <div>
              <p>{(error as any)?.message}</p>
            </div> }
      </div>
    </div>
  );
}