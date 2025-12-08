/**
 * ProductAutocomplete - Autocomplete/combobox for product selection
 *
 * Features:
 * - Search products with debouncing
 * - Display global and private products
 * - Option to create new product inline
 * - Loading states
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useProductAutocomplete } from "./hooks/useProductAutocomplete";
import { validateProductName } from "@/lib/utils/form-validation";
import type { ProductDTO } from "@/types";

interface ProductAutocompleteProps {
  value: ProductDTO | null;
  onChange: (product: ProductDTO | null) => void;
  error?: string;
  testId?: string;
}

export default function ProductAutocomplete({
  value,
  onChange,
  error,
  testId = "product-autocomplete",
}: ProductAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { query, setQuery, results, isLoading } = useProductAutocomplete();

  const handleSelect = (product: ProductDTO) => {
    onChange(product);
    setOpen(false);
    setQuery("");
    setShowCreateForm(false);
  };

  const handleCreateNew = async () => {
    setCreateError(null);

    // Validate name
    const validation = validateProductName(newProductName);
    if (!validation.isValid) {
      setCreateError(validation.error || "Nieprawidłowa nazwa");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newProductName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to create product");
      }

      const newProduct: ProductDTO = await response.json();

      // Select newly created product
      onChange(newProduct);
      setOpen(false);
      setQuery("");
      setShowCreateForm(false);
      setNewProductName("");
    } catch (err) {
      console.error("Failed to create product:", err);
      setCreateError("Nie udało się utworzyć produktu");
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenCreateForm = () => {
    setShowCreateForm(true);
    setNewProductName(query);
    setCreateError(null);
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
    setNewProductName("");
    setCreateError(null);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Wybierz produkt"
            className={`w-full justify-between ${error ? "border-red-500" : ""}`}
            data-testid={`${testId}-trigger`}
          >
            {value ? (
              <span className="truncate">
                {value.name}
                {value.is_global && <span className="ml-2 text-xs text-gray-500">(globalny)</span>}
              </span>
            ) : (
              <span className="text-gray-500">Wybierz produkt...</span>
            )}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="ml-2 h-4 w-4 shrink-0 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Szukaj produktu..."
              value={query}
              onValueChange={setQuery}
              data-testid={`${testId}-search-input`}
            />
            <CommandList>
              {isLoading && <div className="py-6 text-center text-sm text-gray-500">Wyszukiwanie...</div>}

              {!isLoading && !showCreateForm && query && results.length === 0 && (
                <CommandEmpty>
                  <div className="py-2">
                    <p className="text-sm text-gray-600 mb-3">Nie znaleziono produktu</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenCreateForm}
                      className="w-full"
                      data-testid={`${testId}-create-new-button`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Dodaj nowy produkt &quot;{query}&quot;
                    </Button>
                  </div>
                </CommandEmpty>
              )}

              {!showCreateForm && results.length > 0 && (
                <CommandGroup heading="Produkty">
                  {results.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={`${product.id}`}
                      onSelect={() => handleSelect(product)}
                      className="cursor-pointer"
                      data-testid={`${testId}-option-${product.id}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{product.name}</span>
                        {product.is_global && (
                          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                            globalny
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}

                  {/* Option to create new if results exist but user wants new */}
                  {query && (
                    <CommandItem
                      value="__create_new__"
                      onSelect={handleOpenCreateForm}
                      className="cursor-pointer border-t"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Dodaj nowy produkt &quot;{query}&quot;
                    </CommandItem>
                  )}
                </CommandGroup>
              )}

              {/* Inline Create Form */}
              {showCreateForm && (
                <div className="p-4 border-t">
                  <h4 className="text-sm font-semibold mb-3">Dodaj nowy produkt</h4>
                  <div className="space-y-3">
                    <div>
                      <Input
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        placeholder="Nazwa produktu"
                        className={createError ? "border-red-500" : ""}
                        disabled={isCreating}
                        data-testid={`${testId}-new-product-name-input`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreateNew();
                          }
                        }}
                      />
                      {createError && <p className="mt-1 text-xs text-red-600">{createError}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCreateNew}
                        disabled={isCreating || !newProductName.trim()}
                        size="sm"
                        className="flex-1"
                        data-testid={`${testId}-create-submit-button`}
                      >
                        {isCreating ? "Tworzenie..." : "Utwórz"}
                      </Button>
                      <Button
                        onClick={handleCancelCreate}
                        disabled={isCreating}
                        variant="outline"
                        size="sm"
                        data-testid={`${testId}-create-cancel-button`}
                      >
                        Anuluj
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
