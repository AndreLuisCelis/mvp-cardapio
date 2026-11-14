import { ShoppingBag } from 'lucide-react';
import { AppScreen } from '../types';
import { formatBRL } from '../utils/format';

interface TopNavProps {
  activeScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  bagCount: number;
  bagTotal: number;
  activeOrdersCount: number;
}

export function TopNav({
  activeScreen,
  onNavigate,
  bagCount,
  bagTotal,
  activeOrdersCount,
}: TopNavProps) {
  const navItems: { id: AppScreen; label: string }[] = [
    { id: 'menu', label: 'Cardápio' },
    { id: 'combos', label: 'Combos' },
    { id: 'hearth', label: 'Nossa Brasa' },
    {
      id: 'orders',
      label: activeOrdersCount > 0 ? `Pedidos (${activeOrdersCount})` : 'Pedidos',
    },
  ];

  return (
    <header className="w-full bg-[#FFFFFF] border-b border-[#EAEAEA] md:sticky md:top-0 md:z-30">
      <div className="max-w-[980px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('menu')}
          className="text-lg sm:text-xl font-extrabold tracking-[-0.03em] text-[#1C1B1B] whitespace-nowrap shrink-0 cursor-pointer hover:text-[#D3451B] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D3451B] rounded"
        >
          Artisanal Ember
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
                className={`relative py-2 text-[14px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D3451B] ${
                  isActive
                    ? 'text-[#1C1B1B]'
                    : 'text-[#5A413A] hover:text-[#1C1B1B]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[#D3451B]"
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
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-full bg-[#D3451B] hover:bg-[#B02D00] active:scale-[0.98] text-white text-[13px] sm:text-[14px] font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D3451B]"
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
                isActive ? 'text-[#D3451B]' : 'text-[#5A413A]'
              }`}
            >
              {item.label}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 right-0 bottom-0 h-[2px] bg-[#D3451B]"
                />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
