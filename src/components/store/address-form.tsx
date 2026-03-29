'use client';

type AddressValue = {
  name: string;
  phone: string;
  city: string;
  area: string;
  street: string;
};

type AddressFormProps = {
  value: AddressValue;
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
};

const fields: Array<{
  key: keyof AddressValue;
  label: string;
  type?: string;
  placeholder?: string;
}> = [
  { key: 'name', label: 'Full name', type: 'text' },
  { key: 'phone', label: 'Phone', type: 'tel', placeholder: '01xxxxxxxxx' },
  { key: 'city', label: 'City', type: 'text' },
  { key: 'area', label: 'Area', type: 'text' },
  { key: 'street', label: 'Street address', type: 'text' },
];

export function AddressForm({ value, onChange, errors }: AddressFormProps) {
  return (
    <div className="grid grid-cols-2 gap-[10px] max-[400px]:grid-cols-1">
      {fields.map((field) => (
        <div
          key={field.key}
          className={field.key === 'street' ? 'col-span-2 space-y-1 max-[400px]:col-span-1' : 'space-y-1'}
        >
          <label htmlFor={`address-${field.key}`} className="mb-1 block text-xs text-[var(--text-secondary)]">
            {field.label} <span className="text-[var(--accent-coral)]">*</span>
          </label>

          <input
            id={`address-${field.key}`}
            type={field.type ?? 'text'}
            value={value[field.key]}
            placeholder={field.placeholder}
            onChange={(event) => onChange(field.key, event.target.value)}
            className="min-h-[44px] w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-navy)] focus:outline-none"
          />

          {errors[field.key] ? (
            <p className="text-xs text-[var(--danger-text)]">{errors[field.key]}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export type { AddressValue };
