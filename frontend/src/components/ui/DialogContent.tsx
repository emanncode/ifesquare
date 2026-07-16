"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DialogPortal } from "./DialogPortal"
import { DialogOverlay } from "./DialogOverlay"

export function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed bottom-0 left-0 right-0 top-auto z-50 grid w-full max-w-full max-h-[85svh] overflow-y-auto translate-x-0 translate-y-0 gap-6 rounded-t-xl rounded-b-none bg-popover p-6 text-sm text-popover-foreground shadow-xl ring-1 ring-foreground/5 dark:ring-foreground/10 outline-none",
          "data-open:animate-in data-open:slide-in-from-bottom data-open:fade-in-0",
          "data-closed:animate-out data-closed:slide-out-to-bottom data-closed:fade-out-0",
          "sm:top-1/2 sm:left-1/2 sm:right-auto sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:max-h-none sm:overflow-visible",
          "sm:rounded-xl",
          "sm:data-open:animate-in sm:data-open:fade-in-0 sm:data-open:zoom-in-95",
          "sm:data-closed:animate-out sm:data-closed:fade-out-0 sm:data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-4 right-4 bg-secondary"
              size="icon-sm"
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}
