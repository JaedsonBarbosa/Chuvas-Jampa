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

const form = document.getElementsByTagName('form')[0]
const salvar = document.getElementById('ctrSalvar') as HTMLButtonElement
salvar.onclick = () => {
    document.body.className = 'fade-out'
    setTimeout(() => form.submit(), 2500)
}
setTimeout(() => document.body.className = 'fade-in', 1000)