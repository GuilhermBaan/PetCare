if (!localStorage.getItem("token")) {
    window.location.href = "../auth/login.html";
}

function logout() {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        localStorage.removeItem("token");
        window.location.href = "../index.html";
    }
}

async function verifyAuth() {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "../auth/login.html";
        return;
    }

    try {
        const response = await fetch(`${API}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Token inválido');
        }

        const user = await response.json();
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = user.nome;
        }
    } catch (error) {
        console.error('Erro na autenticação:', error);
        localStorage.removeItem("token");
        window.location.href = "../index.html";
    }
}

// Verificar autenticação ao carregar a página
window.addEventListener('load', verifyAuth);
/*
 * SISTEMA DE CLÍNICA VETERINÁRIA - JAVASCRIPT PRINCIPAL
 * Autor: SuperNinja AI Assistant
 * Descrição: Aplicação JavaScript moderna com ES6+, async/await e UX aprimorada
 * Funcionalidades: CRUD completo, validações, notificações, relacionamentos visíveis
 */

// ===== CONFIGURAÇÃO GLOBAL =====
const API = "http://127.0.0.1:8000"; // URL base da API FastAPI

// ===== VARIÁVEIS GLOBAIS =====
let donosCache = []; // Cache para otimizar consultas
let animaisCache = []; // Cache para otimizar consultas
let consultasCache = []; // Cache para consultas
let servicosCache = []; // Cache para serviços de banho e tosa

// ===== UTILITÁRIOS =====

/**
 * Função utilitária para obter elemento por ID
 * @param {string} id - ID do elemento DOM
 * @returns {HTMLElement} Elemento DOM encontrado
 */
function byId(id) {
  return document.getElementById(id);
}

/**
 * Função utilitária para limpar valores de inputs
 * @param {string[]} ids - Array de IDs dos inputs a serem limpos
 */
function clearInputs(ids) {
  ids.forEach(id => {
    const element = byId(id);
    if (element) {
      element.value = "";
      // Dispara evento change para atualizar selects se necessário
      element.dispatchEvent(new Event('change'));
    }
  });
}

/**
 * Função para fazer requisições JSON com tratamento de erro e autenticação
 * @param {string} url - URL da requisição
 * @param {object} opts - Opções da requisição (método, corpo, etc.)
 * @returns {Promise} Promise com os dados da resposta
 */
async function jsonFetch(url, opts = {}) {
  try {
    // Configura headers padrão
    const defaultHeaders = {
      "Content-Type": "application/json",
    };
    
    // Adiciona token de autenticação se disponível
    const token = localStorage.getItem("token");
    if (token) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }
    
    // Mescla headers personalizados com padrão
    const headers = { ...defaultHeaders, ...(opts.headers || {}) };
    
    // Faz a requisição com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
    
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
      ...opts
    });
    
    clearTimeout(timeoutId);
    
    // Verifica se a resposta foi bem sucedida
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${response.status} - ${errorText}`);
    }
    
    // Retorna null para status 204 (No Content) ou JSON para outros casos
    return response.status === 204 ? null : await response.json();
    
  } catch (error) {
    console.error('Erro na requisição:', error);
    
    // Tratamento específico para diferentes tipos de erro
    if (error.name === 'AbortError') {
      throw new Error('Tempo limite da requisição excedido');
    }
    
    throw error;
  }
}

/**
 * Formata data do padrão ISO para formato brasileiro
 * @param {string} dateString - Data em formato ISO
 * @returns {string} Data formatada (DD/MM/YYYY)
 */
function formatarData(dateString) {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return dateString;
  }
}

/**
 * Formata data e hora do padrão ISO para formato brasileiro
 * @param {string} dateString - Data em formato ISO
 * @returns {string} Data e hora formatada (DD/MM/YYYY HH:mm)
 */
function formatarDataHora(dateString) {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Erro ao formatar data/hora:', error);
    return dateString;
  }
}

/**
 * Formata telefone brasileiro
 * @param {string} telefone - Telefone sem formatação
 * @returns {string} Telefone formatado
 */
function formatarTelefone(telefone) {
  if (!telefone) return "";
  
  // Remove tudo que não é dígito
  const numeros = telefone.replace(/\D/g, '');
  
  // Verifica se tem 10 ou 11 dígitos
  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  } else if (numeros.length === 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }
  
  return telefone;
}

/**
 * Aplica máscara de telefone enquanto usuário digita
 * @param {HTMLElement} input - Elemento input de telefone
 */
function aplicarMascaraTelefone(input) {
  input.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 0) {
      // Adiciona parênteses no DDD
      if (value.length <= 2) {
        value = `(${value}`;
      } else if (value.length <= 7) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
      } else {
        value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
      }
    }
    
    e.target.value = value;
  });
}

/**
 * Mostra notificação toast
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo: 'success', 'error', 'warning'
 */
