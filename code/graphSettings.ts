import { ContextoGeral } from "./contextoGeral";

let contexto = new ContextoGeral(true, false)

if (contexto.mapaPronto) {
    const ctrOpcoes = document.getElementById('ctrOpcoes')
    contexto.estacoes.forEach(v => {
        `
    <div class="inputGroup">
        <input id="${v.idestacao}" name="idEstacao" type="radio" value="${v.idestacao}" required />
        <label for="${v.idestacao}">${v.nomeestacao}</label>
    </div>`
        const div = document.createElement('div')
        div.className = 'inputGroup'
        const input = document.createElement('input')
        input.id = v.idestacao
        input.name = 'idEstacao'
        input.type = 'radio'
        input.value = v.idestacao
        input.required = true
        div.appendChild(input)
        input.onclick = () => {
            document.body.className = 'fade-out'
            setTimeout(() => location.href = `.?idEstacao=${v.idestacao}`, 2000)
        }
        const label = document.createElement('label')
        label.htmlFor = v.idestacao
        label.innerText = v.nomeestacao
        div.appendChild(label)
        ctrOpcoes.appendChild(div)
    })
} else {
    location.replace('.?diretoEscolhaEstacao')
}

setTimeout(() => document.body.className = 'fade-in', 1000)