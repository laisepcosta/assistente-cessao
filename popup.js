// =================================================================
// 1. ESTADO GLOBAL E FUNÇÃO DE LIMPEZA DE JSON
// =================================================================
let estadoApp = { jsonBruto: null, inputs: null };

/**
 * Limpa a string bruta retornada pela IA, removendo citações automáticas 
 * e isolando apenas o bloco JSON válido.
 */
function extrairELimparJSON(textoBruto) {
    // 1. Remove as tags malditas de citação (Qualquer formato)
    let textoLimpo = textoBruto
        .replace(/\[cite[^\]]*\]/gi, "") // Cobre [cite_1],, [CITE...]
        .replace(/【[^】]*】/g, "")          // Cobre colchetes asiáticos tipo 【1】 ou 【1, 2】
        .replace(/\[\s*\d+(?:\s*,\s*\d+)*\s*\]/g, ""); // Cobre números puros tipo [1], [12, 50]

    // 2. Garante que vai pegar apenas o que está entre as chaves { ... } do JSON
    const regexJson = /\{[\s\S]*\}/;
    const match = textoLimpo.match(regexJson);

    if (!match) {
        throw new Error("Não foi possível encontrar um formato JSON válido na resposta.");
    }

    // 3. Faz o parse seguro
    try {
        return JSON.parse(match[0]);
    } catch (erro) {
        console.error("Erro ao fazer o parse do JSON limpo:", erro);
        console.error("String que tentou ser parseada:", match[0]);
        throw erro;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    console.log("Assistente NSC carregado.");

    // Recupera dados do localStorage
    inicializarLocalStorage();

    // Controle de exibição de blocos condicionais
    const toggleDiv = (checkId, divId) => {
        const check = document.getElementById(checkId);
        const div = document.getElementById(divId);
        if (check && div) {
            check.addEventListener('change', () => div.classList.toggle('hidden', !check.checked));
            // Dispara logo no load para ajustar a tela se já vier checado do localStorage
            div.classList.toggle('hidden', !check.checked);
        }
    };

    // Recalcula a legitimidade dos cedentes toda vez que alterar o Beneficiário Prévio
    const inputBenPrevio = document.getElementById('beneficiarioDestaquePrevio');
    if (inputBenPrevio) {
        inputBenPrevio.addEventListener('input', () => {
            if (estadoApp.jsonBruto) atualizarListaCedentes(estadoApp.jsonBruto);
        });
    }

    toggleDiv('existeDestaquePrevio', 'divDestaquePrevio');
    toggleDiv('deferidoNestaAnalise', 'divDestaqueNovo');

    // =================================================================
    // 2. AÇÕES DE NAVEGAÇÃO E BOTÕES
    // =================================================================

    // BOTÃO SALVAR (Carrega o JSON, LIMPA e preenche o formulário)
    document.getElementById('btnSalvarJSON')?.addEventListener('click', function () {
        let rawInput = document.getElementById('jsonInput').value;

        try {
            // Usa a nova função de extração segura em vez do JSON.parse direto
            estadoApp.jsonBruto = extrairELimparJSON(rawInput);

            preencherCamposIA(estadoApp.jsonBruto);
            document.getElementById('areaCamposAutopreenchidos').classList.remove('hidden');

            // Oculta o campo de texto do JSON imediatamente
            document.getElementById('jsonInput').classList.add('hidden');

            // Dá o feedback visual no botão
            this.innerText = "✓ Dados Carregados";
            this.style.backgroundColor = "#28a745";

            const botao = this;
            setTimeout(function () {
                botao.classList.add('hidden');
            }, 1000);

            document.getElementById('areaCamposAutopreenchidos').scrollIntoView({ behavior: 'smooth' });
        } catch (e) {
            alert("Erro ao ler JSON. Verifique se o texto está completo e é válido.\nErro: " + e.message);
            console.error(e);
        }
    });

    // BOTÃO REINICIAR 
    document.getElementById('btnReiniciar')?.addEventListener('click', function () {
        if (confirm("Deseja limpar todos os dados e reiniciar a análise?")) {
            localStorage.clear();
            window.location.reload();
        }
    });

    // BOTÃO GERAR CERTIDÃO (Passo 1 -> 2)
    document.getElementById('btnGerarCertidao')?.addEventListener('click', function () {
        try {
            if (!estadoApp.jsonBruto) {
                alert("Por favor, carregue o JSON primeiro.");
                return;
            }
            capturarInputsFinais();
            document.getElementById('tabelaCertidaoVisual').innerHTML = renderizarCertidaoVisual(estadoApp.jsonBruto);
            mudarPasso(1, 2);
        } catch (erro) {
            console.error("Erro ao avançar para o Passo 2:", erro);
            alert("Ocorreu um erro. Verifique o console.");
        }
    });

    // BOTÃO CONFIRMAR (Passo 2 -> 3)
    document.getElementById('btnConfirmarCertidao')?.addEventListener('click', function () {
        try {
            // Roda o motor de regras
            const dadosProcessados = processarDecisoes(estadoApp.jsonBruto, estadoApp.inputs);

            // Gera os HTMLs
            const htmlMinuta = gerarMinutaHTML(estadoApp.jsonBruto, estadoApp.inputs, dadosProcessados.textos);
            const htmlTabela = gerarTabelaNSCHTML(dadosProcessados.tabela);

            // 1. Injeta na tela para você LER (Visual)
            document.getElementById('previaMinuta').innerHTML = htmlMinuta;
            document.getElementById('previaTabela').innerHTML = htmlTabela;

            // 2. Injeta nos textareas ocultos para você COPIAR (Bruto)
            document.getElementById('outputMinuta').value = htmlMinuta;
            document.getElementById('outputTabela').value = htmlTabela;

            mudarPasso(2, 3);
        } catch (erro) {
            console.error("Erro ao gerar Minuta/NSC:", erro);
            alert("Erro ao processar as regras. O arquivo 'motorDeRegras.js' e 'gerarTabelaNSCHTML.js' estão carregados?");
        }
    });

    document.getElementById('btnVoltarPasso2')?.addEventListener('click', () => mudarPasso(3, 2));
    document.getElementById('btnVoltarPasso1')?.addEventListener('click', () => mudarPasso(2, 1));

    configurarCopia('btnCopiarMinuta', 'outputMinuta');
    configurarCopia('btnCopiarTabela', 'outputTabela');

    // BOTÃO: COPIAR TUDO JUNTOS
    const btnCopiarTudo = document.getElementById('btnCopiarTudo');
    if (btnCopiarTudo) {
        btnCopiarTudo.addEventListener('click', function () {
            const minutaText = document.getElementById('outputMinuta').value;
            const tabelaText = document.getElementById('outputTabela').value;
            const textoCombinado = minutaText + "\n\n" + tabelaText;

            navigator.clipboard.writeText(textoCombinado);

            const textoOriginal = this.innerText;
            this.innerText = "✓ Tudo Copiado!";
            this.style.backgroundColor = "#28a745";

            setTimeout(() => {
                this.innerText = textoOriginal;
                this.style.backgroundColor = "#17a2b8";
            }, 2000);
        });
    }

});

