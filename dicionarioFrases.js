const DicionarioFrases = {
    REL_BASE_PERC_INSTRUMENTO: {
        base_total_precatorio: "O instrumento acostado dispõe que a cessão abrange <strong>{{PERC_INSTRUMENTO}}% do valor do precatório</strong>.",
        base_cota_cedente: "O instrumento acostado dispõe que a cessão abrange <strong>{{PERC_INSTRUMENTO}}% do crédito titularizado pelo(s) cedente(s)</strong> no precatório.",
        base_totalidade_cedente_confirmada: "O instrumento acostado dispõe que a cessão abrange <strong>{{PERC_INSTRUMENTO}}% do valor do precatório</strong>, percentual que corresponde a <strong>100% do crédito de titularidade do(a) cedente</strong>.",
        base_conjunta_principal_honorarios: "O instrumento acostado dispõe que a cessão abrange <strong>100% do valor do precatório</strong>, contemplando o crédito principal e os honorários contratuais."
    },
    REL_TIPO_RESSALVA: {
        sem_previsao: "Não existe ressalva quanto à existência de honorários advocatícios contratuais.",
        ressalva_sem_percentual: "Existe ressalva quanto à existência de eventuais honorários advocatícios contratuais, sem indicação expressa do respectivo percentual.",
        ressalva_inclui_periciais_com_percentual_nao_cedidos: "Existe ressalva quanto à existência de honorários advocatícios contratuais, no percentual de <strong>{{PERC_RESSALVA_CONTRATUAIS}}%</strong>, e de honorários periciais, no percentual de <strong>{{PERC_RESSALVA_PERICIAIS}}%</strong>, ambos não integrantes da cessão.",
        ressalva_com_percentual_nao_cedidos: "Existe ressalva quanto à existência de honorários advocatícios contratuais no percentual de <strong>{{PERC_RESSALVA_CONTRATUAIS}}%</strong>, os quais não integram a cessão.",
        ressalva_com_percentual_cedidos: "Existe ressalva quanto à existência de honorários advocatícios contratuais no percentual de <strong>{{PERC_RESSALVA_CONTRATUAIS}}%</strong>, os quais integram a cessão.",
        cessao_exclusiva_contratuais: "O crédito objeto da cessão refere-se exclusivamente a honorários advocatícios contratuais.",
        cessao_exclusiva_sucumbenciais: "O crédito objeto da cessão refere-se exclusivamente a honorários advocatícios sucumbenciais.",
        cessao_exclusiva_periciais: "O crédito objeto da cessão refere-se exclusivamente a honorários periciais.",
        quitados_pelo_cessionario: "Há, ainda, menção a honorários advocatícios contratuais devidos a <strong>{{NOMES_ADVOGADOS}}</strong>, os quais foram quitados diretamente pelo(s) cessionário(s)."
    },
    REL_SUPERPREFERENCIA: {
        sem_previsao: "Não se verifica, na documentação apresentada, informação sobre eventual direito ao recebimento de parcela superpreferencial.",
        englobada_e_nao_recebida: "Nos termos pactuados, a cessão engloba eventual direito à parcela superpreferencial, declarando a parte cedente não ter recebido qualquer adiantamento a este título.",
        englobada_pela_cessao: "Nos termos pactuados, a cessão engloba eventual direito à parcela superpreferencial.",
        renunciada: "Nos termos pactuados, o(s) cedente(s) declara(m) renunciar a eventual direito ao recebimento de parcela superpreferencial.",
        mantida: "Nos termos pactuados, o(s) cedente(s) declara(m) manter eventual direito ao recebimento de parcela superpreferencial.",
        nao_recebida: "Nos termos pactuados, o(s) cedente(s) declara(m) não ter(em) recebido qualquer adiantamento relativo à parcela superpreferencial.",
        ja_recebida: "Nos termos pactuados, o(s) cedente(s) declara(m) o prévio recebimento de adiantamento relativo à parcela superpreferencial."
    },
    REL_REQUERIMENTO_DESTAQUE: {
        nao: "(omitido)",
        sim: "Ademais, {{PREFIXO_PEDIDO}} {{EVENTO_PEDIDO_DESTAQUE}}, há requerimento de destaque de honorários advocatícios contratuais, no percentual de <strong>{{PERC_DEFERIDO_AGORA}}%</strong>, em favor de <strong>{{BENEFICIARIO_PEDIDO_DESTAQUE}}</strong>."
    },
    DEC_DESTAQUE_HONORARIOS: {
        ja_destacados_sem_req: "Consta, {{PREFIXO_PREVIO}} {{EVENTO_DESTAQUE_PREVIO}}, destaque de honorários advocatícios contratuais no percentual de <strong>{{PERC_DESTAQUE_PREVIO}}%</strong>, em favor de <strong>{{BENEFICIARIO_DESTAQUE_PREVIO}}</strong>.",

        ja_destacados_com_req: "Quanto ao requerimento de destaque, consta, {{PREFIXO_PREVIO}} {{EVENTO_DESTAQUE_PREVIO}}, destaque de honorários advocatícios contratuais no percentual de <strong>{{PERC_DESTAQUE_PREVIO}}%</strong>, em favor do(s) Requerente(s). Assim, indefiro o pedido.",

        nao_destacados_com_req_com_contrato: "Quanto ao requerimento de destaque, presentes os pressupostos do art. 8º, §3º, da Resolução n.° 303/2019 do CNJ e do art. 22, §4º, da Lei n.º 8.906/94 (EOAB), <strong>REGISTRE(M)-SE {{BENEFICIARIO_PEDIDO_DESTAQUE}}</strong> como beneficiário(s) dos referidos honorários.",

        nao_destacados_com_req_sem_contrato: "Quanto ao requerimento de destaque, ausente o instrumento exigido pelo art. 8º, §3º, da Resolução n.º 303/2019 do CNJ e pelo art. 22, §4º, da Lei n.º 8.906/94 (EOAB), INDEFIRO, por ora, o pedido.",

        nao_destacados_sem_req_com_ressalva: "Não há registro de destaque de honorários advocatícios contratuais nos autos. O destaque depende de requerimento expresso, devidamente instruído com o respectivo instrumento, protocolado antes da ordem de pagamento, nos termos do art. 22, §4º, da Lei n.º 8.906/94, c/c o art. 8º, §3º, da Resolução n.° 303/2019 do CNJ.",

        nao_destacados_sem_req_sem_ressalva: "Não há registro de destaque de honorários advocatícios contratuais nos autos.",

        nao_destacados_com_req_quitados: "Quanto ao requerimento de destaque, uma vez que os honorários foram quitados diretamente pelo(s) cessionário(s), conforme pactuado, resta prejudicada a análise do pedido.",

        nao_destacados_sem_req_quitados: "Quanto à quitação dos honorários contratuais, uma vez que não houve registro de destaque prévio, nada há a prover."
    }
};