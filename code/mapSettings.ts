import { ContextoGeral } from "./contextoGeral";

let contexto = new ContextoGeral(false, false)

var ctrTempo1 = document.getElementById('ctrTempo1') as HTMLInputElement;
ctrTempo1.checked = contexto.escalaTempo === 1;

var ctrTempo3 = document.getElementById('ctrTempo3') as HTMLInputElement;
ctrTempo3.checked = contexto.escalaTempo === 3;

var ctrTempo12 = document.getElementById('ctrTempo12') as HTMLInputElement;
ctrTempo12.checked = contexto.escalaTempo === 12;

var ctrTempo24 = document.getElementById('ctrTempo24') as HTMLInputElement;
ctrTempo24.checked = contexto.escalaTempo === 24;

var ctrCorSuave = document.getElementById('ctrCorSuave') as HTMLInputElement;
ctrCorSuave.checked = contexto.paletaCor === 0;

var ctrCorAgressiva = document.getElementById('ctrCorAgressiva') as HTMLInputElement;
ctrCorAgressiva.checked = contexto.paletaCor === 1;