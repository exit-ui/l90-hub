import { Check, ChevronDown, CircleAlert } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  type ComponentProps,
  type FocusEvent,
  type ReactNode,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { FADE } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * The field system (spec 7.6): a white field card with a hairline edge. The label sits inside at the top,
 * the value below it in 20 px semibold (no zoom on iOS). Focus shows a green ring on the whole card.
 * A control outside a field card (a table cell) keeps a white surface of its own, 44 px tall.
 */
export const FIELD_CLASS = 'field-surface h-11 w-full min-w-0 px-4 sm:h-12';
export const TEXTAREA_CLASS = 'field-surface block w-full min-w-0 resize-none px-4 py-3';
/** Kept for older call sites: the same as FIELD_CLASS. */
export const CONTROL_CLASS = FIELD_CLASS;
export const CHECKBOX_CLASS =
  'size-6 rounded-full border-hub-faint data-checked:border-hub-success data-checked:bg-hub-success data-checked:text-hub-on-success';

/** A quiet "Saved" with a tick, shown for a moment after a field saves on blur. */
export function SavedTick({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.span
          animate={{ opacity: 1 }}
          className="type-caption inline-flex items-center gap-1 text-hub-positive"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          role="status"
          transition={FADE}
        >
          <Check aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
          Saved
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}

const SAVED_MS = 1600;

/** Shows "Saved" after a blur when the value changed while the field had focus. */
function useSavedTick(value: string, enabled: boolean) {
  const [shown, setShown] = useState(false);
  const atFocus = useRef(value);
  const timer = useRef(0);
  const onFocus = useCallback(() => {
    atFocus.current = value;
  }, [value]);
  const onBlur = useCallback(() => {
    if (!enabled || atFocus.current === value) {
      return;
    }
    setShown(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setShown(false), SAVED_MS);
  }, [enabled, value]);
  return { shown, onFocus, onBlur };
}

interface FieldProps {
  label: string;
  htmlFor: string;
  /** A short line that helps the user. */
  hint?: string;
  /** What is wrong and how to correct it. */
  error?: string;
  /** Shown on the right of the label, for example the "Saved" tick. */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** A white field card: the label and the control inside, an optional hint below, and an error with an icon. */
export function Field({ label, htmlFor, hint, error, aside, children, className }: FieldProps) {
  return (
    <div className={cn('grid min-w-0 content-start gap-2', className)}>
      <div className="field-box min-w-0">
        <div className="flex min-h-4 items-center justify-between gap-2">
          <label className="type-caption min-w-0 text-hub-label" htmlFor={htmlFor}>
            {label}
          </label>
          {aside}
        </div>
        {children}
      </div>
      {hint ? <p className="type-caption px-4 text-hub-label">{hint}</p> : null}
      {error ? (
        <p className="type-label flex items-center gap-2 px-4 text-hub-danger" role="alert">
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

type NativeInputProps = Omit<ComponentProps<'input'>, 'className'> & { className?: string };

/** One field control without a label, for a label that lives elsewhere. */
export function FieldInput({ className, ...props }: NativeInputProps) {
  return <input className={cn(FIELD_CLASS, className)} {...props} />;
}

type NativeTextareaProps = Omit<ComponentProps<'textarea'>, 'className' | 'rows'> & {
  className?: string;
  /** The rows to show first. The area grows with the text. */
  rows?: number;
};

/** A text area that starts at 2 lines and grows with the text. */
export function FieldTextarea({ className, rows = 2, value, onInput, ...props }: NativeTextareaProps) {
  const area = useRef<HTMLTextAreaElement>(null);
  const grow = () => {
    const element = area.current;
    if (element) {
      element.style.height = 'auto';
      element.style.height = `${element.scrollHeight}px`;
    }
  };
  useLayoutEffect(grow, [value]);
  return (
    <textarea
      className={cn(TEXTAREA_CLASS, className)}
      onInput={(event) => {
        grow();
        onInput?.(event);
      }}
      ref={area}
      rows={rows}
      value={value}
      {...props}
    />
  );
}

type InputProps = Omit<ComponentProps<'input'>, 'onChange' | 'value' | 'id'>;

interface TextFieldProps extends InputProps {
  label: string;
  value: string;
  /** Leave this out for a read-only field. */
  onChange?: (value: string) => void;
  hint?: string;
  error?: string;
  /** The field saves as the user types: show "Saved" after the blur. */
  autosave?: boolean;
  fieldClassName?: string;
}

/** A labelled input. Use type="number" or type="date" for those values. */
export function TextField({
  label,
  value,
  onChange,
  hint,
  error,
  autosave = false,
  className,
  fieldClassName,
  onBlur,
  onFocus,
  ...props
}: TextFieldProps) {
  const id = useId();
  const saved = useSavedTick(value, autosave && !error);
  return (
    <Field
      aside={<SavedTick show={saved.shown} />}
      className={fieldClassName}
      error={error}
      hint={hint}
      htmlFor={id}
      label={label}
    >
      <FieldInput
        aria-invalid={error ? true : undefined}
        className={className}
        id={id}
        onBlur={(event: FocusEvent<HTMLInputElement>) => {
          saved.onBlur();
          onBlur?.(event);
        }}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        onFocus={(event: FocusEvent<HTMLInputElement>) => {
          saved.onFocus();
          onFocus?.(event);
        }}
        value={value}
        {...props}
      />
    </Field>
  );
}

interface TextAreaFieldProps extends Omit<ComponentProps<'textarea'>, 'onChange' | 'value' | 'id' | 'rows'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  autosave?: boolean;
  rows?: number;
  fieldClassName?: string;
}

/** A labelled text area that grows from 2 lines. */
export function TextAreaField({
  label,
  value,
  onChange,
  hint,
  autosave = false,
  className,
  fieldClassName,
  rows,
  ...props
}: TextAreaFieldProps) {
  const id = useId();
  const saved = useSavedTick(value, autosave);
  return (
    <Field aside={<SavedTick show={saved.shown} />} className={fieldClassName} hint={hint} htmlFor={id} label={label}>
      <FieldTextarea
        className={className}
        id={id}
        onBlur={saved.onBlur}
        onChange={(event) => onChange(event.target.value)}
        onFocus={saved.onFocus}
        rows={rows}
        value={value}
        {...props}
      />
    </Field>
  );
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  fieldClassName?: string;
}

/** A labelled native select with the field look and a chevron. iOS shows its own picker wheel. */
export function SelectField<T extends string>({ label, value, options, onChange, fieldClassName }: SelectFieldProps<T>) {
  const id = useId();
  return (
    <Field className={fieldClassName} htmlFor={id} label={label}>
      <div className="relative">
        <select
          className={cn(FIELD_CLASS, 'cursor-pointer appearance-none pr-8')}
          id={id}
          onChange={(event) => {
            const match = options.find((option) => option === event.target.value);
            if (match !== undefined) {
              onChange(match);
            }
          }}
          value={value}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-0 size-4 -translate-y-1/2 text-hub-label"
        />
      </div>
    </Field>
  );
}

interface CheckFieldProps {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Show a done item in the strong label colour. There is no line through the text. */
  strike?: boolean;
  className?: string;
}

/** A checkbox with its label. The full row is the touch target. */
export function CheckField({ label, checked, onChange, strike = false, className }: CheckFieldProps) {
  const id = useId();
  return (
    <label
      className={cn('flex min-h-12 min-w-0 cursor-pointer items-center gap-3 py-2', className)}
      htmlFor={id}
    >
      <Checkbox
        checked={checked}
        className={CHECKBOX_CLASS}
        id={id}
        onCheckedChange={(next) => onChange(next === true)}
      />
      <span
        className={cn(
          'type-body min-w-0 break-words transition-colors',
          strike && checked ? 'text-hub-label-strong' : 'text-hub-text',
        )}
      >
        {label}
      </span>
    </label>
  );
}
