import { ContextoGeral } from "./contextoGeral";

let contexto = new ContextoGeral(true, false)

if (contexto.mapaPronto) {
    const ctrOpcoes = document.getElementById('ctrOpcoes')
    ctrOpcoes.innerHTML = contexto.estacoes.map(v => `
    <div class="inputGroup">
        <input id="${v.idestacao}" name="idEstacao" type="radio" value="${v.idestacao}" required />
        <label for="${v.idestacao}">${v.nomeestacao}</label>
    </div>`).join('')
} else {
    location.replace('.?diretoEscolhaEstacao')
}

//AQUI A META É CRIAR OS RADIOS PRA ESCOLHER A ESTAÇÃO
//PRA FACILITAR TUDO SERÁ USADO UM SIMPLES FORM
//TAMBÉM DEVE SER USADO O REQUIRED PARA QUE UM SEJA ESCOLHIDO
//DEPOIS É SÓ FAZER O RESTO DA LÓGICA DA PÁGINA DE DETALHES