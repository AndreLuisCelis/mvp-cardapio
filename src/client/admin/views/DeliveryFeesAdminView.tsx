import { useState } from 'react';
import { Pencil, Plus, Trash2, Truck, X } from 'lucide-react';
import { slugifyCategoryKey } from '../../../shared/imageUtils';
import { deleteDeliveryFeeRecord, upsertDeliveryFee } from '../../../shared/storeRepository';
import type { DeliveryFeeOption, FulfillmentType } from '../../../types';
import { formatBRL } from '../../../utils/format';

interface DeliveryFeesAdminViewProps {
  fees: DeliveryFeeOption[];
  onRefresh: () => Promise<void>;
}

export function DeliveryFeesAdminView({ fees, onRefresh }: DeliveryFeesAdminViewProps) {
  const [editing, setEditing] = useState<DeliveryFeeOption | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<DeliveryFeeOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openNew = () => {
    setIsNew(true);
    setErrorMsg(null);
    setEditing({
      id: '',
      label: '',
      fee: 5.0,
      fulfillment: 'delivery',
      active: true,
      sortOrder: (fees.length + 1) * 10,
    });
  };

  const openEdit = (feeOpt: DeliveryFeeOption) => {
    setIsNew(false);
    setErrorMsg(null);
    setEditing({ ...feeOpt });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const cleanLabel = editing.label.trim();
    if (cleanLabel.length < 2) {
      setErrorMsg('Informe o nome do bairro ou modalidade de entrega.');
      return;
    }

    const nextId = isNew
      ? slugifyCategoryKey(cleanLabel) || `taxa-${Date.now()}`
      : editing.id;

    setSaving(true);
    setErrorMsg(null);
    try {
      await upsertDeliveryFee(
        {
          ...editing,
          id: nextId,
          label: cleanLabel,
          fee: editing.fulfillment === 'pickup' ? 0 : Math.max(0, Number(editing.fee || 0)),
        },
        isNew
      );
      setEditing(null);
      await onRefresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao salvar taxa.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      await deleteDeliveryFeeRecord(confirmDelete.id);
      setConfirmDelete(null);
      await onRefresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-[#0F172A]">Taxas de Entrega e Retirada</h2>
          <p className="text-[13px] text-[#475569]">
            Configure os bairros atendidos, valores de frete e opções de retirada no balcão.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="min-h-[40px] px-4 py-2 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Taxa</span>
        </button>
      </div>

      {fees.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-10 text-center space-y-3">
          <Truck className="w-7 h-7 text-[#64748B] mx-auto" />
          <p className="text-[15px] font-semibold text-[#0F172A]">Nenhuma taxa configurada</p>
          <p className="text-[13px] text-[#475569]">
            Adicione bairros de entrega ou retirada no balcão para o checkout dos clientes.
          </p>
          <button
            type="button"
            onClick={openNew}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-[#0F172A] text-white text-[13px] font-semibold cursor-pointer"
          >
            Adicionar Taxa
          </button>
        </div>
      ) : (
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[12px] font-semibold text-[#475569]">
                  <th className="py-3 px-4">Ordem</th>
                  <th className="py-3 px-4">Bairro / Modalidade</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[13px]">
                {fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 font-mono tabular-nums text-[#475569]">
                      {fee.sortOrder}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#0F172A]">{fee.label}</td>
                    <td className="py-3 px-4 text-[#334155]">
                      {fee.fulfillment === 'pickup' ? 'Retirada no Balcão' : 'Entrega'}
                    </td>
                    <td className="py-3 px-4 font-semibold tabular-nums text-[#0F172A]">
                      {formatBRL(fee.fee)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          fee.active ? 'text-[#16A34A]' : 'text-[#64748B]'
                        }`}
                      >
                        {fee.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(fee)}
                        className="p-1.5 text-[#475569] hover:text-[#0F172A] cursor-pointer"
                        aria-label={`Editar ${fee.label}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(fee)}
                        className="p-1.5 text-[#475569] hover:text-[#DC2626] cursor-pointer ml-1"
                        aria-label={`Excluir ${fee.label}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
        >
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-[#0F172A]">
                {isNew ? 'Nova Taxa de Entrega' : 'Editar Taxa'}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {errorMsg && (
                <p className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[13px] text-[#B91C1C]">
                  {errorMsg}
                </p>
              )}

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#0F172A]">
                  Bairro ou descrição *
                </label>
                <input
                  type="text"
                  required
                  value={editing.label}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, label: e.target.value } : null))
                  }
                  placeholder="Ex: Entrega · Centro (Francisco Morato)"
                  className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[14px]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5 col-span-1">
                  <label className="block text-[13px] font-semibold text-[#0F172A]">Tipo</label>
                  <select
                    value={editing.fulfillment}
                    onChange={(e) => {
                      const fulfillment = e.target.value as FulfillmentType;
                      setEditing((prev) =>
                        prev
                          ? {
                              ...prev,
                              fulfillment,
                              fee: fulfillment === 'pickup' ? 0 : prev.fee,
                            }
                          : null
                      );
                    }}
                    className="w-full min-h-[40px] px-2.5 py-2 border border-[#CBD5E1] rounded-lg text-[13px] bg-white"
                  >
                    <option value="delivery">Entrega</option>
                    <option value="pickup">Retirada</option>
                  </select>
                </div>

                <div className="space-y-1.5 col-span-1">
                  <label className="block text-[13px] font-semibold text-[#0F172A]">
                    Taxa (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={500}
                    disabled={editing.fulfillment === 'pickup'}
                    value={editing.fee}
                    onChange={(e) =>
                      setEditing((prev) =>
                        prev ? { ...prev, fee: Number(e.target.value || 0) } : null
                      )
                    }
                    className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[14px] tabular-nums disabled:bg-[#F8FAFC]"
                  />
                </div>

                <div className="space-y-1.5 col-span-1">
                  <label className="block text-[13px] font-semibold text-[#0F172A]">Ordem</label>
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    value={editing.sortOrder}
                    onChange={(e) =>
                      setEditing((prev) =>
                        prev ? { ...prev, sortOrder: Number(e.target.value || 0) } : null
                      )
                    }
                    className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[14px] tabular-nums"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-[13px] font-medium text-[#0F172A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.active}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, active: e.target.checked } : null))
                  }
                  className="w-4 h-4 rounded"
                />
                <span>Opção ativa no checkout</span>
              </label>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="min-h-[40px] px-4 py-2 rounded-lg border border-[#CBD5E1] text-[13px] font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[40px] px-4 py-2 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold cursor-pointer disabled:opacity-60"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
        >
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl w-full max-w-sm p-5 space-y-4">
            <h3 className="text-[16px] font-bold text-[#0F172A]">Excluir taxa?</h3>
            <p className="text-[13px] text-[#475569]">
              Deseja remover <strong>{confirmDelete.label}</strong> das opções de entrega?
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-[#CBD5E1] text-[13px] font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleDelete}
                className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#DC2626] text-white text-[13px] font-semibold cursor-pointer disabled:opacity-60"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
