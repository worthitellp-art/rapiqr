import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

type Tone = 'outline' | 'dark';
type Size = 'sm' | 'md' | 'lg';

export interface FlowButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Label text. Use `children` instead when the label needs an icon or markup. */
  text?: string;
  children?: ReactNode;
  /**
   * `outline`: transparent pill that floods dark on hover (the original design).
   * `dark`: solid black pill that floods brand yellow on hover.
   */
  tone?: Tone;
  size?: Size;
  fullWidth?: boolean;
  /** Replaces the arrows with a spinner and disables the button. */
  loading?: boolean;
}

const TONE: Record<Tone, { button: string; circle: string; arrow: string }> = {
  outline: {
    button: 'border-[#333333]/40 bg-transparent text-[#111111] hover:border-transparent hover:text-white',
    circle: 'bg-[#111111]',
    arrow: 'stroke-[#111111] group-hover:stroke-white',
  },
  dark: {
    button: 'border-transparent bg-[#111111] text-white hover:text-[#111111]',
    circle: 'bg-[#FFD500]',
    arrow: 'stroke-white group-hover:stroke-[#111111]',
  },
};

const SIZE: Record<Size, string> = {
  sm: 'px-6 py-2 text-xs',
  md: 'px-8 py-3 text-sm',
  lg: 'px-9 py-4 text-[15px]',
};

/**
 * Button with the "flow" hover: a circle swells from the centre to flood
 * the button, the corners square off, one arrow slides out while the other slides
 * in, and the label shifts across. Pure CSS — no animation library needed.
 */
export const FlowButton = forwardRef<HTMLButtonElement, FlowButtonProps>(function FlowButton(
  { text, children, tone = 'outline', size = 'md', fullWidth = false, loading = false, className, disabled, type = 'button', ...props },
  ref
) {
  const t = TONE[tone];
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'group relative inline-flex cursor-pointer select-none items-center justify-center gap-1 overflow-hidden rounded-lg border-[1.5px] font-semibold',
        'transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:rounded-sm active:scale-[0.96]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950',
        'disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none',
        t.button,
        SIZE[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {/* Left arrow: waits off-canvas, slides in on hover */}
      {!loading && (
        <ArrowRight
          aria-hidden="true"
          className={cn(
            'absolute left-[-25%] z-[9] h-4 w-4 fill-none transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:left-4',
            t.arrow
          )}
        />
      )}

      <span
        className={cn(
          'relative z-[1] inline-flex items-center justify-center gap-1.5 transition-all duration-[800ms] ease-out',
          loading ? 'translate-x-0' : '-translate-x-3 group-hover:translate-x-3'
        )}
      >
        {children ?? text}
      </span>

      {/* Flood circle: scaled up far enough to cover any button width */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 scale-100 rounded-[50%] opacity-0',
          'transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-[45] group-hover:opacity-100',
          t.circle
        )}
      />

      {/* Right arrow: sits at rest, slides out on hover. Spinner takes its place while loading. */}
      {loading ? (
        <Loader2 aria-hidden="true" className={cn('absolute right-4 z-[9] h-4 w-4 animate-spin', t.arrow)} />
      ) : (
        <ArrowRight
          aria-hidden="true"
          className={cn(
            'absolute right-4 z-[9] h-4 w-4 fill-none transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:right-[-25%]',
            t.arrow
          )}
        />
      )}
    </button>
  );
});

export default FlowButton;
