function renderizarCertidaoVisual(json) {
    // --- 1. VARIÁVEIS PRINCIPAIS ---
    const meta = json?.metadados_precatorio || {};
    const reqCessao = json?.requerimento_cessao || {};
    const inst = reqCessao.instrumento_cessao || {};
    const reqDestaque = json?.requerimento_destaque || {};
    const cont = reqDestaque.contrato_honorarios || {};
    const inputs = typeof estadoApp !== 'undefined' ? (estadoApp.inputs || {}) : {};

    // --- 2. FUNÇÕES AUXILIARES ---

    /**
     * Limpa a string bruta retornada pela IA, removendo citações automáticas 
     * e isolando apenas o bloco JSON válido.
     */
    function extrairELimparJSON(textoBruto) {
        let textoLimpo = textoBruto
            .replace(/\[cite_[^\]]*\]/g, "")
            .replace(/【\d+】/g, "")
            .replace(/\[\d+\]/g, "");

        const regexJson = /\{[\s\S]*\}/;
        const match = textoLimpo.match(regexJson);

        if (!match) {
            throw new Error("Não foi possível encontrar um formato JSON válido na resposta.");
        }

        try {
            return JSON.parse(match[0]);
        } catch (erro) {
            console.error("Erro ao fazer o parse do JSON limpo:", erro);
            console.error("String que tentou ser parseada:", match[0]);
            throw erro;
        }
    }

    const criarLinha = (aspecto, analise, loc) => `
        <tr>
            <td style="font-weight:bold; border:1px solid #ccc; padding:8px; word-wrap: break-word; background-color: #fdfdfd;">${aspecto}</td>
            <td style="border:1px solid #ccc; padding:8px; word-wrap: break-word; line-height: 1.5;">${analise || '-'}</td>
            <td style="font-size:13px; color:#555; border:1px solid #ccc; padding:8px; word-wrap: break-word; font-style: italic;">${loc || 'N/I'}</td>
        </tr>`;

    const checkIcon = (val) => val ? '<span style="color:green; font-weight:bold;">✅ SIM</span>' : '<span style="color:red; font-weight:bold;">❌ NÃO</span>';

    // FUNÇÃO CORRIGIDA: Agora prevê o caso do Advogado (que usa OAB em vez de numero_documento)
    const renderizarParte = (p) => {
        const identificador = p.numero_documento ? `${p.tipo_documento || 'Doc'}: ${p.numero_documento}` : (p.oab || p.oab_uf ? `OAB: ${p.oab || p.oab_uf}` : 'N/I');
        return `<strong>${p.nome || '-'}</strong> (${identificador})`;
    };

    const limparNomeArquivo = (nome) => {
        if (!nome) return '-';
        return nome.replace(/^[\d\.\-]+[_\-]?/, '');
    };

    // --- 3. INÍCIO DA TABELA HTML ---
    let html = `<table style="width:100%; table-layout: fixed; border-collapse:collapse; font-size:14px;">
        <tr style="background:#343a40; color: white;">
            <th style="width:25%; padding:8px; border:1px solid #ccc;">Aspecto</th>
            <th style="width:55%; padding:8px; border:1px solid #ccc;">Análise IA / Dados Extraídos</th>
            <th style="width:20%; padding:8px; border:1px solid #ccc;">Localização</th>
        </tr>`;

    // =================================================================
    // DADOS DO PRECATÓRIO
    // =================================================================
    html += `<tr><td colspan="3" style="background:#e9ecef; font-weight:bold; padding:8px; border:1px solid #ccc; text-align:center;">DADOS DO PRECATÓRIO</td></tr>`;

    html += criarLinha("Identificação do Precatório",
        `<em>Número (GV): </em><strong>${meta.numero_precatorio || '-'}</strong><br><em>Natureza:</em> ${meta.natureza || '-'}<br><em>Vencimento:</em> ${meta.vencimento || '-'}`,
        "SGP/TJMG");

    html += criarLinha("Devedor", `${meta.devedor || '-'}`, "SGP/TJMG");

    html += criarLinha("Processos Relacionados",
        `<strong>Originário:</strong> ${meta.processo_judicial_originario || '-'}<br><strong>SEI:</strong> ${meta.processo_sei || '-'}<br><strong>Eproc:</strong> ${meta.processo_eproc || '-'}`,
        "SGP/TJMG");

    const infoDestaquePrevio = inputs.existeDestaquePrevio
        ? `<strong style="color:#0056b3;">SIM</strong><br><em>Percentual:</em> ${inputs.percDestaquePrevio || 0}%<br><em>Beneficiário:</em> ${inputs.beneficiarioDestaquePrevio || 'Não informado'}<br><em>Evento:</em> ${inputs.eventoDestaquePrevio || 'Não informado'}`
        : `<strong>NÃO</strong>`;
    html += criarLinha("Destaque Prévio (Anotado nos Autos)", infoDestaquePrevio, "Painel de Inputs / Histórico");

    // =================================================================
    // REQUERIMENTO DE CESSÃO
    // =================================================================
    html += `<tr><td colspan="3" style="background:#d1ecf1; font-weight:bold; padding:8px; border:1px solid #ccc; text-align:center;">REQUERIMENTO DE CESSÃO</td></tr>`;

    // Eventos da Cessão (Validados pelo usuário no Painel de Inputs)
    html += criarLinha("Eventos da Cessão",
        `<strong>Comunicação:</strong> Evento ${inputs.eventoComunicacao || '-'}<br>
        <strong>Instrumento:</strong> Evento ${inputs.eventoInstrumento || '-'}<br>
        <strong>Data:</strong> ${inputs.dataComunicacao || '-'}`,
        "Painel de Inputs");

    const chkCessao = reqCessao.checklist_documentos || {};
    const listaCheckCessao = `
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.8;">
            <li><strong>Petição:</strong> ${checkIcon(chkCessao.peticao_comunicacao_cessao?.presente)} <em>(${limparNomeArquivo(chkCessao.peticao_comunicacao_cessao?.nome_arquivo)})</em></li>
            <li><strong>Instrumento:</strong> ${checkIcon(chkCessao.instrumento_cessao?.presente)} <em>(${limparNomeArquivo(chkCessao.instrumento_cessao?.nome_arquivo)})</em></li>
            <li><strong>Docs Cessionário:</strong> ${checkIcon(chkCessao.documentos_cessionario?.presente)} <em>(${limparNomeArquivo(chkCessao.documentos_cessionario?.nome_arquivo)})</em></li>
            <li><strong>Rep. Cessionário (Estatuto/FIDC):</strong> ${checkIcon(chkCessao.documentos_representacao_cessionario?.presente)} <em>(${limparNomeArquivo(chkCessao.documentos_representacao_cessionario?.nome_arquivo)})</em><br><span style="color:#666; font-size:12px;">↳ <em>Análise: ${chkCessao.documentos_representacao_cessionario?.analise || '-'}</em></span></li>
            <li><strong>Procurações:</strong> ${checkIcon(chkCessao.procuracoes?.presente)} <em>(${limparNomeArquivo(chkCessao.procuracoes?.nomes_arquivos)})</em></li>
            <li><strong>Renúncia Superpreferência:</strong> ${checkIcon(chkCessao.termo_renuncia_superpreferencia?.presente)} <em>(${limparNomeArquivo(chkCessao.termo_renuncia_superpreferencia?.nome_arquivo)})</em></li>
            <li><strong>Quitação de Honorários:</strong> ${checkIcon(chkCessao.declaracao_quitacao_honorarios?.presente)} <em>(${limparNomeArquivo(chkCessao.declaracao_quitacao_honorarios?.nome_arquivo)})</em></li>
        </ul>
        <hr style='margin: 8px 0; border: 0; border-top: 1px dashed #ccc;'>
        <em>Parecer Geral do Checklist:</em> ${chkCessao.analise_geral || '-'}
    `;
    html += criarLinha("Checklist de Documentos (Cessão)", listaCheckCessao, "Visão Geral do Anexo");

    html += criarLinha("Identificação do Precatório (Instrumento)", `<em>Divergência:</em> ${inst.identificacao_precatorio?.houve_divergencia ? '<strong style="color:red">SIM</strong>' : '<strong style="color:green">NÃO</strong>'}<br><em>Análise:</em> ${inst.identificacao_precatorio?.analise_divergencia || "Sem divergências relatadas."}`, inst.identificacao_precatorio?.localizacao);

    const formInst = inst.formalidades || {};
    const escr = inst.dados_escritura_publica || {};
    const dadosCartorio = escr.lavrado_em_cartorio
        ? `<br><em>Cartório:</em> ${escr.nome_cartorio} (Livro ${escr.livro || '-'}, Pág ${escr.pagina || '-'})`
        : '';
    html += criarLinha("Formalidades (Assinaturas e Data)", `<em>Data do Instrumento:</em> ${formInst.data_instrumento || 'Não informada'}<br><em>Assinatura do Cedente:</em> ${formInst.assinatura_cedente ? 'SIM' : 'NÃO'}<br><em>Assinatura do Cessionário:</em> ${formInst.assinatura_cessionario ? 'SIM' : 'NÃO'}${dadosCartorio}<br><em>Análise:</em> ${formInst.analise || '-'}`, formInst.localizacao);

    const intExCessao = reqCessao.peticao_anexa?.pedido_intimacao_exclusiva || {};
    const advsCessao = intExCessao.advogados_indicados?.map(a => `<strong>${a.nome}</strong> (OAB: ${a.oab})`).join(", ") || 'Nenhum indicado';
    html += criarLinha("Pedido de Intimação Exclusiva (Cessão)", `<em>Existe Pedido?</em> <strong>${intExCessao.existe_pedido ? 'SIM' : 'NÃO'}</strong><br><em>Advogados:</em> ${advsCessao}<br><em>Procuração Válida Anexada:</em> ${intExCessao.procuracao_valida_anexada ? 'SIM' : 'NÃO'}<br><em>Análise:</em> ${intExCessao.analise || '-'}`, intExCessao.localizacao);

    // =================================================================
    // PARTES
    // =================================================================
    html += `<tr><td colspan="3" style="background:#d1ecf1; font-weight:bold; padding:8px; border:1px solid #ccc; text-align:center;">PARTES</td></tr>`;

    const cedentes = inst.partes?.cedentes?.map(c => `${renderizarParte(c)}<br><em>Parte no Precatório:</em> ${c.e_parte_precatorio ? 'SIM' : 'NÃO'}${c.qualificacao_completa ? `<br><em>Qualificação:</em> ${c.qualificacao_completa}` : ''}<br><em>Análise:</em> ${c.analise || '-'}`).join("<br><hr style='margin: 5px 0; border: 0; border-top: 1px dashed #ccc;'><br>") || "Nenhum identificado";
    html += criarLinha("Cedente(s)", cedentes, inst.partes?.cedentes?.[0]?.localizacao);

    const advogados = inst.partes?.advogados_cedente?.map(a => `${renderizarParte(a)}<br><em>Assina como:</em> ${a.assina_como || 'N/I'}<br><em>Análise:</em> ${a.analise || '-'}`).join("<br><hr style='margin: 5px 0; border: 0; border-top: 1px dashed #ccc;'><br>") || "Nenhum identificado";
    html += criarLinha("Advogados do(s) Cedente(s)", advogados, inst.partes?.advogados_cedente?.[0]?.localizacao);

    const cessionarios = inst.partes?.cessionarios?.map(c => `${renderizarParte(c)}${c.administradora_procuradora ? `<br><em>Admin/Proc:</em> ${c.administradora_procuradora}` : ''}${c.divisao_especificada ? `<br><em>Divisão:</em> ${c.divisao_especificada}` : ''}${c.representante_legal_assinante ? `<br><em>Assinado por:</em> ${c.representante_legal_assinante}` : ''}${c.qualificacao_completa ? `<br><em>Qualificação:</em> ${c.qualificacao_completa}` : ''}<br><em>Análise:</em> ${c.analise || '-'}`).join("<br><hr style='margin: 5px 0; border: 0; border-top: 1px dashed #ccc;'><br>") || "Nenhum identificado";
    html += criarLinha("Cessionário(s)", cessionarios, inst.partes?.cessionarios?.[0]?.localizacao);

    const outras = inst.partes?.outras_partes?.map(o => `${renderizarParte(o)}<br><em>Papel:</em> ${o.papel || 'N/I'}${o.qualificacao_completa ? `<br><em>Qualificação:</em> ${o.qualificacao_completa}` : ''}<br><em>Análise:</em> ${o.analise || '-'}`).join("<br><hr style='margin: 5px 0; border: 0; border-top: 1px dashed #ccc;'><br>") || "Nenhuma identificada";
    html += criarLinha("Outras Partes (Anuentes/Cônjuges)", outras, inst.partes?.outras_partes?.[0]?.localizacao);

    // =================================================================
    // HONORÁRIOS ADVOCATÍCIOS CONTRATUAIS (Oculto se não houver pedido novo)
    // =================================================================

    let percNovoVal = 0;
    const valorIdentificadoIA = parseFloat(cont.objeto_e_valores?.estipulacao_honorarios?.percentual_numero) || 0;

    if (reqDestaque.ha_requerimento) {
        html += `<tr><td colspan="3" style="background:#fff3cd; font-weight:bold; padding:8px; border:1px solid #ccc; text-align:center;">3. HONORÁRIOS ADVOCATÍCIOS CONTRATUAIS (NOVO PEDIDO)</td></tr>`;

        // --- LÓGICA DE EXIBIÇÃO: PERDA DE OBJETO vs PEDIDO ATIVO ---
        if (inputs.perdaObjetoCertificada) {
            // Se o usuário certificou a duplicidade no Passo 1
            percNovoVal = 0; // Zera para a conta de coerência não divergir da ressalva

            html += criarLinha("Destaque Novo (A ser deferido)",
                `<strong style="color:#dc3545;">⚠️ PEDIDO PREJUDICADO / PERDA DE OBJETO</strong><br>
                 Identificado pedido de ${valorIdentificadoIA}% no Evento ${reqDestaque.rastreabilidade_evento?.numero_evento || 'N/I'}.<br>
                 <em>Motivo:</em> Identidade total com o destaque já anotado no histórico.`,
                "Certificação do Auditor");

            // Não mostramos o restante do checklist para não poluir, já que o pedido será indeferido
        } else {
            // Se for um pedido novo legítimo
            percNovoVal = valorIdentificadoIA;

            html += criarLinha("Destaque Novo (A ser deferido)",
                `<strong>Pedido de destaque: SIM</strong><br><em>Evento:</em> ${reqDestaque.rastreabilidade_evento?.numero_evento || 'N/I'}<br><em>Análise IA:</em> ${reqDestaque.rastreabilidade_evento?.analise || '-'}`,
                reqDestaque.rastreabilidade_evento?.localizacao || "IA");

            const chkDestaque = reqDestaque.checklist_documentos || {};
            const listaCheckDestaque = `
                <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
                    <li><strong>Petição de Destaque:</strong> ${checkIcon(chkDestaque.peticao_destaque_honorarios?.presente)} <em>(${limparNomeArquivo(chkDestaque.peticao_destaque_honorarios?.nome_arquivo)})</em></li>
                    <li><strong>Contrato de Honorários:</strong> ${checkIcon(chkDestaque.contrato_honorarios?.presente)} <em>(${limparNomeArquivo(chkDestaque.contrato_honorarios?.nome_arquivo)})</em></li>
                </ul>
                <hr style='margin: 5px 0; border: 0; border-top: 1px dashed #ccc;'>
                <em>Parecer Geral:</em> ${chkDestaque.analise_geral || '-'}
            `;
            html += criarLinha("Checklist de Documentos (Destaque)", listaCheckDestaque, "Visão Geral do Anexo");

            const intExDestaque = reqDestaque.peticao_anexa?.pedido_intimacao_exclusiva || {};
            const advsDestaque = intExDestaque.advogados_indicados?.map(a => `<strong>${a.nome}</strong> (OAB: ${a.oab})`).join(", ") || 'Nenhum indicado';
            html += criarLinha("Pedido de Intimação Exclusiva (Destaque)", `<em>Existe Pedido?</em> <strong>${intExDestaque.existe_pedido ? 'SIM' : 'NÃO'}</strong><br><em>Advogados:</em> ${advsDestaque}<br><em>Procuração Válida Anexada:</em> ${intExDestaque.procuracao_valida_anexada ? 'SIM' : 'NÃO'}<br><em>Análise:</em> ${intExDestaque.analise || '-'}`, intExDestaque.localizacao);

            const formCont = cont.formalidades_instrumento || {};
            html += criarLinha("Formalidades do Contrato", `<em>Data de Celebração:</em> ${formCont.data_contrato?.data_celebracao || 'N/I'}<br><em>Assinatura Cliente:</em> ${formCont.assinaturas?.assinatura_cliente_presente ? 'SIM' : 'NÃO'}<br><em>Assinatura Advogado:</em> ${formCont.assinaturas?.assinatura_advogado_presente ? 'SIM' : 'NÃO'}<br><em>Tipo Assinatura:</em> ${formCont.assinaturas?.tipo_assinatura_identificado || 'N/I'}<br><em>Análise:</em> ${formCont.assinaturas?.analise_manifestacao_vontade || 'N/I'}`, formCont.assinaturas?.localizacao || formCont.data_contrato?.localizacao);

            const contratantes = cont.partes?.contratantes?.map(c => `${renderizarParte(c)}<br><em>Parte no Prec:</em> ${c.e_parte_precatorio ? 'SIM' : 'NÃO'}<br><em>Análise:</em> ${c.analise || '-'}`).join("<br><hr style='margin: 5px 0; border: 0; border-top: 1px dashed #ccc;'><br>") || "N/I";
            html += criarLinha("Contratantes (Clientes)", contratantes, cont.partes?.contratantes?.[0]?.localizacao);

            const contratadas = cont.partes?.contratadas?.map(c => `${renderizarParte(c)}<br><em>Análise:</em> ${c.analise || '-'}`).join("<br><hr style='margin: 5px 0; border: 0; border-top: 1px dashed #ccc;'><br>") || "N/I";
            html += criarLinha("Contratadas (Advogados)", contratadas, cont.partes?.contratadas?.[0]?.localizacao);

            const objVal = cont.objeto_e_valores || {};
            html += criarLinha("Objeto do Contrato", `<em>Nexo com processo originário?</em> <strong>${objVal.objeto_contrato?.nexo_processo_originario ? 'SIM' : 'NÃO'}</strong><br><em>Análise:</em> ${objVal.objeto_contrato?.analise || 'N/I'}`, objVal.objeto_contrato?.localizacao);

            percNovoVal = parseFloat(cont.objeto_e_valores?.estipulacao_honorarios?.percentual_numero) || 0;
            html += criarLinha("Estipulação de Honorários", `<em>Valor Numérico:</em> ${percNovoVal}%<br><em>Valor Literal:</em> ${cont.objeto_e_valores?.estipulacao_honorarios?.valor_percentual_literal || 'N/I'}`, cont.objeto_e_valores?.estipulacao_honorarios?.localizacao);

            const relPat = cont.relacoes_patronais || {};
            html += criarLinha("Relações Patronais", `<em>Múltiplos advogados identificados?</em> ${relPat.multiplos_advogados?.identificados ? 'SIM' : 'NÃO'}<br><em>Renúncia de Co-Patronos:</em> ${relPat.renuncia_co_patronos?.existe_renuncia ? 'SIM' : 'NÃO'}<br><em>Divisão de Honorários Expressa:</em> ${relPat.divisao_honorarios?.previsao_expressa ? 'SIM' : 'NÃO'}<br><em>Análise:</em> ${relPat.multiplos_advogados?.analise || '-'}`, relPat.multiplos_advogados?.localizacao);

            html += criarLinha("Tributação (Compatibilidade PF/PJ)", `<em>Solicita pagamento em favor de PJ?</em> <strong>${cont.tributacao_pagamento?.pedido_pagamento_pj ? 'SIM' : 'NÃO'}</strong><br><em>Parecer da IA:</em> ${cont.tributacao_pagamento?.analise_compatibilidade_pf_pj || 'N/I'}`, cont.tributacao_pagamento?.localizacao);
        }

        // =================================================================
        // 4. OBJETO ECONÔMICO E EFEITOS JURÍDICOS
        // =================================================================
        html += `<tr><td colspan="3" style="background:#d4edda; font-weight:bold; padding:8px; border:1px solid #ccc; text-align:center;">4. OBJETO ECONÔMICO E EFEITOS JURÍDICOS</td></tr>`;

        const objEcon = inst.objeto_economico || {};
        html += criarLinha("Valor da Cessão",
            `<em>Forma de Pagamento:</em> ${objEcon.valor_cessao?.forma_pagamento || "Não informada"}<br>
             <em>Comprovante Apresentado:</em> ${objEcon.valor_cessao?.comprovante_pagamento_apresentado ? 'SIM' : 'NÃO'}<br>
             <em>Análise:</em> ${objEcon.valor_cessao?.analise || '-'}`,
            objEcon.valor_cessao?.localizacao);

        html += criarLinha("Percentual Cedido",
            `<strong>${objEcon.percentual_instrumento?.percentual_numero || 0}%</strong> da cota-parte cedida.<br>
             <em>Texto literal:</em> ${objEcon.percentual_instrumento?.texto_literal || "Não informado"}<br>
             <em>Análise:</em> ${objEcon.percentual_instrumento?.analise || '-'}`,
            objEcon.percentual_instrumento?.localizacao);

        html += criarLinha("Base de Cálculo",
            `<em>Classificação:</em> <strong>${objEcon.base_calculo?.classificacao || "BASE_INDEFINIDA"}</strong><br>
             <em>Análise:</em> ${objEcon.base_calculo?.analise || "N/I"}`,
            objEcon.base_calculo?.localizacao);

        html += criarLinha("Indicador de Totalidade",
            `<em>Abrange 100% da cota?</em> <strong>${objEcon.indicador_totalidade?.abrange_totalidade ? 'SIM' : 'NÃO'}</strong><br>
             <em>Análise:</em> ${objEcon.indicador_totalidade?.analise || "N/I"}`,
            objEcon.indicador_totalidade?.localizacao);

        html += criarLinha("Superpreferência",
            `<em>Status:</em> <strong>${inst.superpreferencia?.status || "sem_previsao"}</strong><br>
             <em>Renúncia Expressa Anexa:</em> ${inst.superpreferencia?.declaracao_renuncia_expressa ? 'SIM' : 'NÃO'}<br>
             <em>Análise:</em> ${inst.superpreferencia?.analise || "N/I"}`,
            inst.superpreferencia?.localizacao);

        // --- LÓGICA DE COERÊNCIA INTEGRADA (MATEMÁTICA JURÍDICA) ---
        const ressalvaNum = parseFloat(inst.ressalva_honorarios?.percentual_contratuais) || 0;
        const percPrevio = parseFloat(inputs.percDestaquePrevio) || 0;

        // Se houve perda de objeto certificada, o novo percentual é ignorado na soma (vira 0)
        const percNovoEfetivo = inputs.perdaObjetoCertificada ? 0 : percNovoVal;
        const destaqueSoma = percPrevio + percNovoEfetivo;

        let infoCoincidencia = "";
        let estiloAlerta = 'color:green;';

        if (inputs.perdaObjetoCertificada) {
            // Caso 1: Duplicidade resolvida pelo auditor
            infoCoincidencia = `✅ <strong>SOMA AJUSTADA:</strong> Pedido novo ignorado por perda de objeto (duplicidade).<br>
                                <em>Cálculo:</em> Histórico (${percPrevio}%) = Ressalva no Contrato (${ressalvaNum}%)`;
        } else if (ressalvaNum === destaqueSoma) {
            // Caso 2: Perfeita harmonia
            infoCoincidencia = `✅ <strong>COERENTE:</strong> Ressalva (${ressalvaNum}%) = Soma dos Destaques (${destaqueSoma}%)`;
        } else {
            // Caso 3: Divergência e exibição da decisão tomada no Passo 1
            estiloAlerta = 'color:red; font-weight:bold;';
            const decisaoAuditor = inputs.opcaoDivergencia || "NÃO INFORMADA";
            infoCoincidencia = `❌ <strong>DIVERGENTE:</strong><br>
                                Ressalva no Instrumento: ${ressalvaNum}%<br>
                                Soma dos Destaques: ${destaqueSoma}% (Histórico ${percPrevio}% + Novo ${percNovoEfetivo}%)<br>
                                <strong>DECISÃO DO AUDITOR:</strong> ${decisaoAuditor}`;
        }

        html += criarLinha("Ressalva de Honorários",
            `<em>Tipo:</em> <strong>${inst.ressalva_honorarios?.tipo || "sem_previsao"}</strong><br>
             <em>% Contratuais:</em> ${ressalvaNum}% | <em>% Periciais:</em> ${inst.ressalva_honorarios?.percentual_periciais || 0}%`,
            inst.ressalva_honorarios?.localizacao);

        html += criarLinha("Coerência (Destaques x Ressalva)", `<span style="${estiloAlerta}">${infoCoincidencia}</span>`, "Motor de Regras");

        html += criarLinha("Quitação de Honorários",
            `<em>Apresentada:</em> ${inst.declaracao_quitacao_honorarios?.apresentada ? 'SIM' : 'NÃO'}<br>
             <em>Assinada por:</em> ${inst.declaracao_quitacao_honorarios?.assinada_por || 'N/I'}`,
            inst.declaracao_quitacao_honorarios?.localizacao);

        html += criarLinha("Cessão Exclusiva de Honorários",
            `<em>Tipo:</em> <strong>${inst.cessao_exclusiva_honorarios?.tipo || "NÃO"}</strong><br>
             <em>Análise:</em> ${inst.cessao_exclusiva_honorarios?.analise || '-'}`,
            inst.cessao_exclusiva_honorarios?.localizacao);

        html += criarLinha("Percentual NSC", "<strong>Aguardando processamento do Motor de Regras...</strong>", "Passo 3");

        return html + `</table>`;
    }

    // Mantido apenas se você usar a criação individual em algum outro lugar
    function criarLinhaCertidao(aspecto, analise, localizacao) {
        return `<tr>
        <td style="font-weight: bold; border: 1px solid #ccc; padding: 6px;">${aspecto}</td>
        <td style="border: 1px solid #ccc; padding: 6px;">${analise || '-'}</td>
        <td style="font-size: 13px; color: #555; border: 1px solid #ccc; padding: 6px;">${localizacao || 'Verificar instrumento'}</td>
    </tr>`;
    }
}