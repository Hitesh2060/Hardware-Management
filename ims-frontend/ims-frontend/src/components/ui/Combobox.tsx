import { useState, useEffect, useRef } from 'react';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from 'cmdk';
import { ChevronDown, Check, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = 'Search...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found',
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedValue, setSelectedValue] = useState<string | undefined>(value);

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  const handleSelect = (currentValue: string) => {
    setSelectedValue(currentValue);
    setOpen(false);
    onValueChange(currentValue);
    setSearch('');
  };

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal h-10 px-3 py-2',
            !selectedValue && 'text-[var(--color-ink-muted)]',
            className
          )}
        >
          <span className="truncate">
            {selectedValue ? selectedOption?.label : placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0 z-50 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md shadow-lg"
        align="start"
        sideOffset={4}
      >
        <Command
          value={search}
          onValueChange={setSearch}
          className="rounded-md overflow-hidden"
        >
          <div className="flex items-center border-b border-[var(--color-border)] px-3">
            <CommandInput
              placeholder={searchPlaceholder}
              className="flex-1 h-10 outline-none bg-transparent text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <CommandList className="max-h-60 overflow-y-auto">
            <CommandEmpty className="py-4 text-center text-sm text-[var(--color-ink-muted)]">
              {emptyMessage}
            </CommandEmpty>
            <CommandGroup>
              {options
                .filter((opt) => 
                  !opt.disabled && 
                  (opt.label.toLowerCase().includes(search.toLowerCase()) ||
                   opt.value.toLowerCase().includes(search.toLowerCase()))
                )
                .map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={() => handleSelect(opt.value)}
                    className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-[var(--color-muted)] data-[selected=true]:bg-[var(--color-muted)]"
                  >
                    <span>{opt.label}</span>
                    {selectedValue === opt.value && (
                      <Check className="h-4 w-4 text-[var(--color-primary)]" />
                    )}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}