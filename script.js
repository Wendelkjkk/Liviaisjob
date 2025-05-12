document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');
    const errorElement = document.getElementById('error-message');
    const submitButton = document.getElementById('submit-button');

    // Senha válida
    const CORRECT_PASSWORD = "liviakk1";

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const password = passwordInput.value.trim();
        errorElement.classList.remove('visible');
        submitButton.disabled = true;
        submitButton.innerHTML = '<span>Acessando...</span>';

        try {
            // Validação
            if (password === CORRECT_PASSWORD) {
                // Verifica se a página existe antes de redirecionar
                const response = await fetch('storage.html');
                if (response.ok) {
                    window.location.href = "storage.html";
                } else {
                    throw new Error('Página não encontrada');
                }
            } else {
                throw new Error('Senha incorreta');
            }
        } catch (error) {
            submitButton.disabled = false;
            submitButton.innerHTML = '<span>Acessar</span>';
            
            if (error.message.includes('Senha incorreta')) {
                errorElement.textContent = "Senha incorreta. Tente novamente.";
            } else {
                errorElement.textContent = "Erro: storage.html não encontrado!";
                console.error("Erro:", error);
            }
            errorElement.classList.add('visible');
            passwordInput.focus();
        }
    });

    // Reset do botão ao digitar
    passwordInput.addEventListener('input', function() {
        if (submitButton.disabled) {
            submitButton.disabled = false;
            submitButton.innerHTML = '<span>Acessar</span>';
        }
    });
});

// Detecta se é mobile para ajustes específicos  
const isMobile = /Android|webOS|iPhone|iPad/i.test(navigator.userAgent);  

if (isMobile) {  
    console.log("Modo mobile: otimizações ativas");  
    // Exemplo: aumenta área de toque dos botões  
    document.querySelectorAll('button').forEach(btn => {  
        btn.style.minHeight = '44px';  
    });  
}  
