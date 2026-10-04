import { useMemo, useState } from 'react';

const SERVICE_PRICE = 180;

export default function App() {
  const [payment, setPayment] = useState<'pix' | 'card'>('pix');
  const [coupon, setCoupon] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const discount = useMemo(() => coupon.trim().toUpperCase() === 'SMART10' ? SERVICE_PRICE * 0.1 : 0, [coupon]);

  if (confirmed) {
    return (
      <main className="page">
        <section className="card success">
          <span className="successIcon">✓</span>
          <h1>Pagamento confirmado</h1>
          <p>A solicitação foi registrada. Acompanhe o reparo pela área do cliente.</p>
          <button onClick={() => setConfirmed(false)}>Voltar ao checkout</button>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="card">
        <header>
          <span className="eyebrow">SmartFix</span>
          <h1>Revisão do serviço</h1>
          <p>Confira os dados antes de confirmar o pagamento.</p>
        </header>
        <div className="summary">
          <div><span>Dispositivo</span><strong>Smartphone</strong></div>
          <div><span>Serviço</span><strong>Diagnóstico e reparo</strong></div>
          <div><span>Assistência</span><strong>SmartFix Centro</strong></div>
        </div>
        <label className="field">
          Cupom de desconto
          <input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="Use SMART10" />
        </label>
        <fieldset>
          <legend>Forma de pagamento</legend>
          <label><input type="radio" checked={payment === 'pix'} onChange={() => setPayment('pix')} /> PIX</label>
          <label><input type="radio" checked={payment === 'card'} onChange={() => setPayment('card')} /> Cartão</label>
        </fieldset>
        <div className="total">
          <span>Total</span>
          <strong>{(SERVICE_PRICE - discount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
        </div>
        {discount > 0 && <p className="discount">Desconto SMART10 aplicado.</p>}
        <button onClick={() => setConfirmed(true)}>Confirmar com {payment === 'pix' ? 'PIX' : 'cartão'}</button>
      </section>
    </main>
  );
}
