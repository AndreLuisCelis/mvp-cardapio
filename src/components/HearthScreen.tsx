import { Clock, Flame, MapPin } from 'lucide-react';
import { ABOUT_SECTION, STORE_INFO } from '../config/store';
import { formatBRL } from '../utils/format';
import { ResilientImage } from './ResilientImage';

interface HearthScreenProps {
  onExploreMenu: () => void;
}

export function HearthScreen({ onExploreMenu }: HearthScreenProps) {
  return (
    <div className="space-y-8 pb-16">
      <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <p className="text-[13px] font-semibold text-brand">
              {STORE_INFO.name} · {STORE_INFO.neighborhood}
            </p>
            <h1 className="text-[28px] sm:text-[36px] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#1C1B1B] text-balance">
              {ABOUT_SECTION.headline}
            </h1>
            <p className="text-[15px] leading-[1.6] text-[#5A413A]">
              {ABOUT_SECTION.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onExploreMenu}
              className="min-h-[48px] px-6 py-3 rounded-lg bg-brand hover:bg-brand-hover text-white text-[15px] font-semibold cursor-pointer transition-colors"
            >
              Explorar o Cardápio
            </button>
          </div>
        </div>

        <div className="lg:col-span-6 bg-[#F6F3F2] min-h-[240px]">
          <ResilientImage
            src={STORE_INFO.bannerImg}
            alt={`Lanches e combos da ${STORE_INFO.name}`}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ABOUT_SECTION.pillars.map((pillar) => (
          <article
            key={pillar.number}
            className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-xl p-5 sm:p-6 space-y-2.5"
          >
            <p className="text-[13px] font-bold text-brand tabular-nums">
              {pillar.number}
            </p>
            <h2 className="text-[17px] font-bold text-[#1C1B1B]">
              {pillar.title}
            </h2>
            <p className="text-[14px] leading-[1.55] text-[#5A413A]">
              {pillar.body}
            </p>
          </article>
        ))}
      </section>

      <section className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-brand shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-[15px] font-bold text-[#1C1B1B]">Localização</h3>
            <p className="text-[14px] text-[#5A413A]">
              {STORE_INFO.neighborhood} · {STORE_INFO.city}
              <br />
              Retirada no balcão e delivery
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-brand shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-[15px] font-bold text-[#1C1B1B]">Tempo de Entrega</h3>
            <p className="text-[14px] text-[#5A413A] tabular-nums">
              Média de {STORE_INFO.deliveryTimeMin} minutos
              <br />
              Taxa fixa: {formatBRL(STORE_INFO.deliveryFee)}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Flame className="w-5 h-5 text-brand shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-[15px] font-bold text-[#1C1B1B]">Pedido Mínimo</h3>
            <p className="text-[14px] text-[#5A413A] tabular-nums">
              A partir de {formatBRL(STORE_INFO.minOrder)} para entrega.
              <br />
              {STORE_INFO.paymentMethodsLabel}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
