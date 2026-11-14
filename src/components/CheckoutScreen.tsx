import { useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, MessageCircle, Minus, Plus, Trash2 } from 'lucide-react';
import { BuyerData, CartItem, FulfillmentType, MenuItem } from '../types';
import { formatBRL } from '../utils/format';
import { ResilientImage } from './ResilientImage';

const WHATSAPP_LOJA = '5511991625833';

type PaymentMethod = 'Pix' | 'Cartão' | 'Dinheiro';

export interface NeighborhoodFeeOption {
  id: string;
  label: string;
  fee: number;
  fulfillment: FulfillmentType;
}

const NEIGHBORHOOD_FEES: NeighborhoodFeeOption[] = [
  { id: 'retirada', label: 'Retirada no Balcão', fee: 0, fulfillment: 'pickup' },
  { id: 'centro', label: 'Centro', fee: 5, fulfillment: 'delivery' },
  { id: 'jardim-primavera', label: 'Jardim Primavera', fee: 7, fulfillment: 'delivery' },
  { id: 'vila-nova', label: 'Vila Nova', fee: 8, fulfillment: 'delivery' },
];

interface CheckoutScreenProps {
  cartItems: CartItem[];
  suggestedItems: MenuItem[];
  onBackToMenu: () => void;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onEditItem: (cartItem: CartItem) => void;
  onQuickAdd: (item: MenuItem) => void;
  onPlaceOrder: (details: {
    fulfillment: FulfillmentType;
    neighborhoodLabel: string;
    deliveryFee: number;
    buyer: BuyerData;
    tipPercent: number;
  }) => void;
}

export function formatCartItemSummary(cartItem: CartItem): string {
  const parts: string[] = [];
  cartItem.menuItem.customizationGroups.forEach((group) => {
    if (group.type === 'single') {
      const choiceId = cartItem.selectedSingle[group.id];
      const choice = group.choices.find((c) => c.id === choiceId);
      if (choice) parts.push(choice.label);
    } else {
      const ids = cartItem.selectedMulti[group.id] || [];
      ids.forEach((id) => {
        const choice = group.choices.find((c) => c.id === id);
        if (choice) parts.push(`+ ${choice.label}`);
      });
    }
  });
  if (cartItem.observacao) {
    parts.push(`Obs: "${cartItem.observacao}"`);
  }
  return parts.join(' · ');
}

