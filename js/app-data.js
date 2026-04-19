(function () {
    const STORAGE_KEY = "caca-contexto-v6";
    const WINDOW_NAME_PREFIX = "__caca_contexto_store__:";

    const DEFAULT_SETTINGS = {
        skin: "light",
        difficulty: "medium",
        mode: "classic",
        gridSize: 12,
        sound: "on",
        assist: "smart"
    };

    const DIFFICULTIES = {
        easy: { name: "Fácil", multiplier: 1, directions: ["right", "down"] },
        medium: { name: "Médio", multiplier: 1.35, directions: ["right", "down", "diag-down", "diag-up"] },
        hard: { name: "Difícil", multiplier: 1.8, directions: ["right", "left", "down", "up", "diag-down", "diag-up", "diag-back", "diag-back-up"] },
        expert: { name: "Expert", multiplier: 2.3, directions: ["right", "left", "down", "up", "diag-down", "diag-up", "diag-back", "diag-back-up"] }
    };

    const MODES = {
        classic: { name: "Clássico", description: "Rodada padrão, focada em jogar e revisar." },
        timed: { name: "Contra o tempo", description: "Cronômetro regressivo para pressionar a leitura." },
        relax: { name: "Relaxante", description: "Sem pressão e com foco em absorver o conteúdo." },
        progressive: { name: "Progressivo", description: "Grade maior e mais direções para a seleção." },
        surprise: { name: "Tema surpresa", description: "O tema é sorteado dentro da matéria escolhida." }
    };

    const VECTORS = {
        right: { row: 0, col: 1 },
        left: { row: 0, col: -1 },
        down: { row: 1, col: 0 },
        up: { row: -1, col: 0 },
        "diag-down": { row: 1, col: 1 },
        "diag-up": { row: -1, col: 1 },
        "diag-back": { row: 1, col: -1 },
        "diag-back-up": { row: -1, col: -1 }
    };
    const VALID_GRID_SIZES = [10, 12, 15, 18];

    function word(term, label, title, curiosity, enem, category) {
        return {
            term,
            label,
            title,
            curiosity,
            enem: enem.split("|"),
            category
        };
    }

    function theme(id, name, summary, words) {
        return { id, name, summary, words };
    }

    const SUBJECTS = [
        {
            id: "history",
            name: "História",
            icon: "🏛️",
            description: "A matéria mais completa, com temas fortes para ENEM.",
            themes: [
                theme("egito-antigo", "Egito Antigo", "Poder, religião e território no mundo egípcio.", [
                    word("CLEOPATRA", "Cleópatra", "A rainha que usou alianças como arma política", "Cleópatra tentou preservar a autonomia do Egito negociando com líderes romanos. Mais do que romance famoso, isso ajuda a entender diplomacia, poder e disputa no Mediterrâneo antigo.", "expansão romana|relações entre Egito e Roma", "Poder"),
                    word("NILO", "Nilo", "O rio que organizava a vida egípcia", "O Nilo garantia agricultura regular e sustentava a base econômica do Egito. Sem ele, o poder central egípcio seria bem mais frágil.", "economia agrária antiga|sociedade hidráulica", "Território"),
                    word("FARAO", "Faraó", "Rei e autoridade sagrada ao mesmo tempo", "O faraó reunia poder político e religioso, mostrando como o Estado egípcio ligava governo, crença e estabilidade social.", "teocracia|centralização política", "Política"),
                    word("PIRAMIDE", "Pirâmide", "Monumento que também revela desigualdade", "As pirâmides falam de religião, mas também mostram um Estado capaz de concentrar trabalho, recursos e poder simbólico.", "hierarquia social|religiosidade egípcia", "Sociedade"),
                    word("HIEROGLIFO", "Hieróglifo", "Escrita também era ferramenta de controle", "Hieróglifos não serviam só para decorar paredes. Eles ajudavam na administração, na religião e no poder estatal.", "escrita e poder|administração antiga", "Cultura")
                ]),
                theme("grecia-antiga", "Grécia Antiga", "Cidadania, pólis e diferentes modelos de cidade.", [
                    word("ATENAS", "Atenas", "A democracia famosa tinha muitas exclusões", "Atenas é lembrada pela democracia, mas mulheres, estrangeiros e escravizados ficavam fora da cidadania. Esse limite cai bastante em prova.", "democracia ateniense|limites da cidadania", "Política"),
                    word("ESPARTA", "Esparta", "A cidade que organizou a sociedade pela guerra", "Esparta priorizava disciplina e militarização, mostrando que a Grécia Antiga tinha modelos bem diferentes de organização social.", "militarização|diversidade das pólis", "Sociedade"),
                    word("DEMOCRACIA", "Democracia", "Uma ideia antiga, mas bem diferente da atual", "Na Atenas clássica, democracia significava participação direta de uma parte restrita dos homens livres. Isso ajuda a evitar comparação simplista com o presente.", "origem da democracia|comparação entre épocas", "Política"),
                    word("POLIS", "Pólis", "A cidade-Estado era o centro da vida grega", "A pólis concentrava identidade, política e pertencimento. Por trás dessa palavra está a chave para entender a fragmentação política grega.", "cidade-Estado|organização política grega", "Território"),
                    word("SOCRATES", "Sócrates", "Questionar a cidade custou caro", "Sócrates foi condenado em Atenas e seu caso ajuda a conectar filosofia, vida pública e conflitos políticos na Grécia.", "filosofia grega|vida política ateniense", "Cultura")
                ]),
                theme("roma-antiga", "Roma Antiga", "República, crise política e formação do império.", [
                    word("SENADO", "Senado", "A elite falava em república, mas mandava muito", "O Senado concentrava influência aristocrática e é essencial para entender a política romana sem idealização.", "república romana|elite patrícia", "Política"),
                    word("CESAR", "César", "Prestígio militar virou crise institucional", "Júlio César acumulou poder demais e sua trajetória mostra como guerra externa podia desestabilizar a política interna romana.", "crise da República|militarização do poder", "Poder"),
                    word("AUGUSTO", "Augusto", "O império nasceu com aparência de continuidade", "Augusto concentrou poder mantendo parte da aparência republicana. Isso ajuda a entender a transição sem simplificar demais.", "formação do Império|transição política romana", "Política"),
                    word("REPUBLICA", "República", "Roma não era democracia plena", "A República Romana tinha instituições, mas o peso das elites era grande. A palavra ajuda a revisar participação política com cuidado.", "instituições romanas|participação política", "Política"),
                    word("PLEBEUS", "Plebeus", "Conflito social também fez Roma mudar", "A pressão plebeia abriu espaço para mudanças legais e mostra que Roma não foi feita apenas por generais e imperadores.", "lutas sociais em Roma|Lei das Doze Tábuas", "Sociedade")
                ]),
                theme("revolucao-francesa", "Revolução Francesa", "Crise do Antigo Regime e radicalização política.", [
                    word("BASTILHA", "Bastilha", "Símbolo mais forte que a própria prisão", "A tomada da Bastilha vale muito pelo impacto simbólico. Ela condensou medo popular, revolta e crise do absolutismo.", "início da Revolução Francesa|simbolismo político", "Política"),
                    word("JACOBINOS", "Jacobinos", "A ala que empurrou a revolução para o radical", "Os jacobinos aparecem quando o assunto é radicalização, mobilização popular e período do Terror.", "radicalização revolucionária|convenção nacional", "Política"),
                    word("ROBESPIERRE", "Robespierre", "Virtude revolucionária e repressão lado a lado", "Robespierre virou símbolo da violência política usada para defender a revolução.", "Período do Terror|lideranças revolucionárias", "Poder"),
                    word("GUILHOTINA", "Guilhotina", "Ferramenta de execução e marca do Terror", "A guilhotina ajuda a lembrar que a revolução abriu novos horizontes, mas também viveu forte repressão.", "Terror jacobino|violência política", "Política"),
                    word("REPUBLICA", "República", "A ruptura foi maior que a troca de governante", "Com a república, o debate sobre soberania ganhou peso novo e ajuda a ligar revolução, cidadania e fim do Antigo Regime.", "fim do absolutismo|soberania popular", "Política")
                ]),
                theme("era-vargas", "Era Vargas", "Industrialização, propaganda e controle estatal no Brasil.", [
                    word("VARGAS", "Vargas", "Modernização e controle na mesma figura", "Getúlio Vargas ampliou o papel do Estado e dialogou com trabalhadores, mas também concentrou poder. Essa mistura aparece muito no ENEM.", "Era Vargas|Estado e sociedade", "Política"),
                    word("CLT", "CLT", "Direitos vieram junto com enquadramento", "A CLT ampliou direitos, mas também reforçou o controle do Estado sobre sindicatos. O ponto importante é fugir da leitura simplista.", "legislação trabalhista|trabalhismo", "Sociedade"),
                    word("ESTADONOVO", "Estado Novo", "Autoritarismo com linguagem nacionalista", "No Estado Novo houve censura, centralização e propaganda oficial, o que ajuda a revisar autoritarismo no Brasil do século XX.", "ditadura varguista|centralização política", "Poder"),
                    word("POPULISMO", "Populismo", "A imagem do líder também fazia política", "A construção da relação direta com massas urbanas ajuda a discutir populismo no contexto brasileiro.", "populismo|propaganda política", "Política"),
                    word("INDUSTRIA", "Indústria", "Industrializar virou projeto de Estado", "A Era Vargas fortaleceu a industrialização e mudou o peso do Estado na economia brasileira.", "industrialização brasileira|intervenção estatal", "Economia")
                ]),
                theme("guerra-fria", "Guerra Fria", "Bipolaridade, alianças e disputas de influência.", [
                    word("OTAN", "OTAN", "Aliança militar de um dos blocos", "A OTAN simboliza a lógica de alianças e a militarização da Guerra Fria.", "blocos de poder|Guerra Fria", "Política"),
                    word("BERLIM", "Berlim", "A cidade que virou fronteira ideológica", "Berlim resume bem a divisão entre capitalismo e socialismo no pós-guerra.", "mundo bipolar|divisão da Alemanha", "Território"),
                    word("CUBA", "Cuba", "Uma ilha pequena com impacto enorme", "A Revolução Cubana e a crise dos mísseis colocaram a ilha no centro da disputa global.", "Revolução Cubana|crise dos mísseis", "Política"),
                    word("ESPIONAGEM", "Espionagem", "Conflito sem guerra aberta não era paz", "A espionagem foi central porque a Guerra Fria também era guerra por informação e tecnologia.", "disputa tecnológica|guerra de informação", "Poder"),
                    word("BIPOLARIDADE", "Bipolaridade", "Dois polos organizaram a ordem mundial", "A bipolaridade ajuda a entender por que tantos conflitos locais foram lidos pela lógica EUA x URSS.", "ordem mundial pós-1945|blocos ideológicos", "Política")
                ])
            ]
        },
        {
            id: "geography",
            name: "Geografia",
            icon: "🗺️",
            description: "Espaço, território e leitura de mundo.",
            themes: [
                theme("clima-e-territorio", "Clima e Território", "Natureza, espaço e ocupação do território.", [
                    word("CLIMA", "Clima", "O padrão que organiza paisagens e atividades", "Clima influencia agricultura, ocupação humana e dinâmica ambiental, sendo importante para interpretar espaço geográfico.", "climatologia|paisagens", "Natureza"),
                    word("RELEVO", "Relevo", "A forma do terreno muda circulação e uso do espaço", "Relevo interfere em transporte, urbanização e ocupação do território, aparecendo em leitura de mapas e paisagens.", "geomorfologia|ocupação do território", "Natureza"),
                    word("FRONTEIRA", "Fronteira", "Linha política, mas também zona de tensão", "Fronteiras não são só traços no mapa. Elas envolvem circulação, controle e disputas de poder.", "território|geopolítica", "Território"),
                    word("URBANIZACAO", "Urbanização", "Cidade crescendo muda tudo ao redor", "Urbanização reorganiza trabalho, moradia, circulação e desigualdade, tema constante em prova.", "urbanização|rede urbana", "Sociedade")
                ])
            ]
        },
        {
            id: "philosophy",
            name: "Filosofia",
            icon: "🧠",
            description: "Ideias, ética e reflexão crítica.",
            themes: [
                theme("etica-e-politica", "Ética e Política", "Pensamento crítico e vida em sociedade.", [
                    word("ETICA", "Ética", "Refletir sobre ação humana e responsabilidade", "Ética ajuda a discutir escolhas, valores e responsabilidade na vida em sociedade.", "ética|ação humana", "Pensamento"),
                    word("RAZAO", "Razão", "Pensar com método mudou o debate filosófico", "A ideia de razão aparece em vários autores e ajuda a entender como se constrói conhecimento crítico.", "racionalismo|conhecimento", "Pensamento"),
                    word("POLITICA", "Política", "A vida coletiva também é campo filosófico", "Filosofia política discute poder, justiça e organização da vida comum.", "filosofia política|Estado", "Sociedade"),
                    word("LIBERDADE", "Liberdade", "Tema central em ética e política", "A liberdade aparece em debates sobre autonomia, poder e responsabilidade.", "liberdade|autonomia", "Pensamento")
                ])
            ]
        },
        {
            id: "sociology",
            name: "Sociologia",
            icon: "👥",
            description: "Sociedade, cultura e desigualdade.",
            themes: [
                theme("sociedade-e-cultura", "Sociedade e Cultura", "Relações sociais e leitura crítica do cotidiano.", [
                    word("CULTURA", "Cultura", "O jeito de viver também é construção social", "Cultura envolve valores, símbolos e práticas aprendidas socialmente.", "cultura|identidade", "Sociedade"),
                    word("TRABALHO", "Trabalho", "Produzir também organiza relações sociais", "Trabalho ajuda a discutir desigualdade, consumo e organização da vida moderna.", "trabalho|sociedade industrial", "Sociedade"),
                    word("DESIGUALDADE", "Desigualdade", "A sociedade distribui recursos de forma desigual", "Desigualdade social aparece em renda, acesso a direitos e oportunidades.", "desigualdade social|cidadania", "Sociedade"),
                    word("IDENTIDADE", "Identidade", "Pertencer também é processo social", "Identidade é construída em relações sociais, culturais e históricas.", "identidade|grupos sociais", "Cultura")
                ])
            ]
        },
        {
            id: "literature",
            name: "Literatura",
            icon: "📚",
            description: "Movimentos literários e leitura de texto.",
            themes: [
                theme("movimentos-literarios", "Movimentos Literários", "Estilo, época e linguagem.", [
                    word("ROMANTISMO", "Romantismo", "Emoção, nacionalismo e subjetividade", "O romantismo valorizou sentimento, natureza e idealização, muito cobrado em leitura literária.", "romantismo|subjetividade", "Escola literária"),
                    word("REALISMO", "Realismo", "Menos idealização e mais crítica social", "O realismo buscou observar a sociedade de modo mais crítico e analítico.", "realismo|crítica social", "Escola literária"),
                    word("MODERNISMO", "Modernismo", "Ruptura estética e linguagem brasileira", "O modernismo quebrou padrões antigos e buscou uma linguagem mais brasileira e experimental.", "modernismo|ruptura estética", "Escola literária"),
                    word("METAFORA", "Metáfora", "Figura de linguagem que muda o sentido", "A metáfora é chave para interpretação de texto e leitura de poesia.", "figuras de linguagem|interpretação", "Linguagem")
                ])
            ]
        },
        {
            id: "portuguese",
            name: "Português",
            icon: "✍️",
            description: "Leitura, gramática e interpretação.",
            themes: [
                theme("linguagem-e-texto", "Linguagem e Texto", "Gramática ligada à interpretação.", [
                    word("COESAO", "Coesão", "Texto se liga por dentro", "Coesão organiza as partes do texto e é decisiva para interpretação.", "coesão textual|interpretação", "Texto"),
                    word("COERENCIA", "Coerência", "Sentido geral importa mais do que frase solta", "Coerência é a lógica interna do texto e aparece bastante em análise de leitura.", "coerência textual|sentido", "Texto"),
                    word("ARGUMENTO", "Argumento", "Defender ideia exige estrutura", "Argumentação ajuda a entender artigos, redação e textos opinativos.", "argumentação|gêneros textuais", "Texto"),
                    word("VARIACAO", "Variação", "A língua muda conforme contexto e grupo", "Variação linguística é importante para leitura crítica e combate ao preconceito linguístico.", "variação linguística|uso da língua", "Linguagem")
                ])
            ]
        },
        {
            id: "biology",
            name: "Biologia",
            icon: "🧬",
            description: "Vida, corpo e ambiente.",
            themes: [
                theme("corpo-e-vida", "Corpo e Vida", "Bases biológicas que caem muito no ENEM.", [
                    word("CELULA", "Célula", "A unidade básica da vida", "A célula é base para entender tecidos, genética e metabolismo.", "citologia|organização dos seres vivos", "Vida"),
                    word("DNA", "DNA", "A molécula que guarda informação genética", "DNA é central para hereditariedade, mutação e biotecnologia.", "genética|hereditariedade", "Genética"),
                    word("MITOSE", "Mitose", "Dividir também é crescer e renovar", "Mitose ajuda a entender crescimento, reposição celular e manutenção dos tecidos.", "divisão celular|crescimento", "Genética"),
                    word("ECOLOGIA", "Ecologia", "Vida e ambiente não se separam", "Ecologia conecta cadeias alimentares, impactos ambientais e equilíbrio dos ecossistemas.", "ecologia|relações ecológicas", "Ambiente")
                ])
            ]
        },
        {
            id: "chemistry",
            name: "Química",
            icon: "⚗️",
            description: "Matéria, reações e aplicações.",
            themes: [
                theme("quimica-geral", "Química Geral", "Conceitos básicos para interpretar fenômenos.", [
                    word("ATOMO", "Átomo", "Entender a matéria começa por aqui", "Átomo é base para explicar modelos atômicos, ligações e transformações químicas.", "estrutura da matéria|modelos atômicos", "Matéria"),
                    word("LIGACAO", "Ligação", "Átomos se conectam por estabilidade", "Ligações químicas explicam por que substâncias têm propriedades tão diferentes.", "ligações químicas|propriedades da matéria", "Matéria"),
                    word("ACIDO", "Ácido", "Não é só algo que corrói", "Ácidos aparecem em pH, reações e equilíbrio químico, quase sempre em situações do cotidiano.", "ácidos e bases|pH", "Reação"),
                    word("REACAO", "Reação", "Transformar matéria é reorganizar ligações", "Reação química é ideia base para entender transformação e conservação da matéria.", "reações químicas|transformações", "Reação")
                ])
            ]
        },
        {
            id: "physics",
            name: "Física",
            icon: "⚙️",
            description: "Movimento, energia e interpretação de fenômenos.",
            themes: [
                theme("movimento-e-energia", "Movimento e Energia", "Conteúdos clássicos com leitura contextualizada.", [
                    word("FORCA", "Força", "Interação que altera movimento", "Força é central em dinâmica e ajuda a interpretar aceleração, equilíbrio e movimento.", "dinâmica|leis de Newton", "Mecânica"),
                    word("ENERGIA", "Energia", "Transformações aparecem em todo lugar", "Energia liga mecânica, calor e eletricidade, sempre em processos de transformação.", "transformação de energia|trabalho", "Mecânica"),
                    word("INERCIA", "Inércia", "Corpos resistem à mudança", "Inércia é uma das chaves das leis de Newton e aparece muito em situações do cotidiano.", "primeira lei de Newton|movimento", "Mecânica"),
                    word("VELOCIDADE", "Velocidade", "Mais que fórmula, é leitura de movimento", "Velocidade é assunto constante em cinemática e gráficos.", "cinemática|gráficos de movimento", "Mecânica")
                ])
            ]
        },
        {
            id: "math",
            name: "Matemática",
            icon: "📐",
            description: "Funções, porcentagens e leitura de dados.",
            themes: [
                theme("funcoes-e-porcentagem", "Funções e Porcentagem", "Modelagem e interpretação numérica.", [
                    word("FUNCAO", "Função", "Relação entre grandezas", "Função ajuda a modelar situações e interpretar variações no mundo real.", "funções|interpretação de problemas", "Álgebra"),
                    word("GRAFICO", "Gráfico", "Ler imagem matemática é metade da questão", "Gráfico mostra tendência, crescimento e comparação, algo muito cobrado no ENEM.", "leitura de gráficos|interpretação de dados", "Álgebra"),
                    word("PORCENTAGEM", "Porcentagem", "Ferramenta simples e estratégica", "Porcentagem aparece em juros, descontos e indicadores sociais.", "razão e proporção|porcentagem", "Aritmética"),
                    word("EQUACAO", "Equação", "Organizar relações em linguagem matemática", "Equações ajudam a encontrar valores desconhecidos e aparecem em vários contextos.", "equações|modelagem matemática", "Álgebra")
                ])
            ]
        }
    ];

    function readWebStorage(storageName) {
        try {
            const storage = window[storageName];
            return storage ? storage.getItem(STORAGE_KEY) : null;
        } catch (error) {
            return null;
        }
    }

    function writeWebStorage(storageName, raw) {
        try {
            const storage = window[storageName];
            if (!storage) {
                return false;
            }

            storage.setItem(STORAGE_KEY, raw);
            return true;
        } catch (error) {
            return false;
        }
    }

    function readWindowNameStore() {
        try {
            if (typeof window.name !== "string" || !window.name.startsWith(WINDOW_NAME_PREFIX)) {
                return null;
            }

            return window.name.slice(WINDOW_NAME_PREFIX.length);
        } catch (error) {
            return null;
        }
    }

    function writeWindowNameStore(raw) {
        try {
            window.name = `${WINDOW_NAME_PREFIX}${raw}`;
        } catch (error) {
            // Ignore write errors and keep the game playable with in-memory state.
        }
    }

    function loadStore() {
        const raw = readWebStorage("localStorage")
            || readWebStorage("sessionStorage")
            || readWindowNameStore();

        if (!raw) {
            return {};
        }

        try {
            return JSON.parse(raw);
        } catch (error) {
            return {};
        }
    }

    function saveStore(store) {
        const raw = JSON.stringify(store);
        const stored = writeWebStorage("localStorage", raw) || writeWebStorage("sessionStorage", raw);

        if (!stored) {
            writeWindowNameStore(raw);
            return;
        }

        writeWindowNameStore(raw);
    }

    function getStore() {
        const store = loadStore();
        const settings = sanitizeSettings(store.settings || {});
        const subject = getSubject(store.selectedSubject);
        const theme = getTheme(subject.id, store.selectedTheme);

        return {
            settings,
            selectedSubject: subject.id,
            selectedTheme: theme.id,
            discovered: Array.isArray(store.discovered) ? store.discovered : [],
            results: Array.isArray(store.results) ? store.results : []
        };
    }

    function setStore(patch) {
        const current = getStore();
        const nextSettings = patch.settings
            ? sanitizeSettings({
                ...current.settings,
                ...patch.settings
            })
            : current.settings;
        const next = {
            ...current,
            ...patch,
            settings: nextSettings
        };

        saveStore(next);
        return next;
    }

    function getSubject(subjectId) {
        return SUBJECTS.find((subject) => subject.id === subjectId) || SUBJECTS[0];
    }

    function getTheme(subjectId, themeId) {
        const subject = getSubject(subjectId);
        return subject.themes.find((item) => item.id === themeId) || subject.themes[0];
    }

    function sanitizeSettings(settings) {
        const skin = settings.skin === "dark" ? "dark" : DEFAULT_SETTINGS.skin;
        const difficulty = DIFFICULTIES[settings.difficulty] ? settings.difficulty : DEFAULT_SETTINGS.difficulty;
        const mode = MODES[settings.mode] ? settings.mode : DEFAULT_SETTINGS.mode;
        const gridSize = VALID_GRID_SIZES.includes(Number(settings.gridSize)) ? Number(settings.gridSize) : DEFAULT_SETTINGS.gridSize;
        const sound = settings.sound === "off" ? "off" : "on";
        const assist = settings.assist === "off" ? "off" : "smart";

        return {
            skin,
            difficulty,
            mode,
            gridSize,
            sound,
            assist
        };
    }

    function formatTime(totalSeconds) {
        const safe = Math.max(0, Math.floor(totalSeconds || 0));
        const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
        const seconds = String(safe % 60).padStart(2, "0");
        return `${minutes}:${seconds}`;
    }

    window.CacaContexto = {
        STORAGE_KEY,
        DEFAULT_SETTINGS,
        DIFFICULTIES,
        MODES,
        VECTORS,
        SUBJECTS,
        getStore,
        setStore,
        getSubject,
        getTheme,
        formatTime
    };
})();
