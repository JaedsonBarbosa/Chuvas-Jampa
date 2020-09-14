import { ContextoGeral } from "./contextoGeral";
import * as Chartist from "./chartist"
import { GerenciadorCores, PaletasCores } from "./cores";

class Legenda {
    constructor(readonly texto: string, readonly ignorar: boolean, readonly cor: number[]) {}
    public toString = () : string => this.ignorar ? '' : this.texto;
}

class Grafico {
    private grafico: any;
    constructor (readonly idPai:string) {}

    Atualizar(legendas: Legenda[], valores: number[]) {
        if (this.grafico === undefined) {
            this.grafico = new Chartist.Bar(this.idPai, {
                labels: legendas,
                series: [valores]
            },
            { fullWidth: true, chartPadding: { left: 0, right: 0, top: 0, bottom: 10}});
            this.grafico.on('draw', this.PersonalizarBarras);
        } else {
            this.grafico.update({
                labels: legendas,
                series: [valores]
            });
        }
    }

    private PersonalizarBarras(data) {
        if(data.type === 'bar') {
            const legenda = data.axisX.ticks[data.index] as Legenda;
            const cor = legenda.cor;
            data.element._node.style.stroke = `rgb(${cor[0]}, ${cor[1]}, ${cor[2]}, 1)`; //"#5562eb"
            const valor = data.series[data.index];
            const index = 't' + data.index.toString();
            data.element._node.onmouseenter = (e: MouseEvent) => ExibirInfo(index, `${valor.toFixed(2)} mm<br>${legenda.texto}`, e);
            data.element._node.onmouseout = () => document.getElementById('t' + data.index.toString()).remove();
        }

        function ExibirInfo(index: string, texto: string, e: MouseEvent) {
            function getOffset(element: Element)
            {
                var bound = element.getBoundingClientRect();
                var html = document.documentElement;
                return {
                    top: bound.top + window.pageYOffset - html.clientTop,
                    bottom: bound.bottom + window.pageYOffset - html.clientTop,
                    left: bound.left + window.pageXOffset - html.clientLeft,
                    right: bound.right + window.pageXOffset - html.clientLeft
                };
            }
            
            const div = document.createElement('div');
            const offset = getOffset(e.srcElement as Element);
            div.id = index;
            div.classList.add('tooltip');
            div.style.top = offset.top.toString() + 'px';
            if (offset.right <= 0.5 * document.documentElement.clientWidth) {
                div.style.left = offset.right.toString() + 'px';
                div.classList.add('direto');
            } else {
                div.style.left = offset.left.toString() + 'px';
                div.classList.add('inverso');
            }
            div.innerHTML = texto;
            document.body.appendChild(div);
        }
    }
}

let contexto = new ContextoGeral(true, true)
console.log(contexto.idEstacaoPronta)
if (contexto.idEstacaoPronta) {
    const ctrEstacao = document.getElementById('ctrEstacao')
    ctrEstacao.innerText = contexto.estacoes.find(v => v.idestacao == contexto.idEstacaoPronta).nomeestacao

    function Format(valor: number) { return valor.toString(); }
    function DataString(data:Date) { return `${Format(data.getDate())}/${Format(data.getMonth() + 1)}`; }

    const legendas = contexto.legendas.map(v => new Date(v))
    const graficoHoras = new Grafico('#grafHoras')
    const niveis = new GerenciadorCores(PaletasCores.agressivo).cores.reverse()
    const valoresHora = [60,30,20,0]
    graficoHoras.Atualizar(legendas.map(
        (data,i,a) => new Legenda(
            `${Format(data.getHours())}h\n${DataString(data)}`,
            i % 3 != 0 || i === a.length - 1,
            niveis.find((v1,i1) => contexto.valores[i] >= valoresHora[i1]))), contexto.valores)

    const graficosDias = new Grafico('#grafDias')
    const legendasHoras = legendas.map(v => DataString(v));
    const legendasDias = legendasHoras.filter((v,i,a) => i === a.indexOf(v));
    const valoresDia = legendasDias.map(dia => contexto.valores.filter((v,i) => legendasHoras[i] === dia).reduce((o,c) => o + c, 0))
    const referenciaDia = [100,50,20,0]
    graficosDias.Atualizar(
        legendasDias.map((v,i,a) => new Legenda(
            v,
            i % 2 != 0 || i === a.length - 1,
            niveis.find((v1,i1) => valoresDia[i] >= referenciaDia[i1]))),
            valoresDia)

    document.getElementById('containerHoras').scrollLeft = 999999
} else {
    location.replace('graphSettings.html')
}

const salvar = document.getElementById('ctrOutra') as HTMLButtonElement
salvar.onclick = () => {
    document.body.className = 'fade-out'
    setTimeout(() => location.href = 'graphSettings.html', 2000)
}

const ctrMapa = document.getElementById('ctrMapa') as HTMLButtonElement
ctrMapa.onclick = () => {
    document.body.className = 'fade-out'
    setTimeout(() => location.href = '.', 2000)
}

setTimeout(() => document.body.className = 'fade-in', 1000)