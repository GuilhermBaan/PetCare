const API = "http://127.0.0.1:8000/auth";


function showLoading(buttonId, textId, originalText, isLoading = true) {
    const button = document.getElementById(buttonId);
    const textElement = document.getElementById(textId);
    
    if (isLoading) {
        button.disabled = true;
        textElement.innerHTML = originalText + '<span class="loading"></span>';
        button.style.opacity = '0.7';
    } else {
        button.disabled = false;
        textElement.textContent = originalText;
        button.style.opacity = '1';
    }
}

function showMessage(msgId, message, isError = false, timeout = 5000) {
    const msg = document.getElementById(msgId);
    msg.innerHTML = message;
    msg.style.color = isError ? '#ff7675' : '#00b894';
    
    if (!isError) {
        msg.style.background = 'rgba(0, 184, 148, 0.1)';
        msg.style.border = '1px solid #00b894';
        msg.style.borderRadius = '10px';
        msg.style.padding = '10px';
    }
    
    if (timeout > 0) {
        setTimeout(() => {
            msg.innerHTML = '';
            msg.style.background = '';
            msg.style.border = '';
            msg.style.padding = '';
        }, timeout);
    }
}

// 🔐 LOGIN
const loginBtn = document.getElementById("loginBtn");
const loginEmail = document.getElementById("email");
const loginPassword = document.getElementById("password");
const loginMsg = document.getElementById("msg");

if (loginBtn && loginEmail && loginPassword && loginMsg) {
    loginBtn.onclick = async () => {
        const email = loginEmail.value.trim();
        const password = loginPassword.value;

        if (!email || !password) {
            showMessage("msg", "⚠️ Por favor, preencha todos os campos!", true);
            shakeElement(loginBtn);
            return;
        }

        // Validar formato do email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage("msg", "📧 Por favor, insira um e-mail válido!", true);
            shakeElement(loginEmail);
            return;
        }

        showLoading("loginBtn", "loginBtnText", "🚪 Entrando no Sistema");

        try {
            const resp = await fetch(`${API}/login`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({email, password})
            });

            const data = await resp.json();

            if (!resp.ok) {
                let errorMessage = "Erro ao fazer login";
                
                if (resp.status === 401) {
                    errorMessage = "🔐 E-mail ou senha incorretos";
                } else if (resp.status === 429) {
                    errorMessage = "⏰ Muitas tentativas. Tente novamente em alguns minutos";
                } else if (data.detail) {
                    errorMessage = data.detail;
                }
                
                showMessage("msg", errorMessage, true);
                shakeElement(loginBtn);
                return;
            }

            // Sucesso!
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("userEmail", email);
            
            showMessage("msg", "🎉 Login realizado com sucesso! Redirecionando...", false, 0);
            
            // Animação de sucesso
            createConfetti();
            
            // Redirecionar após 2 segundos
            setTimeout(() => {
                window.location.href = "../index.html";
            }, 2000);

        } catch (error) {
            console.error("Erro no login:", error);
            showMessage("msg", "🌐 Erro de conexão com o servidor. Verifique sua internet.", true);
        } finally {
            showLoading("loginBtn", "loginBtnText", "🚪 Entrar no Sistema", false);
        }
    };
}

// 📝 CADASTRO
const cadBtn = document.getElementById("cadBtn");
const cadNome = document.getElementById("nome");
const cadEmail = document.getElementById("email");
const cadPassword = document.getElementById("password");
const cadMsg = document.getElementById("msg");

