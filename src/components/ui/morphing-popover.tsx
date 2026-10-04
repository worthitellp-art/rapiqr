import { useState, useId, useRef, useEffect, createContext, useContext, isValidElement } from 'react';
import type { ComponentProps, ForwardRefExoticComponent, ReactNode } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import type { Transition, Variants } from 'framer-motion';
import { useClickOutside } from '../../hooks/use-click-outside';
import { cn } from '../../lib/cn';

const TRANSITION: Transition = {
  type: 'spring',
  bounce: 0.1,
  duration: 0.4,
};

type MorphingPopoverContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  uniqueId: string;
  variants?: Variants;
};

const MorphingPopoverContext = createContext<MorphingPopoverContextValue | null>(null);

function usePopoverLogic({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  const uniqueId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);

  const isOpen = controlledOpen ?? uncontrolledOpen;

  const open = () => {
    if (controlledOpen === undefined) setUncontrolledOpen(true);
    onOpenChange?.(true);
  };

  const close = () => {
    if (controlledOpen === undefined) setUncontrolledOpen(false);
    onOpenChange?.(false);
  };

  const toggle = () => (isOpen ? close() : open());

  return { isOpen, open, close, toggle, uniqueId };
}

export type MorphingPopoverProps = {
  children: ReactNode;
  transition?: Transition;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variants?: Variants;
  className?: string;
} & Omit<ComponentProps<'div'>, 'children' | 'className'>;

/**
 * A trigger that morphs into its panel: the trigger and the panel share a
 * framer-motion `layoutId`, so opening animates one into the other. Closes on
 * outside press or Escape. Pass `open`/`onOpenChange` to control it yourself.
 */
function MorphingPopover({
  children,
  transition = TRANSITION,
  defaultOpen,
  open,
  onOpenChange,
  variants,
  className,
  ...props
}: MorphingPopoverProps) {
  const popoverLogic = usePopoverLogic({ defaultOpen, open, onOpenChange });

  return (
    <MorphingPopoverContext.Provider value={{ ...popoverLogic, variants }}>
      <MotionConfig transition={transition}>
        <div className={cn('relative flex items-center justify-center', className)} key={popoverLogic.uniqueId} {...props}>
          {children}
        </div>
      </MotionConfig>
    </MorphingPopoverContext.Provider>
  );
}

export type MorphingPopoverTriggerProps = {
  asChild?: boolean;
  children: ReactNode;
  className?: string;
} & Omit<ComponentProps<typeof motion.button>, 'children' | 'className'>;

function MorphingPopoverTrigger({ children, className, asChild = false, ...props }: MorphingPopoverTriggerProps) {
  const context = useContext(MorphingPopoverContext);
  if (!context) {
    throw new Error('MorphingPopoverTrigger must be used within MorphingPopover');
  }

  // A press on the trigger must not count as "outside" the panel, or it would
  // close on mousedown and instantly reopen on click.
  const keepOpenOnPress = {
    onMouseDown: (event: { stopPropagation: () => void }) => event.stopPropagation(),
    onTouchStart: (event: { stopPropagation: () => void }) => event.stopPropagation(),
  };

  if (asChild && isValidElement(children)) {
    const MotionComponent = motion.create(children.type as ForwardRefExoticComponent<any>);
    const childProps = children.props as Record<string, unknown>;

    return (
      <MotionComponent
        {...childProps}
        {...keepOpenOnPress}
        onClick={context.toggle}
        layoutId={`popover-trigger-${context.uniqueId}`}
        className={childProps.className}
        key={context.uniqueId}
        aria-expanded={context.isOpen}
        aria-haspopup="dialog"
        aria-controls={`popover-content-${context.uniqueId}`}
      />
    );
  }

  return (
    <motion.div key={context.uniqueId} layoutId={`popover-trigger-${context.uniqueId}`} onClick={context.toggle} {...keepOpenOnPress}>
      <motion.button
        {...props}
        layoutId={`popover-label-${context.uniqueId}`}
        key={context.uniqueId}
        className={className}
        aria-expanded={context.isOpen}
        aria-haspopup="dialog"
        aria-controls={`popover-content-${context.uniqueId}`}
      >
        {children}
      </motion.button>
    </motion.div>
  );
}

export type MorphingPopoverContentProps = {
  children: ReactNode;
  className?: string;
} & Omit<ComponentProps<typeof motion.div>, 'children' | 'className'>;

function MorphingPopoverContent({ children, className, ...props }: MorphingPopoverContentProps) {
  const context = useContext(MorphingPopoverContext);
  if (!context) {
    throw new Error('MorphingPopoverContent must be used within MorphingPopover');
  }

  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, context.close);

  useEffect(() => {
    if (!context.isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') context.close();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [context.isOpen, context.close]);

  return (
    <AnimatePresence>
      {context.isOpen && (
        <motion.div
          {...props}
          ref={ref}
          layoutId={`popover-trigger-${context.uniqueId}`}
          key={context.uniqueId}
          id={`popover-content-${context.uniqueId}`}
          role="dialog"
          aria-modal="false"
          className={cn(
            'absolute z-50 overflow-hidden rounded-lg border border-neutral-950/10 bg-white text-neutral-950 shadow-[0_20px_45px_-18px_rgba(0,0,0,0.28)]',
            className
          )}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={context.variants}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { MorphingPopover, MorphingPopoverTrigger, MorphingPopoverContent };