export function CheckoutScreen({
  cartItems,
  suggestedItems,
  onBackToMenu,
  onUpdateQuantity,
  onRemoveItem,
  onEditItem,
  onQuickAdd,
  onPlaceOrder,
}: CheckoutScreenProps) {
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string>('retirada');
  const [tipPercent, setTipPercent] = useState<number>(0);
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [endereco, setEndereco] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix');
  const [troco, setTroco] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<{
    nome?: boolean;
    whatsapp?: boolean;
    endereco?: boolean;
    bairro?: boolean;
  }>({});

  const selectedNeighborhood = useMemo(
    () =>
      NEIGHBORHOOD_FEES.find((n) => n.id === selectedNeighborhoodId) ??
      NEIGHBORHOOD_FEES[0],
    [selectedNeighborhoodId]
  );

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.preco * item.quantidade, 0),
    [cartItems]
  );
  const deliveryFee = selectedNeighborhood.fee;
  const tip = useMemo(() => subtotal * (tipPercent / 100), [subtotal, tipPercent]);
  const total = subtotal + deliveryFee + tip;

  const missingPairings = useMemo(() => {
    const idsInBag = new Set(cartItems.map((ci) => ci.id));
    return suggestedItems.filter((item) => !idsInBag.has(item.id)).slice(0, 2);
  }, [cartItems, suggestedItems]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setValidationError('Adicione pelo menos um item à sacola antes de enviar o pedido.');
      return;
    }

    const isPickup = selectedNeighborhood.id === 'retirada';
    const nextMissing: {
      nome?: boolean;
      whatsapp?: boolean;
      endereco?: boolean;
      bairro?: boolean;
    } = {
      nome: !nome.trim(),
      whatsapp: !whatsapp.trim(),
      bairro: !selectedNeighborhoodId,
      endereco: !isPickup && !endereco.trim(),
    };

    const missingLabels: string[] = [];
    if (nextMissing.nome) missingLabels.push('Nome');
    if (nextMissing.whatsapp) missingLabels.push('WhatsApp');
    if (nextMissing.bairro) missingLabels.push('Bairro');
    if (nextMissing.endereco) missingLabels.push('Endereço/Número');

    if (missingLabels.length > 0) {
      setMissingFields(nextMissing);
      setValidationError(
        `Preencha os campos obrigatórios antes de enviar: ${missingLabels.join(', ')}.`
      );
      return;
    }

    setMissingFields({});
    setValidationError(null);

    const cleanTroco = troco.trim().replace(/^R\$\s*/i, '');
    const paymentLine =
      paymentMethod === 'Dinheiro' && cleanTroco
        ? `*Pagamento:* Dinheiro (Troco para R$ ${cleanTroco})`
        : `*Pagamento:* ${paymentMethod}`;

    const entregaLine = isPickup
      ? `*Entrega:* Retirada no Balcão`
      : `*Entrega:* ${endereco.trim()} - ${selectedNeighborhood.label}`;

    const bairroLine = isPickup
      ? ''
      : `*Bairro:* ${selectedNeighborhood.label}`;

    const itemLines = cartItems.map((ci) => {
      const line = `• ${ci.quantidade}x ${ci.nome} - ${formatBRL(ci.preco * ci.quantidade)}`;
      const obs = ci.observacao.trim();
      return obs ? `${line}\n_Obs: ${obs}_` : line;
    });

    const mensagem = [
      `*NOVO PEDIDO - ${nome.trim()}*`,
      '',
      ...itemLines,
      '',
      entregaLine,
      ...(isPickup ? [bairroLine] : []),
      paymentLine,
      '',
      `Subtotal: ${formatBRL(subtotal)}`,
      `Taxa de Entrega: ${formatBRL(deliveryFee)}`,
      ...(tip > 0 ? [`Gorjeta (${tipPercent}%): ${formatBRL(tip)}`] : []),
      `*TOTAL: ${formatBRL(total)}*`,
    ].join('\n');

    const whatsappUrl = `https://wa.me/${WHATSAPP_LOJA}?text=${encodeURIComponent(mensagem)}`;
    window.open(whatsappUrl, '_blank');

    onPlaceOrder({
      fulfillment: selectedNeighborhood.fulfillment,
      neighborhoodLabel: selectedNeighborhood.label,
      deliveryFee,
      buyer: {
        nome: nome.trim(),
        whatsapp: whatsapp.trim(),
        endereco: endereco.trim(),
        bairro: selectedNeighborhood.label,
      },
      tipPercent,
    });
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-5">
        <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-xl p-8 sm:p-10 space-y-4">
          <h1 className="text-[24px] font-bold tracking-[-0.02em] text-[#1C1B1B]">
            Sua sacola está vazia
          </h1>
          <p className="text-[15px] text-[#5A413A] max-w-md mx-auto">
            Comece escolhendo um dos nossos smash burgers na brasa, fritas rústicas com alecrim ou sodas artesanais.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onBackToMenu}
              className="min-h-[48px] px-6 py-3 rounded-lg bg-[#D3451B] hover:bg-[#B02D00] text-white text-[15px] font-semibold transition-colors cursor-pointer"
            >
              Ver o Cardápio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBackToMenu}
          className="inline-flex items-center gap-2 min-h-[44px] text-[14px] font-semibold text-[#5A413A] hover:text-[#1C1B1B] cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Cardápio</span>
        </button>
        <h1 className="text-[22px] sm:text-[26px] font-bold tracking-[-0.02em] text-[#1C1B1B]">
          Revisar e Finalizar
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" noValidate>
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Entrega e Cálculo de Frete por Bairro */}
          <section className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-xl p-5 space-y-4">
            <h2 className="text-[17px] font-bold text-[#1C1B1B]">
              Entrega e Cálculo de Frete
            </h2>

            {validationError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-[10px] border border-[#BA1A1A] bg-[#FFF8F7] text-[13px] font-medium text-[#BA1A1A]"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="bairro-frete"
                className="block text-[13px] font-semibold text-[#1C1B1B]"
              >
                Bairro / Modalidade de Entrega
              </label>
              <select
                id="bairro-frete"
                value={selectedNeighborhoodId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setSelectedNeighborhoodId(nextId);
                  setMissingFields((prev) => ({
                    ...prev,
                    bairro: false,
                    endereco: nextId === 'retirada' ? false : prev.endereco,
                  }));
                  if (validationError) setValidationError(null);
                }}
                className={`w-full min-h-[44px] px-3.5 py-2.5 bg-[#FFFFFF] border rounded-[10px] text-[14px] text-[#1C1B1B] tabular-nums focus:outline-none ${
                  missingFields.bairro
                    ? 'border-[#BA1A1A] focus:border-[#BA1A1A]'
                    : 'border-[#EAEAEA] focus:border-[#D3451B]'
                }`}
              >
                {NEIGHBORHOOD_FEES.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label} — {formatBRL(option.fee)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label
                  htmlFor="buyer-nome"
                  className="block text-[13px] font-semibold text-[#1C1B1B]"
                >
                  Nome Completo *
                </label>
                <input
                  id="buyer-nome"
                  type="text"
                  value={nome}
                  onChange={(e) => {
                    setNome(e.target.value);
                    if (missingFields.nome) {
                      setMissingFields((prev) => ({ ...prev, nome: false }));
                    }
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="Lucas Almeida"
                  className={`w-full min-h-[44px] px-3.5 py-2.5 bg-[#FFFFFF] border rounded-[10px] text-[14px] text-[#1C1B1B] focus:outline-none ${
                    missingFields.nome
                      ? 'border-[#BA1A1A] bg-[#FFF8F7] focus:border-[#BA1A1A]'
                      : 'border-[#EAEAEA] focus:border-[#D3451B]'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="buyer-whatsapp"
                  className="block text-[13px] font-semibold text-[#1C1B1B]"
                >
                  WhatsApp *
                </label>
                <input
                  id="buyer-whatsapp"
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => {
                    setWhatsapp(e.target.value);
                    if (missingFields.whatsapp) {
                      setMissingFields((prev) => ({ ...prev, whatsapp: false }));
                    }
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="(11) 99123-4567"
                  className={`w-full min-h-[44px] px-3.5 py-2.5 bg-[#FFFFFF] border rounded-[10px] text-[14px] text-[#1C1B1B] focus:outline-none ${
                    missingFields.whatsapp
                      ? 'border-[#BA1A1A] bg-[#FFF8F7] focus:border-[#BA1A1A]'
                      : 'border-[#EAEAEA] focus:border-[#D3451B]'
                  }`}
                />
              </div>
            </div>

            {selectedNeighborhood.fulfillment === 'delivery' && (
              <div className="space-y-1.5">
                <label
                  htmlFor="buyer-endereco"
                  className="block text-[13px] font-semibold text-[#1C1B1B]"
                >
                  Endereço e Número *
                </label>
                <input
                  id="buyer-endereco"
                  type="text"
                  value={endereco}
                  onChange={(e) => {
                    setEndereco(e.target.value);
                    if (missingFields.endereco) {
                      setMissingFields((prev) => ({ ...prev, endereco: false }));
                    }
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="Rua das Flores, 240, Apto 12"
                  className={`w-full min-h-[44px] px-3.5 py-2.5 bg-[#FFFFFF] border rounded-[10px] text-[14px] text-[#1C1B1B] focus:outline-none ${
                    missingFields.endereco
                      ? 'border-[#BA1A1A] bg-[#FFF8F7] focus:border-[#BA1A1A]'
                      : 'border-[#EAEAEA] focus:border-[#D3451B]'
                  }`}
                />
              </div>
            )}
          </section>

          {/* Bag Items */}
          <section className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-xl p-5 space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[17px] font-bold text-[#1C1B1B]">
                Seus Itens
              </h2>
              <button
                type="button"
                onClick={onBackToMenu}
                className="text-[13px] font-semibold text-[#D3451B] hover:underline cursor-pointer"
              >
                + Adicionar Mais Itens
              </button>
            </div>

            <div className="divide-y divide-[#EAEAEA]">
              {cartItems.map((ci) => {
                const summary = formatCartItemSummary(ci);
                return (
                  <div
                    key={ci.cartItemId}
                    className="py-4 first:pt-1 last:pb-1 flex items-start gap-3.5"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#F6F3F2] border border-[#EAEAEA] shrink-0">
                      <ResilientImage
                        src={ci.menuItem.imageUrl}
                        alt={ci.nome}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[15px] font-bold text-[#1C1B1B]">
                          {ci.nome}
                        </h3>
                        <span className="text-[15px] font-bold text-[#1C1B1B] tabular-nums shrink-0">
                          {formatBRL(ci.preco * ci.quantidade)}
                        </span>
                      </div>

                      {summary && (
                        <p className="text-[13px] leading-[1.45] text-[#5A413A]">
                          {summary}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <div className="inline-flex items-center bg-[#F5F5F5] border border-[#EAEAEA] rounded-full p-0.5">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(ci.cartItemId, -1)}
                            aria-label={`Diminuir quantidade de ${ci.nome}`}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[#1A1A1A] hover:bg-[#FFFFFF] cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 text-[13px] font-bold text-[#1C1B1B] tabular-nums">
                            {ci.quantidade}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(ci.cartItemId, 1)}
                            aria-label={`Aumentar quantidade de ${ci.nome}`}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[#1A1A1A] hover:bg-[#FFFFFF] cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onEditItem(ci)}
                          className="text-[13px] font-semibold text-[#5A413A] hover:text-[#1C1B1B] cursor-pointer"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(ci.cartItemId)}
                          aria-label={`Remover ${ci.nome}`}
                          className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#8E7069] hover:text-[#BA1A1A] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remover</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recommended Sides & Drinks */}
          {missingPairings.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-[15px] font-bold text-[#1C1B1B]">
                Complete Seu Pedido
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {missingPairings.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-xl p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#F6F3F2] shrink-0">
                        <ResilientImage
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-[#1C1B1B] truncate">
                          {item.name}
                        </p>
                        <p className="text-[13px] font-bold text-[#5A413A] tabular-nums">
                          {formatBRL(item.price)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onQuickAdd(item)}
                      className="min-h-[38px] px-3 py-1.5 rounded-full bg-[#F5F5F5] hover:bg-[#EAE7E7] border border-[#EAEAEA] text-[12px] font-semibold text-[#1C1B1B] shrink-0 cursor-pointer"
                    >
                      + Incluir
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Totals Summary */}
        <aside className="lg:col-span-5 bg-[#FFFFFF] border border-[#EAEAEA] rounded-xl p-5 sm:p-6 space-y-5 lg:sticky lg:top-24">
          <h2 className="text-[18px] font-bold text-[#1C1B1B]">
            Resumo do Pedido
          </h2>

          {/* Tip Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-semibold text-[#1C1B1B]">Gorjeta para a Cozinha</span>
              <span className="text-[#5A413A] tabular-nums">{formatBRL(tip)}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0, 10, 15, 20].map((pct) => {
                const active = tipPercent === pct;
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setTipPercent(pct)}
                    className={`min-h-[40px] rounded-lg border text-[13px] font-semibold tabular-nums cursor-pointer transition-colors ${
                      active
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                        : 'bg-[#FFFFFF] text-[#1C1B1B] border-[#EAEAEA] hover:border-[#D9D9D9]'
                    }`}
                  >
                    {pct === 0 ? 'Sem' : `${pct}%`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2.5 border-t border-[#EAEAEA] pt-4">
            <span className="block text-[13px] font-semibold text-[#1C1B1B]">
              Forma de Pagamento
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['Pix', 'Cartão', 'Dinheiro'] as PaymentMethod[]).map((method) => {
                const active = paymentMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`min-h-[40px] rounded-lg border text-[13px] font-semibold cursor-pointer transition-colors ${
                      active
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                        : 'bg-[#FFFFFF] text-[#1C1B1B] border-[#EAEAEA] hover:border-[#D9D9D9]'
                    }`}
                  >
                    {method}
                  </button>
                );
              })}
            </div>
            {paymentMethod === 'Dinheiro' && (
              <div className="space-y-1 pt-1">
                <label
                  htmlFor="payment-troco"
                  className="block text-[12px] font-medium text-[#5A413A]"
                >
                  Troco para quanto? (Opcional)
                </label>
                <input
                  id="payment-troco"
                  type="text"
                  value={troco}
                  onChange={(e) => setTroco(e.target.value)}
                  placeholder="Ex: 100,00"
                  className="w-full min-h-[42px] px-3.5 py-2 bg-[#FFFFFF] border border-[#EAEAEA] focus:border-[#D3451B] focus:outline-none rounded-[10px] text-[14px] text-[#1C1B1B]"
                />
              </div>
            )}
          </div>

          <div className="border-t border-[#EAEAEA] pt-4 space-y-2.5 text-[14px]">
            <div className="flex justify-between text-[#5A413A]">
              <span>Subtotal</span>
              <span className="tabular-nums font-medium text-[#1C1B1B]">
                {formatBRL(subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-[#5A413A]">
              <span>Frete ({selectedNeighborhood.label})</span>
              <span className="tabular-nums font-medium text-[#1C1B1B]">
                {formatBRL(deliveryFee)}
              </span>
            </div>
            {tip > 0 && (
              <div className="flex justify-between text-[#5A413A]">
                <span>Gorjeta ({tipPercent}%)</span>
                <span className="tabular-nums font-medium text-[#1C1B1B]">
                  {formatBRL(tip)}
                </span>
              </div>
            )}
            <div className="border-t border-[#EAEAEA] pt-3 flex justify-between text-[17px] font-extrabold text-[#1C1B1B]">
              <span>Total Final</span>
              <span className="tabular-nums">{formatBRL(total)}</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full min-h-[50px] px-6 py-3.5 rounded-lg bg-[#D3451B] hover:bg-[#B02D00] active:scale-[0.98] text-[#FFFFFF] text-[15px] font-bold inline-flex items-center justify-center gap-2 transition-all cursor-pointer tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D3451B]"
          >
            <MessageCircle className="w-4 h-4 shrink-0" strokeWidth={2.2} />
            <span>Enviar Pedido no WhatsApp · {formatBRL(total)}</span>
          </button>

          <p className="text-[12px] text-[#8E7069] text-center">
            Pagamento via Pix, cartão ou dinheiro na retirada e entrega.
          </p>
        </aside>
      </form>
    </div>
  );
}
