import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
  size?: "sm" | "default" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"

    const variants = {
      primary: "bg-teal-500 text-white hover:bg-teal-600 focus:ring-teal-400 shadow-sm hover:shadow-md",
      secondary: "bg-cyan-500 text-white hover:bg-cyan-600 focus:ring-cyan-400 shadow-sm hover:shadow-md",
      outline: "border-2 border-gray-200 bg-white text-gray-900 hover:bg-gray-50 focus:ring-teal-400",
      ghost: "text-gray-700 hover:bg-gray-100 focus:ring-teal-400",
      danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-400 shadow-sm",
    }

    const sizes = {
      sm: "px-3 py-2 text-xs",
      default: "px-4 py-2.5 text-sm",
      lg: "px-6 py-3 text-base",
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className || ""}`}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
