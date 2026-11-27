import {
  AlertTriangle,
  Check,
  ChefHat,
  Clock,
  Flame,
  Loader2,
  MessageCircle,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { KITCHEN_STAGES } from '../config/store';
import { OrderStage, PlacedOrder, StoreSettingsRecord } from '../types';
import { formatBRL } from '../utils/format';

interface OrdersScreenProps {
  orders: PlacedOrder[];
  storeSettings: StoreSettingsRecord;
  isRestoringOrders?: boolean;
  retryingOrderId?: string | null;
  onRetryPersistence?: (orderId: string) => void;
  onRefreshOrderStatus?: (orderId: string) => void;
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
  storeSettings,
  isRestoringOrders = false,
  retryingOrderId = null,
  onRetryPersistence,
  onRefreshOrderStatus,
  onBackToMenu,
}: OrdersScreenProps) {
  const activeOrder = orders[0];
  const pastOrders = orders.slice(1);

  if (isRestoringOrders && !activeOrder) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-xl p-8 space-y-4 text-center">
          <Loader2 className="w-7 h-7 animate-spin text-brand mx-auto" />
          <h1 className="text-[20px] font-bold text-[#1C1B1B]">
            Restaurando acompanhamento dos seus pedidos...
          </h1>
          <p className="text-[14px] text-[#5A413A]">
            Consultando o status atualizado na cozinha em tempo real.
          </p>
        </div>
      </div>
    );
  }

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

  const isPersisted = activeOrder.persistenceStatus === 'persisted';
  const isCompleted = isPersisted && activeOrder.stage >= 3;
  const buyerAddress =
    activeOrder.fulfillment === 'delivery' && activeOrder.buyer.endereco
      ? `${activeOrder.buyer.endereco} · ${activeOrder.neighborhoodLabel}`
      : `${storeSettings.name} · ${storeSettings.neighborhood} · ${storeSettings.city} · ${activeOrder.neighborhoodLabel}`;

  const headerStatusText = (() => {
    if (activeOrder.persistenceStatus === 'unavailable') {
      return {
        label: 'Enviado ao WhatsApp (sem rastreio online)',
        colorClass: 'text-[#845300]',
      };
    }
    if (activeOrder.persistenceStatus === 'failed') {
      return {
        label: 'Falha ao salvar acompanhamento no servidor',
        colorClass: 'text-[#BA1A1A]',
      };
    }
    if (isCompleted) {
      return {
        label:
          activeOrder.fulfillment === 'pickup'
            ? 'Pronto para retirada no balcão'
            : 'Pedido pronto e saindo para entrega',
        colorClass: 'text-[#16A34A]',
      };
    }
    return {
      label: 'Acompanhamento em tempo real ativo',
      colorClass: 'text-[#16A34A]',
    };
  })();

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className={`text-[13px] font-semibold ${headerStatusText.colorClass}`}>
            {headerStatusText.label} ·{' '}
            <span className="text-[#5A413A] font-normal">{activeOrder.placedAt}</span>
          </p>
          <h1 className="text-[26px] sm:text-[30px] font-extrabold tracking-[-0.02em] text-[#1C1B1B] tabular-nums">
            Pedido #{activeOrder.orderCode}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {activeOrder.whatsappUrl && (
            <a
              href={activeOrder.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-4 py-2 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-[14px] font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Abrir no WhatsApp</span>
            </a>
          )}
          <button
            type="button"
            onClick={onBackToMenu}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-[#FFFFFF] border border-[#EAEAEA] hover:border-[#D9D9D9] text-[14px] font-semibold text-[#1C1B1B] cursor-pointer transition-colors"
          >
            Voltar ao Cardápio
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Real-Time Tracker OR Explicit Unavailable / Persistence Failure State */}
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

            {isPersisted && (
              <div className="flex items-center gap-2 text-[12px] font-semibold">
                {activeOrder.syncStatus === 'live' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D]">
                    <Wifi className="w-3.5 h-3.5" />
                    <span>Sincronizado em tempo real</span>
                  </span>
                )}
                {activeOrder.syncStatus === 'connecting' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Conectando à cozinha...</span>
                  </span>
                )}
                {(activeOrder.syncStatus === 'error' || activeOrder.syncStatus === 'inactive') && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E]">
                      <WifiOff className="w-3.5 h-3.5" />
                      <span>Sincronização indisponível</span>
                    </span>
                    {onRefreshOrderStatus && (
                      <button
                        type="button"
                        onClick={() => onRefreshOrderStatus(activeOrder.id)}
                        className="min-h-[34px] px-3 py-1 rounded-lg border border-[#EAEAEA] hover:bg-[#F5F5F5] text-[12px] font-semibold text-[#1C1B1B] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Atualizar</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {activeOrder.persistenceStatus === 'unavailable' && (
            <div
              role="status"
              className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-5 space-y-3"
            >
              <div className="flex items-start gap-3">
                <WifiOff className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h2 className="text-[15px] font-bold text-[#78350F]">
                    Acompanhamento em tempo real indisponível
                  </h2>
                  <p className="text-[13px] text-[#92400E] leading-[1.5]">
                    O serviço de banco de dados em tempo real (Firebase) não está disponível neste ambiente. Este pedido não foi salvo no servidor; acompanhe a confirmação e o preparo diretamente pelo WhatsApp da loja.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeOrder.persistenceStatus === 'failed' && (
            <div
              role="alert"
              className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-5 space-y-3"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h2 className="text-[15px] font-bold text-[#991B1B]">
                    Pedido não salvo para acompanhamento em tempo real
                  </h2>
                  <p className="text-[13px] text-[#B91C1C] leading-[1.5]">
                    {activeOrder.persistenceError ||
                      'Não foi possível gravar o pedido no servidor. O acompanhamento automático da cozinha não está ativo.'}
                  </p>
                </div>
              </div>
              {onRetryPersistence && (
                <div>
                  <button
                    type="button"
                    disabled={retryingOrderId === activeOrder.id}
                    onClick={() => onRetryPersistence(activeOrder.id)}
                    className="min-h-[40px] px-4 py-2 rounded-lg bg-[#991B1B] hover:bg-[#7F1D1D] disabled:opacity-60 text-white text-[13px] font-semibold inline-flex items-center gap-2 cursor-pointer"
                  >
                    {retryingOrderId === activeOrder.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Tentando registrar...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Tentar registrar acompanhamento novamente</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {isPersisted && (
            <>
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

              <p className="text-[12px] text-[#8E7069]">
                As etapas avançam automaticamente conforme a equipe da cozinha atualiza seu pedido no painel interno.
              </p>
            </>
          )}

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
            {pastOrders.map((order) => {
              const stageInfo =
                order.persistenceStatus === 'persisted'
                  ? KITCHEN_STAGES.find((s) => s.stage === order.stage)?.title || 'Em andamento'
                  : 'Sem rastreio online';
              return (
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
                    <p className="text-[12px] text-[#8E7069]">
                      {order.placedAt} · {stageInfo}
                    </p>
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
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
