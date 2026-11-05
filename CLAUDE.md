# Fade District — réservation + espace barbier (démo)

Responda sempre em português, de forma direta. Os textos do site são em francês.

## Contexto

Fade District é um **projeto conceitual** da Olix Studio: um barbeiro premium fictício em Genebra, já publicado em https://fadedistrict1.netlify.app.
- **Stack:** Vite e JavaScript puro, com Three.js no hero.
- **Dados:** os serviços estão em `src/data/services.js`, com nome, descrição, `minutes` e `price`.
- **Visual:** preto, carvão, prata e acentos dourado-champanhe. Tokens em `src/styles/tokens.css`.

Agora vamos acrescentar **um sistema de reserva por horário e um painel para o barbeiro**, inspirado no fluxo de 4 passos do Easy!Appointments (ex.: wornbarber.com/appointments), mas **com o visual do Fade District**.

Ele serve para a Olix mostrar a donos de barbearia como o sistema funcionaria. Por isso, é uma **DEMONSTRAÇÃO sem servidor**: os dados ficam só no navegador de quem testa. Nada é enviado.

## Regra número 1

O design atual está aprovado. As páginas novas seguem exatamente os mesmos tokens, fontes, botões, espaçamentos e animações. Não redesenhe o que existe.

## Mudanças no site atual

- **Remover todos os botões e links para ligar** (`tel:`) e o telefone em destaque. A reserva passa a ser o único caminho.
- Todos os CTA « Réserver » levam para `reserver.html`.
- Os horários de abertura saem do HTML e vão para `src/data/hours.js`, a fonte única usada pela tabela de horários **e** pela reserva. A tabela da página continua com a mesma aparência.
- Adicionar `reserver.html` e `admin.html` no `vite.config.js`.

## Página de reserva (`reserver.html`), em 4 passos

Indicador 1-2-3-4 no topo. Botões « Retour » e « Suivant » fixos embaixo no celular.

1. **Prestation et barbier**
   - Serviços agrupados por categoria, de `services.js`, com duração e preço.
   - Dois barbeiros fictícios (ex.: « Karim » e « Léo ») e a opção « Peu importe ». Nesse caso o sistema escolhe quem estiver livre.
2. **Date et heure**
   - Calendário do mês: dias passados e fechados desativados, até 30 dias à frente.
   - Embaixo, a grade de horários livres, em intervalos de 15 min, levando em conta a duração do serviço, os horários de abertura, as marcações existentes e os bloqueios.
   - Horários com menos de 2 h de antecedência não aparecem. Fuso `Europe/Zurich`.
3. **Vos informations:** prénom, nom, téléphone (obrigatório), e-mail (obrigatório) e remarque (opcional). Validação clara, campos com 16 px.
4. **Confirmation**
   - Resumo com serviço, barbeiro, data, hora, duração e preço, e o botão « Confirmer ».
   - Depois, tela de sucesso com:
     - « Ajouter à mon calendrier » (download de um arquivo .ics);
     - a frase « Dans la version réelle, vous recevriez un e-mail de confirmation et un rappel la veille. »

## Painel do barbeiro (`admin.html`)

- **Login:** a tela mostra a senha da demo (« demo ») e explica que, na versão real, cada barbeiro tem um acesso próprio e seguro. Adicionar `<meta name="robots" content="noindex">`.
- **Agenda:**
  - visão Jour e visão Semaine, com filtro por barbeiro;
  - cada marcação mostra hora, cliente, serviço, duração, telefone e remarque;
  - no celular, a agenda do dia é uma lista por hora, fácil de usar com uma mão.
- **Ações numa marcação:** Annuler, Marquer comme fait e Absent (no-show). Sem `confirm()` do navegador: usar uma confirmação dentro da página.
- **Bloquer un créneau:** pausa, folga ou férias, por barbeiro, com início e fim.
- **No topo do dia:** número de marcações e total previsto em CHF.
- **Clients:** lista com busca, número de visitas e última visita.
- **Botão « Réinitialiser la démo »:** volta aos dados iniciais.

