/**
 * Gera a estrutura HTML da Tabela NSC (Template Visual).
 * @param {Object} dados - Objeto contendo o array de linhas e dados do precatório.
 */
function gerarTabelaNSCHTML(dados) {
    
    // 1. Gera o HTML de cada linha individual percorrendo o array processado
    let linhasHTML = "";
    dados.linhasNSC.forEach(row => {
        linhasHTML += `
  <tr>
    <td style="border:1px solid #000; padding:5px;">${row.data}</td>
    <td style="border:1px solid #000; padding:5px;">${row.tipo}</td>
    <td style="border:1px solid #000; padding:5px;">${row.percentual}%</td>
    <td style="border:1px solid #000; padding:5px;">${row.de}</td>
    <td style="border:1px solid #000; padding:5px;">${row.para}</td>
    <td style="border:1px solid #000; padding:5px;">${row.evento}</td>
    <td style="border:1px solid #000; padding:5px;">${row.observacao}</td>
  </tr>`;
    });

    // 2. Retorna a tabela completa com o cabeçalho dinâmico
    return `
<table style="width:100%; text-align:center; border:1px solid #000; border-collapse:collapse; table-layout:auto;">
  <tr>
    <th colspan="7" style="text-align:center; font-size:14px; font-weight:bold;">DADOS PARA LANÇAMENTO</th>
  </tr>
  <tr>
    <td colspan="7" style="text-align:center; font-size:14px; font-weight:bold;">
      Precatório: ${dados.numero} / ${dados.natureza} / ${dados.vencimento} / ${dados.devedor}
    </td>
  </tr>
  <tr style="background-color:#f2f2f2">
    <th style="border:1px solid #000; padding:5px;">Data da Comunicação</th>
    <th style="border:1px solid #000; padding:5px;">Tipo</th>
    <th style="border:1px solid #000; padding:5px;">%</th>
    <th style="border:1px solid #000; padding:5px;">DE</th>
    <th style="border:1px solid #000; padding:5px;">PARA</th>
    <th style="border:1px solid #000; padding:5px;">Evento Eproc</th>
    <th style="border:1px solid #000; padding:5px;">Observação</th>
  </tr>
  ${linhasHTML}
</table>`.trim();
}