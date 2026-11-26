import { ShoppingBag } from 'lucide-react';
import { AppScreen, StoreSettingsRecord } from '../types';
import { formatBRL } from '../utils/format';

interface TopNavProps {
  activeScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  bagCount: number;
  bagTotal: number;
  activeOrdersCount: number;
  storeSettings: StoreSettingsRecord;
}

export function TopNav({
  activeScreen,
  onNavigate,
  bagCount,
  bagTotal,
  activeOrdersCount,
  storeSettings,
}: TopNavProps) {
  const navItems: { id: AppScreen; label: string }[] = [
    { id: 'menu', label: 'Cardápio' },
    { id: 'combos', label: 'Combos' },
    { id: 'hearth', label: storeSettings.aboutNavLabel },
    {
      id: 'orders',
      label: activeOrdersCount > 0 ? `Pedidos (${activeOrdersCount})` : 'Pedidos',
    },
  ];

  return (
    <header className="w-full bg-[#FFFFFF] border-b border-[#EAEAEA] md:sticky md:top-0 md:z-30">
      <div className="max-w-[980px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand logo (optional) + wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('menu')}
          className="inline-flex items-center gap-2.5 text-lg sm:text-xl font-extrabold tracking-[-0.03em] text-[#1C1B1B] whitespace-nowrap shrink-0 cursor-pointer hover:text-brand transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand rounded"
        >
          {storeSettings.logoUrl && (
            <img
              src={storeSettings.logoUrl}
              alt={`Logo ${storeSettings.name}`}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover border border-[#EAEAEA] bg-[#F6F3F2]"
            />
          )}
          <span>{storeSettings.name}</span>
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Navegação principal"
          className="hidden md:flex items-center gap-7"
        >
          {navItems.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative py-2 text-[14px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                  isActive
                    ? 'text-[#1C1B1B]'
                    : 'text-[#5A413A] hover:text-[#1C1B1B]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-brand"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('checkout')}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-full bg-brand hover:bg-brand-hover active:scale-[0.98] text-white text-[13px] sm:text-[14px] font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <ShoppingBag className="w-4 h-4" strokeWidth={2.2} />
            <span className="tabular-nums">
              {bagCount > 0 ? `Sacola (${bagCount}) · ${formatBRL(bagTotal)}` : 'Sacola (0)'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile clean single-line sub-navigation bar */}
      <nav
        aria-label="Navegação móvel"
        className="md:hidden border-t border-[#EAEAEA] bg-[#FFFFFF] px-4 flex items-center gap-5 overflow-x-auto no-scrollbar"
      >
        {navItems.map((item) => {
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`relative min-h-[44px] py-2.5 text-[13px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                isActive ? 'text-brand' : 'text-[#5A413A]'
              }`}
            >
              {item.label}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 right-0 bottom-0 h-[2px] bg-brand"
                />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
