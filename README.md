# Mari e Cauã

Projeto web estático do jogo **Caça ao Contexto**, com interface inspirada nas artes da pasta `Jogar` e foco em estudo por matéria, tema e revisão por caça-palavras.

## Estrutura

```text
Mari e Cauã/
|-- index.html
|-- jogo.html
|-- configuracoes.html
|-- serve.ps1
|-- css/
|   `-- style.css
`-- js/
    |-- app-data.js
    |-- menu.js
    |-- settings.js
    `-- game.js
```

## Páginas

- `index.html`: tela inicial e seleção de matéria/tema.
- `configuracoes.html`: ajustes de aparência, dificuldade, modo, grade, som e pistas.
- `jogo.html`: tela principal do caça-palavras com progresso, pontuação e conteúdo desbloqueado.

## Scripts

- `js/app-data.js`: dados do jogo, matérias, temas, palavras e persistência local.
- `js/menu.js`: fluxo da tela inicial, escolha de matéria e seleção de tema.
- `js/settings.js`: controle das opções e presets.
- `js/game.js`: lógica do tabuleiro, seleção de palavras, pontuação, progresso e modal de descoberta.

## Estilo

- Tema `light`: fundo azul com botões vermelhos, inspirado nas telas claras de referência.
- Tema `dark`: fundo preto com botões e cards claros, inspirado nas telas escuras de referência.
- O tema visual é salvo localmente junto com as demais configurações da rodada.

## Como rodar

### Opção 1

Abra `index.html` diretamente no navegador.

### Opção 2

Use o servidor local incluído:

```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```

Depois abra:

```text
http://127.0.0.1:54821/index.html
```

## Funcionalidades

- seleção de matéria e tema
- tema claro e escuro
- presets de estudo
- múltiplos modos de jogo
- grade configurável
- sistema de pontuação
- pista com penalidade
- palavras desbloqueadas com curiosidades
- salvamento local de progresso e resultados

## Validação feita

- conferência manual da estrutura de arquivos
- smoke test local do servidor retornando `200` para páginas, CSS e JS principais
- revisão dos vínculos entre HTML, CSS e scripts

## Observações

- O projeto é estático e não depende de build.
- O progresso fica salvo no navegador por `localStorage`, `sessionStorage` ou `window.name` como fallback.
