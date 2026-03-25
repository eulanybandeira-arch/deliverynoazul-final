import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { InventoryItem } from "@/types/inventory";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface InventoryItemSelectorProps {
  items: InventoryItem[];
  selectedItemId?: string;
  onSelect: (item: InventoryItem) => void;
  placeholder?: string;
}

export function InventoryItemSelector({
  items,
  selectedItemId,
  onSelect,
  placeholder = "Selecione um insumo",
}: InventoryItemSelectorProps) {
  const [open, setOpen] = useState(false);
  const selectedItem = items.find(item => item.id === selectedItemId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <span className="truncate">
            {selectedItem ? selectedItem.name : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0">
        <Command>
          <CommandInput placeholder="Buscar insumo..." />
          <CommandList>
            <CommandEmpty>Nenhum insumo encontrado.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedItemId === item.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}