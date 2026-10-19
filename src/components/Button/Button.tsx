import type { ComponentProps } from "react";
import styles from "./Button.module.css";

interface ButtonProps extends ComponentProps<"button"> {
  variant?: "primary" | "secondary" | "dark";
  iconOnly?: boolean;
}

function Button({
  variant = "primary",
  iconOnly = false,
  type = "button",
  className,
  ...props
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    iconOnly && styles.iconOnly,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <button type={type} className={classNames} {...props} />;
}

export default Button;
