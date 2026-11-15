import { Check, ChefHat, Clock, Flame, PackageCheck, RotateCcw } from 'lucide-react';
import { KITCHEN_STAGES, STORE_INFO } from '../config/store';
import { OrderStage, PlacedOrder } from '../types';
import { formatBRL } from '../utils/format';

interface OrdersScreenProps {
  orders: PlacedOrder[];
  onAdvanceStage: (orderId: string) => void;
  onBackToMenu: () => void;
}

const STAGE_ICONS: Record<OrderStage, typeof Check> = {
  0: Check,
  1: Flame,
  2: ChefHat,
  3: PackageCheck,
};

export function OrdersScreen({
  orders,
  onAdvanceStage,
  onBackToMenu,
}: OrdersScreenProps) {
  const activeOrder = orders[0];
  const pastOrders = orders.slice(1);

  if (!activeOrder) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-xl p-8 space-y-4">
          <h1 className="text-[22px] font-bold text-[#1C1B1B]">
            Nenhum pedido realizado ainda
          </h1>
          <p className="text-[14px] text-[#5A413A]">
            Assim que você finalizar um pedido, poderá acompanhar cada etapa da cozinha por aqui.
          </p>
          <button
            type="button"
            onClick={onBackToMenu}
            className="min-h-[44px] px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-[14px] font-semibold cursor-pointer"
          >
            Fazer Pedido Agora
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = activeOrder.stage >= 3;
  const buyerAddress =
    activeOrder.fulfillment === 'delivery' && activeOrder.buyer.endereco
      ? `${activeOrder.buyer.endereco} · ${activeOrder.neighborhoodLabel}`
      : `${STORE_INFO.name} · ${STORE_INFO.neighborhood} · ${STORE_INFO.city} · ${activeOrder.neighborhoodLabel}`;

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold text-[#16A34A]">
            {isCompleted ? 'Pronto para retirada' : 'Pedido em preparo na cozinha'} ·{' '}
            <span className="text-[#5A413A] font-normal">{activeOrder.placedAt}</span>
          </p>
          <h1 className="text-[26px] sm:text-[30px] font-extrabold tracking-[-0.02em] text-[#1C1B1B] tabular-nums">
            Pedido #{activeOrder.orderCode}
          </h1>
        </div>

        <button
          type="button"
          onClick={onBackToMenu}
          className="min-h-[44px] px-4 py-2 rounded-lg bg-[#FFFFFF] border border-[#EAEAEA] hover:border-[#D9D9D9] text-[14px] font-semibold text-[#1C1B1B] cursor-pointer transition-colors"
        >
          Voltar ao Cardápio
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Live Kitchen Tracker */}
        <section className="lg:col-span-7 bg-[#FFFFFF] border border-[#EAEAEA] rounded-xl p-5 sm:p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EAEAEA]">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-brand" />
              <div>
                <p className="text-[12px] text-[#5A413A]">
                  {activeOrder.fulfillment === 'pickup'
                    ? 'Previsão de Retirada no Balcão'
                    : 'Previsão de Chegada da Entrega'}
                </p>
                <p className="text-[17px] font-bold text-[#1C1B1B] tabular-nums">
                  {activeOrder.estimatedReady}
                </p>
              </div>
            </div>

            {!isCompleted && (
              <button
                type="button"
                onClick={() => onAdvanceStage(activeOrder.id)}
                className="min-h-[40px] px-3.5 py-2 rounded-full bg-[#F5F5F5] hover:bg-[#EAE7E7] border border-[#EAEAEA] text-[12px] font-semibold text-[#1C1B1B] cursor-pointer transition-colors"
              >
                Avançar Etapa da Cozinha
              </button>
            )}
          </div>

          <ol className="space-y-4">
            {KITCHEN_STAGES.map((step) => {
              const Icon = STAGE_ICONS[step.stage];
              const isDone = activeOrder.stage > step.stage;
              const isCurrent = activeOrder.stage === step.stage;

              return (
                <li
                  key={step.stage}
                  className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-colors ${
                    isCurrent
                      ? 'border-brand bg-surface'
                      : isDone
                      ? 'border-[#EAEAEA] bg-[#FFFFFF]'
                      : 'border-[#EAEAEA] bg-[#FFFFFF] opacity-55'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? 'bg-brand text-[#FFFFFF]'
                        : isDone
                        ? 'bg-[#16A34A] text-[#FFFFFF]'
                        : 'bg-[#F0EDED] text-[#8E7069]'
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2.2} />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-bold text-[#1C1B1B]">
                        {step.title}
                      </p>
                      {isCurrent && (
                        <span className="text-[12px] font-semibold text-brand">
                          Em andamento
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-[#5A413A]">{step.subtitle}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="pt-2 border-t border-[#EAEAEA] text-[13px] text-[#5A413A] space-y-1">
            {(activeOrder.buyer.nome || activeOrder.buyer.whatsapp) && (
              <p className="font-semibold text-[#1C1B1B]">
                {activeOrder.buyer.nome}
                {activeOrder.buyer.nome && activeOrder.buyer.whatsapp ? ' · ' : ''}
                {activeOrder.buyer.whatsapp}
              </p>
            )}
            <p>{buyerAddress}</p>
          </div>
        </section>

        {/* Itemized Receipt */}
        <aside className="lg:col-span-5 bg-[#FFFFFF] border border-[#EAEAEA] rounded-xl p-5 sm:p-6 space-y-4">
          <h2 className="text-[17px] font-bold text-[#1C1B1B]">
            Recibo Detalhado
          </h2>

          <div className="divide-y divide-[#EAEAEA]">
            {activeOrder.items.map((item, idx) => (
              <div key={idx} className="py-3 first:pt-0 space-y-1">
                <div className="flex justify-between gap-3 text-[14px]">
                  <span className="font-semibold text-[#1C1B1B]">
                    <span className="tabular-nums">{item.quantity}×</span> {item.name}
                  </span>
                  <span className="font-bold text-[#1C1B1B] tabular-nums shrink-0">
                    {formatBRL(item.lineTotal)}
                  </span>
                </div>
                {item.summary && (
                  <p className="text-[12px] text-[#5A413A] leading-[1.45]">
                    {item.summary}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-[#EAEAEA] pt-3.5 space-y-2 text-[14px]">
            <div className="flex justify-between text-[#5A413A]">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatBRL(activeOrder.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#5A413A]">
              <span>Frete ({activeOrder.neighborhoodLabel})</span>
              <span className="tabular-nums">{formatBRL(activeOrder.deliveryFee)}</span>
            </div>
            {activeOrder.tip > 0 && (
              <div className="flex justify-between text-[#5A413A]">
                <span>Gorjeta</span>
                <span className="tabular-nums">{formatBRL(activeOrder.tip)}</span>
              </div>
            )}
            <div className="border-t border-[#EAEAEA] pt-2.5 flex justify-between text-[16px] font-extrabold text-[#1C1B1B]">
              <span>Total</span>
              <span className="tabular-nums">{formatBRL(activeOrder.total)}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Previous Orders */}
      {pastOrders.length > 0 && (
        <section className="space-y-3 pt-2">
          <h2 className="text-[18px] font-bold text-[#1C1B1B]">Pedidos Anteriores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastOrders.map((order) => (
              <div
                key={order.id}
                className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <p className="text-[14px] font-bold text-[#1C1B1B] tabular-nums">
                    Pedido #{order.orderCode} · {formatBRL(order.total)}
                  </p>
                  <p className="text-[13px] text-[#5A413A] truncate">
                    {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                  </p>
                  <p className="text-[12px] text-[#8E7069]">{order.placedAt}</p>
                </div>
                <button
                  type="button"
                  onClick={onBackToMenu}
                  className="min-h-[40px] px-3.5 py-2 rounded-full bg-[#F5F5F5] hover:bg-[#EAE7E7] border border-[#EAEAEA] text-[12px] font-semibold text-[#1C1B1B] inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Pedir de Novo</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
