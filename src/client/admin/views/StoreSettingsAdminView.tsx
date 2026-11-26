import { useState } from 'react';
import { CheckCircle2, Save, Trash2, Upload } from 'lucide-react';
import { compressImageFileToDataUrl, isSafeDisplayUrl } from '../../../shared/imageUtils';
import { resolveStoreBannerUrl, saveStoreSettings } from '../../../shared/storeRepository';
import type { StoreSettingsRecord } from '../../../types';

interface StoreSettingsAdminViewProps {
  settings: StoreSettingsRecord;
  onRefresh: () => Promise<void>;
}

export function StoreSettingsAdminView({
  settings,
  onRefresh,
}: StoreSettingsAdminViewProps) {
  const [form, setForm] = useState<StoreSettingsRecord>(settings);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<'logoUrl' | 'bannerUrl' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleUploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logoUrl' | 'bannerUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(field);
    setErrorMsg(null);
    setSavedSuccess(false);
    try {
      const dataUrl = await compressImageFileToDataUrl(file, {
        maxWidth: field === 'logoUrl' ? 360 : 900,
        maxHeight: field === 'logoUrl' ? 360 : 640,
        quality: 0.82,
      });
      setForm((prev) => ({ ...prev, [field]: dataUrl }));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao enviar imagem.');
    } finally {
      setUploadingField(null);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      setErrorMsg('Informe o nome do estabelecimento.');
      return;
    }
    if (!isSafeDisplayUrl(form.logoUrl) || !isSafeDisplayUrl(form.bannerUrl)) {
      setErrorMsg('URL da logo ou banner inválida.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSavedSuccess(false);
    try {
      await saveStoreSettings(form);
      setSavedSuccess(true);
      await onRefresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao salvar informações da loja.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-[#0F172A]">
            Informações da Loja, Logo e Banner
          </h2>
          <p className="text-[13px] text-[#475569]">
            Personalize a identidade visual, WhatsApp, pedido mínimo e textos exibidos no cardápio.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving || uploadingField !== null}
          className="min-h-[42px] px-5 py-2 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
        </button>
      </div>

      {errorMsg && (
        <p className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[13px] text-[#B91C1C]">
          {errorMsg}
        </p>
      )}

      {savedSuccess && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[13px] text-[#15803D]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Configurações da loja atualizadas e publicadas no cardápio.</span>
        </div>
      )}

      {/* Logo e Banner */}
      <section className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 space-y-5">
        <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2.5">
          Identidade Visual (Logo e Banner)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo */}
          <div className="space-y-2.5">
            <label className="block text-[13px] font-semibold text-[#0F172A]">
              Logo da Loja (exibida no cabeçalho)
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] flex items-center justify-center overflow-hidden shrink-0">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Logo atual"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] font-semibold text-[#64748B] text-center px-1">
                    Sem logo
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingField === 'logoUrl' ? 'Enviando...' : 'Enviar Logo'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => handleUploadImage(e, 'logoUrl')}
                    className="hidden"
                  />
                </label>
                {form.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, logoUrl: '' }))}
                    className="min-h-[36px] px-2.5 py-1.5 rounded-lg border border-[#FECACA] text-[#DC2626] text-[12px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover</span>
                  </button>
                )}
              </div>
            </div>
            <input
              type="text"
              value={form.logoUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
              placeholder="Ou cole a URL da logo (https://...)"
              className="w-full min-h-[38px] px-3 py-1.5 border border-[#CBD5E1] rounded-lg text-[12px]"
            />
          </div>

          {/* Banner */}
          <div className="space-y-2.5">
            <label className="block text-[13px] font-semibold text-[#0F172A]">
              Banner Institucional (aba Sobre)
            </label>
            <div className="flex items-center gap-4">
              <div className="w-28 h-16 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] overflow-hidden shrink-0">
                <img
                  src={resolveStoreBannerUrl(form.bannerUrl)}
                  alt="Banner atual"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingField === 'bannerUrl' ? 'Enviando...' : 'Trocar Banner'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => handleUploadImage(e, 'bannerUrl')}
                    className="hidden"
                  />
                </label>
                {form.bannerUrl && (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, bannerUrl: '' }))}
                    className="min-h-[36px] px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] text-[#475569] text-[12px] font-semibold cursor-pointer"
                  >
                    Usar padrão
                  </button>
                )}
              </div>
            </div>
            <input
              type="text"
              value={form.bannerUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, bannerUrl: e.target.value }))}
              placeholder="Ou cole a URL do banner (https://...)"
              className="w-full min-h-[38px] px-3 py-1.5 border border-[#CBD5E1] rounded-lg text-[12px]"
            />
          </div>
        </div>
      </section>

      {/* Dados Principais & Atendimento */}
      <section className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 space-y-4">
        <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2.5">
          Dados do Estabelecimento e Pedidos
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-[#0F172A]">
              Nome da Loja *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[14px]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-[#0F172A]">Bairro *</label>
            <input
              type="text"
              required
              value={form.neighborhood}
              onChange={(e) => setForm((prev) => ({ ...prev, neighborhood: e.target.value }))}
              className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[14px]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-[#0F172A]">Cidade *</label>
            <input
              type="text"
              required
              value={form.city}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
              className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[14px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <label className="block text-[13px] font-semibold text-[#0F172A]">
              WhatsApp (dígitos) *
            </label>
            <input
              type="text"
              required
              value={form.whatsappNumber}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  whatsappNumber: e.target.value.replace(/\D/g, ''),
                }))
              }
              className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[14px] font-mono tabular-nums"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-[#0F172A]">
              Pedido mínimo (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={form.minOrder}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, minOrder: Number(e.target.value || 0) }))
              }
              className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[14px] tabular-nums"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-[#0F172A]">
              Taxa padrão (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={form.deliveryFee}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, deliveryFee: Number(e.target.value || 0) }))
              }
              className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[14px] tabular-nums"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-[#0F172A]">
              Tempo entrega (ex: 20-30)
            </label>
            <input
              type="text"
              value={form.deliveryTimeMin}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, deliveryTimeMin: e.target.value }))
              }
              className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[14px] tabular-nums"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-[#0F172A]">
              Prefixo código pedido
            </label>
            <input
              type="text"
              maxLength={6}
              value={form.orderCodePrefix}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  orderCodePrefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                }))
              }
              className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[14px] font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-[#0F172A]">
              Previsão retirada (min)
            </label>
            <input
              type="number"
              min={1}
              max={240}
              value={form.pickupEstimatedMinutes}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  pickupEstimatedMinutes: Number(e.target.value || 20),
                }))
              }
              className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[14px] tabular-nums"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-[#0F172A]">
              Previsão entrega (min)
            </label>
            <input
              type="number"
              min={1}
              max={240}
              value={form.deliveryEstimatedMinutes}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  deliveryEstimatedMinutes: Number(e.target.value || 35),
                }))
              }
              className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[14px] tabular-nums"
            />
          </div>
        </div>
      </section>

      {/* Textos da Vitrine */}
      <section className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 space-y-4">
        <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2.5">
          Textos da Vitrine e Institucional
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-[#0F172A]">
              Título principal da Home
            </label>
            <input
              type="text"
              value={form.heroHeadline}
              onChange={(e) => setForm((prev) => ({ ...prev, heroHeadline: e.target.value }))}
              className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[13px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-[#0F172A]">
              Rótulo da aba Institucional
            </label>
            <input
              type="text"
              value={form.aboutNavLabel}
              onChange={(e) => setForm((prev) => ({ ...prev, aboutNavLabel: e.target.value }))}
              className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[13px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-[#0F172A]">
              Placeholder da busca
            </label>
            <input
              type="text"
              value={form.searchPlaceholder}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, searchPlaceholder: e.target.value }))
              }
              className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[13px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-[#0F172A]">
              Texto formas de pagamento
            </label>
            <input
              type="text"
              value={form.paymentMethodsLabel}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, paymentMethodsLabel: e.target.value }))
              }
              className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[13px]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-semibold text-[#0F172A]">
            Título da aba Sobre
          </label>
          <input
            type="text"
            value={form.aboutHeadline}
            onChange={(e) => setForm((prev) => ({ ...prev, aboutHeadline: e.target.value }))}
            className="w-full min-h-[40px] px-3 py-2 border border-[#CBD5E1] rounded-lg text-[13px]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-semibold text-[#0F172A]">
            Descrição da aba Sobre
          </label>
          <textarea
            rows={2}
            value={form.aboutDescription}
            onChange={(e) => setForm((prev) => ({ ...prev, aboutDescription: e.target.value }))}
            className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-[13px]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-semibold text-[#0F172A]">
            Mensagem da sacola vazia
          </label>
          <textarea
            rows={2}
            value={form.emptyBagDescription}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, emptyBagDescription: e.target.value }))
            }
            className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-[13px]"
          />
        </div>
      </section>
    </form>
  );
}