function showToast(message, type = 'success') {
  const toast = byId('toast');
  const toastMessage = byId('toastMessage');
  const toastIcon = byId('toastIcon');
  
  // Configura mensagem e estilo
  toastMessage.textContent = message;
  toast.className = `toast ${type}`;
  
  // Configura ícone conforme tipo
  if (type === 'error') {
    toastIcon.className = 'fas fa-exclamation-circle';
  } else if (type === 'warning') {
    toastIcon.className = 'fas fa-exclamation-triangle';
  } else {
    toastIcon.className = 'fas fa-check-circle';
  }
  
  // Mostra toast
  toast.style.display = 'block';
  
  // Esconde automaticamente após 3 segundos
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

/**
 * Mostra modal de confirmação
 * @param {string} message - Mensagem de confirmação
 * @param {Function} onConfirm - Função executada ao confirmar
 */
function showConfirmModal(message, onConfirm) {
  const modal = byId('confirmModal');
  const confirmMessage = byId('confirmMessage');
  const confirmBtn = byId('confirmBtn');
  
  confirmMessage.textContent = message;
  modal.style.display = 'flex';
  
  // Remove event listeners anteriores
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  
  // Adiciona novo event listener
  newConfirmBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    onConfirm();
  });
}

/**
 * Fecha modal de confirmação
 */
function closeModal() {
  byId('confirmModal').style.display = 'none';
}

/**
 * Alterna entre abas do sistema
 * @param {string} tabName - Nome da aba a ser ativada
 */
function switchTab(tabName) {
  // Remove classe active de todas as abas e botões
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.classList.remove('active');
  });
  
  document.querySelectorAll('.tab-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Adiciona classe active na aba e botão selecionados
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  byId(tabName).classList.add('active');
  
  // Carrega dados específicos da tab
  if (tabName === 'consultas') {
    carregarConsultas();
    carregarEstatisticasConsultas();
  } else if (tabName === 'banho-tosa') {
    carregarServicos();
    carregarEstatisticasServicos();
  }
  
  // Atualiza indicador visual
  const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
  const indicator = document.querySelector('.tab-indicator');
  if (activeTab && indicator) {
    indicator.style.width = `${activeTab.offsetWidth}px`;
    indicator.style.left = `${activeTab.offsetLeft}px`;
  }
}

/**
 * Atualiza contador de registros na tabela
 * @param {string} tableId - ID da tabela
 * @param {number} count - Número de registros
 */
function updateRecordCount(tableId, count) {
  const countElement = byId(`${tableId.replace('tabela-', '')}-count`);
  if (countElement) {
    countElement.textContent = `${count} ${count === 1 ? 'registro' : 'registros'}`;
  }
  
  // Mostra/esconde estado vazio
  const emptyState = byId(`${tableId.replace('tabela-', '')}-empty`);
  const table = byId(tableId);
  
  if (emptyState && table) {
    if (count === 0) {
      emptyState.style.display = 'block';
      table.style.display = 'none';
    } else {
      emptyState.style.display = 'none';
      table.style.display = 'table';
    }
  }
}

/**
 * Obtém nome do dono pelo ID (usando cache)
 * @param {number} donoId - ID do dono
 * @returns {string} Nome do dono ou ID não encontrado
 */
function getNomeDonoById(donoId) {
  const dono = donosCache.find(d => d.id === parseInt(donoId));
  return dono ? dono.nome : `ID ${donoId} não encontrado`;
}

/**
 * Obtém nome do animal pelo ID (usando cache)
 * @param {number} animalId - ID do animal
 * @returns {string} Nome do animal ou ID não encontrado
 */
function getNomeAnimalById(animalId) {
  const animal = animaisCache.find(a => a.id === parseInt(animalId));
  return animal ? animal.nome : `ID ${animalId} não encontrado`;
}

// ===== CARREGAMENTO DE DADOS =====

/**
 * Carrega todos os donos da API
 */
async function carregarDonos() {
  try {
    const dados = await jsonFetch(`${API}/donos`);
    donosCache = dados; // Atualiza cache
    
    const tbody = byId("tabela-donos").querySelector("tbody");
    tbody.innerHTML = "";
    
    // Contador de animais por dono
    const contagemAnimais = {};
    animaisCache.forEach(animal => {
      contagemAnimais[animal.dono_id] = (contagemAnimais[animal.dono_id] || 0) + 1;
    });
    
    dados.forEach(dono => {
      const tr = document.createElement("tr");
      const numAnimais = contagemAnimais[dono.id] || 0;
      
      tr.innerHTML = `
        <td><strong>${dono.id}</strong></td>
        <td>${dono.nome}</td>
        <td>${formatarTelefone(dono.telefone)}</td>
        <td>
          <span class="badge ${numAnimais > 0 ? 'badge-success' : 'badge-secondary'}">
            <i class="fas fa-dog"></i> ${numAnimais}
          </span>
        </td>
        <td>
          <button class="btn btn-edit" data-action="edit" data-id="${dono.id}" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-delete" data-action="del" data-id="${dono.id}" title="Excluir">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      
      tbody.appendChild(tr);
    });
    
    // Atualiza contador
    updateRecordCount('tabela-donos', dados.length);
    
    // Atualiza selects de donos em outros formulários
    atualizarSelectDonos();
    
  } catch (error) {
    console.error('Erro ao carregar donos:', error);
    showToast('Erro ao carregar donos: ' + error.message, 'error');
  }
}

/**
 * Carrega todos os animais da API
 */
async function carregarAnimais() {
  try {
    const dados = await jsonFetch(`${API}/animais`);
    animaisCache = dados; // Atualiza cache
    
    const tbody = byId("tabela-animais").querySelector("tbody");
    tbody.innerHTML = "";
    
    dados.forEach(animal => {
      const tr = document.createElement("tr");
      const nomeDono = getNomeDonoById(animal.dono_id);
      
      tr.innerHTML = `
        <td><strong>${animal.id}</strong></td>
        <td>
          <div class="animal-info">
            <i class="fas fa-paw animal-icon"></i>
            ${animal.nome}
          </div>
        </td>
        <td>
          <span class="especie-badge especie-${animal.especie.toLowerCase()}">
            ${getEspecieIcon(animal.especie)} ${animal.especie}
          </span>
        </td>
        <td>${animal.idade} anos</td>
        <td>
          <div class="dono-info">
            <i class="fas fa-user"></i>
            ${nomeDono}
          </div>
        </td>
        <td>
          <span class="id-badge" title="ID do Dono">
            <i class="fas fa-hashtag"></i>
            ${animal.dono_id}
          </span>
        </td>
        <td>
          <button class="btn btn-edit" data-action="edit" data-id="${animal.id}" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-delete" data-action="del" data-id="${animal.id}" title="Excluir">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      
      tbody.appendChild(tr);
    });
    
    updateRecordCount('tabela-animais', dados.length);
    atualizarSelectAnimais();
    
  } catch (error) {
    console.error('Erro ao carregar animais:', error);
    showToast('Erro ao carregar animais: ' + error.message, 'error');
  }
}

