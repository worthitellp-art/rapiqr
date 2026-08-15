import logoLightBg from "../../../assets/logo for wh bg.png";
import logoDarkBg from "../../../assets/darkbglogo.png";
import logoYellowBg from "../../../assets/Group 1000005716-2.png";
import logoDefault from "../../../assets/Group 1000005716.png";

export type LogoVariant = "light" | "dark" | "yellow" | "default" | "auto";

interface AppLogoProps {
  variant?: LogoVariant;
  className?: string;
  alt?: string;
}

/**
 * Adaptive RapiQR Logo Component
 * Selects the optimal logo asset based on the background color:
 * - 'light': Dark text logo for white / light gray backgrounds
 * - 'dark': White text logo for dark slate / navy / black backgrounds
 * - 'yellow': Specialized logo for yellow / amber accent backgrounds
 * - 'default': Default RapiQR brand badge logo
 */
export default function AppLogo({
  variant = "light",
  className = "h-8 w-auto object-contain",
  alt = "RapiQR Logo",
}: AppLogoProps) {
  let logoSrc = logoLightBg;

  switch (variant) {
    case "dark":
      logoSrc = logoDarkBg;
      break;
    case "yellow":
      logoSrc = logoYellowBg;
      break;
    case "default":
      logoSrc = logoDefault;
      break;
    case "light":
    default:
      logoSrc = logoLightBg;
      break;
  }

  return (
    <img
      src={logoSrc}
      alt={alt}
      className={className}
      draggable={false}
    />
  );
}
