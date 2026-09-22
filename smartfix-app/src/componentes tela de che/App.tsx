import { Checkout } from './pages/Checkout/Checkout';

/**
 * No projeto completo, esta página é renderizada pela rota
 * `/solicitar-servico` (última etapa) através do React Router.
 * Aqui ela é montada diretamente para fins de demonstração.
 */
export default function App() {
  return (
    <Checkout
      onBack={() => console.log('Voltar para a etapa de endereço')}
      onPaymentConfirmed={() => console.log('Navegar para /ordens/:id')}
    />
  );
}