/**
 * Carrega todas as vacinas da API
 */
async function carregarVacinas() {
  try {
    const dados = await jsonFetch(`${API}/vacinas`);
    
    const tbody = byId("tabela-vacinas").querySelector("tbody");
    tbody.innerHTML = "";
    
    dados.forEach(vacina => {
      const tr = document.createElement("tr");
      const nomeAnimal = getNomeAnimalById(vacina.animal_id);
      
      tr.innerHTML = `
        <td><strong>${vacina.id}</strong></td>
        <td>
          <div class="vacina-info">
            <i class="fas fa-syringe"></i>
            ${vacina.nome}
          </div>
        </td>
        <td>${formatarData(vacina.data_aplicacao)}</td>
        <td>
          <div class="animal-info">
            <i class="fas fa-paw"></i>
            ${nomeAnimal}
          </div>
        </td>
        <td>
          <span class="id-badge" title="ID do Animal">
            <i class="fas fa-hashtag"></i>
            ${vacina.animal_id}
          </span>
        </td>
        <td>
          <button class="btn btn-edit" data-action="edit" data-id="${vacina.id}" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-delete" data-action="del" data-id="${vacina.id}" title="Excluir">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      
      tbody.appendChild(tr);
    });
    
    updateRecordCount('tabela-vacinas', dados.length);
    
  } catch (error) {
    console.error('Erro ao carregar vacinas:', error);
    showToast('Erro ao carregar vacinas: ' + error.message, 'error');
  }
}

/**
 * Obtém ícone conforme espécie do animal
 * @param {string} especie - Espécie do animal
 * @returns {string} Emoji correspondente
 */
function getEspecieIcon(especie) {
  const icones = {
    'Cão': '\ud83d\udc15',
    'Gato': '\ud83d\udc08',
    'Pássaro': '\ud83e\udd9c',
    'Peixe': '\ud83d\udc20',
    'Hamster': '\ud83d\udc39',
    'Coelho': '\ud83d\udc30',
    'Outro': '\ud83e\udd94'
  };
  
  return icones[especie] || '\ud83d\udc3e';
}

/**
 * Atualiza select de donos no formulário de animais
 */
function atualizarSelectDonos() {
  const selects = ['animal-dono-id', 'consulta-dono', 'servico-dono'];
  
  selects.forEach(selectId => {
    const select = byId(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione o dono</option>';
    
    donosCache.forEach(dono => {
      const option = document.createElement('option');
      option.value = dono.id;
      option.textContent = `${dono.nome} (ID: ${dono.id})`;
      select.appendChild(option);
    });
  });
}

/**
 * Atualiza select de animais no formulário de vacinas
 */
function atualizarSelectAnimais() {
  const selects = ['vacina-animal-id', 'consulta-animal', 'servico-animal'];
  
  selects.forEach(selectId => {
    const select = byId(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione o animal</option>';
    
    animaisCache.forEach(animal => {
      const nomeDono = getNomeDonoById(animal.dono_id);
      const option = document.createElement('option');
      option.value = animal.id;
      option.textContent = `${animal.nome} (${nomeDono}) - ID: ${animal.id}`;
      select.appendChild(option);
    });
  });
}

// ===== FUNCIONALIDADES DE CONSULTAS =====

// Carregar estatísticas do dashboard de consultas
async function carregarEstatisticasConsultas() {
  try {
    const response = await jsonFetch(`${API}/consultas/stats/dashboard`);
    
    if (response) {
      document.getElementById('stat-total').textContent = response.total_consultas;
      document.getElementById('stat-agendadas').textContent = response.agendadas;
      document.getElementById('stat-concluidas').textContent = response.concluidas;
      document.getElementById('stat-canceladas').textContent = response.canceladas;
    }
    
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
  }
}

// Carregar consultas
async function carregarConsultas() {
  try {
    const response = await jsonFetch(`${API}/consultas`);
    consultasCache = response || [];
    
    renderizarConsultas(consultasCache);
    
  } catch (error) {
    console.error('Erro ao carregar consultas:', error);
    showToast('Erro ao carregar consultas', 'error');
  }
}

// Renderizar consultas na tabela
function renderizarConsultas(consultas) {
  const tbody = document.getElementById('consultas-tbody');
  const emptyState = document.getElementById('consultas-empty');
  
  if (!consultas || consultas.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  
  if (emptyState) emptyState.style.display = 'none';
  
  tbody.innerHTML = consultas.map(consulta => {
    return `
      <tr>
        <td>${formatarDataHora(consulta.data_hora)}</td>
        <td>${consulta.dono_nome || getNomeDonoById(consulta.dono_id)}</td>
        <td>${consulta.animal_nome || getNomeAnimalById(consulta.animal_id)}</td>
        <td>${consulta.motivo}</td>
        <td>
          <span class="status-badge ${consulta.status}">
            ${formatarStatus(consulta.status)}
          </span>
        </td>
        <td>R$ ${consulta.valor ? (consulta.valor / 100).toFixed(2) : '0,00'}</td>
        <td>
          <button class="btn-icon" onclick="editarConsulta(${consulta.id})" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon" onclick="excluirConsulta(${consulta.id})" title="Excluir">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Formatar status para exibição
function formatarStatus(status) {
  const statusMap = {
    'AGENDADA': 'Agendada',
    'EM_ANDAMENTO': 'Em Andamento',
    'CONCLUIDA': 'Concluída',
    'CANCELADA': 'Cancelada'
  };
  return statusMap[status] || status;
}

// Salvar consulta
async function salvarConsulta(event) {
  event.preventDefault();
  
  const donoId = document.getElementById('consulta-dono').value;
  const animalId = document.getElementById('consulta-animal').value;
  const dataHora = document.getElementById('consulta-data-hora').value;
  const motivo = document.getElementById('consulta-motivo').value;
  const status = document.getElementById('consulta-status').value;
  const valor = document.getElementById('consulta-valor').value;
  const observacoes = document.getElementById('consulta-observacoes').value;
  
  if (!donoId || !animalId || !dataHora || !motivo) {
    showToast('Por favor, preencha todos os campos obrigatórios', 'error');
    return;
  }
  
  const consultaData = {
    dono_id: parseInt(donoId),
    animal_id: parseInt(animalId),
    data_hora: dataHora,
    motivo: motivo,
    status: status,
    valor: valor ? Math.round(parseFloat(valor) * 100) : null,
    observacoes: observacoes || null
  };
  
  try {
    await jsonFetch(`${API}/consultas`, {
      method: 'POST',
      body: JSON.stringify(consultaData)
    });
    
    showToast('Consulta agendada com sucesso!', 'success');
    limparFormularioConsulta();
    await carregarConsultas();
    await carregarEstatisticasConsultas();
    
  } catch (error) {
    console.error('Erro ao salvar consulta:', error);
    showToast('Erro ao agendar consulta', 'error');
  }
}

// Limpar formulário de consulta
function limparFormularioConsulta() {
  const form = document.getElementById('consulta-form');
  if (form) {
    form.reset();
    const animalSelect = document.getElementById('consulta-animal');
    if (animalSelect) {
      animalSelect.disabled = true;
      animalSelect.innerHTML = '<option value="">Selecione um dono primeiro</option>';
    }
  }
}

// Editar consulta
async function editarConsulta(id) {
  try {
    const consulta = await jsonFetch(`${API}/consultas/${id}`);
    
    // Preencher formulário com os dados da consulta
    const donoSelect = document.getElementById('consulta-dono');
    if (donoSelect) donoSelect.value = consulta.dono_id;
    await carregarAnimaisDoDonoConsulta(consulta.dono_id);
    
    const animalSelect = document.getElementById('consulta-animal');
    if (animalSelect) animalSelect.value = consulta.animal_id;
    
    // Formatar data/hora para o input datetime-local
    const dataHora = new Date(consulta.data_hora);
    const dataHoraLocal = dataHora.toISOString().slice(0, 16);
    const dataHoraInput = document.getElementById('consulta-data-hora');
    if (dataHoraInput) dataHoraInput.value = dataHoraLocal;
    
    const motivoInput = document.getElementById('consulta-motivo');
    if (motivoInput) motivoInput.value = consulta.motivo;
    
    const statusSelect = document.getElementById('consulta-status');
    if (statusSelect) statusSelect.value = consulta.status;
    
    const valorInput = document.getElementById('consulta-valor');
    if (valorInput) valorInput.value = consulta.valor ? (consulta.valor / 100).toFixed(2) : '';
    
    const observacoesInput = document.getElementById('consulta-observacoes');
    if (observacoesInput) observacoesInput.value = consulta.observacoes || '';
    
    // Scroll para o formulário
    const form = document.getElementById('consulta-form');
    if (form) form.scrollIntoView({ behavior: 'smooth' });
    
    showToast('Carregando dados da consulta...', 'success');
    
  } catch (error) {
    console.error('Erro ao carregar consulta:', error);
    showToast('Erro ao carregar consulta', 'error');
  }
}

// Excluir consulta
function excluirConsulta(id) {
  showConfirmModal(
    'Tem certeza que deseja excluir esta consulta?',
    async () => {
      try {
        await jsonFetch(`${API}/consultas/${id}`, { method: 'DELETE' });
        showToast('Consulta excluída com sucesso!', 'success');
        await carregarConsultas();
        await carregarEstatisticasConsultas();
      } catch (error) {
        console.error('Erro ao excluir consulta:', error);
        showToast('Erro ao excluir consulta', 'error');
      }
    }
  );
}

// ===== FUNCIONALIDADES DE BANHO E TOSA =====

// Carregar estatísticas do dashboard de serviços
async function carregarEstatisticasServicos() {
  try {
    const response = await jsonFetch(`${API}/banho-tosa/stats/dashboard`);
    
    if (response) {
      document.getElementById('servico-stat-total').textContent = response.total_servicos;
      document.getElementById('servico-stat-agendados').textContent = response.agendados;
      document.getElementById('servico-stat-concluidos').textContent = response.concluidos;
      document.getElementById('servico-stat-cancelados').textContent = response.cancelados;
    }
    
  } catch (error) {
    console.error('Erro ao carregar estatísticas de serviços:', error);
  }
}

// Carregar serviços de banho e tosa
async function carregarServicos() {
  try {
    const response = await jsonFetch(`${API}/banho-tosa`);
    servicosCache = response || [];
    
    renderizarServicos(servicosCache);
    
  } catch (error) {
    console.error('Erro ao carregar serviços:', error);
    showToast('Erro ao carregar serviços', 'error');
  }
}

// Renderizar serviços na tabela
function renderizarServicos(servicos) {
  const tbody = document.getElementById('servicos-tbody');
  const emptyState = document.getElementById('servicos-empty');
  
  if (!servicos || servicos.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  
  if (emptyState) emptyState.style.display = 'none';
  
  tbody.innerHTML = servicos.map(servico => {
    return `
      <tr>
        <td>${formatarDataHora(servico.data_hora)}</td>
        <td>${servico.dono_nome || getNomeDonoById(servico.dono_id)}</td>
        <td>${servico.animal_nome || getNomeAnimalById(servico.animal_id)}</td>
        <td>
          <span class="servico-badge ${servico.tipo_servico}">
            ${formatarTipoServico(servico.tipo_servico)}
          </span>
        </td>
        <td>
          <span class="status-badge ${servico.status}">
            ${formatarStatusServico(servico.status)}
          </span>
        </td>
        <td>R$ ${servico.valor ? (servico.valor / 100).toFixed(2) : '0,00'}</td>
        <td>${servico.duracao_estimada ? servico.duracao_estimada + ' min' : '-'}</td>
        <td>
          <button class="btn-icon" onclick="editarServico(${servico.id})" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon" onclick="excluirServico(${servico.id})" title="Excluir">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Formatar tipo de serviço para exibição
function formatarTipoServico(tipo) {
  const tipoMap = {
    'BANHO': '🚿 Banho',
    'TOSA': '✂️ Tosa',
    'BANHO_E_TOSA': '🚿✂️ Banho e Tosa'
  };
  return tipoMap[tipo] || tipo;
}

// Formatar status de serviço para exibição
function formatarStatusServico(status) {
  const statusMap = {
    'AGENDADO': 'Agendado',
    'EM_ANDAMENTO': 'Em Andamento',
    'CONCLUIDO': 'Concluído',
    'CANCELADO': 'Cancelado'
  };
  return statusMap[status] || status;
}

// Salvar serviço
async function salvarServico(event) {
  event.preventDefault();
  
  const donoId = document.getElementById('servico-dono').value;
  const animalId = document.getElementById('servico-animal').value;
  const tipoServico = document.getElementById('servico-tipo').value;
  const dataHora = document.getElementById('servico-data-hora').value;
  const status = document.getElementById('servico-status').value;
  const valor = document.getElementById('servico-valor').value;
  const duracao = document.getElementById('servico-duracao').value;
  const observacoes = document.getElementById('servico-observacoes').value;
  
  if (!donoId || !animalId || !tipoServico || !dataHora) {
    showToast('Por favor, preencha todos os campos obrigatórios', 'error');
    return;
  }
  
  const servicoData = {
    dono_id: parseInt(donoId),
    animal_id: parseInt(animalId),
    tipo_servico: tipoServico,
    data_hora: dataHora,
    status: status,
    valor: valor ? Math.round(parseFloat(valor) * 100) : null,
    duracao_estimada: duracao ? parseInt(duracao) : null,
    observacoes: observacoes || null
  };
  
  try {
    await jsonFetch(`${API}/banho-tosa`, {
      method: 'POST',
      body: JSON.stringify(servicoData)
    });
    
    showToast('Serviço agendado com sucesso!', 'success');
    limparFormularioServico();
    await carregarServicos();
    await carregarEstatisticasServicos();
    
  } catch (error) {
    console.error('Erro ao salvar serviço:', error);
    showToast('Erro ao agendar serviço', 'error');
  }
}

// Limpar formulário de serviço
function limparFormularioServico() {
  const form = document.getElementById('servico-form');
  if (form) {
    form.reset();
    const animalSelect = document.getElementById('servico-animal');
    if (animalSelect) {
      animalSelect.disabled = true;
      animalSelect.innerHTML = '<option value="">Selecione um dono primeiro</option>';
    }
  }
}

// Editar serviço
async function editarServico(id) {
  try {
    const servico = await jsonFetch(`${API}/banho-tosa/${id}`);
    
    // Preencher formulário com os dados do serviço
    const donoSelect = document.getElementById('servico-dono');
    if (donoSelect) donoSelect.value = servico.dono_id;
    await carregarAnimaisDoDonoServico(servico.dono_id);
    
    const animalSelect = document.getElementById('servico-animal');
    if (animalSelect) animalSelect.value = servico.animal_id;
    
    const tipoSelect = document.getElementById('servico-tipo');
    if (tipoSelect) tipoSelect.value = servico.tipo_servico;
    
    // Formatar data/hora para o input datetime-local
    const dataHora = new Date(servico.data_hora);
    const dataHoraLocal = dataHora.toISOString().slice(0, 16);
    const dataHoraInput = document.getElementById('servico-data-hora');
    if (dataHoraInput) dataHoraInput.value = dataHoraLocal;
    
    const statusSelect = document.getElementById('servico-status');
    if (statusSelect) statusSelect.value = servico.status;
    
    const valorInput = document.getElementById('servico-valor');
    if (valorInput) valorInput.value = servico.valor ? (servico.valor / 100).toFixed(2) : '';
    
    const duracaoInput = document.getElementById('servico-duracao');
    if (duracaoInput) duracaoInput.value = servico.duracao_estimada || '';
    
    const observacoesInput = document.getElementById('servico-observacoes');
    if (observacoesInput) observacoesInput.value = servico.observacoes || '';
    
    // Scroll para o formulário
    const form = document.getElementById('servico-form');
    if (form) form.scrollIntoView({ behavior: 'smooth' });
    
    showToast('Carregando dados do serviço...', 'success');
    
  } catch (error) {
    console.error('Erro ao carregar serviço:', error);
    showToast('Erro ao carregar serviço', 'error');
  }
}

// Excluir serviço
function excluirServico(id) {
  showConfirmModal(
    'Tem certeza que deseja excluir este serviço?',
    async () => {
      try {
        await jsonFetch(`${API}/banho-tosa/${id}`, { method: 'DELETE' });
        showToast('Serviço excluído com sucesso!', 'success');
        await carregarServicos();
        await carregarEstatisticasServicos();
      } catch (error) {
        console.error('Erro ao excluir serviço:', error);
        showToast('Erro ao excluir serviço', 'error');
      }
    }
  );
}

// Carregar animais do dono selecionado (para consultas)
async function carregarAnimaisDoDonoConsulta(donoId) {
  try {
    const select = document.getElementById('consulta-animal');
    if (!select) return;
    
    if (!donoId) {
      select.disabled = true;
      select.innerHTML = '<option value="">Selecione um dono primeiro</option>';
      return;
    }
    
    select.disabled = false;
    const animaisDoDono = animaisCache.filter(animal => animal.dono_id == donoId);
    
    select.innerHTML = '<option value="">Selecione um animal</option>' +
      animaisDoDono.map(animal => `<option value="${animal.id}">${animal.nome}</option>`).join('');
    
  } catch (error) {
    console.error('Erro ao carregar animais:', error);
  }
}

// Carregar animais do dono selecionado (para serviços)
async function carregarAnimaisDoDonoServico(donoId) {
  try {
    const select = document.getElementById('servico-animal');
    if (!select) return;
    
    if (!donoId) {
      select.disabled = true;
      select.innerHTML = '<option value="">Selecione um dono primeiro</option>';
      return;
    }
    
    select.disabled = false;
    const animaisDoDono = animaisCache.filter(animal => animal.dono_id == donoId);
    
    select.innerHTML = '<option value="">Selecione um animal</option>' +
      animaisDoDono.map(animal => `<option value="${animal.id}">${animal.nome}</option>`).join('');
    
  } catch (error) {
    console.error('Erro ao carregar animais:', error);
  }
}

// ===== EVENT LISTENERS - DONOS =====

// Formulário de donos
byId("form-dono").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const id = byId("dono-id").value;
  const payload = {
    nome: byId("dono-nome").value.trim(),
    telefone: byId("dono-telefone").value.trim()
  };
  
  try {
    if (id) {
      // Atualização
      await jsonFetch(`${API}/donos/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      showToast('Dono atualizado com sucesso!');
    } else {
      // Criação
      await jsonFetch(`${API}/donos`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      showToast('Dono cadastrado com sucesso!');
    }
    
    // Limpa formulário e recarrega dados
    clearInputs(["dono-id", "dono-nome", "dono-telefone"]);
    await carregarDonos();
    await carregarAnimais(); // Atualiza contagem de animais por dono
    
  } catch (error) {
    console.error('Erro ao salvar dono:', error);
    showToast('Erro ao salvar dono: ' + error.message, 'error');
  }
});

// Botão limpar dono
byId("limpar-dono").addEventListener("click", () => {
  clearInputs(["dono-id", "dono-nome", "dono-telefone"]);
});

// Tabela de donos (ações de editar/excluir)
byId("tabela-donos").addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  
  if (action === "edit") {
    try {
      const dono = await jsonFetch(`${API}/donos/${id}`);
      byId("dono-id").value = dono.id;
      byId("dono-nome").value = dono.nome;
      byId("dono-telefone").value = dono.telefone;
      
      // Foca no primeiro campo
      byId("dono-nome").focus();
      
      // Scroll suave para o formulário
      byId("form-dono").scrollIntoView({ behavior: 'smooth' });
      
    } catch (error) {
      console.error('Erro ao carregar dono para edição:', error);
      showToast('Erro ao carregar dados do dono', 'error');
    }
  } else if (action === "del") {
    showConfirmModal(
      `Excluir o dono ${getNomeDonoById(id)}? (Todos os animais e vacinas vinculados serão removidos)`,
      async () => {
        try {
          await jsonFetch(`${API}/donos/${id}`, { method: "DELETE" });
          showToast('Dono excluído com sucesso!');
          await carregarDonos();
          await carregarAnimais();
          await carregarVacinas();
        } catch (error) {
          console.error('Erro ao excluir dono:', error);
          showToast('Erro ao excluir dono: ' + error.message, 'error');
        }
      }
    );
  }
});

// ===== EVENT LISTENERS - ANIMAIS =====

// Formulário de animais
byId("form-animal").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const id = byId("animal-id").value;
  const payload = {
    nome: byId("animal-nome").value.trim(),
    especie: byId("animal-especie").value,
    idade: Number(byId("animal-idade").value),
    dono_id: Number(byId("animal-dono-id").value),
  };
  
  try {
    if (id) {
      await jsonFetch(`${API}/animais/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      showToast('Animal atualizado com sucesso!');
    } else {
      await jsonFetch(`${API}/animais`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      showToast('Animal cadastrado com sucesso!');
    }
    
    clearInputs(["animal-id", "animal-nome", "animal-especie", "animal-idade", "animal-dono-id"]);
    await carregarAnimais();
    
  } catch (error) {
    console.error('Erro ao salvar animal:', error);
    showToast('Erro ao salvar animal: ' + error.message, 'error');
  }
});

// Botão limpar animal
byId("limpar-animal").addEventListener("click", () => {
  clearInputs(["animal-id", "animal-nome", "animal-especie", "animal-idade", "animal-dono-id"]);
});

// Select de dono - mostra ID selecionado
byId("animal-dono-id").addEventListener("change", (e) => {
  const selectedInfo = byId("dono-selecionado");
  const donoIdMostrado = byId("dono-id-mostrado");
  
  if (e.target.value) {
    selectedInfo.style.display = "block";
    donoIdMostrado.textContent = e.target.value;
  } else {
    selectedInfo.style.display = "none";
  }
});

// Tabela de animais
byId("tabela-animais").addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  
  if (action === "edit") {
    try {
      const animal = await jsonFetch(`${API}/animais/${id}`);
      byId("animal-id").value = animal.id;
      byId("animal-nome").value = animal.nome;
      byId("animal-especie").value = animal.especie;
      byId("animal-idade").value = animal.idade;
      byId("animal-dono-id").value = animal.dono_id;
      
      // Dispara evento change para mostrar ID
      byId("animal-dono-id").dispatchEvent(new Event('change'));
      
      byId("animal-nome").focus();
      byId("form-animal").scrollIntoView({ behavior: 'smooth' });
      
    } catch (error) {
      console.error('Erro ao carregar animal para edição:', error);
      showToast('Erro ao carregar dados do animal', 'error');
    }
  } else if (action === "del") {
    showConfirmModal(
      `Excluir o animal ${getNomeAnimalById(id)}? (Todas as vacinas vinculadas serão removidas)`,
      async () => {
        try {
          await jsonFetch(`${API}/animais/${id}`, { method: "DELETE" });
          showToast('Animal excluído com sucesso!');
          await carregarAnimais();
          await carregarVacinas();
        } catch (error) {
          console.error('Erro ao excluir animal:', error);
          showToast('Erro ao excluir animal: ' + error.message, 'error');
        }
      }
    );
  }
});

// ===== EVENT LISTENERS - VACINAS =====

// Formulário de vacinas
byId("form-vacina").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const id = byId("vacina-id").value;
  const animalId = Number(byId("vacina-animal-id").value);
  const payload = {
    nome: byId("vacina-nome").value.trim(),
    data_aplicacao: byId("vacina-data").value
  };
  
  try {
    if (id) {
      await jsonFetch(`${API}/vacinas/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      showToast('Vacina atualizada com sucesso!');
    } else {
      await jsonFetch(`${API}/vacinas?animal_id=${animalId}`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      showToast('Vacina cadastrada com sucesso!');
    }
    
    clearInputs(["vacina-id", "vacina-nome", "vacina-data", "vacina-animal-id"]);
    await carregarVacinas();
    
  } catch (error) {
    console.error('Erro ao salvar vacina:', error);
    showToast('Erro ao salvar vacina: ' + error.message, 'error');
  }
});

// Botão limpar vacina
byId("limpar-vacina").addEventListener("click", () => {
  clearInputs(["vacina-id", "vacina-nome", "vacina-data", "vacina-animal-id"]);
});

// Select de animal - mostra ID selecionado
byId("vacina-animal-id").addEventListener("change", (e) => {
  const selectedInfo = byId("animal-selecionado");
  const animalIdMostrado = byId("animal-id-mostrado");
  
  if (e.target.value) {
    selectedInfo.style.display = "block";
    animalIdMostrado.textContent = e.target.value;
  } else {
    selectedInfo.style.display = "none";
  }
});

// Tabela de vacinas
byId("tabela-vacinas").addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  
  if (action === "edit") {
    try {
      const vacina = await jsonFetch(`${API}/vacinas/${id}`);
      byId("vacina-id").value = vacina.id;
      byId("vacina-nome").value = vacina.nome;
      byId("vacina-data").value = vacina.data_aplicacao;
      byId("vacina-animal-id").value = vacina.animal.id || vacina.animal_id || "";
      
      // Dispara evento change para mostrar ID
      byId("vacina-animal-id").dispatchEvent(new Event('change'));
      
      byId("vacina-nome").focus();
      byId("form-vacina").scrollIntoView({ behavior: 'smooth' });
      
    } catch (error) {
      console.error('Erro ao carregar vacina para edição:', error);
      showToast('Erro ao carregar dados da vacina', 'error');
    }
  } else if (action === "del") {
    showConfirmModal(
      'Excluir esta vacina?',
      async () => {
        try {
          await jsonFetch(`${API}/vacinas/${id}`, { method: "DELETE" });
          showToast('Vacina excluída com sucesso!');
          await carregarVacinas();
        } catch (error) {
          console.error('Erro ao excluir vacina:', error);
          showToast('Erro ao excluir vacina: ' + error.message, 'error');
        }
      }
    );
  }
});

// ===== EVENT LISTENERS GLOBAIS =====

// Aplica máscara de telefone
aplicarMascaraTelefone(byId('dono-telefone'));

// Fecha modal ao clicar fora
document.addEventListener('click', (e) => {
  const modal = byId('confirmModal');
  if (e.target === modal) {
    closeModal();
  }
});

// Atalhos de teclado
document.addEventListener('keydown', (e) => {
  // ESC fecha modal
  if (e.key === 'Escape') {
    closeModal();
  }
  
  // Ctrl+N limpa formulário ativo
  if (e.ctrlKey && e.key === 'n') {
    e.preventDefault();
    const activeTab = document.querySelector('.tab-section.active');
    if (activeTab) {
      const clearBtn = activeTab.querySelector('[id^="limpar-"]');
      if (clearBtn) {
        clearBtn.click();
      }
    }
  }
});

// ===== INICIALIZAÇÃO =====

/**
 * Função de inicialização da aplicação
 */
async function initApp() {
  try {
    // Mostra indicador de carregamento
    console.log('\ud83d\udc3e Iniciando PetCare - Sistema Veterinário...');
    
    // Carrega dados iniciais
    await Promise.all([
      carregarDonos(),
      carregarAnimais(),
      carregarVacinas()
    ]);
    
    // Configura data atual como padrão para novas vacinas
    const today = new Date().toISOString().split('T')[0];
    const vacinaData = byId('vacina-data');
    if (vacinaData) vacinaData.value = today;
    
    // Configura data/hora atual como padrão para novas consultas
    const now = new Date();
    const dateTimeLocal = now.toISOString().slice(0, 16);
    const consultaDataHora = byId('consulta-data-hora');
    if (consultaDataHora) consultaDataHora.value = dateTimeLocal;
    
    const servicoDataHora = byId('servico-data-hora');
    if (servicoDataHora) servicoDataHora.value = dateTimeLocal;
    
    console.log('\u2705 Sistema PetCare inicializado com sucesso!');
    showToast('Bem-vindo ao PetCare! Sistema pronto para uso.', 'success');
    
  } catch (error) {
    console.error('\u274c Erro na inicialização:', error);
    showToast('Erro ao inicializar sistema: ' + error.message, 'error');
  }
}

// Event listeners para consultas e serviços
document.addEventListener('DOMContentLoaded', function() {
  // Event listener para seleção de dono (consultas)
  const donoSelectConsulta = document.getElementById('consulta-dono');
  if (donoSelectConsulta) {
    donoSelectConsulta.addEventListener('change', function() {
      carregarAnimaisDoDonoConsulta(this.value);
    });
  }
  
  // Event listener para seleção de dono (serviços)
  const donoSelectServico = document.getElementById('servico-dono');
  if (donoSelectServico) {
    donoSelectServico.addEventListener('change', function() {
      carregarAnimaisDoDonoServico(this.value);
    });
  }
  
  // Event listener para formulário de consulta
  const consultaForm = document.getElementById('consulta-form');
  if (consultaForm) {
    consultaForm.addEventListener('submit', salvarConsulta);
  }
  
  // Event listener para formulário de serviço
  const servicoForm = document.getElementById('servico-form');
  if (servicoForm) {
    servicoForm.addEventListener('submit', salvarServico);
  }
});

// Inicia a aplicação quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Exporta funções para debug (opcional)
window.PetCare = {
  carregarDonos,
  carregarAnimais,
  carregarVacinas,
  carregarConsultas,
  carregarServicos,
  showToast,
  switchTab
};