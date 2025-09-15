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
        configBtn: document.getElementById('configBtn'),
        changeUserBtn: document.getElementById('changeUserBtn'),
  
        // Modal de configuración
        overlay: document.getElementById('overlay'),
        configModal: document.getElementById('configModal'),
        configForm: document.getElementById('configForm'),
        apiKeyInput: document.getElementById('apiKeyInput'),
        apiKeyError: document.getElementById('apiKeyError'),
        configStatus: document.getElementById('configStatus'),
        configSaveBtn: document.getElementById('configSaveBtn'),
        configSkipBtn: document.getElementById('configSkipBtn'),
  
        // Debug (solo en localhost)
        debugInfo: document.getElementById('debugInfo'),
        debugContent: document.getElementById('debugContent'),
  
        // Notificaciones
        toast: document.getElementById('toast')
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
  
      // --- Inicialización ---
      this.init();
      this.setupDebugModeIfNeeded();
    }
  
    // ============================================
    // Ciclo de vida
    // ============================================
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
      this.elements.chatForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        this.sendMessage();
      });
  
      // Botón minimizar
      this.elements.minimizeBtn?.addEventListener('click', () => this.toggleMinimize());

      // Botón cambiar usuario
      this.elements.changeUserBtn?.addEventListener('click', () => this.reiniciarSesionMenu());

      // Botón configurar
      this.elements.configBtn?.addEventListener('click', () => this.openConfigModal());

      // Modal de configuración
      this.elements.overlay?.addEventListener('click', () => this.closeConfigModal());
      this.elements.configForm?.addEventListener('submit', (e) => this.handleConfigSubmit(e));
      this.elements.configSkipBtn?.addEventListener('click', () => this.handleConfigSkip());
      this.elements.apiKeyInput?.addEventListener('input', () => this.validateApiKeyInput());

      // Delegación de eventos en el área de mensajes (para tarjetas del menú)
      this.elements.chatMessages?.addEventListener('click', (e) => this.handleMenuCardClick(e));

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
        this.state.isConnected = true;
        this.showStatus('En línea', 'online');
        this.showToast('Conectado al backend correctamente', 'success');
      } catch (err) {
        this.state.isConnected = false;
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
      this.state.conversationHistory = [];
  
      // Saludo y menú
      setTimeout(() => {
        this.addBotMessage(this.createGreetingMessage());
        setTimeout(() => this.showMenuOptions(), 800);
        this.elements.chatInput?.focus();
      }, 200);
    }
  
    createGreetingMessage() {
      // Saludo genérico (sin nombre ni fecha)
      return (
        '¡Hola! Soy tu asistente para la gestión de proyectos. ' +
        'Elige una de las siguientes opciones para comenzar:'
      );
    }
  
    // ============================================
    // Menú (igual que antes)
    // ============================================
    async loadMenuOptions() {
      try {
        if (!this.state.menuSessionId) {
          this.state.menuSessionId = 'session_' + this.state.userId + '_' + Date.now();
        }
        const url = `${this.config.backendUrl}/api/menu/opciones?sessionId=${this.state.menuSessionId}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        this.state.menuSessionActive = data.estado === 'activo';
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
      const iconos = {
        1: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
        2: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        3: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        4: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12L16 7M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      };
  
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
      const d = {
        1: 'Inicia un nuevo proyecto con ayuda de IA',
        2: 'Genera tareas automáticamente para tu proyecto',
        3: 'Revisa el estado de tus proyectos existentes',
        4: 'Finalizar sesión y reiniciar'
      };
      return d[id] || 'Acción del menú';
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
  
      if (optionId === 4) {
        // Reiniciar sesión / limpiar chat sin modal
        this.addBotMessage('👋 ¡Sesión reiniciada!');
        setTimeout(() => this.reiniciarSesionMenu(), 700);
        return;
      }
  
      if (optionId === 1) this.state.waitingForProjectIdea = true;
      if (optionId === 2) this.state.waitingForNewTask = true; // se ajustará tras respuesta
  
      this.processMenuAction(action, description, optionId);
    }
  
    async processMenuAction(action, description, optionId) {
      try {
        const url = `${this.config.backendUrl}/api/menu/procesar/${optionId}?sessionId=${this.state.menuSessionId}`;
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const resultado = await res.text();
        this.addBotMessage(resultado);
  
        // Heurísticas para estados de espera
        if (optionId === 2 && this.esRespuestaSolicitandoNuevaTarea(resultado)) {
          this.state.waitingForNewTask = true;
        }
        if (optionId === 3 && this.esRespuestaSolicitandoNumeroTarea(resultado)) {
          this.state.waitingForTaskNumber = true;
        }
  
        if (action === 'salir') {
          this.state.menuSessionActive = false;
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
      this.debugLog('Enviando mensaje', { message, userId: this.state.userId });
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
          this.state.waitingForProjectIdea = false;
        } else if (this.state.waitingForNewTask) {
          await this.sendNewTask(message);
          this.state.waitingForNewTask = false;
        } else if (this.state.waitingForTaskNumber) {
          await this.sendTaskNumber(message);
          this.state.waitingForTaskNumber = false;
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
          const data = await res.json().catch(() => null);
          throw new Error(data?.message || 'Datos inválidos');
        }
        if (res.status === 503) throw new Error('Servicio no disponible temporalmente');
        throw new Error(`Error del servidor (${res.status})`);
      }
      const data = await res.json();
      if (data.estado === 'error') throw new Error(data.respuesta || 'Error procesando');
  
      this.state.conversationHistory.push(
        { role: 'user', content: message },
        { role: 'assistant', content: data.respuesta }
      );
  
      this.addBotMessage(data.respuesta, false, {
        usuario: data.usuario,
        estado: data.estado
      });
    }
  
    async sendProjectIdea(idea) {
      const url = `${this.config.backendUrl}/api/menu/procesar/1/datos?sessionId=${this.state.menuSessionId}`;
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: idea });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const text = await res.text();
      this.addBotMessage(text);
      this.state.conversationHistory.push({ role: 'user', content: idea }, { role: 'assistant', content: text });
    }
  
    async sendNewTask(tarea) {
      const url = `${this.config.backendUrl}/api/menu/procesar/2/datos?sessionId=${this.state.menuSessionId}`;
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: tarea });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const text = await res.text();
      this.addBotMessage(text);
      this.state.conversationHistory.push({ role: 'user', content: tarea }, { role: 'assistant', content: text });
    }
  
    async sendTaskNumber(num) {
      const url = `${this.config.backendUrl}/api/menu/procesar/3/datos?sessionId=${this.state.menuSessionId}`;
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: num });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const text = await res.text();
      this.addBotMessage(text);
      this.state.conversationHistory.push({ role: 'user', content: num }, { role: 'assistant', content: text });
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
      this.state.isChatMinimized = !this.state.isChatMinimized;
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
    // Configuración de API Key
    // ============================================
    openConfigModal() {
      this.elements.overlay?.classList.add('active');
      this.elements.configModal?.classList.add('active');
      this.elements.apiKeyInput?.focus();
    }

    closeConfigModal() {
      this.elements.overlay?.classList.remove('active');
      this.elements.configModal?.classList.remove('active');
      this.clearFieldError('apiKeyInput');
    }

    validateApiKeyInput() {
      const input = this.elements.apiKeyInput;
      if (!input) return;

      const value = input.value.trim();
      if (value.length === 0) {
        this.setFieldError('apiKeyInput', 'La API Key es requerida');
        return false;
      }
      if (value.length < 20) {
        this.setFieldError('apiKeyInput', 'La API Key parece muy corta');
        return false;
      }
      if (!value.startsWith('sk-')) {
        this.setFieldError('apiKeyInput', 'La API Key debe comenzar con "sk-"');
        return false;
      }

      this.clearFieldError('apiKeyInput');
      return true;
    }

    async handleConfigSubmit(e) {
      e.preventDefault();
      
      if (!this.validateApiKeyInput()) return;

      const apiKey = this.elements.apiKeyInput?.value.trim();
      if (!apiKey) return;

      this.showConfigStatus('Guardando...', 'loading');
      
      try {
        // Simular guardado (en una app real, aquí se guardaría en localStorage o backend)
        localStorage.setItem('openai_api_key', apiKey);
        this.state.isConfigured = true;
        
        this.showConfigStatus('✅ API Key guardada correctamente', 'success');
        setTimeout(() => {
          this.closeConfigModal();
          this.showToast('Configuración completada', 'success');
        }, 1500);
        
      } catch (error) {
        console.error('Error guardando API Key:', error);
        this.showConfigStatus('❌ Error al guardar la API Key', 'error');
      }
    }

    handleConfigSkip() {
      this.closeConfigModal();
      this.showToast('Puedes configurar la API Key más tarde desde el botón ⚙️', 'info');
    }

    showConfigStatus(message, type) {
      const status = this.elements.configStatus;
      if (!status) return;

      status.textContent = message;
      status.className = `config-status ${type}`;
      status.style.display = 'block';
    }

    setFieldError(fieldId, message) {
      const input = this.elements[fieldId];
      const error = this.elements[fieldId + 'Error'];
      
      if (input) {
        input.classList.add('error');
      }
      if (error) {
        error.textContent = message;
        error.style.display = 'block';
      }
    }

    clearFieldError(fieldId) {
      const input = this.elements[fieldId];
      const error = this.elements[fieldId + 'Error'];
      
      if (input) {
        input.classList.remove('error');
      }
      if (error) {
        error.style.display = 'none';
      }
    }

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
      this.state.menuSessionId = 'session_' + this.state.userId + '_' + Date.now();
      this.state.menuSessionActive = true;
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