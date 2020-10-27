import { ContextoGeral } from "./contextoGeral"
import { IEstacaoDetalhada, GetMedicao } from "./estacao"
import { GerenciadorCores } from "./cores"
import { DadosGeograficos } from "./geografia"

var concluido = false;
var erro = false;
(async () => {
    const contexto = new ContextoGeral(true, false)
    const params = new URLSearchParams(location.search)
    const idEstacao = params.get('idEstacao')
    let diretoMapa = false

    // Primeiro definimos as animações e o final
    const player = document.querySelector("lottie-player") as any
    let ignore = false;
    player.addEventListener("complete", (x: Event) => {
        if (ignore) return
        else player.seek(0)
        if (concluido) {
            player.remove()
            if (params.has('diretoEscolhaEstacao')) {
                location.replace('graphSettings.html')
            } else if (idEstacao) {
                location.replace('graph.html')
            } else if (diretoMapa || params.has('diretoMapa')) {
                location.replace('map.html')
            } else {
                const ctrSucesso = document.getElementById('ctrSucesso')
                ctrSucesso.style.display = 'block'
                setTimeout(() => ctrSucesso.className = 'fade-in', 500)
            }
        } else if (erro) {
            ignore = true
            player.addEventListener('load', () => player.play())
            player.load('https://assets4.lottiefiles.com/packages/lf20_KWZHHd.json')
        } else {
            player.play()
        }
    })
    player.play()

    if (idEstacao && contexto.mapaPronto) {
        if (idEstacao.length === 4) {
            const resp = await fetch(`https://5nyyeipxml.execute-api.us-east-1.amazonaws.com/producao/helloWorld?metodo=obterAcumuladoHora&idEstacao=${idEstacao}&horas=340`);
            if (resp.status !== 200) {
                erro = true
                return
            }
            const corpo = await resp.json();
            const dadosCarregados = corpo as {
                horarios: string[];
                datas: string[];
                acumulados: (number | null)[][];
                readonly data: number;
            }
            console.info('Dados obtidos em: ' + new Date(dadosCarregados.data).toLocaleString())

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
            contexto.idEstacaoPronta = idEstacao
        } else {
            const resp = await fetch(`https://5nyyeipxml.execute-api.us-east-1.amazonaws.com/producao/helloWorld?metodo=obterRegistrosProprios&idEstacao=${idEstacao}`);
            if (resp.status !== 200) {
                erro = true
                return
            }
            const corpo = await resp.json();
            const tempos = (corpo.registros as number[]).map(v => new Date(v));
            const agora = new Date().setMinutes(0, 0, 0);
            const millisPorHora = 3600 * 1000; // Quantidade de milisegundos em uma hora
            const valores: number[] = []
            const legendas: number[] = []
            for (let hora = agora - 340 * millisPorHora; hora <= agora; hora += millisPorHora) {
                legendas.push(hora);
                const quant = tempos.filter(v => v.valueOf() > hora && v.valueOf() - hora < millisPorHora).length;
                valores.push(quant * 0.2);
            }
            contexto.valores = valores
            contexto.legendas = legendas
            contexto.idEstacaoPronta = idEstacao
        }
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
        const resp = await fetch("https://5nyyeipxml.execute-api.us-east-1.amazonaws.com/producao/helloWorld?metodo=obterRegistros");
        if (resp.status !== 200) {
            erro = true
            return
        }
        const corpo = await resp.json();
        const registros = corpo as {
            readonly estacoes: IEstacaoDetalhada[];
            readonly data: number;
        };
        console.info('Dados obtidos em: ' + new Date(registros.data).toLocaleString())

        const estacoes = registros.estacoes;

        const proprias = await fetch("https://5nyyeipxml.execute-api.us-east-1.amazonaws.com/producao/helloWorld?metodo=GetEstacoesProprias");
        if (proprias.status !== 200)
        {
            erro = true
            return
        }
        const estacoesProprias = await proprias.json() as {
            Ativa: boolean
            CodIBGE: number
            Homologacao: boolean
            Local: {_latitude: number, _longitude: number}
            Nome: string
            id: string
        }[];
        for (let i = 0; i < estacoesProprias.length; i++) {
            const cur = estacoesProprias[i];
            if (cur.Homologacao) continue;
            const regs = await fetch(`https://5nyyeipxml.execute-api.us-east-1.amazonaws.com/producao/helloWorld?metodo=obterRegistrosProprios&idEstacao=${cur.id}`);
            if (regs.status === 200) {
                const corpo = await regs.json();
                const tempos = (corpo.registros as number[]).map(v => new Date(v));
                const agora = new Date().setMinutes(0, 0, 0);
                const millisPorHora = 3600 * 1000;
                estacoes.push({
                    _latitude: cur.Local._latitude,
                    _longitude: cur.Local._longitude,
                    codibge: cur.CodIBGE,
                    datahoraUltimovalor: null,
                    idestacao: cur.id,
                    nomeestacao: cur.Nome,
                    siglaRede: "UFPB",
                    ultimovalor: null,
                    acc1hr: tempos.filter(v => v.valueOf() >= agora - millisPorHora).length * 0.2,
                    acc3hr: tempos.filter(v => v.valueOf() >= agora - 3 * millisPorHora).length * 0.2,
                    acc12hr: tempos.filter(v => v.valueOf() >= agora - 12 * millisPorHora).length * 0.2,
                    acc24hr: tempos.filter(v => v.valueOf() >= agora - 24 * millisPorHora).length * 0.2
                } as IEstacaoDetalhada);
            }
        }
        

        contexto.estacoes = estacoes;
        const dadosGeograficos = new DadosGeograficos(0.2);
        const canvas = document.createElement("canvas");
        canvas.width = dadosGeograficos.largura;
        canvas.height = dadosGeograficos.altura;
        const canvasContext = canvas.getContext("2d");
        const imageData = canvasContext.createImageData(dadosGeograficos.largura, dadosGeograficos.altura);
        const niveis = new GerenciadorCores(cor, estacoes.map(v => GetMedicao(v, contexto.escalaTempo)));
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
        contexto.mapaPronto = true
    }
})().then(() => concluido = true).catch(() => erro = true)

const ctrMapa = document.getElementById('ctrMapa') as HTMLButtonElement
ctrMapa.onclick = () => {
    document.body.className = 'fade-out'
    setTimeout(() => location.href = 'map.html', 2000)
}

const ctrGraficos = document.getElementById('ctrGraficos') as HTMLButtonElement
ctrGraficos.onclick = () => {
    document.body.className = 'fade-out'
    setTimeout(() => location.href = 'graphSettings.html', 2000)
}

const ctrSobre = document.getElementById('ctrSobre') as HTMLButtonElement
ctrSobre.onclick = () => {
    document.body.className = 'fade-out'
    setTimeout(() => location.href = 'about.html', 2000)
}