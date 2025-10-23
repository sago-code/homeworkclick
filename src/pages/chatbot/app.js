import { navigateTo } from '../../main';
import './chatbot.css'

export default class ChatbotApp {
  constructor() {
    // --- Configuración ---
    this.config = {
      backendUrl: 'http://localhost:8080',
      maxMessageLength: 4000,
      maxHistorySize: 50,
      toastDuration: 5000,
      debugMode: this.isLocalhost()
    };
    // Congelar configuración profunda para evitar mutaciones accidentales
    const deepFreeze = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      Object.getOwnPropertyNames(obj).forEach((name) => {
        const value = obj[name];
        if (value && typeof value === 'object') deepFreeze(value);
      });
      return Object.freeze(obj);
    };
    deepFreeze(this.config);

    // --- Referencias al DOM ---
    this.elements = {
      // Contenedores principales
      chatbot: document.getElementById('chatbot'),
      chatMessages: document.getElementById('chatMessages'),
      chatForm: document.getElementById('chatForm'),
      chatInput: document.getElementById('chatInput'),
      sendBtn: document.getElementById('sendBtn'),

      // Header / estado
      chatStatus: document.getElementById('chatStatus'),
      statusIndicator: document.getElementById('statusIndicator'),
      minimizeBtn: document.getElementById('minimizeBtn'),
      // Referencia al botón de configuración eliminada
      changeUserBtn: document.getElementById('changeUserBtn'),

      // Referencias al modal de configuración eliminadas

      // Debug (solo en localhost)
      debugInfo: document.getElementById('debugInfo'),
      debugContent: document.getElementById('debugContent'),

      // Notificaciones
      toast: document.getElementById('toast'),

      // Botón para generar PDF
      generatePdfBtn: document.getElementById('generatePdfBtn'),
      explanationPanel: document.getElementById('explanationPanel'),
      panelTitle: document.getElementById('panelTitle'),
      panelContent: document.getElementById('panelContent'),
      closePanel: document.getElementById('closePanel')
    };

    // --- Estado ---
    this.state = {
      userId: this.generateUserId(), // se mantiene para asociar una sesión técnica
      isChatMinimized: false,
      isConnected: false,
      isConfigured: false,
      currentStreamingMessage: null,
      conversationHistory: [],
      // Estados de flujo de menú
      menuSessionId: null,
      menuSessionActive: true,
      waitingForProjectIdea: false,
      waitingForNewTask: false,
      waitingForTaskNumber: false
    };

    // --- Helpers de usuario (storage inmutable) ---
    this.readUserFromStorage = () => {
      try {
        const src = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (!src) return null;
        const obj = JSON.parse(src);
        return obj ? JSON.parse(JSON.stringify(obj)) : null; // copia defensiva
      } catch {
        return null;
      }
    };

    this.clearUserFromStorage = () => {
      try {
        sessionStorage.removeItem('user');
        localStorage.removeItem('user');
      } catch {}
    };

