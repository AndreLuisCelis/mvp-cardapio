import { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2, Upload, UtensilsCrossed, X } from 'lucide-react';
import { CUSTOMIZATION_GROUP_MAP, IMAGE_MAP, IMAGE_OPTIONS } from '../../../data/menu';
import {
  compressImageFileToDataUrl,
  isSafeDisplayUrl,
  slugifyCategoryKey,
} from '../../../shared/imageUtils';
import { deleteMenuItemRecord, upsertMenuItem } from '../../../shared/storeRepository';
import type {
  CustomizationGroupKey,
  ImageKey,
  MenuItem,
  StoreCategoryConfig,
} from '../../../types';
import { formatBRL } from '../../../utils/format';

interface MenuItemsAdminViewProps {
  items: MenuItem[];
  categories: StoreCategoryConfig[];
  onRefresh: () => Promise<void>;
}

const GROUP_KEYS: CustomizationGroupKey[] = ['bun', 'sear', 'addons', 'dip', 'ice'];

export function MenuItemsAdminView({
  items,
  categories,
  onRefresh,
}: MenuItemsAdminViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'hidden' | 'featured'>(
    'all'
  );

  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<MenuItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'published'
          ? item.published
          : statusFilter === 'hidden'
          ? !item.published
          : item.featured;
      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [items, searchQuery, categoryFilter, statusFilter]);

  const openNew = () => {
    const firstCat = categories[0];
    setIsNew(true);
    setErrorMsg(null);
    setEditing({
      id: '',
      name: '',
      category: firstCat?.key || 'hamburguer-sensacional',
      categoryLabel: firstCat?.title || 'Hambúrguer Sensacional',
      description: '',
      ingredientsSummary: '',
      price: 20.0,
      originalPrice: null,
      prepMinutes: '20-30 min',
      rating: 4.9,
      reviewCount: 50,
      dietaryNote: '',
      featured: false,
      isHero: false,
      published: true,
      imageKey: 'classic_ember',
      imageUrl: IMAGE_MAP.classic_ember,
      customizationGroupKeys: ['bun', 'sear', 'addons'],
      customizationGroups: [
        CUSTOMIZATION_GROUP_MAP.bun,
        CUSTOMIZATION_GROUP_MAP.sear,
        CUSTOMIZATION_GROUP_MAP.addons,
      ],
      sortOrder: (items.length + 1) * 10,
    });
  };

  const openEdit = (item: MenuItem) => {
    setIsNew(false);
    setErrorMsg(null);
    setEditing({
      ...item,
      customizationGroupKeys: [...item.customizationGroupKeys],
    });
  };

  const handleQuickToggle = async (
    item: MenuItem,
    field: 'published' | 'featured' | 'isHero'
  ) => {
    setSaving(true);
    try {
      await upsertMenuItem({ ...item, [field]: !item[field] }, false);
      await onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploadingImage(true);
    setErrorMsg(null);
    try {
      const compressed = await compressImageFileToDataUrl(file, {
        maxWidth: 720,
        maxHeight: 720,
        quality: 0.8,
      });
      setEditing((prev) => (prev ? { ...prev, imageUrl: compressed } : null));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao processar imagem.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    if (editing.name.trim().length < 2) {
      setErrorMsg('Informe o nome do produto (mínimo 2 caracteres).');
      return;
    }
    if (!editing.price || editing.price <= 0) {
      setErrorMsg('Informe um preço maior que zero.');
      return;
    }
    if (!isSafeDisplayUrl(editing.imageUrl)) {
      setErrorMsg('URL da imagem inválida. Use https://, http:// ou envie um arquivo.');
      return;
    }

    const matchedCategory = categories.find((c) => c.key === editing.category);
    const nextId = isNew
      ? `${slugifyCategoryKey(editing.name) || 'produto'}-${Date.now().toString(36)}`
      : editing.id;

    setSaving(true);
    setErrorMsg(null);
    try {
      await upsertMenuItem(
        {
          ...editing,
          id: nextId,
          categoryLabel: matchedCategory?.title || editing.categoryLabel || editing.category,
          customizationGroups: editing.customizationGroupKeys.map(
            (k) => CUSTOMIZATION_GROUP_MAP[k]
          ),
        },
        isNew
      );
      setEditing(null);
      await onRefresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Não foi possível salvar o produto.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      await deleteMenuItemRecord(confirmDelete.id);
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
          <h2 className="text-[18px] font-bold text-[#0F172A]">Produtos do Cardápio</h2>
          <p className="text-[13px] text-[#475569] tabular-nums">
            {items.length} {items.length === 1 ? 'item cadastrado' : 'itens cadastrados'}
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="min-h-[40px] px-4 py-2 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar produto por nome ou descrição..."
            className="w-full min-h-[38px] pl-9 pr-3 py-1.5 border border-[#CBD5E1] rounded-lg text-[13px]"
          />
        </div>
        <div className="md:col-span-4">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filtrar por categoria"
            className="w-full min-h-[38px] px-3 py-1.5 border border-[#CBD5E1] rounded-lg text-[13px] bg-white"
          >
            <option value="all">Todas as categorias</option>
            {categories.map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.title}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'all' | 'published' | 'hidden' | 'featured')
            }
            aria-label="Filtrar por status"
            className="w-full min-h-[38px] px-3 py-1.5 border border-[#CBD5E1] rounded-lg text-[13px] bg-white"
          >
            <option value="all">Todos os status</option>
            <option value="published">Publicados</option>
            <option value="hidden">Ocultos</option>
            <option value="featured">Ofertas em destaque</option>
          </select>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-10 text-center space-y-3">
          <UtensilsCrossed className="w-7 h-7 text-[#64748B] mx-auto" />
          <p className="text-[15px] font-semibold text-[#0F172A]">Nenhum produto encontrado</p>
          <p className="text-[13px] text-[#475569]">
            Ajuste os filtros ou adicione um novo item ao cardápio.
          </p>
        </div>
      ) : (
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[12px] font-semibold text-[#475569]">
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Preço</th>
                  <th className="py-3 px-4">Publicado</th>
                  <th className="py-3 px-4">Oferta</th>
                  <th className="py-3 px-4">Hero</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[13px]">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-3 min-w-[210px]">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover border border-[#E2E8F0] bg-[#F1F5F9] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0F172A] truncate max-w-[240px]">
                            {item.name}
                          </p>
                          <p className="text-[12px] text-[#64748B] truncate max-w-[240px]">
                            {item.description || 'Sem descrição'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-[#334155] whitespace-nowrap">
                      {item.categoryLabel}
                    </td>
                    <td className="py-2.5 px-4 font-semibold tabular-nums text-[#0F172A] whitespace-nowrap">
                      <div>{formatBRL(item.price)}</div>
                      {typeof item.originalPrice === 'number' &&
                        item.originalPrice > item.price && (
                          <div className="text-[11px] text-[#64748B] line-through">
                            {formatBRL(item.originalPrice)}
                          </div>
                        )}
                    </td>
                    <td className="py-2.5 px-4">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleQuickToggle(item, 'published')}
                        className={`text-[12px] font-semibold cursor-pointer ${
                          item.published ? 'text-[#16A34A]' : 'text-[#64748B]'
                        }`}
                      >
                        {item.published ? 'Visível' : 'Oculto'}
                      </button>
                    </td>
                    <td className="py-2.5 px-4">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleQuickToggle(item, 'featured')}
                        className={`text-[12px] font-semibold cursor-pointer ${
                          item.featured ? 'text-[#D97706]' : 'text-[#94A3B8]'
                        }`}
                      >
                        {item.featured ? 'Destaque' : 'Normal'}
                      </button>
                    </td>
                    <td className="py-2.5 px-4">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleQuickToggle(item, 'isHero')}
                        className={`text-[12px] font-semibold cursor-pointer ${
                          item.isHero ? 'text-[#0F172A] underline' : 'text-[#94A3B8]'
                        }`}
                      >
                        {item.isHero ? 'Principal' : 'Não'}
                      </button>
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="p-1.5 text-[#475569] hover:text-[#0F172A] cursor-pointer"
                        aria-label={`Editar ${item.name}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(item)}
                        className="p-1.5 text-[#475569] hover:text-[#DC2626] cursor-pointer ml-1"
                        aria-label={`Excluir ${item.name}`}
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
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
              <h3 className="text-[16px] font-bold text-[#0F172A]">
                {isNew ? 'Adicionar Produto' : `Editar: ${editing.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4">
              {errorMsg && (
                <p className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[13px] text-[#B91C1C]">
                  {errorMsg}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-[#0F172A]">
                    Nome do produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={editing.name}
                    onChange={(e) =>
                      setEditing((prev) => (prev ? { ...prev, name: e.target.value } : null))
                    }
                    className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[14px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-[#0F172A]">
                    Categoria *
                  </label>
                  <select
                    value={editing.category}
                    onChange={(e) => {
                      const nextKey = e.target.value;
                      const cat = categories.find((c) => c.key === nextKey);
                      setEditing((prev) =>
                        prev
                          ? {
                              ...prev,
                              category: nextKey,
                              categoryLabel: cat?.title || nextKey,
                            }
                          : null
                      );
                    }}
                    className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[13px] bg-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#0F172A]">Descrição</label>
                <textarea
                  rows={2}
                  value={editing.description}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, description: e.target.value } : null))
                  }
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-[13px]"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-[#0F172A]">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0.01}
                    required
                    value={editing.price}
                    onChange={(e) =>
                      setEditing((prev) =>
                        prev ? { ...prev, price: Number(e.target.value || 0) } : null
                      )
                    }
                    className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[14px] tabular-nums"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-[#0F172A]">
                    Preço anterior (De:)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={editing.originalPrice ?? ''}
                    placeholder="Opcional"
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditing((prev) =>
                        prev
                          ? { ...prev, originalPrice: val ? Number(val) : null }
                          : null
                      );
                    }}
                    className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[14px] tabular-nums"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-[#0F172A]">Preparo</label>
                  <input
                    type="text"
                    value={editing.prepMinutes}
                    onChange={(e) =>
                      setEditing((prev) =>
                        prev ? { ...prev, prepMinutes: e.target.value } : null
                      )
                    }
                    className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[13px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-[#0F172A]">Ordem</label>
                  <input
                    type="number"
                    min={0}
                    max={10000}
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

              {/* Imagem do produto */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                <p className="text-[13px] font-semibold text-[#0F172A]">Imagem do produto</p>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <img
                    src={editing.imageUrl || IMAGE_MAP[editing.imageKey]}
                    alt={editing.name || 'Prévia'}
                    className="w-20 h-20 rounded-lg object-cover border border-[#CBD5E1] bg-white shrink-0"
                  />
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <label className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[12px] font-semibold text-[#0F172A] inline-flex items-center gap-1.5 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingImage ? 'Enviando...' : 'Enviar arquivo'}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>

                      <select
                        value={editing.imageKey}
                        onChange={(e) => {
                          const key = e.target.value as ImageKey;
                          setEditing((prev) =>
                            prev
                              ? { ...prev, imageKey: key, imageUrl: IMAGE_MAP[key] }
                              : null
                          );
                        }}
                        className="min-h-[36px] px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-[12px]"
                      >
                        {IMAGE_OPTIONS.map((opt) => (
                          <option key={opt.key} value={opt.key}>
                            Padrão: {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <input
                      type="text"
                      value={editing.imageUrl}
                      onChange={(e) =>
                        setEditing((prev) =>
                          prev ? { ...prev, imageUrl: e.target.value } : null
                        )
                      }
                      placeholder="Ou cole a URL da imagem (https://...)"
                      className="w-full min-h-[36px] px-3 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-[12px]"
                    />
                  </div>
                </div>
              </div>

              {/* Personalizações */}
              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-[#0F172A]">
                  Grupos de personalização no modal
                </p>
                <div className="flex flex-wrap gap-3">
                  {GROUP_KEYS.map((key) => {
                    const checked = editing.customizationGroupKeys.includes(key);
                    return (
                      <label
                        key={key}
                        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#334155] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...editing.customizationGroupKeys, key].slice(0, 5)
                              : editing.customizationGroupKeys.filter((k) => k !== key);
                            setEditing((prev) =>
                              prev ? { ...prev, customizationGroupKeys: next } : null
                            );
                          }}
                          className="w-4 h-4 rounded"
                        />
                        <span>{CUSTOMIZATION_GROUP_MAP[key].title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-[#0F172A]">
                    Etiqueta promocional
                  </label>
                  <input
                    type="text"
                    value={editing.dietaryNote || ''}
                    placeholder="Ex: Oferta Especial"
                    onChange={(e) =>
                      setEditing((prev) =>
                        prev ? { ...prev, dietaryNote: e.target.value } : null
                      )
                    }
                    className="w-full min-h-[38px] px-3 py-1.5 border border-[#CBD5E1] rounded-lg text-[13px]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 text-[13px] font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editing.published}
                      onChange={(e) =>
                        setEditing((prev) =>
                          prev ? { ...prev, published: e.target.checked } : null
                        )
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span>Publicado</span>
                  </label>
                  <label className="flex items-center gap-2 text-[13px] font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editing.featured}
                      onChange={(e) =>
                        setEditing((prev) =>
                          prev ? { ...prev, featured: e.target.checked } : null
                        )
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span>Oferta destaque</span>
                  </label>
                  <label className="flex items-center gap-2 text-[13px] font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editing.isHero}
                      onChange={(e) =>
                        setEditing((prev) =>
                          prev ? { ...prev, isHero: e.target.checked } : null
                        )
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span>Banner Hero</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="min-h-[40px] px-4 py-2 rounded-lg border border-[#CBD5E1] text-[13px] font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="min-h-[40px] px-5 py-2 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold cursor-pointer disabled:opacity-60"
                >
                  {saving ? 'Salvando...' : 'Salvar Produto'}
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
            <h3 className="text-[16px] font-bold text-[#0F172A]">Excluir produto?</h3>
            <p className="text-[13px] text-[#475569]">
              Tem certeza que deseja excluir <strong>{confirmDelete.name}</strong>? Esta ação remove o item do cardápio permanentemente.
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
