var params = new URLSearchParams(location.search);
if (params.has('tempo') && params.has('cor')) {
    var tempo = params.get('tempo');
    var cor = params.get('cor');
    var tempoValido = tempo === '1' || tempo === '3' || tempo === '12' || tempo === '24';
    var corValida = cor === '0' || cor === '1';
    if (tempoValido && corValida){
        localStorage.setItem('escalaTempo', tempo)
        localStorage.setItem('paletaCor', cor)
    }
}
var ctrDefault = document.getElementById('ctrDefault');
ctrDefault.style.visibility = "visible";