if (cadBtn && cadNome && cadEmail && cadPassword && cadMsg) {
    cadBtn.onclick = async () => {
        const nome = cadNome.value.trim();
        const email = cadEmail.value.trim();
        const password = cadPassword.value;

        // Validações
        if (!nome || !email || !password) {
            showMessage("msg", "⚠️ Por favor, preencha todos os campos!", true);
            shakeElement(cadBtn);
            return;
        }

        if (nome.length < 3) {
            showMessage("msg", "👤 Seu nome deve ter pelo menos 3 caracteres!", true);
            shakeElement(cadNome);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage("msg", "📧 Por favor, insira um e-mail válido!", true);
            shakeElement(cadEmail);
            return;
        }

        if (password.length < 6) {
            showMessage("msg", "🔐 A senha deve ter pelo menos 6 caracteres!", true);
            shakeElement(cadPassword);
            return;
        }

        showLoading("cadBtn", "cadBtnText", "🎉 Criando Minha Conta");

        try {
            const resp = await fetch(`${API}/register`, {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({nome, email, password})
            });

            const data = await resp.json();

            if (!resp.ok) {
                let errorMessage = "Erro ao criar conta";
                
                if (resp.status === 400 && data.detail && data.detail.includes("email")) {
                    errorMessage = "📧 Este e-mail já está cadastrado. Tente fazer login!";
                } else if (data.detail) {
                    errorMessage = data.detail;
                }
                
                showMessage("msg", errorMessage, true);
                shakeElement(cadBtn);
                return;
            }

            // Sucesso!
            showMessage("msg", "🎉 Conta criada com sucesso! Redirecionando para o login...", false, 0);
            
            // Animação de sucesso
            createConfetti();
            
            // Redirecionar para login após 2.5 segundos
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2500);

        } catch (error) {
            console.error("Erro no cadastro:", error);
            showMessage("msg", "🌐 Erro de conexão com o servidor. Verifique sua internet.", true);
        } finally {
            showLoading("cadBtn", "cadBtnText", "🎉 Criar Minha Conta", false);
        }
    };
}

// 🎨 Função de animação de shake
function shakeElement(element) {
    element.style.animation = 'none';
    setTimeout(() => {
        element.style.animation = 'shake 0.5s ease';
    }, 10);
}

// 🎊 Função de confete (versão简化)
function createConfetti() {
    const colors = ['#ff7675', '#fdcb6e', '#00b894', '#74b9ff', '#a29bfe'];
    const confettiCount = 30;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
                animation: confettiFall 1s ease-out forwards;
                transform: translate(-50%, -50%) rotate(${Math.random() * 360}deg);
            `;
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 1000);
        }, i * 50);
    }
}

// Adicionar CSS de confete ao documento
const confettiCSS = `
@keyframes confettiFall {
    0% {
        transform: translate(-50%, -50%) translateY(0) rotate(0deg);
        opacity: 1;
    }
    100% {
        transform: translate(calc(-50% + ${Math.random() * 200 - 100}px), calc(-50% + ${Math.random() * 200 + 100}px)) translateY(100vh) rotate(${Math.random() * 720}deg);
        opacity: 0;
    }
}
`;

const style = document.createElement('style');
style.textContent = confettiCSS;
document.head.appendChild(style);

// 🔓 Função de logout global
window.logout = function() {
    if (confirm('🐾 Tem certeza que deseja sair do sistema?')) {
        localStorage.removeItem("token");
        localStorage.removeItem("userEmail");
        showMessage("msg", "👋 Até logo! Redirecionando...", false, 0);
        
        setTimeout(() => {
            window.location.href = "../index.html";
        }, 1000);
    }
};

// 🔄 Verificar se já está logado e redirecionar
window.addEventListener('load', () => {
    const token = localStorage.getItem("token");
    
    if (token && (window.location.pathname.includes('login.html') || window.location.pathname.includes('cadastro.html'))) {
        // Se já tem token e está na página de login/cadastro, redirecionar
        showMessage("msg", "🐾 Você já está logado! Redirecionando...", false, 0);
        
        setTimeout(() => {
            window.location.href = "../index.html";
        }, 1500);
    }
});

// 🎯 Melhorar experiência com atalhos de teclado
document.addEventListener('keydown', function(e) {
    // Ctrl+Enter para enviar formulários
    if (e.ctrlKey && e.key === 'Enter') {
        if (loginBtn) loginBtn.click();
        if (cadBtn) cadBtn.click();
    }
    
    // Esc para limpar mensagens
    if (e.key === 'Escape') {
        const msg = document.getElementById('msg');
        if (msg) msg.innerHTML = '';
    }
});

// 💾 Auto-salvar dados do formulário de cadastro
if (cadNome && cadEmail && cadPassword) {
    // Carregar dados salvos
    const savedNome = localStorage.getItem('cadNome');
    const savedEmail = localStorage.getItem('cadEmail');
    
    if (savedNome) cadNome.value = savedNome;
    if (savedEmail) cadEmail.value = savedEmail;
    
    // Salvar enquanto digita
    [cadNome, cadEmail].forEach(input => {
        input.addEventListener('input', () => {
            localStorage.setItem('cad' + input.id.charAt(0).toUpperCase() + input.id.slice(1), input.value);
        });
    });
    
    // Limpar senha ao carregar página
    cadPassword.value = '';
}