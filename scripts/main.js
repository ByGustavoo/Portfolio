const raiz = document.documentElement;
const botaoTema = document.getElementById('alternar-tema');
const botaoMenu = document.getElementById('abrir-menu');
const menu = document.getElementById('menu');
const linksMenu = [...menu.querySelectorAll('.menu-link')];

document.getElementById('ano').textContent = new Date().getFullYear();

const temaAtual = () => {
    if (raiz.dataset.theme) return raiz.dataset.theme;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const atualizarRotuloTema = () => {
    const proximo = temaAtual() === 'dark' ? 'claro' : 'escuro';
    botaoTema.setAttribute('aria-label', `Ativar tema ${proximo}`);
    botaoTema.title = `Ativar tema ${proximo}`;
};

botaoTema.addEventListener('click', () => {
    const novo = temaAtual() === 'dark' ? 'light' : 'dark';
    raiz.dataset.theme = novo;
    try {
        localStorage.setItem('tema', novo);
    } catch (e) {}
    atualizarRotuloTema();
});

atualizarRotuloTema();

const fecharMenu = (devolverFoco) => {
    menu.classList.remove('menu-aberto');
    botaoMenu.setAttribute('aria-expanded', 'false');
    botaoMenu.setAttribute('aria-label', 'Abrir menu');
    if (devolverFoco) botaoMenu.focus();
};

botaoMenu.addEventListener('click', () => {
    const aberto = menu.classList.toggle('menu-aberto');
    botaoMenu.setAttribute('aria-expanded', String(aberto));
    botaoMenu.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    if (aberto) linksMenu[0].focus();
});

linksMenu.forEach((link) => link.addEventListener('click', () => fecharMenu(false)));

document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && menu.classList.contains('menu-aberto')) fecharMenu(true);
});

document.addEventListener('click', (evento) => {
    if (!menu.classList.contains('menu-aberto')) return;
    if (menu.contains(evento.target) || botaoMenu.contains(evento.target)) return;
    fecharMenu(false);
});

const secoes = linksMenu
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

const observadorSecoes = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        linksMenu.forEach((link) => {
            const ativo = link.getAttribute('href') === `#${entrada.target.id}`;
            link.classList.toggle('menu-link-ativo', ativo);
            if (ativo) link.setAttribute('aria-current', 'true');
            else link.removeAttribute('aria-current');
        });
    });
}, { rootMargin: '-45% 0px -50% 0px' });

secoes.forEach((secao) => observadorSecoes.observe(secao));

const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
const topo = document.getElementById('topo');
const progresso = document.getElementById('progresso');
const fotoHero = document.querySelector('.hero-foto');
const dicaRolar = document.querySelector('.rolar');

const seletoresRevelar = [
    '.secao-cabecalho > *',
    '.sobre-texto > p',
    '.formacao-item',
    '.competencia',
    '.cargo',
    '.projeto',
    '.contato > *',
].join(', ');

const posicaoNoGrupo = new Map();

const prepararRevelar = (el) => {
    const indice = posicaoNoGrupo.get(el.parentElement) ?? 0;
    posicaoNoGrupo.set(el.parentElement, indice + 1);
    el.style.setProperty('--atraso', `${Math.min(indice, 5) * 90}ms`);
    el.classList.add('revelar');
};

const observadorRevelar = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
        const el = entrada.target;
        if (entrada.isIntersecting) {
            el.classList.add('revelado');
            return;
        }
        const topoVisivel = entrada.rootBounds ? entrada.rootBounds.top : 0;
        el.dataset.lado = entrada.boundingClientRect.top < topoVisivel ? 'cima' : 'baixo';
        el.classList.remove('revelado');
    });
}, { rootMargin: '0px 0px -8% 0px' });

let ultimaPosicao = scrollY;
let quadroAgendado = false;

const aoRolar = () => {
    quadroAgendado = false;
    const y = scrollY;
    const alturaRolavel = document.documentElement.scrollHeight - innerHeight;
    progresso.style.transform = `scaleX(${alturaRolavel > 0 ? Math.min(y / alturaRolavel, 1) : 0})`;

    const descendo = y > ultimaPosicao + 4;
    const subindo = y < ultimaPosicao - 4;
    const menuAberto = menu.classList.contains('menu-aberto');
    const focoNoTopo = topo.contains(document.activeElement);
    if (descendo && y > 240 && !menuAberto && !focoNoTopo) topo.classList.add('topo-oculto');
    if (subindo || y <= 240) topo.classList.remove('topo-oculto');
    topo.classList.toggle('topo-rolado', y > 8);
    if (descendo || subindo) ultimaPosicao = y;

    if (!semMovimento) {
        const yHero = Math.min(y, innerHeight);
        fotoHero.style.translate = `0 ${(yHero * 0.12).toFixed(1)}px`;
        dicaRolar.style.opacity = String(Math.max(0, 1 - yHero / 180));
    }
};

addEventListener('scroll', () => {
    if (quadroAgendado) return;
    quadroAgendado = true;
    requestAnimationFrame(aoRolar);
}, { passive: true });

topo.addEventListener('focusin', () => topo.classList.remove('topo-oculto'));

raiz.classList.add('js');
if (!semMovimento) {
    document.querySelectorAll(seletoresRevelar).forEach((el) => {
        prepararRevelar(el);
        observadorRevelar.observe(el);
    });
}
aoRolar();
