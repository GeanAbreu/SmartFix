"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");
  const [formSent, setFormSent] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);

      const sections = [
        "inicio",
        "como-funciona",
        "servicos",
        "sobre-nos",
        "contato",
      ];

      const scrollPosition = window.scrollY + 180;

      for (const id of sections) {
        const section = document.getElementById(id);

        if (section) {
          const top = section.offsetTop;
          const height = section.offsetHeight;

          if (
            scrollPosition >= top &&
            scrollPosition < top + height
          ) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleNavigation = (id: string) => {
    setMenuOpen(false);

    const section = document.getElementById(id);

    if (section) {
      const headerOffset = 80;
      const elementPosition =
        section.getBoundingClientRect().top + window.scrollY;

      window.scrollTo({
        top: elementPosition - headerOffset,
        behavior: "smooth",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const data = new FormData(e.currentTarget);
    const subject = String(data.get("assunto") ?? "Contato pelo site SmartFix");
    const message = [
      String(data.get("mensagem") ?? ""),
      "",
      `Nome: ${String(data.get("nome") ?? "")}`,
      `E-mail: ${String(data.get("email") ?? "")}`,
      `Telefone: ${String(data.get("telefone") ?? "")}`,
    ].join("\n");

    window.location.href = `mailto:contato@smartfix.com.br?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

    setFormSent(true);

    setTimeout(() => {
      setFormSent(false);
    }, 5000);
  };

  return (
    <main className="site">

      {/* =========================
          BACKGROUND EFFECTS
      ========================== */}

      <div className="background-glow glow-one"></div>
      <div className="background-glow glow-two"></div>
      <div className="background-grid"></div>

      {/* =========================
          HEADER
      ========================== */}

      <header
        className={`navbar ${
          isScrolled ? "navbar-scrolled" : ""
        }`}
      >
        <div className="container nav-container">

          <button
            className="logo"
            onClick={() => handleNavigation("inicio")}
            aria-label="Ir para o início"
          >
            <span className="logo-smart">SMART</span>
            <span className="logo-fix">FIX</span>
          </button>

          <nav className="desktop-nav">
            <button
              className={activeSection === "inicio" ? "active" : ""}
              onClick={() => handleNavigation("inicio")}
            >
              Início
            </button>

            <button
              className={
                activeSection === "como-funciona" ? "active" : ""
              }
              onClick={() => handleNavigation("como-funciona")}
            >
              Como funciona
            </button>

            <button
              className={
                activeSection === "servicos" ? "active" : ""
              }
              onClick={() => handleNavigation("servicos")}
            >
              Serviços
            </button>

            <button
              className={
                activeSection === "sobre-nos" ? "active" : ""
              }
              onClick={() => handleNavigation("sobre-nos")}
            >
              Sobre nós
            </button>

            <button
              className={
                activeSection === "contato" ? "active" : ""
              }
              onClick={() => handleNavigation("contato")}
            >
              Contato
            </button>
          </nav>

          <div className="nav-actions">
            <Link href="/login" className="btn btn-outline">
              Entrar
            </Link>

            <Link href="/cadastro" className="btn btn-primary">
              Cadastre-se
            </Link>
          </div>

          <button
            className={`mobile-menu-button ${
              menuOpen ? "open" : ""
            }`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* MENU MOBILE */}

        <div
          className={`mobile-menu ${
            menuOpen ? "mobile-menu-open" : ""
          }`}
        >
          <button onClick={() => handleNavigation("inicio")}>
            Início
          </button>

          <button
            onClick={() =>
              handleNavigation("como-funciona")
            }
          >
            Como funciona
          </button>

          <button
            onClick={() => handleNavigation("servicos")}
          >
            Serviços
          </button>

          <button
            onClick={() => handleNavigation("sobre-nos")}
          >
            Sobre nós
          </button>

          <button
            onClick={() => handleNavigation("contato")}
          >
            Contato
          </button>

          <div className="mobile-menu-actions">
            <Link href="/login" className="btn btn-outline">
              Entrar
            </Link>

            <Link href="/cadastro" className="btn btn-primary">
              Cadastre-se
            </Link>
          </div>
        </div>
      </header>

      {/* =========================
          HERO
      ========================== */}

      <section id="inicio" className="hero section">

        <div className="container hero-container">

          <div className="hero-content">

            <div className="security-badge">
              <span className="badge-icon">♢</span>
              Acesso protegido
            </div>

            <h1>
              Seu dispositivo
              <br />
              quebrou?
              <span>
                Nós encontramos
                <br />
                quem conserta.
              </span>
            </h1>

            <p className="hero-description">
              A plataforma mais rápida e segura para conectar
              você às melhores assistências técnicas para
              celulares e computadores.
            </p>

            <div className="hero-buttons">

              <Link
                href="/cadastro"
                className="btn btn-primary btn-large"
              >
                <span>⚒</span>
                Preciso de um Conserto
                <strong>→</strong>
              </Link>

              <Link
                href="/cadastro"
                className="btn btn-outline btn-large"
              >
                <span>▣</span>
                Sou uma Assistência
                <strong>→</strong>
              </Link>

            </div>

            <div className="trust-items">

              <div>
                <span>✓</span>
                Profissionais verificados
              </div>

              <div>
                <span>◷</span>
                Atendimento rápido
              </div>

              <div>
                <span>♢</span>
                Seus dados protegidos
              </div>

            </div>

          </div>

          {/* HERO VISUAL */}

          <div className="hero-visual">

            <div className="visual-ring ring-one"></div>
            <div className="visual-ring ring-two"></div>

            <div className="device-glow"></div>

            <div className="hero-image-wrapper">

              <Image
                src="/images/smartfix-hero.png"
                alt="Celular quebrado e notebook representando os serviços da SmartFix"
                className="hero-image"
                width={1536}
                height={1536}
                priority
                sizes="(max-width: 900px) 90vw, 45vw"
              />

            </div>

            <div className="success-card">

              <div className="avatars">
                <div>🔧</div>
                <div>✓</div>
                <div>⌁</div>
              </div>

              <div>
                <strong>Processo centralizado</strong>
                <p>do pedido ao acompanhamento do reparo</p>
              </div>

            </div>

          </div>

        </div>

        {/* BENEFITS */}

        <div className="container">

          <div className="benefit-strip">

            <div className="benefit-item">
              <div className="benefit-icon">⌕</div>

              <div>
                <h3>Encontre rápido</h3>
                <p>
                  Localize assistências próximas de você.
                </p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon">★</div>

              <div>
                <h3>Profissionais qualificados</h3>
                <p>
                  Técnicos avaliados e recomendados.
                </p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon">R$</div>

              <div>
                <h3>Preços justos</h3>
                <p>
                  Compare orçamentos e escolha o melhor.
                </p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon">◇</div>

              <div>
                <h3>Acesso protegido</h3>
                <p>
                  Autenticação segura e dados fora do navegador.
                </p>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* =========================
          COMO FUNCIONA
      ========================== */}

      <section
        id="como-funciona"
        className="section how-section"
      >

        <div className="container">

          <div className="section-header">

            <span className="section-label">
              COMO FUNCIONA
            </span>

            <h2>
              Resolver seu problema
              <span> nunca foi tão simples.</span>
            </h2>

            <p>
              Da solicitação ao conserto, a SmartFix
              simplifica todo o processo para você.
            </p>

          </div>

          <div className="steps-grid">

            <div className="step-card">

              <span className="step-number">01</span>

              <div className="step-icon">
                📱
              </div>

              <h3>Informe o problema</h3>

              <p>
                Conte para nós qual dispositivo está
                apresentando problemas e o que aconteceu.
              </p>

            </div>

            <div className="step-card">

              <span className="step-number">02</span>

              <div className="step-icon">
                📍
              </div>

              <h3>Encontre profissionais</h3>

              <p>
                Encontre assistências técnicas qualificadas
                próximas de você.
              </p>

            </div>

            <div className="step-card">

              <span className="step-number">03</span>

              <div className="step-icon">
                💰
              </div>

              <h3>Compare opções</h3>

              <p>
                Compare avaliações, serviços e orçamentos
                antes de tomar sua decisão.
              </p>

            </div>

            <div className="step-card">

              <span className="step-number">04</span>

              <div className="step-icon">
                ✓
              </div>

              <h3>Faça seu conserto</h3>

              <p>
                Escolha o profissional e acompanhe todo
                o processo até seu aparelho ficar pronto.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* =========================
          SERVIÇOS
      ========================== */}

      <section
        id="servicos"
        className="section services-section"
      >

        <div className="container">

          <div className="section-header">

            <span className="section-label">
              NOSSOS SERVIÇOS
            </span>

            <h2>
              Encontre o serviço
              <span> que você precisa.</span>
            </h2>

            <p>
              Assistências especializadas para os principais
              dispositivos do seu dia a dia.
            </p>

          </div>

          <div className="services-grid">

            <div className="service-card">

              <div className="service-icon">
                📱
              </div>

              <h3>Celulares</h3>

              <p>
                Soluções completas para smartphones.
              </p>

              <ul>
                <li>✓ Troca de tela</li>
                <li>✓ Troca de bateria</li>
                <li>✓ Conector de carga</li>
                <li>✓ Câmera e diagnóstico</li>
              </ul>

              <Link href="/cadastro">
                Ver serviços →
              </Link>

            </div>

            <div className="service-card">

              <div className="service-icon">
                💻
              </div>

              <h3>Computadores</h3>

              <p>
                Manutenção e otimização do seu PC.
              </p>

              <ul>
                <li>✓ Formatação</li>
                <li>✓ Upgrade de hardware</li>
                <li>✓ Limpeza</li>
                <li>✓ Diagnóstico</li>
              </ul>

              <Link href="/cadastro">
                Ver serviços →
              </Link>

            </div>

            <div className="service-card">

              <div className="service-icon">
                🖥️
              </div>

              <h3>Notebooks</h3>

              <p>
                Assistência especializada para notebooks.
              </p>

              <ul>
                <li>✓ Troca de tela</li>
                <li>✓ Teclado</li>
                <li>✓ Bateria</li>
                <li>✓ SSD e manutenção</li>
              </ul>

              <Link href="/cadastro">
                Ver serviços →
              </Link>

            </div>

            <div className="service-card">

              <div className="service-icon">
                🎮
              </div>

              <h3>Outros dispositivos</h3>

              <p>
                Também cuidamos de outros equipamentos.
              </p>

              <ul>
                <li>✓ Tablets</li>
                <li>✓ Consoles</li>
                <li>✓ Periféricos</li>
                <li>✓ Acessórios</li>
              </ul>

              <Link href="/cadastro">
                Ver serviços →
              </Link>

            </div>

          </div>

        </div>

      </section>

      {/* =========================
          SOBRE NÓS
      ========================== */}

      <section
        id="sobre-nos"
        className="section about-section"
      >

        <div className="container about-container">

          <div className="about-content">

            <span className="section-label">
              SOBRE A SMARTFIX
            </span>

            <h2>
              Tecnologia conectando
              <span> pessoas e soluções.</span>
            </h2>

            <p>
              A SmartFix nasceu para tornar o processo de
              encontrar uma assistência técnica mais simples,
              seguro e transparente.
            </p>

            <p>
              Conectamos clientes a profissionais qualificados,
              permitindo comparar opções, acompanhar serviços
              e encontrar a solução ideal para cada problema.
            </p>

            <div className="about-stats">

              <div>
                <strong>Um só fluxo</strong>
                <span>Do cadastro ao reparo</span>
              </div>

              <div>
                <strong>Mais clareza</strong>
                <span>Status centralizado</span>
              </div>

              <div>
                <strong>Mais segurança</strong>
                <span>Acesso protegido</span>
              </div>

            </div>

          </div>

          <div className="about-visual">

            <div className="about-card-main">

              <div className="about-card-icon">
                ⚡
              </div>

              <h3>
                Tecnologia que resolve.
              </h3>

              <p>
                Uma plataforma criada para facilitar
                a manutenção dos seus dispositivos.
              </p>

              <div className="about-progress">
                <span></span>
              </div>

              <small>
                SmartFix • Tecnologia • Segurança
              </small>

            </div>

          </div>

        </div>

      </section>

      {/* =========================
          CONTATO
      ========================== */}

      <section
        id="contato"
        className="section contact-section"
      >

        <div className="container">

          <div className="contact-container">

            <div className="contact-info">

              <span className="section-label">
                ENTRE EM CONTATO
              </span>

              <h2>
                Estamos prontos
                <span> para ajudar.</span>
              </h2>

              <p>
                Tem alguma dúvida, sugestão ou precisa
                de ajuda? Fale com a equipe SmartFix.
              </p>

              <div className="contact-item">
                <div>✉</div>

                <div>
                  <strong>E-mail</strong>
                  <span>
                    contato@smartfix.com.br
                  </span>
                </div>
              </div>

              <div className="contact-item">
                <div>☎</div>

                <div>
                  <strong>Atendimento</strong>
                  <span>
                    Segunda a sexta, 08h às 18h
                  </span>
                </div>
              </div>

            </div>

            <form
              className="contact-form"
              onSubmit={handleSubmit}
            >

              <div className="form-row">

                <div className="form-group">
                  <label htmlFor="nome">
                    Nome
                  </label>

                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    placeholder="Seu nome"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    E-mail
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                  />
                </div>

              </div>

              <div className="form-group">

                <label htmlFor="telefone">
                  Telefone
                </label>

                <input
                  id="telefone"
                  name="telefone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                />

              </div>

              <div className="form-group">

                <label htmlFor="assunto">
                  Assunto
                </label>

                <input
                  id="assunto"
                  name="assunto"
                  type="text"
                  placeholder="Como podemos ajudar?"
                  required
                />

              </div>

              <div className="form-group">

                <label htmlFor="mensagem">
                  Mensagem
                </label>

                <textarea
                  id="mensagem"
                  name="mensagem"
                  placeholder="Digite sua mensagem..."
                  rows={5}
                  required
                />

              </div>

              <button
                type="submit"
                className="btn btn-primary submit-button"
              >
                Enviar mensagem →
              </button>

              {formSent && (
                <div className="success-message">
                  Seu aplicativo de e-mail foi aberto. Revise e envie a mensagem.
                </div>
              )}

            </form>

          </div>

        </div>

      </section>

      {/* =========================
          FOOTER
      ========================== */}

      <footer className="footer">

        <div className="container footer-content">

          <div className="footer-brand">

            <button
              className="logo"
              onClick={() => handleNavigation("inicio")}
            >
              <span className="logo-smart">
                SMART
              </span>

              <span className="logo-fix">
                FIX
              </span>
            </button>

            <p>
              Conectando você a quem entende de tecnologia.
            </p>

          </div>

          <div className="footer-column">

            <h4>Navegação</h4>

            <button
              onClick={() => handleNavigation("inicio")}
            >
              Início
            </button>

            <button
              onClick={() =>
                handleNavigation("como-funciona")
              }
            >
              Como funciona
            </button>

            <button
              onClick={() =>
                handleNavigation("servicos")
              }
            >
              Serviços
            </button>

          </div>

          <div className="footer-column">

            <h4>Empresa</h4>

            <button
              onClick={() =>
                handleNavigation("sobre-nos")
              }
            >
              Sobre nós
            </button>

            <button
              onClick={() =>
                handleNavigation("contato")
              }
            >
              Contato
            </button>

            <Link href="/privacidade">
              Privacidade
            </Link>

          </div>

          <div className="footer-column">

            <h4>Para você</h4>

            <Link href="/login">
              Entrar
            </Link>

            <Link href="/cadastro">
              Criar conta
            </Link>

            <Link href="/cadastro">
              Solicitar conserto
            </Link>

          </div>

        </div>

        <div className="footer-bottom">

          <div className="container">

            <p>
              © 2026 SmartFix. Todos os direitos reservados.
            </p>

            <span>
              Feito com tecnologia e inovação.
            </span>

          </div>

        </div>

      </footer>

    </main>
  );
}
