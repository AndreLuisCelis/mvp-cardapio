import { useEffect, useMemo, useState } from 'react';
import { Check, Minus, Plus, Star, X } from 'lucide-react';
import { CartItem, MenuItem } from '../types';
import { formatBRL } from '../utils/format';
import { ResilientImage } from './ResilientImage';

interface CustomizerModalProps {
  item: MenuItem | null;
  editingCartItem?: CartItem | null;
  onClose: () => void;
  onSubmit: (payload: {
    menuItem: MenuItem;
    quantity: number;
    selectedSingle: Record<string, string>;
    selectedMulti: Record<string, string[]>;
    kitchenNote: string;
    unitPrice: number;
    editingCartItemId?: string;
  }) => void;
}

export function CustomizerModal({
  item,
  editingCartItem,
  onClose,
  onSubmit,
}: CustomizerModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSingle, setSelectedSingle] = useState<Record<string, string>>({});
  const [selectedMulti, setSelectedMulti] = useState<Record<string, string[]>>({});
  const [kitchenNote, setKitchenNote] = useState('');

  useEffect(() => {
    if (!item) return;
    if (editingCartItem && editingCartItem.menuItem.id === item.id) {
      setQuantity(editingCartItem.quantity);
      setSelectedSingle({ ...editingCartItem.selectedSingle });
      setSelectedMulti({ ...editingCartItem.selectedMulti });
      setKitchenNote(editingCartItem.kitchenNote);
    } else {
      const defaultsSingle: Record<string, string> = {};
      const defaultsMulti: Record<string, string[]> = {};
      item.customizationGroups.forEach((group) => {
        if (group.type === 'single' && group.choices.length > 0) {
          defaultsSingle[group.id] = group.choices[0].id;
        } else if (group.type === 'multi') {
          defaultsMulti[group.id] = [];
        }
      });
      setQuantity(1);
      setSelectedSingle(defaultsSingle);
      setSelectedMulti(defaultsMulti);
      setKitchenNote('');
    }
  }, [item, editingCartItem]);

  useEffect(() => {
    if (!item) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose]);

  const unitPrice = useMemo(() => {
    if (!item) return 0;
    let total = item.price;
    item.customizationGroups.forEach((group) => {
      if (group.type === 'single') {
        const chosenId = selectedSingle[group.id];
        const choice = group.choices.find((c) => c.id === chosenId);
        if (choice) total += choice.priceDelta;
      } else {
        const chosenIds = selectedMulti[group.id] || [];
        chosenIds.forEach((cid) => {
          const choice = group.choices.find((c) => c.id === cid);
          if (choice) total += choice.priceDelta;
        });
      }
    });
    return total;
  }, [item, selectedSingle, selectedMulti]);

  if (!item) return null;

  const toggleMultiChoice = (groupId: string, choiceId: string) => {
    setSelectedMulti((prev) => {
      const current = prev[groupId] || [];
      const exists = current.includes(choiceId);
      return {
        ...prev,
        [groupId]: exists
          ? current.filter((id) => id !== choiceId)
          : [...current, choiceId],
      };
    });
  };

  const handleConfirm = () => {
    onSubmit({
      menuItem: item,
      quantity,
      selectedSingle,
      selectedMulti,
      kitchenNote: kitchenNote.trim(),
      unitPrice,
      editingCartItemId: editingCartItem?.cartItemId,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customizer-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1A1A1A]/45 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-[560px] max-h-[92vh] bg-[#FFFFFF] rounded-t-2xl sm:rounded-xl border border-[#EAEAEA] flex flex-col overflow-hidden"
      >
        {/* Top Hero Photo & Close */}
        <div className="relative h-48 sm:h-56 bg-[#F6F3F2] shrink-0">
          <ResilientImage
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar personalização"
            className="absolute top-3 right-3 min-w-[44px] min-h-[44px] rounded-full bg-[#FFFFFF] border border-[#EAEAEA] text-[#1C1B1B] hover:bg-[#F5F5F5] flex items-center justify-center cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[#D3451B]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Customizer Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <h2
                id="customizer-title"
                className="text-[22px] font-bold tracking-[-0.02em] text-[#1C1B1B]"
              >
                {item.name}
              </h2>
              <div className="flex flex-col items-end shrink-0">
                {typeof item.originalPrice === 'number' &&
                  item.originalPrice > item.price && (
                    <span className="text-[13px] text-[#8E7069] line-through tabular-nums">
                      {formatBRL(item.originalPrice)}
                    </span>
                  )}
                <span className="text-[18px] font-bold text-[#1C1B1B] tabular-nums">
                  {formatBRL(item.price)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#5A413A] tabular-nums">
              <span className="inline-flex items-center gap-1 font-semibold text-[#1C1B1B]">
                <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                {item.rating.toFixed(1).replace('.', ',')} ({item.reviewCount})
              </span>
              {item.calories ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{item.calories} kcal</span>
                </>
              ) : null}
              <span aria-hidden="true">·</span>
              <span>{item.prepMinutes}</span>
            </div>

            <p className="text-[14px] leading-[1.55] text-[#5A413A]">
              {item.description}
            </p>
          </div>

          {/* Customization Groups */}
          {item.customizationGroups.map((group) => (
            <div
              key={group.id}
              className="pt-4 border-t border-[#EAEAEA] space-y-3"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-[15px] font-bold text-[#1C1B1B]">
                  {group.title}
                </h3>
                <span className="text-[12px] font-semibold text-[#5A413A]">
                  {group.type === 'single' ? 'Selecione 1' : 'Opcional · Escolha quantos quiser'}
                </span>
              </div>

              <div className="space-y-2">
                {group.choices.map((choice) => {
                  const isSelected =
                    group.type === 'single'
                      ? selectedSingle[group.id] === choice.id
                      : (selectedMulti[group.id] || []).includes(choice.id);

                  return (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => {
                        if (group.type === 'single') {
                          setSelectedSingle((prev) => ({
                            ...prev,
                            [group.id]: choice.id,
                          }));
                        } else {
                          toggleMultiChoice(group.id, choice.id);
                        }
                      }}
                      className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-lg border flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-[#D3451B] bg-[#FCF9F8]'
                          : 'border-[#EAEAEA] bg-[#FFFFFF] hover:border-[#D9D9D9]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {group.type === 'single' ? (
                          <span
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'border-[#D3451B] bg-[#D3451B]'
                                : 'border-[#8E7069] bg-[#FFFFFF]'
                            }`}
                          >
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-[#FFFFFF]" />
                            )}
                          </span>
                        ) : (
                          <span
                            className={`w-5 h-5 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'border-[#D3451B] bg-[#D3451B] text-[#FFFFFF]'
                                : 'border-[#8E7069] bg-[#FFFFFF]'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                          </span>
                        )}
                        <span className="text-[14px] font-medium text-[#1C1B1B]">
                          {choice.label}
                        </span>
                      </div>

                      {choice.priceDelta > 0 && (
                        <span className="text-[13px] font-semibold text-[#5A413A] tabular-nums shrink-0">
                          + {formatBRL(choice.priceDelta)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Kitchen Note */}
          <div className="pt-4 border-t border-[#EAEAEA] space-y-2">
            <label
              htmlFor="kitchen-note"
              className="block text-[14px] font-bold text-[#1C1B1B]"
            >
              Observações para a Cozinha (Opcional)
            </label>
            <input
              id="kitchen-note"
              type="text"
              value={kitchenNote}
              onChange={(e) => setKitchenNote(e.target.value)}
              placeholder="Ex: Sem picles, molho à parte, pão bem tostado"
              maxLength={120}
              className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#FFFFFF] border border-[#EAEAEA] focus:border-[#D3451B] focus:outline-none rounded-[10px] text-[14px] text-[#1C1B1B] placeholder:text-[#8E7069]"
            />
          </div>
        </div>

        {/* Sticky Modal Footer */}
        <div className="p-4 sm:px-6 bg-[#FFFFFF] border-t border-[#EAEAEA] flex items-center gap-3 shrink-0">
          <div className="inline-flex items-center bg-[#F5F5F5] border border-[#EAEAEA] rounded-full p-1 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Diminuir quantidade"
              disabled={quantity <= 1}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#1A1A1A] hover:bg-[#FFFFFF] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" strokeWidth={2.2} />
            </button>
            <span className="px-3 text-[15px] font-bold text-[#1C1B1B] tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              aria-label="Aumentar quantidade"
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#1A1A1A] hover:bg-[#FFFFFF] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" strokeWidth={2.2} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 min-h-[48px] px-5 py-3 rounded-lg bg-[#D3451B] hover:bg-[#B02D00] active:scale-[0.98] text-[#FFFFFF] text-[15px] font-semibold transition-all cursor-pointer tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D3451B]"
          >
            {editingCartItem ? 'Atualizar Item' : 'Adicionar ao Pedido'} ·{' '}
            {formatBRL(unitPrice * quantity)}
          </button>
        </div>
      </div>
    </div>
  );
}
