import * as React from "react"

import { cn } from "@/lib/utils"

const Container = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "py-0 px-2 md:px-0 space-y-0",
      className
    )}
    {...props}
  />
))
Container.displayName = "Container"

export { Container }