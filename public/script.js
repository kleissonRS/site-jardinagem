// ==========================================================================
// VERDE & VIDA PAISAGISMO - SCRIPT INTERATIVO & INTEGRAÇÃO
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Efeito do Header no Scroll
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2. Menu Mobile Toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.className = 'fa-solid fa-xmark';
            } else {
                icon.className = 'fa-solid fa-bars';
            }
        });

        // Fechar menu mobile ao clicar em qualquer link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                if (mobileToggle.querySelector('i')) {
                    mobileToggle.querySelector('i').className = 'fa-solid fa-bars';
                }
            });
        });
    }

    // 3. Animações de Scroll (IntersectionObserver)
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    reveals.forEach(el => observer.observe(el));

    // 4. Simulador Interativo de Orçamento
    const serviceCards = document.querySelectorAll('.option-card');
    const areaSlider = document.getElementById('area-slider');
    const areaValDisplay = document.getElementById('area-val');
    const estimativaDisplay = document.getElementById('estimativa-preco');

    let selectedServiceBase = 150;
    let selectedServiceName = 'Manutenção de Jardim';

    serviceCards.forEach(card => {
        card.addEventListener('click', () => {
            serviceCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedServiceBase = parseFloat(card.dataset.base || 150);
            selectedServiceName = card.dataset.servico || 'Manutenção de Jardim';
            calcularEstimativa();
        });
    });

    if (areaSlider) {
        areaSlider.addEventListener('input', (e) => {
            areaValDisplay.innerText = e.target.value;
            calcularEstimativa();
        });
    }

    function calcularEstimativa() {
        const area = parseFloat(areaSlider ? areaSlider.value : 50);
        // Cálculo com valor base por m² e fator de escala
        const valorMin = Math.round(selectedServiceBase + (area * 3.5));
        const valorMax = Math.round(valorMin * 1.35);

        if (estimativaDisplay) {
            estimativaDisplay.innerText = `R$ ${valorMin.toLocaleString('pt-BR')} - R$ ${valorMax.toLocaleString('pt-BR')}`;
        }
    }

    window.preencherFormularioComSimulacao = function() {
        const servicoSelect = document.getElementById('servico');
        const areaInput = document.getElementById('area');
        
        if (servicoSelect) servicoSelect.value = selectedServiceName;
        if (areaInput) areaInput.value = `${areaSlider ? areaSlider.value : 50}m² (Estimativa: ${estimativaDisplay ? estimativaDisplay.innerText : ''})`;

        const orcamentoSec = document.getElementById('orcamento');
        if (orcamentoSec) {
            orcamentoSec.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // 5. Comparador Antes & Depois (Slider Arrastável)
    const baRange = document.getElementById('ba-range');
    const baBefore = document.getElementById('ba-before');
    const baHandle = document.getElementById('ba-handle');

    if (baRange && baBefore && baHandle) {
        baRange.addEventListener('input', (e) => {
            const val = e.target.value;
            baBefore.style.width = `${val}%`;
            baHandle.style.left = `${val}%`;
        });
    }

    // 6. Galeria Filtrável
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;
            galleryItems.forEach(item => {
                if (filter === 'all' || item.dataset.category === filter) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // 7. FAQ Accordion
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(q => {
        q.addEventListener('click', () => {
            const item = q.parentElement;
            item.classList.toggle('active');
        });
    });

    // 8. Envio de Formulário de Contato / Orçamento
    const formContato = document.getElementById('form-contato');
    if (formContato) {
        formContato.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nome = document.getElementById('nome').value;
            const telefone = document.getElementById('telefone').value;
            const email = document.getElementById('email').value;
            const servico = document.getElementById('servico').value;
            const area = document.getElementById('area').value;
            const mensagem = document.getElementById('mensagem').value;

            const btnSubmit = formContato.querySelector('button[type="submit"]');
            const textoOriginal = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processando...';
            btnSubmit.disabled = true;

            try {
                const response = await fetch('/api/orcamento', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, telefone, email, servico, area, mensagem })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    const protocolId = data.id || 'ORC-' + Date.now().toString().slice(-6);
                    abrirModalSucesso(protocolId, nome, servico, area, mensagem);
                    formContato.reset();
                } else {
                    alert(data.message || 'Erro ao enviar orçamento.');
                }
            } catch (error) {
                console.error('Erro na requisição:', error);
                // Fallback para envio direto pelo WhatsApp se o servidor falhar
                const protocolFallback = 'ORC-' + Date.now().toString().slice(-6);
                abrirModalSucesso(protocolFallback, nome, servico, area, mensagem);
            } finally {
                btnSubmit.innerHTML = textoOriginal;
                btnSubmit.disabled = false;
            }
        });
    }

    function abrirModalSucesso(protocolo, nome, servico, area, mensagem) {
        const modal = document.getElementById('modal-sucesso');
        const protocoloDisplay = document.getElementById('protocolo-num');
        const waBtn = document.getElementById('modal-wa-btn');

        if (protocoloDisplay) protocoloDisplay.innerText = protocolo;

        // Texto formatado para o WhatsApp
        const textoWA = `Olá Verde & Vida! Solicitei um orçamento pelo site com o protocolo *${protocolo}*.
*Nome:* ${nome}
*Serviço:* ${servico}
*Área:* ${area || 'Não especificada'}
*Mensagem:* ${mensagem || 'Gostaria de agendar uma visita.'}`;

        const urlWA = `https://wa.me/5548988678616?text=${encodeURIComponent(textoWA)}`;
        if (waBtn) waBtn.href = urlWA;

        if (modal) modal.classList.add('active');
    }

    window.fecharModalSucesso = function() {
        const modal = document.getElementById('modal-sucesso');
        if (modal) modal.classList.remove('active');
    };

    window.selecionarServicoForm = function(servicoNome) {
        const servicoSelect = document.getElementById('servico');
        if (servicoSelect) servicoSelect.value = servicoNome;
        const formSec = document.getElementById('orcamento');
        if (formSec) formSec.scrollIntoView({ behavior: 'smooth' });
    };

    // Calcular primeira estimativa ao carregar
    calcularEstimativa();

    // ======================================================================
    // 9. POPUP PROMOCIONAL COM TIMER (Aparece após 8 segundos)
    // ======================================================================
    let promoShown = false;
    let promoCountdownInterval = null;

    function mostrarPromoPopup() {
        if (promoShown) return;
        promoShown = true;
        const popup = document.getElementById('promo-popup');
        if (popup) popup.classList.add('active');
        iniciarPromoCountdown();
    }

    window.fecharPromoPopup = function() {
        const popup = document.getElementById('promo-popup');
        if (popup) popup.classList.remove('active');
        if (promoCountdownInterval) clearInterval(promoCountdownInterval);
    };

    // Timer: Popup aparece após 8 segundos na página
    setTimeout(() => {
        mostrarPromoPopup();
    }, 8000);

    // Exit Intent: Se o mouse sair da página (desktop), mostrar popup
    document.addEventListener('mouseleave', function(e) {
        if (e.clientY <= 0) {
            mostrarPromoPopup();
        }
    });

    // Countdown regressivo do popup (15 minutos fake de urgência)
    function iniciarPromoCountdown() {
        let totalSeconds = 15 * 60; // 15 minutos
        const countdownEl = document.getElementById('promo-countdown');
        if (!countdownEl) return;

        promoCountdownInterval = setInterval(() => {
            totalSeconds--;
            if (totalSeconds <= 0) {
                clearInterval(promoCountdownInterval);
                countdownEl.innerText = '00:00';
                return;
            }
            const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
            const sec = (totalSeconds % 60).toString().padStart(2, '0');
            countdownEl.innerText = `${min}:${sec}`;
        }, 1000);
    }

    // ======================================================================
    // 10. BARRA DE URGÊNCIA - COUNTDOWN DIÁRIO
    // ======================================================================
    function iniciarCountdownBarra() {
        const timerEl = document.getElementById('countdown-timer');
        if (!timerEl) return;

        // Conta regressiva até meia-noite (fim do dia)
        function updateTimer() {
            const agora = new Date();
            const meiaNoite = new Date();
            meiaNoite.setHours(23, 59, 59, 0);
            const diff = meiaNoite - agora;

            if (diff <= 0) {
                timerEl.innerText = '⏰ Últimos minutos!';
                return;
            }

            const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
            const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
            const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
            timerEl.innerText = `⏰ ${h}:${m}:${s}`;
        }

        updateTimer();
        setInterval(updateTimer, 1000);
    }

    iniciarCountdownBarra();

});