// =================================================================
// 3. FUNÇÕES AUXILIARES DE PROCESSAMENTO E DOM
// =================================================================

function preencherCamposIA(json) {
    if (!json) return;

    const meta = json.metadados_precatorio || {};
    const reqCessao = json.requerimento_cessao || {};
    const reqDestaque = json.requerimento_destaque || {};
    const cont = reqDestaque.contrato_honorarios || {};

    // Função de apoio para preencher e avisar a tela
    const preencherInput = (id, valor) => {
        const campo = document.getElementById(id);
        if (campo && valor) {
            campo.value = valor;
            campo.dispatchEvent(new Event('input'));
        }
    };

    // 1. DADOS DO PRECATÓRIO (Metadados Bloqueados)
    preencherInput('numPrecatorioReal', meta.numero_precatorio || "");
    preencherInput('naturezaPrec', meta.natureza || "");
    preencherInput('vencimentoPrec', meta.vencimento || "");

    // Processos Relacionados
    preencherInput('procOriginario', meta.processo_judicial_originario || "");
    preencherInput('procSei', meta.processo_sei || "");
    preencherInput('procEproc', meta.processo_eproc || "");

    // EVENTOS DA CESSÃO (Preenchimento Automático)
    preencherInput('eventoComunicacaoCessao', reqCessao.rastreabilidade_evento?.numero_evento || "");
    preencherInput('eventoInstrumentoCessao', reqCessao.rastreabilidade_evento?.numero_evento || "");

    // 2. DADOS DO DESTAQUE NOVO (Aquele que a IA acabou de ler no PDF)
    const checkDeferido = document.getElementById('deferidoNestaAnalise');

    if (reqDestaque.ha_requerimento) {
        // Marca a checkbox de pedido novo e abre o painel
        if (checkDeferido && !checkDeferido.checked) {
            checkDeferido.checked = true;
            checkDeferido.dispatchEvent(new Event('change'));
        }

        // AQUI ESTÁ A CORREÇÃO: Injeta APENAS no campo do Pedido Novo
        preencherInput('beneficiarioDestaqueNovo', cont.partes?.contratadas?.[0]?.nome || "");

        // Percentual do Pedido Novo
        const percNum = cont.objeto_e_valores?.estipulacao_honorarios?.percentual_numero;
        if (percNum && percNum > 0) {
            preencherInput('percDeferidoAgora', percNum);
        } else {
            const percMatch = cont.objeto_e_valores?.estipulacao_honorarios?.valor_percentual_literal?.match(/\d+/);
            if (percMatch) preencherInput('percDeferidoAgora', percMatch[0]);
        }

        // Evento do Pedido Novo
        preencherInput('eventoPedidoDestaque', reqDestaque.rastreabilidade_evento?.numero_evento || "");

    } else {
        // Se a IA disse que NÃO HÁ requerimento de destaque novo, fecha o painel
        if (checkDeferido && checkDeferido.checked) {
            checkDeferido.checked = false;
            checkDeferido.dispatchEvent(new Event('change'));
        }
    }

    // 3. ATUALIZA A LISTA DE CEDENTES
    atualizarListaCedentes(json);
}

