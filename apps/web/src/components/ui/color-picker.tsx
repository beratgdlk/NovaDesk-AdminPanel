import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '#/components/ui/popover';
import { cn } from '#/lib/utils';
import * as React from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

const predefinedColors = [
  '#FF0000', '#FF4500', '#FF8C00', '#FFD700', '#FFFF00', '#ADFF2F',
  '#00FF00', '#00FF7F', '#00FFFF', '#0080FF', '#0000FF', '#4000FF',
  '#8000FF', '#FF00FF', '#FF0080', '#FF4080', '#808080', '#000000',
  '#FFFFFF', '#F0F0F0', '#D3D3D3', '#A9A9A9', '#696969', '#2F4F4F',
];

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleColorSelect = (color: string) => {
    onChange(color);
    setInputValue(color);
    setIsOpen(false);
  };

  const handlePaletteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    onChange(newColor);
    setInputValue(newColor);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (newValue.match(/^#[0-9A-F]{6}$/i)) {
      onChange(newValue);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-20 h-10 p-0 border-2 border-input hover:border-ring',
            className
          )}
          style={{ backgroundColor: value }}
        >
          <div className="w-full h-full rounded-md" style={{ backgroundColor: value }} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Renk Paleti</Label>
            <div className="mt-2 flex justify-center">
              <input
                type="color"
                value={value}
                onChange={handlePaletteChange}
                className="w-full h-32 rounded-md border-2 border-input cursor-pointer"
                style={{ backgroundColor: 'transparent' }}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="color-input" className="text-sm font-medium">
              Hex Kodu
            </Label>
            <Input
              id="color-input"
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="#000000"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium">Hazır Renkler</Label>
            <div className="grid grid-cols-6 gap-2 mt-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    'w-8 h-8 rounded-md border-2 border-input hover:border-ring transition-colors',
                    value === color && 'ring-2 ring-ring ring-offset-2'
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 