## Modo apresentação

Para a Olix demonstrar o fluxo completo rapidamente (site → reserva → painel) sem fricção:

- **Tela de sucesso da reserva:** botão só da demo « Voir ce rendez-vous côté barbier → ». Leva a `admin.html?date=AAAA-MM-DD&rdv=<id>`, que abre direto no painel (sem pedir senha), já no dia certo, com a marcação destacada (animação curta, desligada com `prefers-reduced-motion`) e a página rolada até ela.
- **Login do painel:** botão « Entrer en mode démo » (1 toque), com a senha « demo » como alternativa abaixo.
- **Painel:** link « Voir le site client » para voltar ao site, e « Réinitialiser la démo » visíveis sem rolar, logo no topo.
- **Rodapé do site** (`index.html`, `services.html`, `reserver.html`): link discreto « Espace barbier (démo) » → `admin.html`.
- **Passo 3 da reserva:** link discreto « Remplir un exemple », que preenche nome, telefone e e-mail claramente fictícios (ex.: Camille Exemple).
- **Links curtos** (`public/_redirects`, rewrite 200): `/reserver` → `/reserver.html`, `/barbier` → `/admin.html`.
- `reserver.html` nunca carrega o bundle do Three.js do hero (confirme nos assets do build).

## Dados

- Toda leitura e escrita passa por `src/js/booking/store.js`, com funções **assíncronas** (Promise): `listAppointments`, `createAppointment`, `updateAppointment`, `listBlocks`, `createBlock`, `listClients`, `resetDemo`. Assim depois troca-se o localStorage pelo Supabase sem mexer nas telas.
- **Demo:**
  - Os dados ficam em `localStorage`, sob uma chave versionada (`fd-demo-v1`), sempre com try/catch. Se o localStorage falhar, funciona em memória.
  - Já vêm cerca de 20 marcações fictícias espalhadas pela semana atual, calculadas a partir da data de hoje, com nomes claramente fictícios.
- **Regras:**
  - **Nunca** dois clientes no mesmo horário com o mesmo barbeiro. Verifique de novo no momento de confirmar.
  - Nunca marcações fora do horário de abertura ou em cima de um bloqueio.
- O cálculo de horários livres fica em `src/js/booking/slots.js`, com funções puras, testadas com casos de borda: fim do dia, serviço longo de 120 min, dia fechado, bloqueio no meio.

## Honestidade e privacidade

- Selo visível nas duas páginas: « Démonstration · aucune donnée n'est envoyée ».
- O site continua identificado como « Projet conceptuel · Olix Studio ».
- Na versão real (não agora): página de privacidade (nLPD), dados na Suíça ou na UE, acesso com login de verdade e exclusão de marcações antigas. Isso fica escrito no README, numa seção « Passer en production ».

## Qualidade

- **Perfeito no iPhone:** teste em 320, 375, 390 e 430 px e no iPhone SE, sem rolagem lateral, com áreas de toque de 44 px e safe areas.
- **Acessibilidade:** navegação por teclado no calendário e na grade de horários, `aria-pressed` e `aria-current` nas escolhas, foco visível e mensagens de erro ligadas aos campos.
- **`prefers-reduced-motion` respeitado.**
- Siga a skill **olix-web-quality**, se estiver instalada (`~/.claude/skills/olix-web-quality`).

## Como trabalhar

1. **Plano:** estrutura dos arquivos, telas e regras de horário. Espere minha aprovação.
2. **Reserva:** os 4 passos completos, com capturas em 390 px e 1280 px. Espere aprovação.
3. **Painel:** login, agenda, ações, bloqueios e clientes, com capturas. Espere aprovação.
4. **Testes e publicação:**
   - casos de borda dos horários;
   - teste de reserva duplicada;
   - reload sem perder dados;
   - console sem erros;
   - depois, commit, push e publicação.

Nunca diga que um teste passou sem ter rodado.
