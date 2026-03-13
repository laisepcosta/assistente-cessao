/**
 * motorDeRegras.js - Versão Corrigida (Alinhada ao Modelo V090326)
 * Responsável por aplicar as regras de negócio e calcular o Percentual Líquido do NSC.
 */

/**
 * Lógica de Prefixo (Regra R2/Bloco 2)
 */
function getPrefixoEvento(eventoInput) {
    if (!eventoInput) return "";
    const texto = String(eventoInput);
    // Detecta intervalos ou listas conforme R2 
    if (texto.match(/[-–,;&/]/) || texto.match(/( e | a )/)) {
        return "aos eventos";
    }
    return "ao evento";
}

/**
 * Formatação de Percentuais (Regra R12)
 * Remove zeros decimais de números inteiros.
 */
function formatarPercentualR12(valor) {
    if (valor === null || valor === undefined) return "0";
    const num = parseFloat(valor);
    if (Number.isInteger(num)) return num.toString();
    return num.toFixed(2).replace(".", ",");
}

function preencherTemplate(template, valores) {
    if (!template) return "";
    return template.replace(/{{(\w+)}}/g, (match, tag) => {
        return valores[tag] !== undefined ? valores[tag] : match;
    });
}

function processarDecisoes(extracaoIA, inputsUsuario) {
    const inst = extracaoIA?.instrumento_cessao || {};
    const objEcon = inst.objeto_economico || {};
    const objEfeitos = inst.ressalva_honorarios || {};

    // 1. Inputs de Extração e Manuais
    const percInstrumento = objEcon.percentual_instrumento?.percentual_numero || 0;
    const indicadorTotalidadeOriginal = objEcon.indicador_totalidade?.abrange_totalidade || false;
    const inferiorEquivaleTotalidade = inputsUsuario.inferiorEquivaleTotalidade || false;
    
    const tipoRessalva = objEfeitos.tipo || "sem_previsao";
    const percRessalva = objEfeitos.percentual_contratuais || 0;
    const cessaoExclusiva = inst.cessao_exclusiva_honorarios?.tipo || "NAO";

    const existeDestaquePrevio = inputsUsuario.existeDestaquePrevio || false;
    const percDestaquePrevio = parseFloat(inputsUsuario.percDestaquePrevio) || 0;
    const deferidoNestaAnalise = inputsUsuario.deferidoNestaAnalise || false;
    const percDeferidoAgora = parseFloat(inputsUsuario.percDeferidoAgora) || 0;
    const opcaoDivergencia = inputsUsuario.opcaoDivergencia || "1";

    const baseIA = objEcon.base_calculo?.classificacao || "BASE_INDEFINIDA";

    // 2. Cálculo da Soma de Destaques Judiciais (R9) 
    let somaDestaquesJudiciais = 0;
    if (existeDestaquePrevio) somaDestaquesJudiciais += percDestaquePrevio;
    if (deferidoNestaAnalise) somaDestaquesJudiciais += percDeferidoAgora;

    let percentualNSC = 0;
    let observacaoNSC = "";
    let indicadorTotalidadeEfetivo = indicadorTotalidadeOriginal || inferiorEquivaleTotalidade;

    // ========================================================
    // A. LÓGICA DE CÁLCULO NSC (Regra R9) 
    // ========================================================

    if (["CONTRATUAIS", "SUCUMBENCIAIS", "PERICIAIS"].includes(cessaoExclusiva)) {
        // Curto-circuito Cessão Exclusiva 
        percentualNSC = indicadorTotalidadeEfetivo ? 100 : percInstrumento;
        observacaoNSC = `Cessão exclusiva de honorários ${cessaoExclusiva.toLowerCase()}.`;
    } else if (indicadorTotalidadeEfetivo) {
        // Caso TOTALIDADE 
        let deducaoDoSaldo = 0;
        let fraseRessalva = "";

        if (tipoRessalva === "quitados_pelo_cessionario") {
            deducaoDoSaldo = 0; 
            fraseRessalva = "Honorários contratuais quitados pelo cessionário.";
        } else if (tipoRessalva === "ressalva_sem_percentual") {
            deducaoDoSaldo = somaDestaquesJudiciais > 0 ? 0 : 20; 
            fraseRessalva = somaDestaquesJudiciais > 0 ? "Ressalva de honorários sem percentual expresso." : "Ressalva de honorários: aplicado 20% por ausência de percentual expresso.";
        } else if (["ressalva_com_percentual_nao_cedidos", "ressalva_inclui_periciais_com_percentual_nao_cedidos"].includes(tipoRessalva)) {
            // Lógica de Divergência R9 
            if (somaDestaquesJudiciais > 0) {
                if (Math.abs(percRessalva - somaDestaquesJudiciais) <= 0.02) {
                    deducaoDoSaldo = 0; 
                    fraseRessalva = `Ressalva coincidente (${formatarPercentualR12(percRessalva)}%).`;
                } else {
                    // Opções de Divergência 
                    if (opcaoDivergencia === "1") deducaoDoSaldo = 0;
                    else if (opcaoDivergencia === "2") deducaoDoSaldo = percRessalva;
                    else deducaoDoSaldo = (percRessalva > somaDestaquesJudiciais) ? (percRessalva - somaDestaquesJudiciais) : 0;
                    fraseRessalva = `Ressalva de honorários contratuais (${formatarPercentualR12(percRessalva)}%).`;
                }
            } else {
                deducaoDoSaldo = percRessalva; 
                fraseRessalva = `Ressalva de honorários contratuais (${formatarPercentualR12(percRessalva)}%).`;
            }
        } else {
            deducaoDoSaldo = 0;
            fraseRessalva = "Não há ressalva de honorários contratuais.";
        }

        percentualNSC = 100 - deducaoDoSaldo; 
        
        // Texto do Destaque 
        let fraseDestaque = somaDestaquesJudiciais > 0 ? `Destaque de honorários (${formatarPercentualR12(somaDestaquesJudiciais)}%).` : "Não há destaque prévio.";
        observacaoNSC = `${fraseDestaque} ${fraseRessalva}`.trim();

    } else {
        // Caso PARCIAL 
        percentualNSC = percInstrumento;
        observacaoNSC = `Cessão parcial expressa (${formatarPercentualR12(percInstrumento)}%).`;
    }

    // ========================================================
    // B. SELEÇÃO DE TEXTOS (Regras R10 e R14)
    // ========================================================
    
    // Objeto de Tags para Templates 
    const tags = {
        PERC_INSTRUMENTO: formatarPercentualR12(percInstrumento),
        PERC_RESSALVA_CONTRATUAIS: formatarPercentualR12(percRessalva),
        PERC_DEFERIDO_AGORA: formatarPercentualR12(percDeferidoAgora),
        PERC_DESTAQUE_PREVIO: formatarPercentualR12(percDestaquePrevio),
        EVENTO_COMUNICACAO_CESSAO: inputsUsuario.eventoComunicacao,
        EVENTO_PEDIDO_DESTAQUE: inputsUsuario.eventoPedidoDestaque,
        EVENTO_DESTAQUE_PREVIO: inputsUsuario.eventoDestaquePrevio,
        PREFIXO_COMUNICACAO: getPrefixoEvento(inputsUsuario.eventoComunicacao),
        PREFIXO_PEDIDO: getPrefixoEvento(inputsUsuario.eventoPedidoDestaque),
        PREFIXO_PREVIO: getPrefixoEvento(inputsUsuario.eventoDestaquePrevio),
        CEDENTE_NOME: (inputsUsuario.cedentesLegitimos || []).join(", ").replace(/, ([^,]*)$/, ' e $1'),
        CESSIONARIO_NOME: inst.partes?.cessionarios?.map(c => c.nome).join(", ").replace(/, ([^,]*)$/, ' e $1') || "[CESSIONÁRIO]",
        BENEFICIARIO_PEDIDO_DESTAQUE: inputsUsuario.beneficiarioDestaqueNovo,
        BENEFICIARIO_DESTAQUE_PREVIO: inputsUsuario.beneficiarioDestaquePrevio,
        NOMES_ADVOGADOS: inputsUsuario.beneficiarioDestaqueNovo
    };

    // Árvore de Decisão R14 (Base de Cálculo) 
    let chaveR14 = "base_total_precatorio";
    if (percInstrumento === 100 && tipoRessalva === "sem_previsao") chaveR14 = "base_conjunta_principal_honorarios";
    else if (percInstrumento === 100) chaveR14 = (baseIA === "BASE_COTA_CEDENTE") ? "base_cota_cedente" : "base_total_precatorio";
    else if (baseIA === "BASE_TOTAL_PRECATÓRIO" && inferiorEquivaleTotalidade) chaveR14 = "base_totalidade_cedente_confirmada";
    else if (baseIA === "BASE_COTA_CEDENTE") chaveR14 = "base_cota_cedente";

    // Árvore de Decisão R10 (Destaque de Honorários) 
    let chaveR10 = "";
    if (!["cessao_exclusiva_contratuais", "cessao_exclusiva_sucumbenciais", "cessao_exclusiva_periciais"].includes(tipoRessalva)) {
        if (existeDestaquePrevio) {
            if (deferidoNestaAnalise) {
                chaveR10 = (percDeferidoAgora === percDestaquePrevio) ? "ja_destacados_com_req" : "nao_destacados_com_req_com_contrato";
            } else chaveR10 = "ja_destacados_sem_req";
        } else {
            if (deferidoNestaAnalise) chaveR10 = "nao_destacados_com_req_com_contrato";
            else {
                if (tipoRessalva === "quitados_pelo_cessionario") chaveR10 = "nao_destacados_sem_req_quitados";
                else if (["ressalva_com_percentual_nao_cedidos", "ressalva_inclui_periciais_com_percentual_nao_cedidos", "ressalva_sem_percentual"].includes(tipoRessalva)) chaveR10 = "nao_destacados_sem_req_com_ressalva";
                else chaveR10 = "nao_destacados_sem_req_sem_ressalva";
            }
        }
    }

    const textosMinuta = {
        basePerc: preencherTemplate(DicionarioFrases.REL_BASE_PERC_INSTRUMENTO[chaveR14], tags),
        ressalva: preencherTemplate(DicionarioFrases.REL_TIPO_RESSALVA[tipoRessalva], tags),
        superpreferencia: preencherTemplate(DicionarioFrases.REL_SUPERPREFERENCIA[inst.superpreferencia?.status || "sem_previsao"], tags),
        reqDestaque: preencherTemplate(DicionarioFrases.REL_REQUERIMENTO_DESTAQUE[deferidoNestaAnalise ? "sim" : "nao"], tags),
        decisaoDestaque: chaveR10 ? preencherTemplate(DicionarioFrases.DEC_DESTAQUE_HONORARIOS[chaveR10], tags) : ""
    };

    // 3. Dados para a Tabela NSC 
    const dadosTabela = {
        numero: extracaoIA?.metadados_precatorio?.processo_eproc || "[NÚMERO]",
        natureza: extracaoIA?.metadados_precatorio?.natureza || "[NATUREZA]",
        vencimento: extracaoIA?.metadados_precatorio?.vencimento || "[ANO]",
        devedor: extracaoIA?.metadados_precatorio?.devedor || "[DEVEDOR]",
        linhasNSC: (inputsUsuario.cedentesLegitimos || []).map(nome => ({
            data: inputsUsuario.dataComunicacao || "[DATA]",
            tipo: "Cessão",
            percentual: formatarPercentualR12(percentualNSC),
            de: nome,
            para: tags.CESSIONARIO_NOME,
            evento: inputsUsuario.eventoInstrumento || "-",
            observacao: observacaoNSC
        }))
    };

    return { textos: textosMinuta, tabela: dadosTabela };
}