/**
 * Transforma os dados brutos da IA em uma tabela visual de conferência.
 * @param {Object} extracaoIA - JSON extraído do PDF.
 */
function renderizarCertidaoVisual(json) {
    const inst = json?.instrumento_cessao || {};
    const inputs = typeof estadoApp !== 'undefined' ? (estadoApp.inputs || {}) : {};

    // 1. ADICIONADO QUEBRA DE LINHA FORÇADA NAS CÉLULAS (word-wrap e overflow-wrap)
    const criarLinha = (aspecto, analise, loc) => `
        <tr>
            <td style="font-weight:bold; border:1px solid #ccc; padding:6px; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${aspecto}</td>
            <td style="border:1px solid #ccc; padding:6px; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${analise || '-'}</td>
            <td style="font-size:14px; color:#555; border:1px solid #ccc; padding:6px; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${loc || 'Verificar instrumento'}</td>
        </tr>`;

    // 2. ADICIONADO TABLE-LAYOUT FIXED PARA FORÇAR O RESPEITO AOS PERCENTUAIS
    let html = `<table style="width:100%; table-layout: fixed; border-collapse:collapse; font-size:14px;">
        <tr style="background:#eee;">
            <th style="width:25%; padding:6px; border:1px solid #ccc;">Aspecto</th>
            <th style="width:50%; padding:6px; border:1px solid #ccc;">Análise IA / Inputs</th>
            <th style="width:25%; padding:6px; border:1px solid #ccc;">Localização</th>
        </tr>`;

    // =================================================================
    // 1. IDENTIFICAÇÃO E PARTES DO INSTRUMENTO
    // =================================================================
    html += `<tr><td colspan="3" style="background:#d1ecf1; font-weight:bold; padding:6px; border:1px solid #ccc; text-align:center;">1. IDENTIFICAÇÃO E PARTES DO INSTRUMENTO</td></tr>`;
    
    html += criarLinha("Precatório", inst.identificacao_precatorio?.analise_divergencia || "Sem divergências relatadas.", inst.identificacao_precatorio?.localizacao);
    
    html += criarLinha("Evento da comunicação", `Comunicação: ${inputs.eventoComunicacao || '-'} <br> Instrumento: ${inputs.eventoInstrumento || '-'}`, "Informação Processual");

    const cedentes = inst.partes?.cedentes?.map(c => `${c.nome} (Parte no Prec: ${c.e_parte_precatorio ? 'SIM' : 'NÃO'})`).join("<br>") || "Não identificado";
    html += criarLinha("Cedente(s)", cedentes, inst.partes?.localizacao);

    const advogados = inst.partes?.advogados_cedente?.map(a => `${a.nome} (OAB: ${a.oab || 'N/I'})`).join("<br>") || "Não identificado";
    html += criarLinha("Advogados do(s) cedente(s)", advogados, inst.partes?.localizacao);

    const cessionarios = inst.partes?.cessionarios?.map(c => `${c.nome} (${c.documento || 'CNPJ/CPF N/I'})`).join("<br>") || "Não identificado";
    html += criarLinha("Cessionário(s)", cessionarios, inst.partes?.localizacao);

    html += criarLinha("Outras Partes", "Verificar existência de anuentes, cônjuges ou intervenientes no instrumento.", inst.partes?.localizacao);
    
    html += criarLinha("Data da Comunicação", inputs.dataComunicacao || "-", "Informação Processual");

    // =================================================================
    // 2. EFEITOS JURÍDICOS E ÔNUS
    // =================================================================
    html += `<tr><td colspan="3" style="background:#fff3cd; font-weight:bold; padding:6px; border:1px solid #ccc; text-align:center;">2. EFEITOS JURÍDICOS E ÔNUS</td></tr>`;
    
    html += criarLinha("Superpreferência", inst.superpreferencia?.status || inst.superpreferencia?.analise, inst.superpreferencia?.localizacao);
    
    const infoRessalva = inst.ressalva_honorarios?.tipo ? `${inst.ressalva_honorarios.tipo} (${inst.ressalva_honorarios.percentual || 0}%)` : "Sem ressalva expressa.";
    html += criarLinha("Ressalva de Honorários", infoRessalva, inst.ressalva_honorarios?.localizacao);

    const infoDestaque = `Prévio: ${inputs.existeDestaquePrevio ? 'SIM ('+inputs.percDestaquePrevio+'%)' : 'NÃO'}. <br> Novo: ${inputs.deferidoNestaAnalise ? 'SIM ('+inputs.percDeferidoAgora+'%)' : 'NÃO'}.`;
    html += criarLinha("Destaque de Honorários", infoDestaque, "Histórico Processual / Inputs");

    const ressalvaNum = inst.ressalva_honorarios?.percentual || 0;
    const destaqueNum = inputs.percDestaquePrevio || inputs.percDeferidoAgora || 0;
    const infoCoincidencia = (ressalvaNum > 0 && ressalvaNum === destaqueNum) ? "SIM (Percentuais idênticos)" : "NÃO (Valores divergem ou inexistentes)";
    html += criarLinha("Coincidência (Destaque x Ressalva)", infoCoincidencia, "Cálculo Lógico");

    html += criarLinha("Cessão Exclusiva", inst.cessao_exclusiva_honorarios?.tipo || "NÃO", inst.cessao_exclusiva_honorarios?.localizacao);

    // =================================================================
    // 3. OBJETO ECONÔMICO DA CESSÃO
    // =================================================================
    html += `<tr><td colspan="3" style="background:#d4edda; font-weight:bold; padding:6px; border:1px solid #ccc; text-align:center;">3. OBJETO ECONÔMICO DA CESSÃO</td></tr>`;
    
    html += criarLinha("Valor da Cessão", "Conferir valor nominal e forma de pagamento no instrumento.", inst.objeto_economico?.localizacao);
    
    html += criarLinha("Percentual no Instrumento", inst.objeto_economico?.percentual_instrumento?.texto_literal || "Não informado", inst.objeto_economico?.percentual_instrumento?.localizacao);
    
    html += criarLinha("Base de Cálculo", inst.objeto_economico?.base_calculo?.classificacao || "Não identificada", inst.objeto_economico?.base_calculo?.localizacao);

    const totalidade = inputs.inferiorEquivaleTotalidade ? "SIM (Atestado via Checkbox)" : (inst.objeto_economico?.indicador_totalidade?.abrange_totalidade ? "SIM (Extração IA)" : "NÃO");
    html += criarLinha("Indicador de Totalidade", totalidade, inst.objeto_economico?.indicador_totalidade?.localizacao);

    html += criarLinha("Percentual NSC", "<strong>Aguardando processamento do Motor de Regras...</strong>", "Resultado Matemático (Passo 3)");

    return html + `</table>`;
}

function criarLinhaCertidao(aspecto, analise, localizacao) {
    return `<tr>
        <td style="font-weight: bold;">${aspecto}</td>
        <td>${analise || '-'}</td>
        <td style="font-size: 14px; color: #555;">${localizacao || 'Verificar instrumento'}</td>
    </tr>`;
}