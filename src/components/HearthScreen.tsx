import { Clock, Flame, MapPin } from 'lucide-react';
import heroSmashImg from '../assets/images/hero_smash_burger_1794688358225.jpg';
import { ResilientImage } from './ResilientImage';

interface HearthScreenProps {
  onExploreMenu: () => void;
}

export function HearthScreen({ onExploreMenu }: HearthScreenProps) {
  const pillars = [
    {
      number: '01.',
      title: 'Acém e Peito Maturados por 45 Dias',
      body: 'Cortes selecionados de pasto moídos frescos todas as manhãs na proporção 80/20 para formar crosta caramelizada por fora e suculência por dentro.',
    },
    {
      number: '02.',
      title: 'Brioche de Gergelim Assado de Manhã',
      body: 'Fermentação lenta com manteiga de fazenda e tostado na chapa na hora do pedido para sustentar nossos molhos artesanais sem perder a maciez.',
    },
    {
      number: '03.',
      title: 'Chapa de Ferro e Brasa de Carvalho',
      body: 'Selagem em alta temperatura com leve defumação natural, acompanhada de picles artesanais, cítricos tostados e batatas Asterix cortadas à mão.',
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <p className="text-[13px] font-semibold text-[#D3451B]">
              Nossa Brasa e Origem dos Ingredientes
            </p>
            <h1 className="text-[28px] sm:text-[36px] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#1C1B1B] text-balance">
              Construído em torno da crosta perfeita, do pão fresco e do fogo real.
            </h1>
            <p className="text-[15px] leading-[1.6] text-[#5A413A]">
              A Artisanal Ember nasceu na Rua Oscar Freire, 142 com um cardápio enxuto e preciso: quatro hambúrgueres autorais, fritas rústicas duplamente fritas e sodas preparadas na casa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onExploreMenu}
              className="min-h-[48px] px-6 py-3 rounded-lg bg-[#D3451B] hover:bg-[#B02D00] text-white text-[15px] font-semibold cursor-pointer transition-colors"
            >
              Explorar o Cardápio
            </button>
          </div>
        </div>

        <div className="lg:col-span-6 bg-[#F6F3F2] min-h-[240px]">
          <ResilientImage
            src={heroSmashImg}
            alt="Cozinha e brasa da Artisanal Ember"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pillars.map((pillar) => (
          <article
            key={pillar.number}
            className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-xl p-5 sm:p-6 space-y-2.5"
          >
            <p className="text-[13px] font-bold text-[#D3451B] tabular-nums">
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
          <MapPin className="w-5 h-5 text-[#D3451B] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-[15px] font-bold text-[#1C1B1B]">Endereço</h3>
            <p className="text-[14px] text-[#5A413A]">
              Rua Oscar Freire, 142 · Jardins<br />Retirada no balcão e delivery local
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-[#D3451B] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-[15px] font-bold text-[#1C1B1B]">Horário da Cozinha</h3>
            <p className="text-[14px] text-[#5A413A] tabular-nums">
              Seg a Qui: 11h30 – 22h30<br />Sex a Dom: 11h30 – 23h30
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Flame className="w-5 h-5 text-[#D3451B] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-[15px] font-bold text-[#1C1B1B]">Alergênicos</h3>
            <p className="text-[14px] text-[#5A413A]">
              Opção de envolto em alface em todos os burgers. Cozinha livre de amendoim.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
