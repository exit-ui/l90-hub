import { type ComponentProps, type ReactNode, useId } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

/** The size and shape of each text control: 44px high with a 12px radius. 16px text stops the zoom on iOS. */
export const CONTROL_CLASS = 'h-11 w-full rounded-control bg-hub-inset px-3 text-base md:text-base';
export const TEXTAREA_CLASS = 'min-h-24 w-full rounded-control bg-hub-inset px-3 py-3 text-base md:text-base';
export const CHECKBOX_CLASS =
  'size-6 rounded-full data-checked:border-hub-positive data-checked:bg-hub-positive data-checked:text-hub-ink dark:data-checked:bg-hub-positive';

interface FieldProps {
  label: string;
  htmlFor: string;
  /** A short line that helps the user. */
  hint?: string;
  /** What is wrong and how to correct it. */
  error?: string;
  children: ReactNode;
  className?: string;
}

/** A label above one control, with an optional hint and an optional error. */
export function Field({ label, htmlFor, hint, error, children, className }: FieldProps) {
  return (
    <div className={cn('grid min-w-0 gap-2', className)}>
      <Label className="type-label text-hub-label" htmlFor={htmlFor}>
        {label}
      </Label>
      {children}
      {hint ? <p className="type-label text-hub-label">{hint}</p> : null}
      {error ? (
        <p className="type-label font-medium text-hub-danger" role="alert">
          Error: {error}
        </p>
      ) : null}
    </div>
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
  fieldClassName?: string;
}

/** A labelled input. Use type="number" or type="date" for those values. */
export function TextField({
  label,
  value,
  onChange,
  hint,
  error,
  className,
  fieldClassName,
  ...props
}: TextFieldProps) {
  const id = useId();
  return (
    <Field className={fieldClassName} error={error} hint={hint} htmlFor={id} label={label}>
      <Input
        aria-invalid={error ? true : undefined}
        className={cn(CONTROL_CLASS, className)}
        id={id}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        value={value}
        {...props}
      />
    </Field>
  );
}

interface TextAreaFieldProps
  extends Omit<ComponentProps<'textarea'>, 'onChange' | 'value' | 'id'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  fieldClassName?: string;
}

export function TextAreaField({
  label,
  value,
  onChange,
  hint,
  className,
  fieldClassName,
  ...props
}: TextAreaFieldProps) {
  const id = useId();
  return (
    <Field className={fieldClassName} hint={hint} htmlFor={id} label={label}>
      <Textarea
        className={cn(TEXTAREA_CLASS, className)}
        id={id}
        onChange={(event) => onChange(event.target.value)}
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

/** A labelled select for a short list of text options. */
export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  fieldClassName,
}: SelectFieldProps<T>) {
  const id = useId();
  return (
    <Field className={fieldClassName} htmlFor={id} label={label}>
      <Select
        onValueChange={(next) => {
          const match = options.find((option) => option === next);
          if (match !== undefined) {
            onChange(match);
          }
        }}
        value={value}
      >
        <SelectTrigger
          className={cn(CONTROL_CLASS, 'data-[size=default]:h-11 cursor-pointer')}
          id={id}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-control">
          {options.map((option) => (
            <SelectItem className="min-h-11 type-body" key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
      className={cn('flex min-h-11 min-w-0 cursor-pointer items-center gap-3 py-2', className)}
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
          'min-w-0 type-body break-words transition-colors',
          strike && checked ? 'text-hub-label-strong' : 'text-hub-text',
        )}
      >
        {label}
      </span>
    </label>
  );
}
