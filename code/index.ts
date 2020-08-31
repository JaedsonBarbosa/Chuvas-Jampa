import { ContextoGeral } from "./contextoGeral"
import { IEstacaoDetalhada, EstacaoEssencial } from "./estacao"
import { NiveisPerigo } from "./niveis";
import { DadosGeograficos } from "./geografia"

const params = new URLSearchParams(location.search)

// Primeiro definimos as animações e o final
const player = document.querySelector("lottie-player") as any
let concluido = false;
let erro = false;
player.addEventListener("loop", (x: Event) => {
    if (concluido) {
        player.stop()
        player.remove()
        //const pularMapa = params.get('pularMapa') ?? false
        const ctrSucesso = document.getElementById('ctrSucesso')
        ctrSucesso.style.visibility = 'visible'
    } else if (erro) {
        player.stop()
        player.loop = false
        player.load('https://assets4.lottiefiles.com/packages/lf20_KWZHHd.json')
    }
})
player.play()

// Analisamos se há novas configurações
const contexto = new ContextoGeral(false)
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
    const registros =  corpo as IRespostaRegistros;
    const estacoes = registros.estacoes.map(x => new EstacaoEssencial(x));

    contexto.estacoes = estacoes
    contexto.ultimaAtualizacao = registros.data

    const dadosGeograficos = new DadosGeograficos(0.2);
    const canvas = document.createElement("canvas");
    canvas.width = dadosGeograficos.largura;
    canvas.height = dadosGeograficos.altura;
    const canvasContext = canvas.getContext("2d");
    const imageData = canvasContext.createImageData(dadosGeograficos.largura, dadosGeograficos.altura);
    const pontos: number[][] = [];
    for (let lat = dadosGeograficos.latMax; lat >= dadosGeograficos.latMin; lat -= dadosGeograficos.passo)
        for (let lon = dadosGeograficos.lonMin; lon <= dadosGeograficos.lonMax; lon += dadosGeograficos.passo)
            pontos.push([lat, lon]);
    const precipitacoes = pontos.map(v => contexto.CalcularChuva(v[0], v[1]));
    const niveis = NiveisPerigo.GerarNiveis(precipitacoes, cor);
    precipitacoes.forEach((ponto, iPonto) => niveis.GetCor(ponto).forEach((cor, iCor) => imageData.data[iPonto * 4 + iCor] = cor));
    canvasContext.putImageData(imageData, 0, 0);
    contexto.imagemChuvas = canvas.toDataURL("image/png");
    contexto.niveis = niveis

    // Um leve delay pra quando a operação for muito rápida
    setTimeout(() => concluido = true, 1000);
})()

interface IRespostaRegistros {
    readonly estacoes: IEstacaoDetalhada[];
    readonly data: number;
}
