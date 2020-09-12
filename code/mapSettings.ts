import { ContextoGeral } from "./contextoGeral";

const contexto = new ContextoGeral(false, false)

const ctrTempo1 = document.getElementById('ctrTempo1') as HTMLInputElement;
ctrTempo1.checked = contexto.escalaTempo === 1;

const ctrTempo3 = document.getElementById('ctrTempo3') as HTMLInputElement;
ctrTempo3.checked = contexto.escalaTempo === 3;

const ctrTempo12 = document.getElementById('ctrTempo12') as HTMLInputElement;
ctrTempo12.checked = contexto.escalaTempo === 12;

const ctrTempo24 = document.getElementById('ctrTempo24') as HTMLInputElement;
ctrTempo24.checked = contexto.escalaTempo === 24;

const ctrCorSuave = document.getElementById('ctrCorSuave') as HTMLInputElement;
ctrCorSuave.checked = contexto.paletaCor === 0;

const ctrCorAgressiva = document.getElementById('ctrCorAgressiva') as HTMLInputElement;
ctrCorAgressiva.checked = contexto.paletaCor === 1;

const form = document.getElementsByTagName('form')[0]
const salvar = document.getElementById('ctrSalvar') as HTMLButtonElement
salvar.onclick = ev => {
    form.className = 'fade-out'
    setTimeout(() => form.submit(), 2500)
}
setTimeout(() => form.className = 'fade-in', 1000)