    // --- Inicialización ---
    this.init();
    this.setupDebugModeIfNeeded();
  }

  // ============================================
  // Ciclo de vida
  // ============================================
  setState(nextState) {
    this.state = { ...this.state, ...nextState };
  }
  init() {
    console.log('🚀 Iniciando Chatbot (sin modal de ingreso)...');
    this.setupEventListeners();
    this.checkBackendConnection();
    this.setupDebugModeIfNeeded();

    // Entrar directo al chat
    this.showChatbot();
  }

  isLocalhost() {
    return (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === ''
    );
  }

  generateUserId() {
    return 'user_' + Math.random().toString(36).slice(2, 11);
  }

  setupEventListeners() {
    // Formulario de chat

    this.elements.infoBtn?.addEventListener('click', () => {
        this.openExplanationPanel('general');
    });
    this.elements.chatForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    this.elements.infoBtn?.addEventListener('click', () => {
  this.openExplanationPanel('general');
});

    this.elements.closePanel?.addEventListener('click', () => this.closeExplanationPanel());

    // Botón minimizar
    this.elements.minimizeBtn?.addEventListener('click', () => this.toggleMinimize());

    // Botón cambiar usuario
    this.elements.changeUserBtn?.addEventListener('click', () => this.reiniciarSesionMenu());

    // Referencias al modal de configuración eliminadas

    // Delegación de eventos en el área de mensajes (para tarjetas del menú)
    this.elements.chatMessages?.addEventListener('click', (e) => this.handleMenuCardClick(e));

    // Evento para generar PDF de chats
      this.elements.generatePdfBtn.addEventListener('click', this.handleGeneratePdf.bind(this));

    // Errores globales
    window.addEventListener('error', (event) => {
      console.error('❌ Error en la aplicación:', event.error);
    });
  }

  async checkBackendConnection() {
    try {
      this.showStatus('Verificando conexión...', 'connecting');
      const res = await fetch(`${this.config.backendUrl}/webhook/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const info = await res.text();
      this.setState({ isConnected: true });
      this.showStatus('En línea', 'online');
      this.showToast('Conectado al backend correctamente', 'success');
    } catch (err) {
      this.setState({ isConnected: false });
      this.showStatus('Sin conexión', 'error');
      console.error('❌ Error conectando al backend:', err);
      this.showToast('No se pudo conectar al backend en http://localhost:8080', 'error');
    }
  }

  // ============================================
  // Chat: UI principal
  // ============================================
  showChatbot() {
    console.log('💬 Mostrando chatbot (sin pedir nombre/fecha)...');

    // Mostrar contenedor del chat
    this.elements.chatbot.style.display = 'flex';
    this.elements.chatbot.classList.add('fade-in');

    // Resetear mensajes
    this.elements.chatMessages.innerHTML = '';
    this.setState({ conversationHistory: [] });

    // Saludo y menú
    setTimeout(() => {
      this.addBotMessage(this.createGreetingMessage());
      setTimeout(() => this.showMenuOptions(), 800);
      this.elements.chatInput?.focus();
    }, 200);
  }

  createGreetingMessage() {
    // Obtener el nombre del usuario del localStorage
    let userName = '';
    try {
      const user = this.readUserFromStorage();
      if (user) userName = user.nombre || '';
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
    }

    // Saludo personalizado si hay nombre, genérico si no
    return (
      `¡Hola${userName ? ' ' + userName : ''}! Soy tu asistente para la gestión de proyectos. ` +
      'Elige una de las siguientes opciones para comenzar:'
    );
  }

  // ============================================
  // Menú (igual que antes)
  // ============================================
  async loadMenuOptions() {
    try {
      if (!this.state.menuSessionId) {
        this.setState({ menuSessionId: 'session_' + this.state.userId + '_' + Date.now() });
      }
      const url = `${this.config.backendUrl}/api/menu/opciones?sessionId=${this.state.menuSessionId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.setState({ menuSessionActive: data.estado === 'activo' });
      return data;
    } catch (err) {
      console.error('❌ Error cargando menú:', err);
      this.showToast('Error al cargar el menú', 'error');
      return null;
    }
  }

  async showMenuOptions() {
    const menuData = await this.loadMenuOptions();
    if (!menuData || !menuData.opciones) {
      this.addBotMessage('No pude cargar las opciones del menú. Intenta nuevamente.');
      return;
    }
    const html = this.createMenuMessage(menuData);
    this.addBotMessage(html, true);
  }

  

  createMenuMessage(menuData) {
    const iconos = Object.freeze({
      1: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
      2: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      3: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      4: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12L16 7M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    });

    let html = `<div class="menu-container">`;
    html += `<div class="menu-header">`;
    html += `<h4>${menuData.titulo}</h4>`;
    html += `<p class="menu-subtitle">¿Qué te gustaría hacer?</p>`;
    html += `</div>`;
    
    // Primera fila: 3 columnas (opciones 1, 2, 3)
    html += `<div class="menu-options-row menu-options-center">`;
    for (let i = 1; i <= 3; i++) {
      const op = menuData.opciones.find(o => o.id === i);
      if (op) {
        const icono = iconos[op.id];
        html += `
          <div class="menu-option-card menu-option-card-row" data-option-id="${op.id}" data-option-action="${op.accion}">
            <div class="menu-option-icon">${icono}</div>
            <div class="menu-option-content">
              <h5 class="menu-option-title">${op.descripcion}</h5>
              <p class="menu-option-description">${this.getMenuOptionDescription(op.id)}</p>
            </div>
            <div class="menu-option-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
          </div>`;
      }
    }
    html += `</div>`;
    
    // Segunda fila: botón Salir centrado (opción 4)
    const opSalir = menuData.opciones.find(o => o.id === 4);
    if (opSalir) {
      const icono = iconos[4];
      html += `<div class="menu-options-row menu-options-center">`;
      html += `
        <div class="menu-option-card menu-option-card-row" data-option-id="${opSalir.id}" data-option-action="${opSalir.accion}">
          <div class="menu-option-icon">${icono}</div>
          <div class="menu-option-content">
            <h5 class="menu-option-title">${opSalir.descripcion}</h5>
            <p class="menu-option-description">${this.getMenuOptionDescription(opSalir.id)}</p>
          </div>
          <div class="menu-option-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>`;
      html += `</div>`;
    }

    html += `</div>`;
    return html;
  }

  getMenuOptionDescription(id) {
    const d = Object.freeze({
      1: 'Inicia un nuevo proyecto con ayuda de IA',
      2: 'Genera tareas automáticamente para tu proyecto',
      3: 'Revisa el estado de tus proyectos existentes',
      4: 'Finalizar sesión y reiniciar'
    });
    return d[id] || 'Acción del menú';
  }

  generatePdfContent() {
      const fechaActual = new Date().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
      });
      
      const mesActual = new Date().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long'
      });
      
      // Datos de ejemplo para el resumen
      const resumenChats = {
          totalChats: 24,
          chatsProyectos: 8,
          chatsTareas: 12,
          chatsConsultas: 4,
          usuarioMasActivo: this.state.userName || "Usuario Ejemplo",
          proyectoMasComentado: "Sistema de Gestión de Tareas",
          tendenciaMensual: "+15% respecto al mes anterior",
          eficienciaResolucion: "87%",
          tiempoPromedioRespuesta: "12 minutos"
      };
      
      return `
          <!DOCTYPE html>
          <html lang="es">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Resumen Mensual de Chats - HomeworkClick</title>
              <style>
                  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
                  
                  body {
                      font-family: 'Roboto', sans-serif;
                      margin: 0;
                      padding: 0;
                      color: #2c3e50;
                      background-color: #f8f9fa;
                      line-height: 1.6;
                  }
                  .container {
                      max-width: 210mm;
                      min-height: 297mm;
                      margin: 0 auto;
                      background: white;
                      padding: 20mm;
                      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                  }
                  .header {
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      border-bottom: 3px solid #4CAF50;
                      padding-bottom: 20px;
                      margin-bottom: 30px;
                  }
                  .company-info {
                      flex: 2;
                  }
                  .company-info h1 {
                      color: #2c3e50;
                      margin: 0 0 5px 0;
                      font-size: 28px;
                      font-weight: 700;
                  }
                  .company-info p {
                      color: #7f8c8d;
                      margin: 0;
                      font-size: 14px;
                  }
                  .report-info {
                      flex: 1;
                      text-align: right;
                  }
                  .report-info .logo {
                      font-size: 40px;
                      margin-bottom: 10px;
                  }
                  .report-info p {
                      margin: 3px 0;
                      font-size: 13px;
                      color: #7f8c8d;
                  }
                  .document-title {
                      text-align: center;
                      margin: 30px 0;
                      padding: 15px;
                      background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
                      color: white;
                      border-radius: 5px;
                  }
                  .document-title h2 {
                      margin: 0;
                      font-size: 22px;
                      font-weight: 500;
                      letter-spacing: 1px;
                  }
                  .section {
                      margin-bottom: 25px;
                      page-break-inside: avoid;
                  }
                  .section h3 {
                      color: #2c3e50;
                      border-bottom: 2px solid #ecf0f1;
                      padding-bottom: 8px;
                      margin-top: 0;
                      font-size: 18px;
                      font-weight: 600;
                      text-transform: uppercase;
                      letter-spacing: 0.5px;
                  }
                  .stats-grid {
                      display: grid;
                      grid-template-columns: repeat(2, 1fr);
                      gap: 15px;
                      margin-bottom: 20px;
                  }
                  .stat-card {
                      background: #fff;
                      padding: 20px;
                      border-radius: 8px;
                      box-shadow: 0 3px 10px rgba(0,0,0,0.08);
                      border-left: 5px solid #4CAF50;
                      text-align: center;
                      transition: transform 0.2s;
                  }
                  .stat-card:hover {
                      transform: translateY(-3px);
                  }
                  .stat-number {
                      font-size: 32px;
                      font-weight: 700;
                      color: #2c3e50;
                      margin-bottom: 5px;
                  }
                  .stat-label {
                      color: #7f8c8d;
                      font-size: 14px;
                      text-transform: uppercase;
                      letter-spacing: 0.5px;
                  }
                  .highlight-box {
                      background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
                      padding: 20px;
                      border-radius: 8px;
                      margin: 20px 0;
                      border-left: 5px solid #2E7D32;
                  }
                  .highlight-box strong {
                      color: #2E7D32;
                  }
                  .metrics-grid {
                      display: grid;
                      grid-template-columns: repeat(2, 1fr);
                      gap: 15px;
                      margin: 20px 0;
                  }
                  .metric-item {
                      padding: 15px;
                      background: #f8f9fa;
                      border-radius: 5px;
                      border-left: 4px solid #4CAF50;
                  }
                  .metric-item strong {
                      color: #2c3e50;
                  }
                  .chat-list {
                      width: 100%;
                      border-collapse: collapse;
                      margin: 20px 0;
                      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                  }
                  .chat-list th {
                      background-color: #4CAF50;
                      color: white;
                      padding: 12px 15px;
                      text-align: left;
                      font-weight: 500;
                      text-transform: uppercase;
                      font-size: 13px;
                      letter-spacing: 0.5px;
                  }
                  .chat-list td {
                      border-bottom: 1px solid #ecf0f1;
                      padding: 12px 15px;
                      font-size: 14px;
                  }
                  .chat-list tr:nth-child(even) {
                      background-color: #f9f9f9;
                  }
                  .chat-list tr:hover {
                      background-color: #f1f8e9;
                  }
                  .recommendations {
                      background: #fff;
                      padding: 20px;
                      border-radius: 8px;
                      box-shadow: 0 3px 10px rgba(0,0,0,0.08);
                      margin: 20px 0;
                  }
                  .recommendations ul {
                      padding-left: 20px;
                  }
                  .recommendations li {
                      margin-bottom: 10px;
                      padding-left: 5px;
                  }
                  .recommendations li::marker {
                      color: #4CAF50;
                  }
                  .footer {
                      text-align: center;
                      margin-top: 40px;
                      color: #7f8c8d;
                      font-size: 12px;
                      border-top: 1px solid #ecf0f1;
                      padding-top: 20px;
                  }
                  .footer p {
                      margin: 5px 0;
                  }
                  .confidential {
                      font-style: italic;
                  }
                  .signature-area {
                      margin-top: 50px;
                      border-top: 1px dashed #ccc;
                      padding-top: 20px;
                      text-align: right;
                  }
                  .signature-line {
                      margin-top: 40px;
                      border-top: 1px solid #7f8c8d;
                      width: 200px;
                      display: inline-block;
                  }
                  
                  /* Estilos específicos para impresión */
                  @media print {
                      @page {
                          margin: 0;
                          size: A4 portrait;
                      }
                      
                      body {
                          background: white;
                          padding: 0;
                          margin: 0;
                          -webkit-print-color-adjust: exact;
                          print-color-adjust: exact;
                      }
                      
                      .container {
                          box-shadow: none;
                          padding: 15mm;
                          max-width: 100%;
                          min-height: auto;
                          margin: 0;
                      }
                      
                      .no-print {
                          display: none;
                      }
                      
                      .stat-card:hover {
                          transform: none;
                      }
                      
                      .chat-list tr:hover {
                          background-color: transparent;
                      }
                      
                      /* Eliminar encabezados y pies de página del navegador */
                      /* Para Chrome, Safari y Edge */
                      @page {
                          margin: 0;
                      }
                      
                      body {
                          margin: 0;
                          padding: 0;
                      }
                      
                      /* Para Firefox */
                      body, html {
                          width: 210mm;
                          height: 297mm;
                          margin: 0;
                          padding: 0;
                      }
                      
                      /* Ocultar elementos no deseados en impresión */
                      .container::before, .container::after {
                          content: none;
                      }
                  }
                  
                  .page-break {
                      page-break-before: always;
                  }
              </style>
          </head>
          <body>
              <div class="container">
                  <div class="header">
                      <div class="company-info">
                          <h1>HomeworkClick App</h1>
                          <p>Sistema de Gestión de Proyectos Inteligente</p>
                      </div>
                      <div class="report-info">
                          <div class="logo">🤖</div>
                          <p><strong>Reporte:</strong> Resumen Mensual de Chats</p>
                          <p><strong>Generado el:</strong> ${fechaActual}</p>
                          <p><strong>Período:</strong> ${mesActual}</p>
                      </div>
                  </div>
                  
                  <div class="document-title">
                      <h2>Resumen de Actividad de Chat - ${mesActual}</h2>
                  </div>
                  
                  <div class="section">
                      <h3>Estadísticas Generales</h3>
                      <div class="stats-grid">
                          <div class="stat-card">
                              <div class="stat-number">${resumenChats.totalChats}</div>
                              <div class="stat-label">Total de Chats</div>
                          </div>
                          <div class="stat-card">
                              <div class="stat-number">${resumenChats.chatsProyectos}</div>
                              <div class="stat-label">Chats sobre Proyectos</div>
                          </div>
                          <div class="stat-card">
                              <div class="stat-number">${resumenChats.chatsTareas}</div>
                              <div class="stat-label">Chats sobre Tareas</div>
                          </div>
                          <div class="stat-card">
                              <div class="stat-number">${resumenChats.chatsConsultas}</div>
                              <div class="stat-label">Consultas Generales</div>
                          </div>
                      </div>
                      
                      <div class="metrics-grid">
                          <div class="metric-item">
                              <strong>Usuario más activo:</strong> ${resumenChats.usuarioMasActivo}
                          </div>
                          <div class="metric-item">
                              <strong>Eficiencia en resolución:</strong> ${resumenChats.eficienciaResolucion}
                          </div>
                          <div class="metric-item">
                              <strong>Proyecto más comentado:</strong> ${resumenChats.proyectoMasComentado}
                          </div>
                          <div class="metric-item">
                              <strong>Tiempo promedio de respuesta:</strong> ${resumenChats.tiempoPromedioRespuesta}
                          </div>
                      </div>
                      
                      <div class="highlight-box">
                          <strong>📈 Tendencia del mes:</strong> ${resumenChats.tendenciaMensual}
                      </div>
                  </div>
                  
                  <div class="section">
                      <h3>Resumen de Actividad</h3>
                      
                      <h4>Chats Recientes</h4>
                      <table class="chat-list">
                          <thead>
                              <tr>
                                  <th>Fecha</th>
                                  <th>Usuario</th>
                                  <th>Tipo</th>
                                  <th>Tema</th>
                              </tr>
                          </thead>
                          <tbody> 
                              <tr>
                                  <td>${new Date().toLocaleDateString('es-ES')}</td>
                                  <td>${this.state.userName || "Usuario"}</td>
                                  <td><span style="color: #4CAF50;">●</span> Proyecto</td>
                                  <td>Nuevo sistema de gestión</td>
                              </tr>
                              <tr>
                                  <td>${new Date(Date.now() - 2 * 86400000).toLocaleDateString('es-ES')}</td>
                                  <td>${this.state.userName || "Usuario"}</td>
                                  <td><span style="color: #2196F3;">●</span> Tarea</td>
                                  <td>Implementación de API</td>
                              </tr>
                              <tr>
                                  <td>${new Date(Date.now() - 5 * 86400000).toLocaleDateString('es-ES')}</td>
                                  <td>${this.state.userName || "Usuario"}</td>
                                  <td><span style="color: #FF9800;">●</span> Consulta</td>
                                  <td>Configuración del sistema</td>
                              </tr>
                              <tr>
                                  <td>${new Date(Date.now() - 7 * 86400000).toLocaleDateString('es-ES')}</td>
                                  <td>${this.state.userName || "Usuario"}</td>
                                  <td><span style="color: #4CAF50;">●</span> Proyecto</td>
                                  <td>Análisis de requerimientos</td>
                              </tr>
                          </tbody>
                      </table>
                  </div>
                  
                  <div class="section">
                      <h3>Análisis y Recomendaciones</h3>
                      <div class="recommendations">
                          <p>Basado en el análisis de la actividad del mes de ${mesActual.split(' ')[0]}, nuestro sistema recomienda:</p>
                          <ul>
                              <li><strong>Focalizar esfuerzos</strong> en el proyecto "${resumenChats.proyectoMasComentado}" que ha generado la mayor cantidad de consultas</li>
                              <li><strong>Revisar las tareas pendientes</strong> del último mes y priorizar su finalización</li>
                              <li><strong>Programar una revisión de progreso</strong> para la próxima semana con el equipo de desarrollo</li>
                              <li><strong>Optimizar los flujos de trabajo</strong> para reducir el tiempo de respuesta en consultas técnicas</li>
                          </ul>
                      </div>
                  </div>
                  
                  <div class="signature-area">
                      <p>Documento generado automáticamente por el Sistema HomeworkClick</p>
                      <div class="signature-line"></div>
                      <p>Firma del Responsable</p>
                  </div>
                  
                  <div class="footer">
                      <p>HomeworkClick App - Sistema Inteligente de Gestión de Proyectos</p>
                      <p>© ${new Date().getFullYear()} - Todos los derechos reservados</p>
                      <p class="confidential">Este documento es confidencial y para uso exclusivo del destinatario</p>
                  </div>
              </div>
              
              <script>
                  // Script para asegurar que se imprima correctamente
                  window.onload = function() {
                      // Forzar el modo de impresión después de cargar
                      setTimeout(function() {
                          window.print();
                      }, 500);
                  };
              </script>
          </body>
          </html>
      `;
  }

  handleMenuCardClick(event) {
    const card = event.target.closest('.menu-option-card');
    if (!card) return;
    const optionId = parseInt(card.dataset.optionId, 10);
    const action = card.dataset.optionAction;
    const desc = card.querySelector('.menu-option-title')?.textContent || '';

    this.handleMenuOptionClick(optionId, action, desc);
  }

  handleMenuOptionClick(optionId, action, description) {
    this.addUserMessage(`${optionId}. ${description}`);
    this.openExplanationPanel(optionId);
    

    if (optionId === 4) {
      // Reiniciar sesión / limpiar chat sin modal
      this.addBotMessage('👋 ¡Sesión reiniciada!');
      this.clearUserFromStorage();
      navigateTo('/login');
      router();
      return;
    }

    if (optionId === 1) this.setState({ waitingForProjectIdea: true });
    if (optionId === 2) this.setState({ waitingForNewTask: true }); // se ajustará tras respuesta

    this.processMenuAction(action, description, optionId);
  }

  handleGeneratePdf() {
      console.log('📄 Generando resumen PDF...');
      
      try {

          const pdfContent = this.generatePdfContent();
          

          const pdfWindow = window.open('', '_blank', 'width=800,height=600');
          
          if (pdfWindow) {
              pdfWindow.document.write(pdfContent);
              pdfWindow.document.close();
              

              pdfWindow.onload = function() {
                  setTimeout(() => {
                      pdfWindow.print();
                  }, 250);
              };
              
              this.showToast('PDF generado correctamente', 'success');
          } else {
              throw new Error('No se pudo abrir la ventana para el PDF. Verifica los bloqueadores de ventanas emergentes.');
          }
          
      } catch (error) {
          console.error('❌ Error generando PDF:', error);
          this.showToast('Error al generar el PDF: ' + error.message, 'error');
      }
  }

  getEffectiveUserId() {
    const user = this.readUserFromStorage();
    const id = user && user.id;
    return (typeof id === 'number' && !Number.isNaN(id)) ? id : null;
  }

  async processMenuAction(action, description, optionId) {
    try {
      const uidNum = this.getEffectiveUserId();
      const sid = encodeURIComponent(this.state.menuSessionId);
      let url = `${this.config.backendUrl}/api/menu/procesar/${optionId}?sessionId=${sid}`;
      if (uidNum !== null) {
        url += `&userId=${encodeURIComponent(uidNum)}`;
      } else {
        console.warn('⚠️ No hay usuario logueado: las acciones no se persistirán en BD');
        this.showToast('Inicia sesión para guardar en BD', 'info');
      }
      
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const resultado = await res.text();
      this.addBotMessage(resultado);

      // Heurísticas para estados de espera
      if (optionId === 2 && this.esRespuestaSolicitandoNuevaTarea(resultado)) {
        this.setState({ waitingForNewTask: true });
      }
      if (optionId === 3 && this.esRespuestaSolicitandoNumeroTarea(resultado)) {
        this.setState({ waitingForTaskNumber: true });
      }

      if (action === 'salir') {
        this.setState({ menuSessionActive: false });
        setTimeout(() => this.reiniciarSesionMenu(), 1500);
      }
    } catch (err) {
      console.error('❌ Error procesando opción:', err);
      this.addBotMessage('Ocurrió un error al procesar tu selección. Intenta de nuevo.');
      setTimeout(() => this.showMenuOptions(), 900);
    }
  }

  esRespuestaSolicitandoNuevaTarea(resp) {
    if (!resp) return false;
    const keys = [
      'AGREGAR NUEVA TAREA',
      'Escribe la descripción de la nueva tarea',
      'Para agregar una nueva tarea',
      'agrega la primera tarea',
      'CREAR PRIMERA TAREA'
    ];
    return keys.some((k) => resp.includes(k));
  }

  esRespuestaSolicitandoNumeroTarea(resp) {
    if (!resp) return false;
    const keys = [
      'MARCAR TAREA COMO COMPLETADA',
      'Escribe el número de la tarea',
      'Para completar una tarea',
      'número de la tarea que has completado',
      'Escribe "3" para marcar'
    ];
    return keys.some((k) => resp.includes(k));
  }

  // ============================================
  // Envío de mensajes
  // ============================================
  async sendMessage() {
    const message = this.elements.chatInput.value.trim();
    this.debugLog('Enviando mensaje', { 
      message, 
      userId: this.getEffectiveUserId(),
      rawStateUserId: this.state.userId,
      stored: this.readUserFromStorage()
    });
    if (!message) {
      this.showToast('Por favor escribe un mensaje', 'warning');
      return;
    }
    if (message.length > this.config.maxMessageLength) {
      this.showToast(`El mensaje es demasiado largo (máximo ${this.config.maxMessageLength})`, 'error');
      return;
    }
    if (!this.state.isConnected) {
      this.showToast('No hay conexión con el backend', 'error');
      return;
    }

    this.addUserMessage(message);
    this.elements.chatInput.value = '';
    this.setButtonsEnabled(false);
    this.showStatusIndicator('Procesando mensaje...');

    try {
      if (this.state.waitingForProjectIdea) {
        await this.sendProjectIdea(message);
        this.setState({ waitingForProjectIdea: false });
      } else if (this.state.waitingForNewTask) {
        await this.sendNewTask(message);
        this.setState({ waitingForNewTask: false });
      } else if (this.state.waitingForTaskNumber) {
        await this.sendTaskNumber(message);
        this.setState({ waitingForTaskNumber: false });
      } else {
        await this.sendWebhookMessage(message);
      }
    } catch (err) {
      console.error('❌ Error enviando mensaje:', err);
      this.showToast(`Error: ${err.message}`, 'error');
      this.addBotMessage('Ocurrió un error al procesar tu mensaje. Intenta nuevamente.');
    } finally {
      this.setButtonsEnabled(true);
      this.hideStatusIndicator();
      this.elements.chatInput.focus();
    }
  }

  async sendWebhookMessage(message) {
    const body = { mensaje: message, usuario: this.state.userId };
    const res = await fetch(`${this.config.backendUrl}/webhook/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      if (res.status === 400) {
        try {
          const data = await res.json();
          throw new Error(data?.message || data?.respuesta || 'Datos inválidos');
        } catch (jsonError) {
          // Si no se puede parsear como JSON, intentamos obtener el texto
          const text = await res.text().catch(() => null);
          throw new Error(text || 'Datos inválidos');
        }
      }
      if (res.status === 503) throw new Error('Servicio no disponible temporalmente');
      throw new Error(`Error del servidor (${res.status})`);
    }
    
    try {
      // Primero intentamos obtener el texto de la respuesta
      const responseText = await res.text();
      
      // Luego intentamos parsear como JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        // Si no es JSON válido, mostramos el texto directamente
        console.error('❌ Respuesta no es JSON válido:', responseText);
        this.addBotMessage(responseText);
      this.state.conversationHistory = [
        ...this.state.conversationHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: responseText }
      ];
        return;
      }
      
      if (data.estado === 'error') throw new Error(data.respuesta || 'Error procesando');

      this.state.conversationHistory = [
        ...this.state.conversationHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: data.respuesta }
      ];

      this.addBotMessage(data.respuesta, false, {
        usuario: data.usuario,
        estado: data.estado
      });
    } catch (jsonError) {
      console.error('❌ Error al procesar la respuesta JSON:', jsonError);
      throw new Error('Error al procesar la respuesta del servidor');
    }
  }

  async sendProjectIdea(idea) {
    const uidNum = this.getEffectiveUserId();
    const sid = encodeURIComponent(this.state.menuSessionId);
    let url = `${this.config.backendUrl}/api/menu/procesar/1/datos?sessionId=${sid}`;
    if (uidNum !== null) url += `&userId=${encodeURIComponent(uidNum)}`;
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: idea });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const text = await res.text();
    this.addBotMessage(text);
    this.state.conversationHistory = [
      ...this.state.conversationHistory,
      { role: 'user', content: idea },
      { role: 'assistant', content: text }
    ];
  }

  async sendNewTask(tarea) {
    const uidNum = this.getEffectiveUserId();
    const sid = encodeURIComponent(this.state.menuSessionId);
    let url = `${this.config.backendUrl}/api/menu/procesar/2/datos?sessionId=${sid}`;
    if (uidNum !== null) url += `&userId=${encodeURIComponent(uidNum)}`;
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: tarea });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const text = await res.text();
    this.addBotMessage(text);
    this.state.conversationHistory = [
      ...this.state.conversationHistory,
      { role: 'user', content: tarea },
      { role: 'assistant', content: text }
    ];
  }

  async sendTaskNumber(num) {
    const uidNum = this.getEffectiveUserId();
    const sid = encodeURIComponent(this.state.menuSessionId);
    let url = `${this.config.backendUrl}/api/menu/procesar/3/datos?sessionId=${sid}`;
    if (uidNum !== null) url += `&userId=${encodeURIComponent(uidNum)}`;
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: num });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const text = await res.text();
    this.addBotMessage(text);
    this.state.conversationHistory = [
      ...this.state.conversationHistory,
      { role: 'user', content: num },
      { role: 'assistant', content: text }
    ];
  }

  // ============================================
  // Render de mensajes
  // ============================================
  addBotMessage(text, isHTML = false, metadata = {}) {
    let display = text;
    let shouldShowMenu = false;
    if (text && text.includes('MOSTRAR_MENU_PRINCIPAL')) {
      display = text.replace(/\n\nMOSTRAR_MENU_PRINCIPAL\s*$/gi, '').trim();
      shouldShowMenu = true;
    }

    const el = this.createMessageElement('bot', display, isHTML, metadata);
    this.elements.chatMessages.appendChild(el);
    this.scrollToBottom();

    if (shouldShowMenu) setTimeout(() => this.showMenuOptions(), 1200);
    return el;
  }

  openExplanationPanel(optionId) {
        // Evita romper si el panel no está en el DOM
        if (!this.elements.explanationPanel || !this.elements.panelContent || !this.elements.panelTitle) {
            console.warn('Panel de explicación no disponible en el DOM.');
            return;
        }

        this.showExplanationContent(optionId);
        this.elements.explanationPanel.classList.remove('hidden');
        this.elements.chatbot.classList.remove('full-width');

        // Asegurar que el panel sea visible
        this.elements.explanationPanel.style.transform = 'translateY(-50%)';
        this.elements.explanationPanel.style.opacity = '1';
        this.elements.explanationPanel.style.pointerEvents = 'auto';
    }

    closeExplanationPanel() {
        this.elements.explanationPanel.classList.add('hidden');
        this.elements.chatbot.classList.add('full-width');
    }

    // Nueva: contenido del panel de explicaciones según la opción
    showExplanationContent(optionId) {
        const titleByOption = {
            1: '🚀 Crear un nuevo proyecto',
            2: '🧩 Generar tareas automáticamente',
            3: '📊 Revisar estado de proyectos',
            4: '🔁 Finalizar sesión'
        };
        const getHtml = (id) => {
            switch (id) {
                case 1:
                    return `
                        <p>Inicia un proyecto: te pido una idea breve y genero nombre y estructura básica.</p>
                        <ul>
                            <li>Detecto posibles errores de ChatGPT y no persisto si hay fallos.</li>
                            <li>Si tu <code>userId</code> es válido (numérico) guardo en la BD.</li>
                            <li>Si no hay nombre claro, extraigo uno de tu idea (evitando frases genéricas).</li>
                        </ul>
                        <p>Responde con tu idea, por ejemplo: <em>"Panadería artesanal con delivery"</em>.</p>
                    `;
                case 2:
                    return `
                        <p>Genera tareas para tu proyecto activo o uno nuevo.</p>
                        <ul>
                            <li>Te pido el título o contexto de la tarea.</li>
                            <li>Agrupo y formato las tareas antes de mostrar.</li>
                            <li>Puedo persistir si hay usuario con <code>userId</code> numérico.</li>
                        </ul>
                        <p>Ejemplo: <em>"Crear API de productos con CRUD y autenticación"</em>.</p>
                    `;
                case 3:
                    return `
                        <p>Consulta tus proyectos guardados y su estado.</p>
                        <ul>
                            <li>Filtrado por tu usuario si estás logeado.</li>
                            <li>Muestra avances y pendientes si están disponibles.</li>
                        </ul>
                        <p>Haz clic en un proyecto para ver detalles o generar tareas.</p>
                    `;
                case 4:
                    return `
                        <p>Finaliza la sesión actual y vuelve al inicio de sesión.</p>
                        <ul>
                            <li>Limpiamos el estado y el historial del chat.</li>
                            <li>Puedes ingresar con otro usuario.</li>
                        </ul>
                    `;
                default:
                    return `
                        <p>Selecciona una opción del menú para ver su explicación.</p>
                        <ul>
                            <li>1: Crear proyecto</li>
                            <li>2: Generar tareas</li>
                            <li>3: Ver proyectos</li>
                            <li>4: Finalizar sesión</li>
                        </ul>
                    `;
            }
        };

        const safeId = Number.isFinite(optionId) ? optionId : null;
        this.elements.panelTitle.textContent = titleByOption[safeId] || 'ℹ️ Información';
        this.elements.panelContent.innerHTML = getHtml(safeId);

        // Accesibilidad básica
        this.elements.explanationPanel.setAttribute('aria-hidden', 'false');
        this.elements.explanationPanel.setAttribute('role', 'dialog');
    }

  addUserMessage(text) {
    const el = this.createMessageElement('user', text);
    this.elements.chatMessages.appendChild(el);
    this.scrollToBottom();
    return el;
  }

  createMessageElement(type, text, isHTML = false, metadata = {}) {
    const wrap = document.createElement('div');
    wrap.className = `message ${type}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = type === 'bot' ? '🤖' : '👤';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    if (isHTML) {
      textDiv.innerHTML = text;
    } else {
      textDiv.textContent = text;
      textDiv.style.whiteSpace = 'pre-wrap';
      textDiv.style.wordWrap = 'break-word';
      textDiv.style.overflowWrap = 'anywhere';
    }

    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    bubble.appendChild(textDiv);
    bubble.appendChild(time);

    if (metadata.model || metadata.tokens || metadata.requestId) {
      const meta = document.createElement('div');
      meta.className = 'message-meta';
      const parts = [];
      if (metadata.model) parts.push(`Modelo: ${metadata.model}`);
      if (metadata.tokens) parts.push(`Tokens: ${metadata.tokens}`);
      if (metadata.requestId) parts.push(`ID: ${metadata.requestId.substring(0, 8)}...`);
      meta.textContent = parts.join(' • ');
      bubble.appendChild(meta);
    }

    wrap.appendChild(avatar);
    wrap.appendChild(bubble);
    return wrap;
  }

  scrollToBottom() {
    setTimeout(() => {
      this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }, 50);
  }

  // ============================================
  // UI helpers
  // ============================================
  setButtonsEnabled(enabled) {
    this.elements.sendBtn.disabled = !enabled;
    this.elements.chatInput.disabled = !enabled;
  }

  showStatusIndicator(text) {
    this.elements.statusIndicator.querySelector('.status-text').textContent = text;
    this.elements.statusIndicator.style.display = 'flex';
  }

  hideStatusIndicator() {
    this.elements.statusIndicator.style.display = 'none';
  }

  showStatus(text, type = 'online') {
    this.elements.chatStatus.textContent = text;
    this.elements.chatStatus.className = `chat-status ${type}`;
  }

  showToast(message, type = 'info') {
    this.elements.toast.textContent = message;
    this.elements.toast.className = `toast ${type}`;
    this.elements.toast.classList.add('show');
    setTimeout(() => this.elements.toast.classList.remove('show'), this.config.toastDuration);
  }

  toggleMinimize() {
    this.setState({ isChatMinimized: !this.state.isChatMinimized });
    if (this.state.isChatMinimized) {
      this.elements.chatbot.classList.add('minimized');
      this.elements.minimizeBtn.textContent = '➕';
      this.elements.minimizeBtn.title = 'Maximizar chat';
    } else {
      this.elements.chatbot.classList.remove('minimized');
      this.elements.minimizeBtn.textContent = '➖';
      this.elements.minimizeBtn.title = 'Minimizar chat';
      this.elements.chatInput.focus();
    }
  }

  // ============================================
  // Configuración de API Key - Eliminada
  // ============================================
  // Los métodos relacionados con la configuración de API Key han sido eliminados

  // ============================================
  // Funciones de utilidad
  // ============================================

  debugLog(message, data = null) {
    if (!this.config.debugMode) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    
    console.log(logMessage, data || '');
    
    // Mostrar en el panel de debug si existe
    const debugContent = this.elements.debugContent;
    if (debugContent) {
      const logEntry = document.createElement('div');
      logEntry.className = 'debug-entry';
      logEntry.innerHTML = `<span class="debug-time">[${timestamp}]</span> <span class="debug-message">${message}</span>`;
      
      debugContent.appendChild(logEntry);
      debugContent.scrollTop = debugContent.scrollHeight;
      
      // Limitar a 50 entradas
      const entries = debugContent.querySelectorAll('.debug-entry');
      if (entries.length > 50) {
        entries[0].remove();
      }
    }
  }

  setupDebugModeIfNeeded() {
    if (!this.config.debugMode) return;
    
    const debugInfo = this.elements.debugInfo;
    if (debugInfo) {
      debugInfo.style.display = 'block';
      this.debugLog('Modo debug activado');
    }
  }

  // ============================================
  // Sesión de menú
  // ============================================
  async reiniciarSesionMenu() {
    this.setState({
      menuSessionId: 'session_' + (this.getEffectiveUserId() ?? 'anon') + '_' + Date.now(),
      menuSessionActive: true
    });
    this.elements.chatMessages.innerHTML = '';
    this.addBotMessage('🔄 Nueva sesión iniciada.');
    setTimeout(() => this.showMenuOptions(), 600);
  }
}

// ===============================
// Inicialización global
// ===============================
let chatbotApp;
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 DOM listo - inicializando ChatbotApp (sin modal de ingreso)');
  chatbotApp = new ChatbotApp();
});
