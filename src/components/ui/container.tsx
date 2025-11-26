import * as React from "react"

import { cn } from "@/lib/utils"

const Container = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "py-1 px-2 md:px-1 space-y-0",
      className
    )}
    {...props}
  />
))
Container.displayName = "Container"

export { Container }