/**
 * motorDeRegras.js
 * Responsável por aplicar as regras de negócio e calcular o Percentual Líquido do NSC.
 */

function preencherTemplate(template, valores) {
    if (!template) return "";
    return template.replace(/{{(\w+)}}/g, (match, tag) => valores[tag] !== undefined ? valores[tag] : match);
}

function processarDecisoes(extracaoIA, inputsUsuario) {
    // 1. Extração Segura dos Dados do JSON (Estrutura Atualizada)
    const inst = extracaoIA?.instrumento_cessao || {};
    const objEfeitos = inst.ressalva_honorarios || {};
    const objEcon = inst.objeto_economico || {};

    const percInstrumento = objEcon.percentual_instrumento?.percentual_numero || 0;
    let indicadorTotalidade = objEcon.indicador_totalidade?.abrange_totalidade || false;
    
    const tipoRessalva = objEfeitos.tipo || "SEM_PREVISAO";
    const percRessalva = objEfeitos.percentual || 0;
    const cessaoExclusiva = inst.cessao_exclusiva_honorarios?.tipo || "NAO"; 

    // 2. Extração dos Inputs Manuais
    const existeDestaquePrevio = inputsUsuario.existeDestaquePrevio || false; 
    const percDestaquePrevio = inputsUsuario.percDestaquePrevio || 0;
    
    const deferidoNestaAnalise = inputsUsuario.deferidoNestaAnalise || false; 
    const percDeferidoAgora = inputsUsuario.percDeferidoAgora || 0;
    
    const inferiorEquivaleTotalidade = inputsUsuario.inferiorEquivaleTotalidade || false; 
    const opcaoDivergencia = inputsUsuario.opcaoDivergencia || "1"; 
    
    // NOVO: Pega APENAS os cedentes que você deixou marcado na tela
    const cedentesAprovados = inputsUsuario.cedentesLegitimos || [];

    let percentualNSC = 0;
    let observacaoNSC = "";

    // ========================================================
    // A. LÓGICA DE CÁLCULO (NSC)
    // ========================================================
    let encerrouCalculo = false;

    // Curto-Circuito: Cessão Exclusiva de Honorários
    if (["CONTRATUAIS", "SUCUMBENCIAIS", "PERICIAIS"].includes(cessaoExclusiva)) {
        let sufixo = cessaoExclusiva.toLowerCase();
        percentualNSC = indicadorTotalidade ? 100 : percInstrumento;
        observacaoNSC = indicadorTotalidade ? `Cessão exclusiva de honorários ${sufixo} (100%).` : `Cessão de honorários ${sufixo} (${percInstrumento}%).`;
        encerrouCalculo = true;
    }

    // Regra Padrão se não for cessão exclusiva
    if (!encerrouCalculo) {
        let somaDestaquesJudiciais = 0;
        if (inferiorEquivaleTotalidade) indicadorTotalidade = true;
        
        if (existeDestaquePrevio) somaDestaquesJudiciais += percDestaquePrevio;
        if (deferidoNestaAnalise) somaDestaquesJudiciais += percDeferidoAgora;

        let deducaoSaldo = 0;

        if (indicadorTotalidade) {
            // Se o usuário marcou para abater honorários (Opção 2) ou se há ressalva forte
            if (tipoRessalva.includes("RESSALVA_COM_PERCENTUAL") && percRessalva > 0) {
                if (somaDestaquesJudiciais > 0) {
                    // Se o destaque nos autos bate com a ressalva do contrato (Divergência <= 2%)
                    if (Math.abs(percRessalva - somaDestaquesJudiciais) <= 0.02) {
                        deducaoSaldo = somaDestaquesJudiciais; // Abate o destaque comprovado
                        observacaoNSC = `Totalidade da cota-parte cedida, abatido o destaque de honorários (${somaDestaquesJudiciais}%).`;
                    } else {
                        // Se divergem, aplica a escolha do usuário
                        if (opcaoDivergencia === "1") {
                            deducaoSaldo = somaDestaquesJudiciais; // Só abate o que tem nos autos
                            observacaoNSC = `Abatido apenas o destaque consolidado nos autos (${somaDestaquesJudiciais}%). Ressalva ignorada por divergência.`;
                        } else if (opcaoDivergencia === "2") {
                            deducaoSaldo = percRessalva; // Abate a ressalva bruta
                            observacaoNSC = `Abatida a ressalva contratual (${percRessalva}%).`;
                        } else if (opcaoDivergencia === "3") {
                            deducaoSaldo = percRessalva > somaDestaquesJudiciais ? percRessalva : somaDestaquesJudiciais;
                            observacaoNSC = `Abatimento misto (Destaque/Ressalva: ${deducaoSaldo}%).`;
                        }
                    }
                } else {
                    // Se não há destaque judicial, mas há ressalva, abate a ressalva se o usuário permitir
                    deducaoSaldo = (opcaoDivergencia === "2" || opcaoDivergencia === "3") ? percRessalva : 0; 
                    observacaoNSC = deducaoSaldo > 0 ? `Abatida a ressalva contratual (${percRessalva}%) ante a ausência de destaque.` : `Ressalva ignorada (${percRessalva}%), sem destaque nos autos.`;
                }
            } else if (tipoRessalva === "QUITADOS_PELO_CESSIONARIO") {
                deducaoSaldo = 0;
                observacaoNSC = "Honorários contratuais quitados pelo cessionário (100% da cota cedida).";
            } else {
                // Sem ressalva, abate apenas os destaques reais (se houver)
                deducaoSaldo = somaDestaquesJudiciais;
                observacaoNSC = deducaoSaldo > 0 ? `Abatido o destaque de honorários (${deducaoSaldo}%).` : "Cessão de 100% da cota-parte, sem ônus identificados.";
            }
            
            percentualNSC = 100 - deducaoSaldo;

        } else {
            // Se NÃO é a totalidade, o percentual cedido já é o líquido (Ex: cedeu exatos 30%)
            percentualNSC = percInstrumento;
            observacaoNSC = `Cessão parcial expressa (${percInstrumento}%).`;
        }
    }

    // Trava de Segurança Matemática
    percentualNSC = Math.max(0, Math.round(percentualNSC * 100) / 100);

    // ========================================================
    // B. SELEÇÃO DE TEXTOS (Frases da Minuta)
    // ========================================================
    // Nota: Como não tenho o arquivo dicionarioFrases.js exato aqui, 
    // estou passando os valores brutos para que a gerarMinutaHTML faça o texto,
    // ou você pode manter a lógica do dicionario se ele já existir.
    
    let textosMinuta = {
        baseCalculoLiteral: objEcon.base_calculo?.classificacao === "BASE_TOTAL_PRECATORIO" ? "sobre o valor total do precatório" : "sobre a cota-parte do cedente",
        analiseRessalva: tipoRessalva,
        analiseSuperpreferencia: inst.superpreferencia?.status || "SEM_PREVISAO"
    };

    // ========================================================
    // C. DADOS DA TABELA NSC (Para gerarTabelaNSCHTML.js)
    // ========================================================
    // Pega o nome do cessionário do JSON
    const cessionarios = inst.partes?.cessionarios || [];
    const nomeCessionario = cessionarios.map(c => c.nome).join(", ").replace(/, ([^,]*)$/, ' e $1') || "[CESSIONÁRIO]";

    // Cria uma linha na tabela NSC para cada cedente APROVADO pelo usuário
    const linhasNSC = cedentesAprovados.map(nomeCedente => ({
        data: inputsUsuario.dataComunicacao || "[DATA]",
        tipo: "Cessão",
        percentual: percentualNSC,
        de: nomeCedente,
        para: nomeCessionario,
        evento: inputsUsuario.eventoInstrumento || "-",
        observacao: observacaoNSC
    }));

    const dadosTabela = {
        numero: extracaoIA?.metadados_precatorio?.processo_eproc || "[NÚMERO]", 
        linhasNSC: linhasNSC
    };

    return { textos: textosMinuta, tabela: dadosTabela };
}