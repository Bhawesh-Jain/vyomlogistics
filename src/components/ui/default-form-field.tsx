import DatePicker from "../date-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "./form";
import { Input } from "./input";
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "./select";
import { Textarea } from "./textarea";

export interface SpinnerItem {
  label: string;
  value: string;
}

export function DefaultFormTextField({
  label,
  name,
  placeholder = '',
  step = '',
  uppercase = false,
  disabled = false,
  capitalize = true,
  form
}: {
  label: string,
  name: string,
  step?: string,
  placeholder?: string,
  uppercase?: boolean,
  disabled?: boolean,
  capitalize?: boolean,
  form: any
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              disabled={disabled}
              placeholder={placeholder}
              step={step}
              {...field}
              onFocus={(e) => {
                e.target.select();
              }}
              value={field.value || ''}
              onChange={(e) => {
                const value = uppercase
                  ? e.target.value.toUpperCase()
                  : e.target.value;
                field.onChange(value);
              }}
              autoCapitalize={capitalize ? "sentences" : "off"}
              onInput={uppercase ? (e) => {
                e.currentTarget.value = e.currentTarget.value.toUpperCase()
              } : undefined}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}


export function DefaultFormTimeField({
  label,
  name,
  placeholder,
  form
}: {
  label: string,
  name: string,
  placeholder: string,
  form: any
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type="time" placeholder={placeholder} {...field} autoCapitalize="characters" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
};

export function DefaultFormTextArea({
  label,
  name,
  placeholder,
  className = '',
  form,
  rows = 3
}: {
  label: string,
  name: string,
  placeholder: string,
  rows?: number,
  className?: string,
  form: any
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea placeholder={placeholder} {...field} rows={rows} className={className} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
};


export function DefaultFormSelect({
  label,
  name,
  placeholder = '',
  options,
  form,
}: {
  label: string,
  name: string,
  options: any[],
  placeholder?: string,
  form: any,
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Select
              onValueChange={field.onChange}
              value={String(field.value)}
              defaultValue={String(field.value)}
              form={form}
            >
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
};

export function DefaultFormDatePicker({
  label,
  name,
  form,
  subYear = 0,
  minToday = false,
  maxToday = false,
}: {
  label: string;
  name: string;
  form: any;
  subYear?: number;
  minToday?: boolean;
  maxToday?: boolean;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <DatePicker
              date={field.value || null}
              minToday={minToday}
              maxToday={maxToday}
              subYear={subYear}
              onChange={(date) => field.onChange(date)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}