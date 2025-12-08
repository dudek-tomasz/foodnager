/**
 * VisuallyHidden - Hides content visually but keeps it accessible for screen readers
 *
 * Uses CSS to hide content from sighted users while keeping it accessible to screen readers
 */

import * as React from "react";

function VisuallyHidden({ className, children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={className}
      style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: "0",
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: "0",
      }}
      {...props}
    >
      {children}
    </span>
  );
}

export { VisuallyHidden };
