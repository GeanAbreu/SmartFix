import { useMemo, useState } from 'react';
import './styles.css';

const devices = [
  { id: 1, name: 'iPhone 13', detail: 'Apple · Smartphone' },
  { id: 2, name: 'Galaxy S23', detail: 'Samsung · Smartphone' },
  { id: 3, name: 'Notebook IdeaPad', detail: 'Lenovo · Notebook' },
];

export default function App() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const filtered = useMemo(() => devices.filter((device) => `${device.name} ${device.detail}`.toLowerCase().includes(query.toLowerCase())), [query]);

  return (
    <main className="devicePage">
      <section className="deviceCard">
        <span className="brand">SmartFix</span>
        <h1>Selecione um dispositivo</h1>
        <p>Escolha qual aparelho precisa de assistência.</p>
        <input aria-label="Buscar dispositivo" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome ou marca" />
        <div className="deviceList">
          {filtered.map((device) => (
            <button key={device.id} className={selected === device.id ? 'selected' : ''} onClick={() => setSelected(device.id)}>
              <strong>{device.name}</strong><span>{device.detail}</span>
            </button>
          ))}
        </div>
        <button className="continue" disabled={selected === null} onClick={() => alert('Dispositivo selecionado para a solicitação.')}>Continuar</button>
      </section>
    </main>
  );
}
