/**
 * Gera o HTML da Minuta do Despacho com filtragem de partes e limpeza de tags.
 * @param {Object} extracaoIA - JSON com os dados extraídos do PDF pela IA.
 * @param {Object} inputsUsuario - Dados manuais (eventos, destaques e cedentes validados).
 * @param {Object} textos - Dicionário de frases processadas (Destaque, Ressalva, etc).
 */
function gerarMinutaHTML(extracaoIA, inputsUsuario, textos) {
    // 1. EXTRAÇÃO SEGURA (Atualizada para a nova estrutura do JSON)
    const partes = extracaoIA?.instrumento_cessao?.partes || {};
    const cessionarios = partes.cessionarios || [];
    
    // 2. FILTRAGEM JURÍDICA: Puxa os cedentes que VOCÊ validou nas caixinhas do Passo 1
    const nomesCedentes = inputsUsuario.cedentesLegitimos || [];
        
    // 3. FORMATAÇÃO E PLACEHOLDERS: Aplica conjunções e evita campos vazios
    const nomeCedenteFormatado = nomesCedentes.length > 0 
        ? nomesCedentes.join(", ").replace(/, ([^,]*)$/, ' e $1') 
        : "[NOME DO CEDENTE]";
        
    const nomeCessionarioFormatado = cessionarios.length > 0 
        ? cessionarios.map(c => c.nome).join(", ").replace(/, ([^,]*)$/, ' e $1') 
        : "[NOME DO CESSIONÁRIO]";

    // 4. EVENTOS: Define o prefixo correto (singular ou plural)
    const eventoCom = inputsUsuario.eventoComunicacao || "[EVENTO_COM]";
    const prefixoCom = eventoCom.includes(",") || eventoCom.includes(" e ") || eventoCom.includes("-") 
        ? "aos eventos" 
        : "ao evento";

    // 5. TEMPLATE: Estrutura oficial do despacho
    const html = `
<p class="paragrafoPadrao">Trata-se, ${prefixoCom} ${eventoCom}, de comunicação de cessão dos direitos creditórios de <strong>${nomeCedenteFormatado}</strong> em favor de <strong>${nomeCessionarioFormatado}</strong>.</p>

<p class="paragrafoPadrao">${textos.basePerc || ""}</p>

<p class="paragrafoPadrao">${textos.ressalva || ""}</p>

<p class="paragrafoPadrao">${textos.superpreferencia || ""}</p>

<p class="paragrafoPadrao">${textos.reqDestaque || ""}</p>

<p class="paragrafoPadrao">É o relatório. Decido.</p>

<p class="paragrafoPadrao">${textos.decisaoDestaque || ""}</p>

<p class="paragrafoPadrao">Dê-se ciência aos procuradores do(s) beneficiário(s) (originário/cedente), bem como do devedor pelo prazo de 2 (dois) dias corridos para eventuais impugnações, nos termos do art. 80, da Resolução n.° 303/2019 do CNJ.</p>

<p class="paragrafoPadrao">Decorrido o prazo sem impugnação dos interessados, <strong>REGISTRE(M)-SE ${nomeCessionarioFormatado}</strong> como beneficiário(s) cessionário(s) dos direitos previstos na cessão, com o devido cadastramento de seu(s) patrono(s).</p>

<p class="paragrafoPadrao">A ordem cronológica do precatório fica mantida e o(s) cessionário(s) não faz(em) jus às preferências do § 2º do art. 100 da CR, estando sujeito(s) ao disposto no § 2º do art. 42 da Resolução n.° 303/2019 do CNJ.</p>

<p class="paragrafoPadrao">Esta decisão servirá como ofício para conhecimento do juízo da execução, conforme art. 45, § 1º, da referida Resolução.</p>

<p class="paragrafoPadrao">Belo Horizonte, data da assinatura eletrônica.</p>
    `;

    // 6. LIMPEZA FINAL (R11-B): Remove parágrafos vazios ou marcados como (omitido) 
    return html.replace(/<p class="paragrafoPadrao">\s*\(omitido\)\s*<\/p>/gi, "")
               .replace(/<p class="paragrafoPadrao">\s*<\/p>/gi, "")
               .trim();
}