function atualizarListaCedentes(json) {
    if (!json) return;

    const container = document.getElementById('containerCedentesCheck');
    if (!container) return;

    container.innerHTML = "";

    // Adaptado para a nova árvore (requerimento_cessao)
    const cedentes = json?.requerimento_cessao?.instrumento_cessao?.partes?.cedentes || [];
    const cont = json?.requerimento_destaque?.contrato_honorarios || {};

    const nomeBenNovo = cont.partes?.contratadas?.[0]?.nome?.trim().toLowerCase() || "";
    const nomeBenPrevio = document.getElementById('beneficiarioDestaquePrevio')?.value.trim().toLowerCase() || "";

    let cedentesAdicionados = 0;

    cedentes.forEach((cedente, index) => {
        const nomeCedente = cedente.nome.trim().toLowerCase();

        if (nomeCedente === nomeBenNovo && nomeCedente !== nomeBenPrevio && nomeBenNovo !== "") {
            const divAviso = document.createElement('div');
            divAviso.style.fontSize = "10px";
            divAviso.style.color = "#dc3545";
            divAviso.style.marginBottom = "5px";
            divAviso.innerHTML = `<s>${cedente.nome}</s> <span style="font-style:italic;">(Bloqueado: Apenas expectativa de honorários)</span>`;
            container.appendChild(divAviso);
            return;
        }

        const div = document.createElement('div');
        div.className = "checkbox-group";
        div.style.marginBottom = "5px";
        div.innerHTML = `
            <input type="checkbox" id="cedente_${index}" class="check-cedente-legitimo" data-nome="${cedente.nome}" checked>
            <label for="cedente_${index}" style="font-size: 14px;">${cedente.nome}</label>
        `;
        container.appendChild(div);
        cedentesAdicionados++;
    });

    if (cedentesAdicionados === 0 && cedentes.length > 0) {
        container.innerHTML += "<span style='color:red; font-size:14px;'>Nenhum cedente com crédito estabelecido válido.</span>";
    } else if (cedentes.length === 0) {
        container.innerHTML = "<span style='color:red; font-size:14px;'>Nenhum cedente encontrado.</span>";
    }
}

