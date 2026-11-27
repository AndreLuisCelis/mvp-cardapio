import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChefHat,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  Loader2,
  PackageCheck,
  ReceiptText,
} from 'lucide-react';
import { KITCHEN_STAGES } from '../../../config/store';
import {
  fetchStaffOrderItems,
  subscribeToStaffOrders,
  updateStaffOrderStage,
} from '../../../shared/orderRepository';
import { formatOrderPlacedAt } from '../../../shared/orderStorage';
import type { OrderStage, PlacedOrderItem, StaffOrderRecord } from '../../../types';
import { formatBRL } from '../../../utils/format';

export function OrdersAdminView() {
  const [orders, setOrders] = useState<StaffOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, PlacedOrderItem[]>>({});
  const [loadingItemsId, setLoadingItemsId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'active' | 'all'>('active');

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToStaffOrders({
      onOrders: (list) => {
        setOrders(list);
        setLoading(false);
        setError(null);
      },
      onError: (msg) => {
        setError(msg);
        setLoading(false);
      },
    });
    return () => unsub();
  }, []);

  const handleToggleItems = async (orderId: string) => {
    if (expandedItems[orderId]) {
      setExpandedItems((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      return;
    }

    setLoadingItemsId(orderId);
    try {
      const items = await fetchStaffOrderItems(orderId);
      setExpandedItems((prev) => ({ ...prev, [orderId]: items }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar itens.');
    } finally {
      setLoadingItemsId(null);
    }
  };

  const handleSetStage = async (order: StaffOrderRecord, nextStage: OrderStage) => {
    if (order.stage === nextStage || updatingOrderId) return;
    setUpdatingOrderId(order.id);
    setError(null);
    try {
      await updateStaffOrderStage(order.id, order.trackerId, nextStage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar etapa do pedido.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const visibleOrders =
    filterMode === 'active' ? orders.filter((o) => o.stage < 3) : orders;

  const activeCount = orders.filter((o) => o.stage < 3).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold text-[#0F172A]">
            Pedidos da Cozinha (Tempo Real)
          </h1>
          <p className="text-[13px] text-[#64748B]">
            Avance as etapas da cozinha aqui. Dados pessoais do cliente permanecem apenas no WhatsApp.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-[#E2E8F0] bg-white p-1">
          <button
            type="button"
            onClick={() => setFilterMode('active')}
            className={`px-3 py-1.5 rounded-md text-[12px] font-semibold cursor-pointer transition-colors ${
              filterMode === 'active'
                ? 'bg-[#0F172A] text-white'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            Em andamento ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-md text-[12px] font-semibold cursor-pointer transition-colors ${
              filterMode === 'all'
                ? 'bg-[#0F172A] text-white'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            Todos ({orders.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[13px] text-[#B91C1C]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-3 animate-pulse">
          <div className="h-5 w-48 bg-[#E2E8F0] rounded" />
          <div className="h-20 w-full bg-[#F1F5F9] rounded" />
          <div className="h-20 w-full bg-[#F1F5F9] rounded" />
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center space-y-2">
          <ReceiptText className="w-8 h-8 text-[#94A3B8] mx-auto" />
          <p className="text-[15px] font-semibold text-[#0F172A]">
            {filterMode === 'active'
              ? 'Nenhum pedido em andamento no momento'
              : 'Nenhum pedido registrado ainda'}
          </p>
          <p className="text-[13px] text-[#64748B]">
            Novos pedidos finalizados no cardápio aparecerão automaticamente aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleOrders.map((order) => {
            const currentStageInfo =
              KITCHEN_STAGES.find((s) => s.stage === order.stage) || KITCHEN_STAGES[0];
            const isExpanded = Boolean(expandedItems[order.id]);
            const items = expandedItems[order.id] || [];
            const nextStage = order.stage < 3 ? ((order.stage + 1) as OrderStage) : null;
            const isUpdating = updatingOrderId === order.id;

            return (
              <article
                key={order.id}
                className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-[17px] font-extrabold text-[#0F172A] tabular-nums">
                        #{order.orderCode}
                      </span>
                      <span className="text-[12px] font-semibold px-2.5 py-1 rounded-md bg-[#F1F5F9] text-[#334155]">
                        {order.pickupWindow}
                      </span>
                      <span
                        className={`text-[12px] font-semibold px-2.5 py-1 rounded-md ${
                          order.stage >= 3
                            ? 'bg-[#DCFCE7] text-[#166534]'
                            : 'bg-[#FEF3C7] text-[#92400E]'
                        }`}
                      >
                        {currentStageInfo.title}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#64748B] flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Criado: {formatOrderPlacedAt(order.createdAtIso)} · Previsão:{' '}
                        {order.estimatedReady}
                      </span>
                    </p>
                  </div>

                  <div className="text-right space-y-0.5">
                    <p className="text-[17px] font-extrabold text-[#0F172A] tabular-nums">
                      {formatBRL(order.total)}
                    </p>
                    <p className="text-[11px] text-[#64748B] tabular-nums">
                      Itens {formatBRL(order.subtotal)} · Taxa {formatBRL(order.deliveryFee)}
                      {order.tip > 0 ? ` · Gorjeta ${formatBRL(order.tip)}` : ''}
                    </p>
                  </div>
                </div>

                {/* Stage Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F1F5F9]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {KITCHEN_STAGES.map((stageObj) => {
                      const active = order.stage === stageObj.stage;
                      const done = order.stage > stageObj.stage;
                      const StageIcon =
                        stageObj.stage === 0
                          ? CheckCircle2
                          : stageObj.stage === 1
                          ? Flame
                          : stageObj.stage === 2
                          ? ChefHat
                          : PackageCheck;
                      return (
                        <button
                          key={stageObj.stage}
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleSetStage(order, stageObj.stage)}
                          className={`min-h-[34px] px-2.5 py-1 rounded-lg border text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60 ${
                            active
                              ? 'bg-[#0F172A] text-white border-[#0F172A]'
                              : done
                              ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                              : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <StageIcon className="w-3.5 h-3.5" />
                          <span>{stageObj.title}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleItems(order.id)}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[12px] font-semibold text-[#334155] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {loadingItemsId === order.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                      <span>{isExpanded ? 'Ocultar itens' : 'Ver itens'}</span>
                    </button>

                    {nextStage !== null && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleSetStage(order, nextStage)}
                        className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-60 text-white text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>
                          Avançar para{' '}
                          {KITCHEN_STAGES.find((s) => s.stage === nextStage)?.title}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 space-y-2">
                    {items.length === 0 ? (
                      <p className="text-[12px] text-[#64748B]">Nenhum item encontrado.</p>
                    ) : (
                      items.map((item, idx) => (
                        <div
                          key={`${item.menuItemId}-${idx}`}
                          className="flex items-start justify-between gap-3 text-[13px] border-b last:border-b-0 border-[#E2E8F0] pb-2 last:pb-0"
                        >
                          <div>
                            <p className="font-semibold text-[#0F172A]">
                              {item.quantity}× {item.name}
                            </p>
                            {item.summary && (
                              <p className="text-[12px] text-[#475569]">{item.summary}</p>
                            )}
                          </div>
                          <span className="font-semibold text-[#0F172A] tabular-nums shrink-0">
                            {formatBRL(item.lineTotal)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
