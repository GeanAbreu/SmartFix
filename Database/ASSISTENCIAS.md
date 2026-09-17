# Busca de assistências (RF06)

A tela `/cliente/assistencias` está disponível pelo menu do cliente e pela triagem
de uma nova ordem. Usa a tabela física `partner` (nome singular no banco), somente
com `is_approved = true`, e o endereço principal de `client_addresses`.

- Origem inicial: endereço principal do cliente. É possível trocar por outro endereço,
  CEP/cidade ou localização do navegador, solicitada apenas ao tocar no botão.
- Raio inicial de 10 km, ajustável para 5, 25, 50 ou 100 km. A distância usa Haversine,
  em linha reta, sem arredondamento antes do filtro. Os resultados são ordenados por proximidade.
- Coordenadas dos CEPs: BrasilAPI CEP v2. São posições aproximadas da área do CEP,
  não coordenadas confirmadas da porta do estabelecimento. Uma cidade usa seu centro.
  A tela identifica essas aproximações. Não se inventa posição quando o provedor não a encontra.
- Nota: média e quantidade de todas as avaliações em `reviews`. Sem registros,
  mostra “Sem avaliações”. O perfil exibe até 10 avaliações recentes, sem identificar clientes.
- Lista e mapa usam o mesmo conjunto de resultados. Pinos numerados abrem o perfil.
- Solicitar reparo encaminha a assistência e o aparelho para a triagem. Sem aparelho,
  encaminha ao cadastro e retorna ao perfil escolhido depois de salvar.
- O rascunho de triagem e a região de retorno são guardados em `sessionStorage`,
  com chaves separadas por conta, e não geram ordem até o envio explícito do formulário.

## Integrações e operação

As rotas `/api/partners/nearby` e `/api/locations` usam POST para não colocar a origem
da busca nos URLs. Exigem sessão de cliente válida, validam coordenadas/raio e
resolvem endereços cadastrados somente com `client_id` da sessão. O RLS existente
permanece ativo; o acesso ao banco continua exclusivamente pelo servidor autenticado.
Não são necessárias migrations nem novas colunas.

A geocodificação envia somente CEP ou consulta de cidade; nunca envia identificador
de conta, nome do cliente, número do imóvel ou complemento. O servidor deduplica
consultas, usa cache de 24 horas e uma fila de chamadas externas com timeout.
Falhas de localização de parceiros são informadas na tela, sem esconder a lista válida.

O [Photon público](https://github.com/komoot/photon#demo-server) permite uso moderado,
sem garantia de disponibilidade. Para crescimento, troque `PHOTON_API_URL` por uma
instância própria ou serviço compatível. O mapa usa Leaflet e tiles OpenStreetMap,
com atribuição visível e cache do navegador, sem pré-download ou modo offline.
Observe a [política de tiles](https://operations.osmfoundation.org/policies/tiles/).
`NEXT_PUBLIC_MAP_TILE_URL` permite trocar um provedor XYZ compatível mediante novo build;
ao mudar o fornecedor, confira também a atribuição exigida por ele.

Geolocalização do navegador requer HTTPS em produção (localhost funciona para testes)
e autorização do próprio cliente. `Permissions-Policy` permite `geolocation=(self)`.
O usuário pode continuar por CEP/endereço quando a permissão for recusada.

## Validação

`npm test` inclui distância, limites, cache, aprovação, raio e isolamento de endereço.
Execute também `npm run lint` e `npm run build`. Para resultados reais, aprove o parceiro
pelo fluxo administrativo existente e mantenha o CEP de seu endereço atualizado.
Nunca aprove contas automaticamente apenas para preencher a lista.
