import { useState } from 'react';
import { FolderTree, Pencil, Plus, Trash2, X } from 'lucide-react';
import { slugifyCategoryKey } from '../../../shared/imageUtils';
import { deleteCategoryRecord, upsertCategory } from '../../../shared/storeRepository';
import type { StoreCategoryConfig } from '../../../types';

interface CategoriesAdminViewProps {
  categories: StoreCategoryConfig[];
  onRefresh: () => Promise<void>;
}

export function CategoriesAdminView({ categories, onRefresh }: CategoriesAdminViewProps) {
  const [editing, setEditing] = useState<StoreCategoryConfig | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<StoreCategoryConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openNew = () => {
    setIsNew(true);
    setErrorMsg(null);
    setEditing({
      id: '',
      key: '',
      title: '',
      isCombo: false,
      active: true,
      sortOrder: (categories.length + 1) * 10,
    });
  };

  const openEdit = (cat: StoreCategoryConfig) => {
    setIsNew(false);
    setErrorMsg(null);
    setEditing({ ...cat });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const cleanTitle = editing.title.trim();
    const cleanKey = slugifyCategoryKey(editing.key || cleanTitle);
    if (cleanTitle.length < 2) {
      setErrorMsg('Informe um nome com pelo menos 2 caracteres.');
      return;
    }
    if (cleanKey.length < 2) {
      setErrorMsg('Informe um identificador válido (apenas letras, números e hífen).');
      return;
    }
    if (isNew && categories.some((c) => c.id === cleanKey || c.key === cleanKey)) {
      setErrorMsg('Já existe uma categoria com esse identificador.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      await upsertCategory(
        {
          ...editing,
          id: isNew ? cleanKey : editing.id,
          key: cleanKey,
          title: cleanTitle,
        },
        isNew
      );
      setEditing(null);
      await onRefresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao salvar categoria.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      await deleteCategoryRecord(confirmDelete.id);
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
          <h2 className="text-[18px] font-bold text-[#0F172A]">Categorias do Cardápio</h2>
          <p className="text-[13px] text-[#475569]">
            Organize a ordem das seções e defina quais categorias aparecem na aba Combos.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="min-h-[40px] px-4 py-2 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-10 text-center space-y-3">
          <FolderTree className="w-7 h-7 text-[#64748B] mx-auto" />
          <p className="text-[15px] font-semibold text-[#0F172A]">
            Nenhuma categoria cadastrada no banco
          </p>
          <p className="text-[13px] text-[#475569]">
            Crie sua primeira categoria ou importe o cardápio inicial no topo do painel.
          </p>
          <button
            type="button"
            onClick={openNew}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-[#0F172A] text-white text-[13px] font-semibold cursor-pointer"
          >
            Criar Categoria
          </button>
        </div>
      ) : (
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[12px] font-semibold text-[#475569]">
                  <th className="py-3 px-4">Ordem</th>
                  <th className="py-3 px-4">Nome da Categoria</th>
                  <th className="py-3 px-4">Identificador</th>
                  <th className="py-3 px-4">Aba Combos</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[13px]">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 font-mono tabular-nums text-[#475569]">
                      {cat.sortOrder}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#0F172A]">{cat.title}</td>
                    <td className="py-3 px-4 font-mono text-[12px] text-[#64748B]">{cat.key}</td>
                    <td className="py-3 px-4 text-[#334155]">{cat.isCombo ? 'Sim' : 'Não'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          cat.active ? 'text-[#16A34A]' : 'text-[#64748B]'
                        }`}
                      >
                        {cat.active ? 'Ativa' : 'Oculta'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        className="p-1.5 text-[#475569] hover:text-[#0F172A] cursor-pointer"
                        aria-label={`Editar ${cat.title}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(cat)}
                        className="p-1.5 text-[#475569] hover:text-[#DC2626] cursor-pointer ml-1"
                        aria-label={`Excluir ${cat.title}`}
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
                {isNew ? 'Nova Categoria' : 'Editar Categoria'}
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
                  Título exibido *
                </label>
                <input
                  type="text"
                  required
                  value={editing.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setEditing((prev) =>
                      prev
                        ? {
                            ...prev,
                            title,
                            key: isNew ? slugifyCategoryKey(title) : prev.key,
                          }
                        : null
                    );
                  }}
                  placeholder="Ex: Sobremesas"
                  className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[14px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-[#0F172A]">
                    Slug (ID) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isNew}
                    value={editing.key}
                    onChange={(e) =>
                      setEditing((prev) =>
                        prev ? { ...prev, key: slugifyCategoryKey(e.target.value) } : null
                      )
                    }
                    className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[13px] font-mono disabled:bg-[#F8FAFC]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-[#0F172A]">
                    Ordem
                  </label>
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

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2.5 text-[13px] font-medium text-[#0F172A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.isCombo}
                    onChange={(e) =>
                      setEditing((prev) => (prev ? { ...prev, isCombo: e.target.checked } : null))
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span>Incluir na aba &ldquo;Combos&rdquo; do cardápio</span>
                </label>

                <label className="flex items-center gap-2.5 text-[13px] font-medium text-[#0F172A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.active}
                    onChange={(e) =>
                      setEditing((prev) => (prev ? { ...prev, active: e.target.checked } : null))
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span>Categoria ativa no cardápio público</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="min-h-[40px] px-4 py-2 rounded-lg border border-[#CBD5E1] text-[13px] font-semibold text-[#334155] cursor-pointer"
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
            <h3 className="text-[16px] font-bold text-[#0F172A]">Excluir categoria?</h3>
            <p className="text-[13px] text-[#475569]">
              Tem certeza que deseja excluir <strong>{confirmDelete.title}</strong>? Produtos vinculados a ela deixarão de aparecer agrupados até serem reclassificados.
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
