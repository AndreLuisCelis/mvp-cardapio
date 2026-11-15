import { useMemo, useState } from 'react';
import { Minus, Plus, Search, Star, X } from 'lucide-react';
import { MENU_CATEGORIES, STORE_INFO } from '../data/menu';
import { CartItem, MenuCategory, MenuItem } from '../types';
import { formatBRL } from '../utils/format';
import { ResilientImage } from './ResilientImage';

interface MenuScreenProps {
  items: MenuItem[];
  initialCategory?: MenuCategory;
  cartItems: CartItem[];
  onOpenCustomizer: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
  onAdjustItemQuantity: (menuItemId: string, delta: number) => void;
}

const COMBO_CATEGORY_KEYS: Exclude<MenuCategory, 'all' | 'combos'>[] = [
  'combos-casal',
  'combos-grande-fome',
  'combos-individuais',
];

export function MenuScreen({
  items,
  initialCategory = 'all',
  cartItems,
  onOpenCustomizer,
  onQuickAdd,
  onAdjustItemQuantity,
}: MenuScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');

  const isCombosView = initialCategory === 'combos';

  const categoryTabs = useMemo<{ id: MenuCategory; label: string }[]>(() => {
    if (isCombosView) {
      return [
        { id: 'combos', label: 'Todos os Combos' },
        ...MENU_CATEGORIES.filter((c) => c.isCombo).map((c) => ({
          id: c.key,
          label: c.title,
        })),
      ];
    }
    return [
      { id: 'all', label: 'Todo o Cardápio' },
      ...MENU_CATEGORIES.map((c) => ({
        id: c.key,
        label: c.title,
      })),
    ];
  }, [isCombosView]);

  const effectiveCategory = selectedCategory;

  const heroItem = useMemo(() => items.find((item) => item.isHero) ?? items[0], [items]);

  const featuredItems = useMemo(
    () => items.filter((item) => item.featured),
    [items]
  );

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory =
        effectiveCategory === 'all'
          ? true
          : effectiveCategory === 'combos'
          ? COMBO_CATEGORY_KEYS.includes(item.category)
          : item.category === effectiveCategory;
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.categoryLabel.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [items, effectiveCategory, searchQuery]);

  const getItemCountInBag = (menuItemId: string) =>
    cartItems
      .filter((ci) => ci.menuItem.id === menuItemId)
      .reduce((sum, ci) => sum + ci.quantity, 0);

  const groupedSections = useMemo(() => {
    return MENU_CATEGORIES.map((section) => ({
      ...section,
      items: filteredItems.filter((item) => item.category === section.key),
    })).filter((section) => section.items.length > 0);
  }, [filteredItems]);

  const showSpotlightAndFeatured =
    !searchQuery.trim() && effectiveCategory === 'all';

  return (
    <div className="space-y-8 pb-28 sm:pb-16">
      {/* Storefront Hero Spotlight */}
      {!isCombosView && !searchQuery.trim() && heroItem && (
        <section aria-label="Destaque da casa">
          <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 lg:items-stretch">
            <div className="lg:col-span-6 p-5 sm:p-8 flex flex-col justify-between gap-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#5A413A]">
                  <span className="font-semibold text-[#16A34A]">Aberto agora</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {STORE_INFO.neighborhood}, {STORE_INFO.city}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Entrega em {STORE_INFO.deliveryTimeMin} min</span>
                </div>

                <h1 className="text-[30px] sm:text-[38px] font-extrabold leading-[1.14] tracking-[-0.03em] text-[#1C1B1B] text-balance">
                  {STORE_INFO.heroHeadline}
                </h1>

                <p className="text-[15px] leading-[1.55] text-[#5A413A] max-w-[46ch]">
                  Destaque do dia: <strong>{heroItem.name}</strong> ({heroItem.description}). Pedido mínimo de{' '}
                  {formatBRL(STORE_INFO.minOrder)} e entrega fixa de {formatBRL(STORE_INFO.deliveryFee)}.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => onOpenCustomizer(heroItem)}
                  className="min-h-[48px] px-6 py-3 rounded-lg bg-brand hover:bg-brand-hover active:scale-[0.98] text-white text-[15px] font-semibold transition-all cursor-pointer tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  Pedir {heroItem.name} · {formatBRL(heroItem.price)}
                </button>
                <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1C1B1B] tabular-nums">
                  <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                  <span>{heroItem.rating.toFixed(1).replace('.', ',')}</span>
                  <span className="font-normal text-[#5A413A]">
                    ({heroItem.reviewCount} avaliações)
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 relative bg-[#F6F3F2] min-h-[220px] sm:min-h-[280px] lg:min-h-0">
              <ResilientImage
                src={heroItem.imageUrl}
                alt={heroItem.name}
                className="w-full h-full aspect-[16/9] lg:aspect-auto object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* Search & Category Filter Bar */}
      <section aria-label="Filtros do cardápio" className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="relative max-w-md">
            <Search
              className="w-4 h-4 text-[#8E7069] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              strokeWidth={2}
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={STORE_INFO.searchPlaceholder}
              aria-label="Buscar itens do cardápio"
              className="w-full min-h-[44px] pl-10 pr-10 py-2.5 bg-[#FFFFFF] border border-[#EAEAEA] focus:border-brand focus:outline-none rounded-[10px] text-[14px] text-[#1C1B1B] placeholder:text-[#8E7069] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Limpar busca"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md text-[#5A413A] hover:text-[#1C1B1B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div
            role="tablist"
            aria-label="Categorias do cardápio"
            className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5"
          >
            {categoryTabs.map((tab) => {
              const isActive = effectiveCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`min-h-[44px] px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                    isActive
                      ? 'bg-[#1A1A1A] text-[#FFFFFF] border border-[#1A1A1A]'
                      : 'bg-[#FFFFFF] text-[#1A1A1A] border border-[#EAEAEA] hover:border-[#D9D9D9]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Launches / Offers */}
      {showSpotlightAndFeatured && featuredItems.length > 0 && (
        <section aria-labelledby="featured-heading" className="space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2
              id="featured-heading"
              className="text-[20px] sm:text-[22px] font-bold tracking-[-0.02em] text-[#1C1B1B]"
            >
              Ofertas em Destaque
            </h2>
            <span className="text-[13px] text-[#5A413A]">
              Preços promocionais por tempo limitado
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredItems.map((item) => {
              const qtyInBag = getItemCountInBag(item.id);
              const hasPromo =
                typeof item.originalPrice === 'number' &&
                item.originalPrice > item.price;
              return (
                <article
                  key={item.id}
                  className="bg-[#FFFFFF] border border-[#EAEAEA] hover:border-[#D9D9D9] rounded-xl overflow-hidden flex flex-col justify-between transition-colors"
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => onOpenCustomizer(item)}
                      className="w-full block text-left cursor-pointer group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      <div className="aspect-[4/3] w-full bg-[#F6F3F2] overflow-hidden">
                        <ResilientImage
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                        />
                      </div>
                      <div className="p-4 space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-[12px] text-[#5A413A]">
                          <span className="font-semibold text-brand">
                            {item.dietaryNote || item.categoryLabel}
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-[#1C1B1B] tabular-nums">
                            <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                            {item.rating.toFixed(1).replace('.', ',')}
                          </span>
                        </div>
                        <h3 className="text-[17px] font-bold leading-[1.3] text-[#1C1B1B]">
                          {item.name}
                        </h3>
                        <p className="text-[13px] leading-[1.45] text-[#5A413A] line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  </div>

                  <div className="px-4 pb-4 pt-2 flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      {hasPromo && item.originalPrice != null && (
                        <span className="text-[12px] text-[#8E7069] line-through tabular-nums">
                          {formatBRL(item.originalPrice)}
                        </span>
                      )}
                      <span className="text-[16px] font-bold text-[#1C1B1B] tabular-nums">
                        {formatBRL(item.price)}
                      </span>
                    </div>

                    {qtyInBag === 0 ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenCustomizer(item)}
                          className="min-h-[38px] px-3 py-1.5 rounded-full bg-[#F5F5F5] hover:bg-[#EAE7E7] border border-[#EAEAEA] text-[12px] font-semibold text-[#1A1A1A] whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                        >
                          Personalizar
                        </button>
                        <button
                          type="button"
                          onClick={() => onQuickAdd(item)}
                          aria-label={`Adicionar ${item.name}`}
                          className="min-h-[38px] min-w-[38px] px-3 py-1.5 rounded-full bg-brand hover:bg-brand-hover text-white text-[12px] font-semibold inline-flex items-center justify-center gap-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                          <span>Adicionar</span>
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center bg-[#F5F5F5] border border-[#EAEAEA] rounded-full p-0.5">
                        <button
                          type="button"
                          onClick={() => onAdjustItemQuantity(item.id, -1)}
                          aria-label={`Remover uma unidade de ${item.name}`}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[#1A1A1A] hover:bg-[#FFFFFF] transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" strokeWidth={2.2} />
                        </button>
                        <span className="px-2.5 text-[13px] font-bold text-[#1C1B1B] tabular-nums">
                          {qtyInBag}
                        </span>
                        <button
                          type="button"
                          onClick={() => onAdjustItemQuantity(item.id, 1)}
                          aria-label={`Adicionar mais uma unidade de ${item.name}`}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-brand hover:bg-[#FFFFFF] transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Menu Category Sections (Horizontal Compact Cards) */}
      {groupedSections.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-xl p-10 text-center space-y-3">
          <p className="text-[17px] font-semibold text-[#1C1B1B]">
            Nenhum item encontrado para &ldquo;{searchQuery}&rdquo;
          </p>
          <p className="text-[14px] text-[#5A413A]">
            Tente limpar a busca ou selecionar Todo o Cardápio.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory(isCombosView ? 'combos' : 'all');
            }}
            className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#1A1A1A] text-white text-[14px] font-semibold cursor-pointer"
          >
            Limpar Filtros
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedSections.map((section) => (
            <section
              key={section.key}
              aria-labelledby={`section-${section.key}`}
              className="space-y-3.5"
            >
              <div className="flex items-baseline justify-between border-b border-[#EAEAEA] pb-2">
                <h2
                  id={`section-${section.key}`}
                  className="text-[20px] font-bold tracking-[-0.02em] text-[#1C1B1B]"
                >
                  {section.title}
                </h2>
                <span className="text-[13px] text-[#5A413A] tabular-nums">
                  {section.items.length} {section.items.length === 1 ? 'opção' : 'opções'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {section.items.map((item) => {
                  const qtyInBag = getItemCountInBag(item.id);
                  const hasPromo =
                    typeof item.originalPrice === 'number' &&
                    item.originalPrice > item.price;

                  return (
                    <article
                      key={item.id}
                      className="bg-[#FFFFFF] border border-[#EAEAEA] hover:border-[#D9D9D9] rounded-xl p-3.5 flex flex-col justify-between gap-3 transition-colors"
                    >
                      {/* Top Row: Info + Thumbnail */}
                      <div className="flex items-start justify-between gap-3.5">
                        <button
                          type="button"
                          onClick={() => onOpenCustomizer(item)}
                          className="flex-1 min-w-0 text-left space-y-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand rounded"
                        >
                          <h3 className="text-[16px] font-semibold leading-[1.3] text-[#1C1B1B] line-clamp-2">
                            {item.name}
                          </h3>
                          <p className="text-[13px] leading-[1.45] text-[#5A413A] line-clamp-2">
                            {item.description}
                          </p>
                          <p className="text-[12px] text-[#8E7069] tabular-nums pt-0.5">
                            {item.calories ? `${item.calories} kcal · ` : ''}
                            {item.prepMinutes}
                            {item.dietaryNote ? ` · ${item.dietaryNote}` : ''}
                          </p>
                        </button>

                        {/* Right Thumbnail */}
                        <button
                          type="button"
                          onClick={() => onOpenCustomizer(item)}
                          aria-label={`Personalizar ${item.name}`}
                          className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-lg overflow-hidden bg-[#F6F3F2] border border-[#EAEAEA] cursor-pointer"
                        >
                          <ResilientImage
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-200"
                          />
                        </button>
                      </div>

                      {/* Bottom Row: Full-width Price & Action Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F6F3F2]">
                        <div className="flex items-baseline gap-1.5 flex-wrap whitespace-nowrap">
                          <span className="text-[15px] font-bold text-[#1C1B1B] tabular-nums">
                            {formatBRL(item.price)}
                          </span>
                          {hasPromo && item.originalPrice != null && (
                            <span className="text-[12px] text-[#8E7069] line-through tabular-nums">
                              {formatBRL(item.originalPrice)}
                            </span>
                          )}
                        </div>

                        {qtyInBag === 0 ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => onOpenCustomizer(item)}
                              className="min-h-[36px] px-3 py-1.5 rounded-full bg-[#F5F5F5] hover:bg-[#EAE7E7] border border-[#EAEAEA] text-[12px] font-semibold text-[#1A1A1A] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                            >
                              Personalizar
                            </button>
                            <button
                              type="button"
                              onClick={() => onQuickAdd(item)}
                              aria-label={`Adicionar ${item.name}`}
                              className="min-h-[36px] min-w-[36px] px-3 py-1.5 rounded-full bg-brand hover:bg-brand-hover text-white text-[12px] font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                              <span>Adicionar</span>
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center bg-[#F5F5F5] border border-[#EAEAEA] rounded-full p-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => onAdjustItemQuantity(item.id, -1)}
                              aria-label={`Remover uma unidade de ${item.name}`}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-[#1A1A1A] hover:bg-[#FFFFFF] transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" strokeWidth={2.2} />
                            </button>
                            <span className="px-2.5 text-[13px] font-bold text-[#1C1B1B] tabular-nums">
                              {qtyInBag}
                            </span>
                            <button
                              type="button"
                              onClick={() => onAdjustItemQuantity(item.id, 1)}
                              aria-label={`Adicionar mais uma unidade de ${item.name}`}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-brand hover:bg-[#FFFFFF] transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
