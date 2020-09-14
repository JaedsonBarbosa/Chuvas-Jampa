const ctrInicio = document.getElementById('ctrInicio') as HTMLButtonElement
ctrInicio.onclick = () => {
    document.body.className = 'fade-out'
    setTimeout(() => location.href = '.', 2000)
}

setTimeout(() => document.body.classList.add('fade-in'), 1000);