function capturarInputsFinais() {
    const selecionados = Array.from(document.querySelectorAll('.check-cedente-legitimo:checked'))
        .map(el => el.getAttribute('data-nome'));

    estadoApp.inputs = {
        numPrecatorioReal: document.getElementById('numPrecatorioReal')?.value || "",
        cedentesLegitimos: selecionados,
        eventoComunicacao: document.getElementById('eventoComunicacaoCessao')?.value || "",
        eventoInstrumento: document.getElementById('eventoInstrumentoCessao')?.value || "",
        dataComunicacao: document.getElementById('dataComunicacaoCessao')?.value || "",
        existeDestaquePrevio: document.getElementById('existeDestaquePrevio')?.checked || false,
        percDestaquePrevio: parseFloat(document.getElementById('percDestaquePrevio')?.value) || 0,
        eventoDestaquePrevio: document.getElementById('eventoDestaquePrevio')?.value || "",
        beneficiarioDestaquePrevio: document.getElementById('beneficiarioDestaquePrevio')?.value || "",
        deferidoNestaAnalise: document.getElementById('deferidoNestaAnalise')?.checked || false,
        percDeferidoAgora: parseFloat(document.getElementById('percDeferidoAgora')?.value) || 0,
        eventoPedidoDestaque: document.getElementById('eventoPedidoDestaque')?.value || "",
        dataPedidoDestaque: document.getElementById('dataPedidoDestaque')?.value || "",
        beneficiarioDestaqueNovo: document.getElementById('beneficiarioDestaqueNovo')?.value || "",
        opcaoDivergencia: document.getElementById('opcaoDivergencia')?.value || "1",
        inferiorEquivaleTotalidade: document.getElementById('inferiorEquivaleTotalidade')?.checked || false
    };
}

function inicializarLocalStorage() {
    const inputs = document.querySelectorAll('input:not(#jsonInput), textarea:not(#jsonInput), select');
    inputs.forEach(el => {
        const salvo = localStorage.getItem(el.id);
        if (salvo !== null) {
            if (el.type === 'checkbox') el.checked = (salvo === 'true');
            else el.value = salvo;
            // Não dispara o event('change') massivamente no load para não causar bugs de renderização
        }
        el.addEventListener('input', () => localStorage.setItem(el.id, el.type === 'checkbox' ? el.checked : el.value));
        el.addEventListener('change', () => localStorage.setItem(el.id, el.type === 'checkbox' ? el.checked : el.value));
    });
}

