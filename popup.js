// =================================================================
// 1. ESTADO GLOBAL
// =================================================================
let estadoApp = { jsonBruto: null, inputs: null };

document.addEventListener('DOMContentLoaded', function() {
    console.log("Assistente NSC carregado.");

    // Recupera dados do localStorage (incluindo o JSON da última sessão)
    inicializarLocalStorage();

    // Controle de exibição de blocos condicionais
    const toggleDiv = (checkId, divId) => {
        const check = document.getElementById(checkId);
        const div = document.getElementById(divId);
        if (check && div) {
            check.addEventListener('change', () => div.classList.toggle('hidden', !check.checked));
        }
    };

    // Recalcula a legitimidade dos cedentes toda vez que você alterar o Beneficiário Prévio
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

    // BOTÃO SALVAR (Carrega o JSON e preenche o formulário)
    document.getElementById('btnSalvarJSON')?.addEventListener('click', function() {
        let rawInput = document.getElementById('jsonInput').value;
        rawInput = rawInput.replace(/```json|```/g, "").trim();

        try {
            estadoApp.jsonBruto = JSON.parse(rawInput);
            preencherCamposIA(estadoApp.jsonBruto);
            document.getElementById('areaCamposAutopreenchidos').classList.remove('hidden');
            
            this.innerText = "✓ Dados Carregados";
            this.style.backgroundColor = "#28a745";
            document.getElementById('areaCamposAutopreenchidos').scrollIntoView({ behavior: 'smooth' });
        } catch (e) {
            alert("Erro ao ler JSON. Verifique se o texto está completo.");
            console.error(e); // Para facilitar o debug
        }
    });

    // BOTÃO REINICIAR (A única forma de limpar o JSON e o cache)
    document.getElementById('btnReiniciar')?.addEventListener('click', function() {
        if (confirm("Deseja limpar todos os dados e reiniciar a análise?")) {
            localStorage.clear();
            window.location.reload();
        }
    });

    // BOTÃO GERAR CERTIDÃO (Passo 1 -> 2)
    document.getElementById('btnGerarCertidao')?.addEventListener('click', function() {
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
    document.getElementById('btnConfirmarCertidao')?.addEventListener('click', function() {
        try {
            // Roda o motor de regras
            const dadosProcessados = processarDecisoes(estadoApp.jsonBruto, estadoApp.inputs);
            
            // Gera os HTMLs
            const htmlMinuta = gerarMinutaHTML(estadoApp.jsonBruto, estadoApp.inputs, dadosProcessados.textos);
            const htmlTabela = gerarTabelaNSCHTML(dadosProcessados.tabela);

            // 1. Injeta na tela para você LER (Visual)
            document.getElementById('previaMinuta').innerHTML = htmlMinuta;
            document.getElementById('previaTabela').innerHTML = htmlTabela; // <-- A LINHA QUE FALTAVA

            // 2. Injeta nos textareas ocultos para você COPIAR (Bruto)
            document.getElementById('outputMinuta').value = htmlMinuta;
            document.getElementById('outputTabela').value = htmlTabela;

            mudarPasso(2, 3);
        } catch (erro) {
            console.error("Erro ao gerar Minuta/NSC:", erro);
            alert("Erro ao processar as regras. O arquivo 'motorDeRegras.js' e 'gerarTabelaNSCHTML.js' estão carregados?");
        }
    });

    // Garanta que o botão voltar também tem o ouvinte certo (se não tiver ainda)
    document.getElementById('btnVoltarPasso2')?.addEventListener('click', () => mudarPasso(3, 2));
    document.getElementById('btnVoltarPasso1')?.addEventListener('click', () => mudarPasso(2, 1));

    // Botões de Cópia Individuais (Já existiam)
    configurarCopia('btnCopiarMinuta', 'outputMinuta');
    configurarCopia('btnCopiarTabela', 'outputTabela');

    // NOVO BOTÃO: COPIAR TUDO JUNTOS
    const btnCopiarTudo = document.getElementById('btnCopiarTudo');
    if (btnCopiarTudo) {
        btnCopiarTudo.addEventListener('click', function() {
            const minutaText = document.getElementById('outputMinuta').value;
            const tabelaText = document.getElementById('outputTabela').value;
            
            // Junta os dois textos colocando duas quebras de linha (<br><br>) entre eles
            const textoCombinado = minutaText + tabelaText;
            
            navigator.clipboard.writeText(textoCombinado);
            
            // Efeito visual de sucesso no botão
            const textoOriginal = this.innerText;
            this.innerText = "✓ Tudo Copiado!";
            this.style.backgroundColor = "#28a745"; // Fica verde
            
            setTimeout(() => { 
                this.innerText = textoOriginal; 
                this.style.backgroundColor = "#17a2b8"; // Volta ao azul
            }, 2000);
        });
    }

});

// =================================================================
// 3. FUNÇÕES AUXILIARES DE PROCESSAMENTO
// =================================================================

function preencherCamposIA(json) {
    const meta = json?.metadados_precatorio || {};
    const h = json?.contrato_honorarios || {};

    const numReal = document.getElementById('numPrecatorioReal');
    if (numReal) numReal.value = meta.processo_eproc || meta.numero_precatorio || "";

    if (h.pedido_destaque_novo?.existe_pedido_destaque_novo) {
        document.getElementById('deferidoNestaAnalise').checked = true;
        document.getElementById('divDestaqueNovo').classList.remove('hidden');
        
        document.getElementById('beneficiarioDestaqueNovo').value = h.partes?.contratadas?.[0]?.nome || "";
        
        const percMatch = h.objeto_e_valores?.estipulacao_honorarios?.valor_percentual_literal?.match(/\d+/);
        if (percMatch) document.getElementById('percDeferidoAgora').value = percMatch[0];

        document.getElementById('eventoPedidoDestaque').value = ""; 
        document.getElementById('dataPedidoDestaque').value = "";
        const evContrato = document.getElementById('eventoContratoPedido');
        if (evContrato) evContrato.value = "";
    }

    atualizarListaCedentes(json);
}

function atualizarListaCedentes(json) {
    if (!json) return;
    
    const container = document.getElementById('containerCedentesCheck');
    if (!container) return;
    
    container.innerHTML = "";
    const cedentes = json?.instrumento_cessao?.partes?.cedentes || [];
    const h = json?.contrato_honorarios || {};
    const nomeBenNovo = h.partes?.contratadas?.[0]?.nome?.trim().toLowerCase() || "";
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
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(el => {
        const salvo = localStorage.getItem(el.id);
        if (salvo !== null) {
            if (el.type === 'checkbox') el.checked = (salvo === 'true');
            else el.value = salvo;
            el.dispatchEvent(new Event('change'));
        }
        el.addEventListener('input', () => localStorage.setItem(el.id, el.type === 'checkbox' ? el.checked : el.value));
        el.addEventListener('change', () => localStorage.setItem(el.id, el.type === 'checkbox' ? el.checked : el.value));
    });
}

function mudarPasso(sai, entra) {
    document.getElementById(`passo${sai}`).classList.add('hidden');
    document.getElementById(`passo${entra}`).classList.remove('hidden');
}

function configurarCopia(btnId, areaId) {
    document.getElementById(btnId)?.addEventListener('click', function() {
        const text = document.getElementById(areaId).value;
        navigator.clipboard.writeText(text);
        this.innerText = "✓ Copiado!";
        setTimeout(() => { this.innerText = (btnId === 'btnCopiarMinuta' ? "Copiar Minuta" : "Copiar Tabela"); }, 2000);
    });
}