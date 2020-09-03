import { ContextoGeral } from "./contextoGeral"
import { IEstacaoDetalhada, GetMedicao } from "./estacao"
import { GerenciadorCores } from "./cores";
import { DadosGeograficos } from "./geografia"

const contexto = new ContextoGeral(false, false)
const params = new URLSearchParams(location.search)
let idEstacao = params.get('idEstacao')
let diretoMapa = false

// Primeiro definimos as animações e o final
const player = document.querySelector("lottie-player") as any
let concluido = false;
let erro = false;
player.addEventListener("loop", (x: Event) => {
    if (concluido) {
        player.stop()
        player.remove()
        contexto.mapaPronto = true
        if (params.has('diretoEscolhaEstacao')) {
            location.replace('graphSettings.html')
        } else if (idEstacao) {
            location.replace('graph.html')
        } else if (diretoMapa || params.has('diretoMapa')) {
            location.replace('map.html')
        } else {
            const ctrSucesso = document.getElementById('ctrSucesso')
            ctrSucesso.style.visibility = 'visible'
        }
    } else if (erro) {
        player.stop()
        player.loop = false
        player.load('https://assets4.lottiefiles.com/packages/lf20_KWZHHd.json')
    }
})
player.play()

if (idEstacao && contexto.mapaPronto) {
    (async () => {
        const resp = await fetch(`https://us-central1-chuvasjampa.cloudfunctions.net/obterAcumuladoHora?idEstacao=${idEstacao}&horas=340`);
        if (resp.status !== 200) {
            erro = true
            return
        }
        const corpo = await resp.json();
        const dadosCarregados = corpo as {
            horarios: string[];
            datas: string[];
            acumulados: (number|null)[][];
            readonly data: number;
        }

        const ultAtt = document.getElementById('ultimaAtualizacao');
        ultAtt.style.visibility = 'visible'
        ultAtt.innerHTML = new Date(dadosCarregados.data).toLocaleString()

        function CorrigirData(dia: string, hora: string) {
            const partesDia = dia.split('/');
            const horaNum = Number(hora.replace('h', ''));
            const data = new Date(Number(partesDia[2]), Number(partesDia[1]) - 1, Number(partesDia[0]), horaNum);
            data.setHours(data.getHours() - 3);
            return data;
        }
        let indexData = 0;
        const valores: number[] = [];
        const legendas = dadosCarregados.horarios.map((v, i) => {
            const retorno = CorrigirData(dadosCarregados.datas[indexData], v)
            const valor = dadosCarregados.acumulados[indexData][i] ?? 0;
            valores.push(Number.isNaN(valor) ? 0 : valor);
            if (v === '23h') { indexData++; }
            return retorno.valueOf();
        });
        contexto.valores = valores
        contexto.legendas = legendas

        // Um leve delay pra quando a operação for muito rápida
        setTimeout(() => concluido = true, 2000);
    })()
} else {
    // Analisamos se há novas configurações
    let tempo: number
    let cor: number
    if (params.has('tempo') && params.has('cor')) {
        const tempoNovo = params.get('tempo')
        const corNova = params.get('cor')
        const tempoValido = tempoNovo === '1' || tempoNovo === '3' || tempoNovo === '12' || tempoNovo === '24'
        const corValida = corNova === '0' || corNova === '1'
        if (tempoValido && corValida) {
            localStorage.setItem('escalaTempo', tempoNovo)
            localStorage.setItem('paletaCor', corNova)
            tempo = Number(tempoNovo)
            cor = Number(corNova);
            diretoMapa = true
        }
    } else {
        tempo = contexto.escalaTempo;
        cor = contexto.paletaCor;
    }

    // Fazemos a requisição e processamos
    (async () => {
        const resp = await fetch("https://us-central1-chuvasjampa.cloudfunctions.net/obterRegistros");
        if (resp.status !== 200) {
            erro = true
            return
        }
        const corpo = await resp.json();
        const registros = corpo as {
            readonly estacoes: IEstacaoDetalhada[];
            readonly data: number;
        };

        const ultAtt = document.getElementById('ultimaAtualizacao');
        ultAtt.style.visibility = 'visible'
        ultAtt.innerHTML = new Date(registros.data).toLocaleString()

        contexto.estacoes = registros.estacoes
        const dadosGeograficos = new DadosGeograficos(0.2);
        const canvas = document.createElement("canvas");
        canvas.width = dadosGeograficos.largura;
        canvas.height = dadosGeograficos.altura;
        const canvasContext = canvas.getContext("2d");
        const imageData = canvasContext.createImageData(dadosGeograficos.largura, dadosGeograficos.altura);
        const niveis = new GerenciadorCores(registros.estacoes.map(v => GetMedicao(v, contexto.escalaTempo)), cor);
        const quantNiveis = niveis.cores.length
        const passo = (niveis.valorMaximo - niveis.valorMinimo) / (quantNiveis - 1)
        let iPonto = 0
        for (let lat = dadosGeograficos.latMax; lat >= dadosGeograficos.latMin; lat -= dadosGeograficos.passo)
            for (let lon = dadosGeograficos.lonMin; lon <= dadosGeograficos.lonMax; lon += dadosGeograficos.passo) {
                const precipitacao = contexto.CalcularChuva(lat, lon);
                let corPonto: number[]
                for (let i = 0, nivel = niveis.valorMinimo; i < quantNiveis; i++, nivel += passo) {
                    if (nivel >= precipitacao) {
                        if (i === 0) {
                            corPonto = niveis.cores[0]
                            break
                        }
                        const corMinima = niveis.cores[i - 1], corMaxima = niveis.cores[i];
                        const minimo = nivel - passo, maximo = nivel;
                        const relacao = (precipitacao - minimo) / (maximo - minimo)
                        corPonto = corMinima.map((v, i) => v + relacao * (corMaxima[i] - v));
                        break
                    } else if (i == quantNiveis - 1) {
                        corPonto = niveis.cores[quantNiveis - 1]
                        break
                    }
                }
                corPonto.forEach((cor, iCor) => imageData.data[iPonto * 4 + iCor] = cor)
                iPonto += 1
            }
        canvasContext.putImageData(imageData, 0, 0);
        contexto.imagemChuvas = canvas.toDataURL("image/png");
        contexto.cores = niveis

        // Um leve delay pra quando a operação for muito rápida
        setTimeout(() => concluido = true, 2000);
    })()
}