function mudarPasso(sai, entra) {
    document.getElementById(`passo${sai}`).classList.add('hidden');
    document.getElementById(`passo${entra}`).classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function configurarCopia(btnId, areaId) {
    document.getElementById(btnId)?.addEventListener('click', function () {
        const text = document.getElementById(areaId).value;
        navigator.clipboard.writeText(text);
        this.innerText = "✓ Copiado!";
        setTimeout(() => { this.innerText = (btnId === 'btnCopiarMinuta' ? "Copiar Minuta" : "Copiar Tabela"); }, 2000);
    });
}

function validarDestaquesRealTime() {
    const painel = document.getElementById('painelAlertaDestaque');
    const displayMsg = document.getElementById('msgAlertaUnificada');
    const areaCheck = document.getElementById('areaCheckPerda');
    const areaDecisao = document.getElementById('areaDecisaoDivergencia');
    const checkPerda = document.getElementById('certificarPerdaObjeto');

    if (!painel || !estadoApp.jsonBruto) return;

    const previoPerc = parseFloat(document.getElementById('percDestaquePrevio').value) || 0;
    const novoPerc = parseFloat(document.getElementById('percDeferidoAgora').value) || 0;
    const previoNome = document.getElementById('beneficiarioDestaquePrevio').value.trim().toLowerCase();
    const novoNome = document.getElementById('beneficiarioDestaqueNovo').value.trim().toLowerCase();
    const ressalva = parseFloat(estadoApp.jsonBruto.requerimento_cessao?.instrumento_cessao?.ressalva_honorarios?.percentual_contratuais) || 0;

    let msgs = [];
    let mostrarCheck = false;
    let mostrarSelect = false;
    let tipoPainel = "escondido"; // Pode ser: warning, success, error

    // 1. Identifica Duplicidade
    const ehDuplicado = (previoPerc > 0 && novoPerc > 0 && previoPerc === novoPerc && previoNome === novoNome && previoNome !== "");

    // 2. Calcula a soma efetiva
    const perdaCertificada = (checkPerda && checkPerda.checked);
    const valorNovoEfetivo = perdaCertificada ? 0 : novoPerc;
    const soma = previoPerc + valorNovoEfetivo;

    const erroMatematico = (ressalva > 0 && soma !== ressalva);

    // --- LÓGICA DE MENSAGENS E ESTADO ---

    // Se for duplicado, o painel DEVE aparecer (seja pedindo pra marcar, ou confirmando que marcou)
    if (ehDuplicado) {
        mostrarCheck = true;
        if (!perdaCertificada) {
            msgs.push("⚠️ <strong>AÇÃO NECESSÁRIA:</strong> Pedido idêntico ao histórico. Certifique a perda de objeto abaixo.");
            tipoPainel = "warning"; // Laranja
        } else {
            msgs.push("✅ <strong>PERDA DE OBJETO CERTIFICADA:</strong> O valor novo foi desconsiderado da soma da ressalva.");
            tipoPainel = "success"; // Verde (Fica registrado na tela!)
        }
    }

    // Se houver erro de conta (Ressalva vs Destaques)
    if (erroMatematico) {
        // Se a perda já foi certificada e AINDA ASSIM a conta não bate, pede a decisão
        if (!ehDuplicado || perdaCertificada) {
            msgs.push(`❌ <strong>DIVERGÊNCIA:</strong> Soma dos Destaques (${soma}%) ≠ Ressalva (${ressalva}%).`);
            mostrarSelect = true;
        }
        // O Erro matemático é crítico, então o painel fica vermelho
        tipoPainel = "error";
    }

    // --- RENDERIZAÇÃO VISUAL ---
    if (msgs.length > 0) {
        painel.classList.remove('hidden');
        displayMsg.innerHTML = msgs.join("<br><br>"); // Dá um espaço se houver 2 mensagens

        if (mostrarCheck) areaCheck.classList.remove('hidden');
        else areaCheck.classList.add('hidden');

        if (mostrarSelect) areaDecisao.classList.remove('hidden');
        else areaDecisao.classList.add('hidden');

        // Aplica as cores dinâmicas
        if (tipoPainel === "error") {
            painel.style.backgroundColor = "#fff5f5";
            painel.style.borderColor = "#dc3545";
            displayMsg.style.color = "#721c24";
        } else if (tipoPainel === "warning") {
            painel.style.backgroundColor = "#fffbef";
            painel.style.borderColor = "#ffc107";
            displayMsg.style.color = "#856404";
        } else if (tipoPainel === "success") {
            painel.style.backgroundColor = "#f4fff6"; // Fundo verdinho claro
            painel.style.borderColor = "#28a745";    // Borda verde
            displayMsg.style.color = "#155724";      // Texto verde escuro
        }
    } else {
        // O painel só some se não for duplicado E a matemática estiver perfeita.
        painel.classList.add('hidden');
    }
}

// ATUALIZAÇÃO DOS OUVINTES (Incluir Nomes e o Checkbox)
document.getElementById('percDestaquePrevio').addEventListener('input', validarDestaquesRealTime);
document.getElementById('percDeferidoAgora').addEventListener('input', validarDestaquesRealTime);
document.getElementById('beneficiarioDestaquePrevio').addEventListener('input', validarDestaquesRealTime);
document.getElementById('beneficiarioDestaqueNovo').addEventListener('input', validarDestaquesRealTime);
document.getElementById('certificarPerdaObjeto').addEventListener('change', validarDestaquesRealTime);