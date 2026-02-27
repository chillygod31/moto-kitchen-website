// ===== CONFIGURATION =====
const CONFIG = {
  GOOGLE_SHEET_ID: '1HfyW9UWyvsnvNr3ZdHg6XUFxLlYl9u47T3YQqTia8b4',
  STORAGE_KEY: 'motoKitchenInvoices',
  DRAFT_KEY: 'motoKitchenDraft',
  CATEGORIES: {
    MEAT: 'Poultry, Fish and Meats',
    VEG: 'Vegetables and Stews',
    SIDES: 'Sides',
    BITES: 'Bites and Drinks'
  }
};

// ===== DEFAULT MENU PRICES =====
const menuPrices = {
  "Mshikaki/Skewers": 5.00,
  "Goat meat/Mbuzi": 5.00,
  "Chicken/Kuku": 3.50,
  "Fried Fish/Samaki": 4.50,
  "Minced meat in tomato sauce": 2.50,
  "Chicken biriyani stew": 4.00,
  "Mchuzi wa Samaki/Fish stew": 5.00,
  "Mchuzi wa Kuku/Chicken stew": 4.00,
  "Mchuzi wa Nyama/Beef stew": 4.00,
  "Ndizi wa Nyama/Green bananas and beef": 7.50,
  "Urojo/Zanzibar mix": 7.50,
  "Njegere/Peas": 3.00,
  "Kisamvu/cassava leaves": 3.00,
  "Kabichi/Fried cabbage": 3.00,
  "Mchicha/Spinach": 3.00,
  "Biriganya/Eggplant": 3.00,
  "Vegetarian Biriyani sauce": 3.50,
  "Maharage/brown beans": 3.00,
  "Bamia": 4.00,
  "Urojo Vegetarian": 6.75,
  "Pilau Veg": 4.00,
  "Pilau Beef": 4.50,
  "Pilau Chicken": 4.50,
  "Wali wa nazi/coconut flavoured rice": 3.50,
  "Chapati": 2.00,
  "Ugali": 4.50,
  "Mihogo": 3.50,
  "Plantain": 5.00,
  "Rice": 3.00,
  "Biriyani": 4.00,
  "Vegetarian Rices with peas": 4.00,
  "Kachumbari": 1.00,
  "Salad": 3.00,
  "Samosa": 3.50,
  "Bahjia": 1.50,
  "Bahjia with chutney": 1.50,
  "Visheti": 1.50,
  "Kalimati": 1.50,
  "Kachori": 1.75,
  "Katlesi/Cutlets": 2.00,
  "Eggchop": 2.00,
  "Kebab": 3.00,
  "Mandazi": 1.50,
  "Vitumbua": 1.75,
  "Coconut cake": 3.00,
  "Fresh Fruit": 4.00,
  "Fresh juice": 4.50,
  "Chai ya Maziwa/Milk Tea": 4.00,
  "Chai ya Tangawizi/Fresh ginger tea": 4.00,
  "Pili Pili": 0.50
};

// ===== UTILITY FUNCTIONS =====
function formatEUR(amount) {
  return amount.toFixed(2).replace('.', ',');
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function formatIBAN(iban) {
  if (!iban) return '';
  const cleaned = iban.replace(/\s/g, '');
  if (cleaned.length >= 18) {
    return cleaned.match(/.{1,4}/g).join(' ');
  }
  return iban;
}

function formatServiceFeeTypes(types) {
  if (types.length === 0) {
    return 'delivery, buffet set up, decorations & staff';
  } else if (types.length === 1) {
    return types[0];
  } else if (types.length === 2) {
    return types.join(' and ');
  } else {
    const lastItem = types.pop();
    return types.join(', ') + ' and ' + lastItem;
  }
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => toast.remove(), 3000);
}

// ===== LOADING OVERLAY =====
function showLoading(message = 'Generating PDF...') {
  let overlay = document.querySelector('.loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-content">
        <div class="spinner"></div>
        <p class="loading-message">${message}</p>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  overlay.querySelector('.loading-message').textContent = message;
  overlay.classList.add('show');
}

function hideLoading() {
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) overlay.classList.remove('show');
}

// ===== LOCAL STORAGE =====
function saveDraft(docType) {
  const formData = getFormData(docType);
  const drafts = JSON.parse(localStorage.getItem(CONFIG.DRAFT_KEY) || '{}');
  drafts[docType] = {
    data: formData,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem(CONFIG.DRAFT_KEY, JSON.stringify(drafts));
  updateDraftIndicator(docType, true);
}

function loadDraft(docType) {
  const drafts = JSON.parse(localStorage.getItem(CONFIG.DRAFT_KEY) || '{}');
  if (drafts[docType]) {
    setFormData(docType, drafts[docType].data);
    updateDraftIndicator(docType, true);
    return true;
  }
  return false;
}

function clearDraft(docType) {
  const drafts = JSON.parse(localStorage.getItem(CONFIG.DRAFT_KEY) || '{}');
  delete drafts[docType];
  localStorage.setItem(CONFIG.DRAFT_KEY, JSON.stringify(drafts));
  updateDraftIndicator(docType, false);
}

function updateDraftIndicator(docType, hasDraft) {
  const form = document.getElementById(`${docType}FormSection`);
  if (!form) return;
  
  let indicator = form.querySelector('.draft-indicator');
  if (hasDraft) {
    if (!indicator) {
      indicator = document.createElement('span');
      indicator.className = 'draft-indicator saved';
      indicator.textContent = '✓ Draft saved';
      const title = form.querySelector('h2');
      if (title) title.appendChild(indicator);
    }
  } else if (indicator) {
    indicator.remove();
  }
}

// ===== API-BASED HISTORY FUNCTIONS (with localStorage fallback) =====

// Flag to track if API is available
let useAPIForHistory = true;

// Track current document type for filtering history
let currentDocumentType = 'invoice';

// Main history functions - try API first, fallback to localStorage
async function saveToHistory(docType, formData) {
  if (useAPIForHistory) {
    await saveToHistoryAPI(docType, formData);
  } else {
    saveToHistoryLocal(docType, formData);
  }
}

async function loadFromHistory(id) {
  // Check if it's a UUID (API) or number (localStorage)
  if (typeof id === 'string' && id.includes('-')) {
    await loadFromHistoryAPI(id);
  } else {
    loadFromHistoryLocal(id);
  }
}

async function deleteFromHistory(id) {
  // Check if it's a UUID (API) or number (localStorage)
  if (typeof id === 'string' && id.includes('-')) {
    await deleteFromHistoryAPI(id);
  } else {
    deleteFromHistoryLocal(id);
  }
}

async function renderHistory() {
  if (useAPIForHistory) {
    await renderHistoryAPI();
  } else {
    renderHistoryLocal();
  }
}

// ===== API HISTORY FUNCTIONS =====
async function saveToHistoryAPI(docType, formData) {
  const numberField = docType === 'invoice' ? 'invoiceNumber' :
                      docType === 'quote' ? 'quoteNumber' : 'embassyInvoiceNumber';
  const clientField = docType === 'invoice' ? 'client' :
                      docType === 'quote' ? 'quoteClient' : 'embassyInvoiceClient';

  try {
    const response = await fetch('/api/invoice-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        document_type: docType,
        document_number: formData[numberField] || '',
        client_name: formData[clientField] || '',
        form_data: formData
      })
    });

    if (response.ok) {
      await renderHistoryAPI();
    } else if (response.status === 401) {
      // Not logged in, fallback to localStorage
      console.log('Not authenticated, using localStorage for history');
      useAPIForHistory = false;
      saveToHistoryLocal(docType, formData);
    } else {
      console.error('Failed to save to API:', await response.text());
      saveToHistoryLocal(docType, formData);
    }
  } catch (error) {
    console.error('Failed to save to API, using localStorage:', error);
    useAPIForHistory = false;
    saveToHistoryLocal(docType, formData);
  }
}

async function loadFromHistoryAPI(id) {
  try {
    const response = await fetch(`/api/invoice-history/${id}`, {
      credentials: 'include'
    });
    if (response.ok) {
      const invoice = await response.json();
      switchDocumentType(invoice.document_type);
      setFormData(invoice.document_type, invoice.form_data);
      showToast('Invoice loaded from history', 'success');
    } else {
      showToast('Failed to load invoice', 'error');
    }
  } catch (error) {
    console.error('Failed to load from API:', error);
    showToast('Failed to load invoice', 'error');
  }
}

async function deleteFromHistoryAPI(id) {
  if (!confirm('Delete this invoice from history?')) return;

  try {
    const response = await fetch(`/api/invoice-history/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (response.ok) {
      await renderHistoryAPI();
      showToast('Deleted from history', 'success');
    } else {
      showToast('Failed to delete invoice', 'error');
    }
  } catch (error) {
    console.error('Failed to delete from API:', error);
    showToast('Failed to delete invoice', 'error');
  }
}

async function renderHistoryAPI() {
  const container = document.getElementById('historyList');
  if (!container) return;

  // Show loading state
  container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Loading...</p>';

  // Map current document type to API filter value
  // The API expects 'invoice', 'quote', or 'embassyInvoice' (not 'embassy-invoice')
  const apiDocType = currentDocumentType === 'embassy-invoice' ? 'embassyInvoice' : currentDocumentType;

  try {
    const response = await fetch(`/api/invoice-history?limit=50&type=${apiDocType}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Not logged in, fallback to localStorage
        console.log('Not authenticated, using localStorage for history');
        useAPIForHistory = false;
        renderHistoryLocal();
        return;
      }
      throw new Error('Failed to fetch history');
    }

    const { invoices } = await response.json();

    // Get display label for current tab
    const tabLabel = currentDocumentType === 'invoice' ? 'invoices' :
                     currentDocumentType === 'quote' ? 'quotes' : 'embassy invoices';

    if (!invoices || invoices.length === 0) {
      container.innerHTML = `<p style="text-align: center; color: #666; padding: 20px;">No saved ${tabLabel} yet</p>`;
      return;
    }

    container.innerHTML = invoices.map(entry => `
      <div class="history-item" data-id="${entry.id}">
        <div class="history-item-info">
          <strong>${entry.document_type === 'invoice' ? 'Invoice' : entry.document_type === 'quote' ? 'Quote' : 'Embassy Invoice'} ${entry.document_number || ''}</strong>
          <span>${entry.client_name || 'No client'} - ${new Date(entry.created_at).toLocaleDateString()}</span>
        </div>
        <div class="history-item-actions">
          <button class="btn btn-primary" onclick="loadFromHistory('${entry.id}')">Load</button>
          <button class="btn btn-danger" onclick="deleteFromHistory('${entry.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to fetch history from API:', error);
    useAPIForHistory = false;
    renderHistoryLocal();
  }
}

// ===== LOCAL STORAGE HISTORY FUNCTIONS (fallback) =====
function saveToHistoryLocal(docType, formData) {
  const history = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]');
  const entry = {
    id: Date.now(),
    type: docType,
    data: formData,
    date: new Date().toISOString(),
    number: formData.invoiceNumber || formData.quoteNumber || formData.embassyInvoiceNumber,
    client: formData.client || formData.quoteClient || formData.embassyInvoiceClient
  };
  history.unshift(entry);
  // Keep last 50 entries
  if (history.length > 50) history.pop();
  localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(history));
  renderHistoryLocal();
}

function loadFromHistoryLocal(id) {
  const history = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]');
  const entry = history.find(h => h.id === id);
  if (entry) {
    switchDocumentType(entry.type);
    setFormData(entry.type, entry.data);
    showToast('Invoice loaded from history', 'success');
  }
}

function deleteFromHistoryLocal(id) {
  if (!confirm('Delete this invoice from history?')) return;
  let history = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]');
  history = history.filter(h => h.id !== id);
  localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(history));
  renderHistoryLocal();
  showToast('Deleted from history', 'success');
}

function renderHistoryLocal() {
  const container = document.getElementById('historyList');
  if (!container) return;

  const allHistory = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]');

  // Filter history by current document type
  // localStorage uses 'invoice', 'quote', or 'embassy-invoice' as type
  const history = allHistory.filter(entry => {
    // Normalize types for comparison
    const entryType = entry.type === 'embassyInvoice' ? 'embassy-invoice' : entry.type;
    return entryType === currentDocumentType;
  });

  // Get display label for current tab
  const tabLabel = currentDocumentType === 'invoice' ? 'invoices' :
                   currentDocumentType === 'quote' ? 'quotes' : 'embassy invoices';

  if (history.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: #666; padding: 20px;">No saved ${tabLabel} yet</p>`;
    return;
  }

  container.innerHTML = history.map(entry => `
    <div class="history-item" data-id="${entry.id}">
      <div class="history-item-info">
        <strong>${entry.type === 'invoice' ? 'Invoice' : entry.type === 'quote' ? 'Quote' : 'Embassy Invoice'} ${entry.number || ''}</strong>
        <span>${entry.client || 'No client'} - ${new Date(entry.date).toLocaleDateString()}</span>
      </div>
      <div class="history-item-actions">
        <button class="btn btn-primary" onclick="loadFromHistory(${entry.id})">Load</button>
        <button class="btn btn-danger" onclick="deleteFromHistory(${entry.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

// ===== FORM DATA HELPERS =====
function getFormData(docType) {
  const prefix = docType === 'invoice' ? '' : docType === 'quote' ? 'quote' : 'embassyInvoice';
  const customOrderId = docType === 'invoice' ? 'isCustomOrder' : docType === 'quote' ? 'quoteIsCustomOrder' : 'embassyInvoiceIsCustomOrder';
  const isCustomOrder = document.getElementById(customOrderId)?.checked || false;
  const getVal = (id) => document.getElementById(id)?.value || '';
  const getChecked = (id) => document.getElementById(id)?.checked || false;

  // Get selected menu items
  const selectedItems = [];
  const sectionId = docType === 'embassy-invoice' ? 'embassyInvoiceFormSection' : `${docType}FormSection`;
  const section = document.getElementById(sectionId);
  if (section) {
    section.querySelectorAll('.pricing-table tbody tr input[type="checkbox"]:checked').forEach(cb => {
      const row = cb.closest('tr');
      const qtyInput = row.querySelector('.qty-input');
      const item = {
        name: row.getAttribute('data-item'),
        price: parseFloat(row.getAttribute('data-price')) || 0
      };
      if (isCustomOrder && qtyInput) {
        item.quantity = parseInt(qtyInput.value) || 0;
      }
      selectedItems.push(item);
    });
  }
  
  if (docType === 'invoice') {
    return {
      invoiceDate: getVal('invoiceDate'),
      caterDate: getVal('caterDate'),
      invoiceNumber: getVal('invoiceNumber'),
      client: getVal('client'),
      guestCount: getVal('guestCount'),
      serviceDescription: getVal('serviceDescription'),
      itemDescription: getVal('itemDescription'),
      discount: getVal('discount'),
      serviceFee: getVal('serviceFee'),
      includeMocktailPackage: getChecked('includeMocktailPackage'),
      mocktailHours: getVal('mocktailHours'),
      includeAdminFee: getChecked('includeAdminFee'),
      serviceFeeDelivery: getChecked('serviceFeeDelivery'),
      serviceFeeBuffet: getChecked('serviceFeeBuffet'),
      serviceFeeDecorations: getChecked('serviceFeeDecorations'),
      serviceFeeStaff: getChecked('serviceFeeStaff'),
      isAmendedInvoice: getChecked('isAmendedInvoice'),
      originalInvoiceNumber: getVal('originalInvoiceNumber'),
      previouslyPaidAmount: getVal('previouslyPaidAmount'),
      isCustomOrder,
      selectedItems
    };
  } else if (docType === 'quote') {
    return {
      quoteDate: getVal('quoteDate'),
      quoteCaterDate: getVal('quoteCaterDate'),
      quoteNumber: getVal('quoteNumber'),
      quoteClient: getVal('quoteClient'),
      quoteGuestCount: getVal('quoteGuestCount'),
      quoteServiceDescription: getVal('quoteServiceDescription'),
      quoteItemDescription: getVal('quoteItemDescription'),
      quoteDiscount: getVal('quoteDiscount'),
      quoteServiceFee: getVal('quoteServiceFee'),
      quoteIncludeMocktailPackage: getChecked('quoteIncludeMocktailPackage'),
      quoteMocktailHours: getVal('quoteMocktailHours'),
      quoteIncludeAdminFee: getChecked('quoteIncludeAdminFee'),
      quoteServiceFeeDelivery: getChecked('quoteServiceFeeDelivery'),
      quoteServiceFeeBuffet: getChecked('quoteServiceFeeBuffet'),
      quoteServiceFeeDecorations: getChecked('quoteServiceFeeDecorations'),
      quoteServiceFeeStaff: getChecked('quoteServiceFeeStaff'),
      isCustomOrder,
      selectedItems
    };
  } else {
    return {
      embassyInvoiceDate: getVal('embassyInvoiceDate'),
      embassyInvoiceCaterDate: getVal('embassyInvoiceCaterDate'),
      embassyInvoiceNumber: getVal('embassyInvoiceNumber'),
      embassyInvoiceClient: getVal('embassyInvoiceClient'),
      embassyInvoiceGuestCount: getVal('embassyInvoiceGuestCount'),
      embassyInvoiceServiceDescription: getVal('embassyInvoiceServiceDescription'),
      embassyInvoiceItemDescription: getVal('embassyInvoiceItemDescription'),
      embassyInvoiceDiscount: getVal('embassyInvoiceDiscount'),
      embassyInvoiceServiceFee: getVal('embassyInvoiceServiceFee'),
      embassyInvoiceIncludeMocktailPackage: getChecked('embassyInvoiceIncludeMocktailPackage'),
      embassyInvoiceMocktailHours: getVal('embassyInvoiceMocktailHours'),
      embassyInvoiceIncludeAdminFee: getChecked('embassyInvoiceIncludeAdminFee'),
      embassyInvoiceServiceFeeDelivery: getChecked('embassyInvoiceServiceFeeDelivery'),
      embassyInvoiceServiceFeeBuffet: getChecked('embassyInvoiceServiceFeeBuffet'),
      embassyInvoiceServiceFeeDecorations: getChecked('embassyInvoiceServiceFeeDecorations'),
      embassyInvoiceServiceFeeStaff: getChecked('embassyInvoiceServiceFeeStaff'),
      embassyInvoiceIsAmended: getChecked('embassyInvoiceIsAmended'),
      embassyInvoiceOriginalNumber: getVal('embassyInvoiceOriginalNumber'),
      embassyInvoicePreviouslyPaid: getVal('embassyInvoicePreviouslyPaid'),
      isCustomOrder,
      selectedItems
    };
  }
}

function setFormData(docType, data) {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };
  const setChecked = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.checked = val || false;
  };
  
  // Clear all checkboxes first
  const sectionId = docType === 'embassy-invoice' ? 'embassyInvoiceFormSection' : `${docType}FormSection`;
  const section = document.getElementById(sectionId);
  if (section) {
    section.querySelectorAll('.pricing-table tbody tr input[type="checkbox"]').forEach(cb => {
      cb.checked = false;
      cb.closest('tr').classList.remove('selected');
    });
  }
  
  if (docType === 'invoice') {
    setVal('invoiceDate', data.invoiceDate);
    setVal('caterDate', data.caterDate);
    setVal('invoiceNumber', data.invoiceNumber);
    setVal('client', data.client);
    setVal('guestCount', data.guestCount);
    setVal('serviceDescription', data.serviceDescription);
    setVal('itemDescription', data.itemDescription);
    setVal('discount', data.discount);
    setVal('serviceFee', data.serviceFee);
    setChecked('includeMocktailPackage', data.includeMocktailPackage);
    setVal('mocktailHours', data.mocktailHours);
    setChecked('includeAdminFee', data.includeAdminFee);
    setChecked('serviceFeeDelivery', data.serviceFeeDelivery);
    setChecked('serviceFeeBuffet', data.serviceFeeBuffet);
    setChecked('serviceFeeDecorations', data.serviceFeeDecorations);
    setChecked('serviceFeeStaff', data.serviceFeeStaff);
    setChecked('isAmendedInvoice', data.isAmendedInvoice);
    setVal('originalInvoiceNumber', data.originalInvoiceNumber);
    setVal('previouslyPaidAmount', data.previouslyPaidAmount);
    setChecked('isCustomOrder', data.isCustomOrder);
    if (data.isCustomOrder) toggleCustomOrder('invoice', true);
    // Show/hide amended invoice fields based on checkbox
    const amendedFields = document.getElementById('amendedInvoiceFields');
    if (amendedFields) {
      amendedFields.style.display = data.isAmendedInvoice ? 'block' : 'none';
    }
  } else if (docType === 'quote') {
    setVal('quoteDate', data.quoteDate);
    setVal('quoteCaterDate', data.quoteCaterDate);
    setVal('quoteNumber', data.quoteNumber);
    setVal('quoteClient', data.quoteClient);
    setVal('quoteGuestCount', data.quoteGuestCount);
    setVal('quoteServiceDescription', data.quoteServiceDescription);
    setVal('quoteItemDescription', data.quoteItemDescription);
    setVal('quoteDiscount', data.quoteDiscount);
    setVal('quoteServiceFee', data.quoteServiceFee);
    setChecked('quoteIncludeMocktailPackage', data.quoteIncludeMocktailPackage);
    setVal('quoteMocktailHours', data.quoteMocktailHours);
    setChecked('quoteIncludeAdminFee', data.quoteIncludeAdminFee);
    setChecked('quoteServiceFeeDelivery', data.quoteServiceFeeDelivery);
    setChecked('quoteServiceFeeBuffet', data.quoteServiceFeeBuffet);
    setChecked('quoteServiceFeeDecorations', data.quoteServiceFeeDecorations);
    setChecked('quoteServiceFeeStaff', data.quoteServiceFeeStaff);
    setChecked('quoteIsCustomOrder', data.isCustomOrder);
    if (data.isCustomOrder) toggleCustomOrder('quote', true);
  } else {
    setVal('embassyInvoiceDate', data.embassyInvoiceDate);
    setVal('embassyInvoiceCaterDate', data.embassyInvoiceCaterDate);
    setVal('embassyInvoiceNumber', data.embassyInvoiceNumber);
    setVal('embassyInvoiceClient', data.embassyInvoiceClient);
    setVal('embassyInvoiceGuestCount', data.embassyInvoiceGuestCount);
    setVal('embassyInvoiceServiceDescription', data.embassyInvoiceServiceDescription);
    setVal('embassyInvoiceItemDescription', data.embassyInvoiceItemDescription);
    setVal('embassyInvoiceDiscount', data.embassyInvoiceDiscount);
    setVal('embassyInvoiceServiceFee', data.embassyInvoiceServiceFee);
    setChecked('embassyInvoiceIncludeMocktailPackage', data.embassyInvoiceIncludeMocktailPackage);
    setVal('embassyInvoiceMocktailHours', data.embassyInvoiceMocktailHours);
    setChecked('embassyInvoiceIncludeAdminFee', data.embassyInvoiceIncludeAdminFee);
    setChecked('embassyInvoiceServiceFeeDelivery', data.embassyInvoiceServiceFeeDelivery);
    setChecked('embassyInvoiceServiceFeeBuffet', data.embassyInvoiceServiceFeeBuffet);
    setChecked('embassyInvoiceServiceFeeDecorations', data.embassyInvoiceServiceFeeDecorations);
    setChecked('embassyInvoiceServiceFeeStaff', data.embassyInvoiceServiceFeeStaff);
    setChecked('embassyInvoiceIsAmended', data.embassyInvoiceIsAmended);
    setVal('embassyInvoiceOriginalNumber', data.embassyInvoiceOriginalNumber);
    setVal('embassyInvoicePreviouslyPaid', data.embassyInvoicePreviouslyPaid);
    setChecked('embassyInvoiceIsCustomOrder', data.isCustomOrder);
    if (data.isCustomOrder) toggleCustomOrder('embassy-invoice', true);
    // Show/hide amended invoice fields based on checkbox
    const embassyAmendedFields = document.getElementById('embassyInvoiceAmendedFields');
    if (embassyAmendedFields) {
      embassyAmendedFields.style.display = data.embassyInvoiceIsAmended ? 'block' : 'none';
    }
  }
  
  // Re-select menu items
  if (data.selectedItems && section) {
    data.selectedItems.forEach(item => {
      const row = section.querySelector(`tr[data-item="${item.name}"]`);
      if (row) {
        const cb = row.querySelector('input[type="checkbox"]');
        if (cb) {
          cb.checked = true;
          row.classList.add('selected');
        }
        if (item.quantity && data.isCustomOrder) {
          const qtyInput = row.querySelector('.qty-input');
          if (qtyInput) qtyInput.value = item.quantity;
        }
      }
    });
  }
  
  // Recalculate
  if (docType === 'invoice') calculateTotals();
  else if (docType === 'quote') calculateQuoteTotals();
  else calculateEmbassyInvoiceTotals();
  
  updateSelectedSummary(docType);
}

// ===== CUSTOM ORDER TOGGLE =====
function toggleCustomOrder(docType, show) {
  const sectionId = docType === 'embassy-invoice' ? 'embassyInvoiceFormSection' : `${docType}FormSection`;
  const section = document.getElementById(sectionId);
  if (!section) return;

  // Show/hide quantity columns and headers
  section.querySelectorAll('.qty-col').forEach(el => {
    el.style.display = show ? '' : 'none';
  });
  section.querySelectorAll('.qty-header').forEach(el => {
    el.style.display = show ? '' : 'none';
  });

  // Show/hide guest count field
  const guestCountId = docType === 'invoice' ? 'guestCount' : docType === 'quote' ? 'quoteGuestCount' : 'embassyInvoiceGuestCount';
  const guestCountEl = document.getElementById(guestCountId);
  if (guestCountEl) {
    const formGroup = guestCountEl.closest('.form-group');
    if (formGroup) formGroup.style.display = show ? 'none' : '';
  }

  // Show/hide price per person display in form
  const pppId = docType === 'invoice' ? 'pricePerPersonDisplay' : docType === 'quote' ? 'quotePricePerPersonDisplay' : 'embassyInvoicePricePerPersonDisplay';
  const pppEl = document.getElementById(pppId);
  if (pppEl) {
    const formGroup = pppEl.closest('.form-group');
    if (formGroup) formGroup.style.display = show ? 'none' : '';
  }

  // Show/hide discount (not applicable for custom order)
  const discountId = docType === 'invoice' ? 'discount' : docType === 'quote' ? 'quoteDiscount' : 'embassyInvoiceDiscount';
  const discountEl = document.getElementById(discountId);
  if (discountEl) {
    const formGroup = discountEl.closest('.form-group');
    if (formGroup) formGroup.style.display = show ? 'none' : '';
  }

  // Show/hide mocktail package (not applicable for custom order)
  const mocktailId = docType === 'invoice' ? 'includeMocktailPackage' : docType === 'quote' ? 'quoteIncludeMocktailPackage' : 'embassyInvoiceIncludeMocktailPackage';
  const mocktailEl = document.getElementById(mocktailId);
  if (mocktailEl) {
    const formGroup = mocktailEl.closest('.form-group');
    if (formGroup) formGroup.style.display = show ? 'none' : '';
  }

  // Clear quantities when turning off custom order
  if (!show) {
    section.querySelectorAll('.qty-input').forEach(input => {
      input.value = '';
    });
  }

  // Recalculate
  if (docType === 'invoice') calculateTotals();
  else if (docType === 'quote') calculateQuoteTotals();
  else calculateEmbassyInvoiceTotals();
}

// ===== SELECTED ITEMS SUMMARY =====
function updateSelectedSummary(docType) {
  // Handle section ID - embassy-invoice uses embassyInvoiceFormSection
  const sectionId = docType === 'embassy-invoice' ? 'embassyInvoiceFormSection' : `${docType}FormSection`;
  const section = document.getElementById(sectionId);
  if (!section) return;

  let summary = section.querySelector('.selected-summary');
  if (!summary) {
    // Create summary element if it doesn't exist
    // Find the menu section - it's the form-group that contains pricing-table elements
    const allFormGroups = section.querySelectorAll('.form-group[style*="grid-column: 1 / -1"]');
    let menuSection = null;
    for (const fg of allFormGroups) {
      if (fg.querySelector('.pricing-table')) {
        menuSection = fg;
        break;
      }
    }
    if (menuSection) {
      summary = document.createElement('div');
      summary.className = 'selected-summary';
      summary.innerHTML = `
        <h4>Selected Items</h4>
        <div class="selected-items-list"></div>
        <div class="summary-total">Total per person: EUR 0,00</div>
      `;
      // Insert summary BEFORE the menu section
      menuSection.parentNode.insertBefore(summary, menuSection);
    }
  }

  if (!summary) return;
  
  const listEl = summary.querySelector('.selected-items-list');
  const totalEl = summary.querySelector('.summary-total');
  
  const customOrderId = docType === 'invoice' ? 'isCustomOrder' : docType === 'quote' ? 'quoteIsCustomOrder' : 'embassyInvoiceIsCustomOrder';
  const isCustomOrder = document.getElementById(customOrderId)?.checked || false;

  const selectedItems = [];
  section.querySelectorAll('.pricing-table tbody tr input[type="checkbox"]:checked').forEach(cb => {
    const row = cb.closest('tr');
    const qtyInput = row.querySelector('.qty-input');
    const quantity = isCustomOrder ? (parseInt(qtyInput?.value) || 0) : 1;
    selectedItems.push({
      name: row.getAttribute('data-item'),
      price: parseFloat(row.getAttribute('data-price')) || 0,
      quantity: quantity
    });
  });

  if (selectedItems.length === 0) {
    listEl.innerHTML = '<p style="color: #666; font-size: 11px;">No items selected</p>';
    totalEl.textContent = isCustomOrder ? 'Total: EUR 0,00' : 'Total per person: EUR 0,00';
  } else if (isCustomOrder) {
    listEl.innerHTML = selectedItems.map(item => `
      <div class="selected-item">
        <span>${item.quantity > 0 ? item.quantity + 'x ' : ''}${item.name}</span>
        <span>€${formatEUR(item.price * item.quantity)}</span>
      </div>
    `).join('');
    const total = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalEl.textContent = `Total: EUR ${formatEUR(total)}`;
  } else {
    listEl.innerHTML = selectedItems.map(item => `
      <div class="selected-item">
        <span>${item.name}</span>
        <span>€${formatEUR(item.price)}</span>
      </div>
    `).join('');
    const total = selectedItems.reduce((sum, item) => sum + item.price, 0);
    totalEl.textContent = `Total per person: EUR ${formatEUR(total)}`;
  }
}

// ===== MENU SEARCH =====
function filterMenuItems(searchTerm, docType) {
  const section = document.getElementById(`${docType}FormSection`);
  if (!section) return;
  
  const rows = section.querySelectorAll('.pricing-table tbody tr');
  const term = searchTerm.toLowerCase();
  
  rows.forEach(row => {
    const itemName = row.getAttribute('data-item')?.toLowerCase() || '';
    if (term === '' || itemName.includes(term)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// ===== DOCUMENT TYPE SWITCHING =====
function switchDocumentType(type) {
  // Normalize type for consistency (embassy-invoice and embassyInvoice are the same)
  const normalizedType = type === 'embassyInvoice' ? 'embassy-invoice' : type;

  // Update current document type
  currentDocumentType = normalizedType;

  document.querySelectorAll('.document-type-option').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-type="${normalizedType}"]`)?.classList.add('active');

  document.getElementById('invoiceFormSection')?.classList.toggle('active', normalizedType === 'invoice');
  document.getElementById('quoteFormSection')?.classList.toggle('active', normalizedType === 'quote');
  document.getElementById('embassyInvoiceFormSection')?.classList.toggle('active', normalizedType === 'embassy-invoice');

  document.getElementById('invoicePages').style.display = normalizedType === 'invoice' ? 'block' : 'none';
  document.getElementById('quotePages').style.display = normalizedType === 'quote' ? 'block' : 'none';
  document.getElementById('embassyInvoicePages').style.display = normalizedType === 'embassy-invoice' ? 'block' : 'none';

  // Load draft if exists
  loadDraft(normalizedType);

  // Re-render history filtered by current document type
  renderHistory();
}

// ===== CALCULATION FUNCTIONS =====
function calculateTotals() {
  const isCustomOrder = document.getElementById('isCustomOrder')?.checked || false;
  const guestCount = parseFloat(document.getElementById('guestCount')?.value) || 0;
  const discount = parseFloat(document.getElementById('discount')?.value) || 0;
  const serviceFee = parseFloat(document.getElementById('serviceFee')?.value) || 0;

  const selectedCheckboxes = document.querySelectorAll('#invoiceFormSection .pricing-table tbody tr input[type="checkbox"]:checked');
  let subtotal = 0;
  const selectedItems = [];

  selectedCheckboxes.forEach(checkbox => {
    const row = checkbox.closest('tr');
    const itemName = row.getAttribute('data-item');
    const price = parseFloat(row.getAttribute('data-price')) || 0;
    const qtyInput = row.querySelector('.qty-input');
    const quantity = isCustomOrder ? (parseInt(qtyInput?.value) || 0) : 1;

    if (isCustomOrder) {
      subtotal += price * quantity;
      if (quantity > 0) selectedItems.push({ name: itemName, price: price, quantity: quantity });
    } else {
      subtotal += price;
      selectedItems.push({ name: itemName, price: price });
    }
  });

  const includeMocktail = document.getElementById('includeMocktailPackage')?.checked;
  const mocktailHours = parseFloat(document.getElementById('mocktailHours')?.value) || 0;
  const mocktailCostPerPerson = includeMocktail && mocktailHours > 0 ? 11 * mocktailHours : 0;

  let itemTotal;
  let rate;
  let pricePerPerson;

  if (isCustomOrder) {
    itemTotal = subtotal;
    rate = 0;
    pricePerPerson = 0;
  } else {
    pricePerPerson = subtotal - discount + mocktailCostPerPerson;
    rate = pricePerPerson;
    itemTotal = rate * guestCount;
  }

  const includeAdminFee = document.getElementById('includeAdminFee')?.checked;
  const adminFeeBase = itemTotal + serviceFee;
  const adminFee = includeAdminFee ? adminFeeBase * 0.03 : 0;
  const grandTotal = itemTotal + serviceFee + adminFee;
  
  const adminFeeRow = document.getElementById('adminFeeRow');
  if (adminFeeRow) adminFeeRow.style.display = includeAdminFee ? '' : 'none';

  const invoiceDate = document.getElementById('invoiceDate')?.value;
  const caterDate = document.getElementById('caterDate')?.value;
  let depositDue = 0;
  
  if (invoiceDate && caterDate) {
    const diffDays = Math.ceil((new Date(caterDate) - new Date(invoiceDate)) / (1000 * 60 * 60 * 24));
    depositDue = diffDays <= 7 ? grandTotal : grandTotal * 0.5;
  }

  // Update displays
  const updateEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  // Update key fields on invoice display (for real-time preview updates)
  const client = document.getElementById('client')?.value || '';
  updateEl('displayClient', client);
  updateEl('displayClient2', client);

  const invoiceNumber = document.getElementById('invoiceNumber')?.value || '';
  const formattedInvoiceNumber = invoiceNumber.startsWith('#') ? invoiceNumber : '#' + invoiceNumber;
  updateEl('displayInvoiceNumber', formattedInvoiceNumber);
  updateEl('displayInvoiceNumber2', formattedInvoiceNumber);

  const serviceDescription = document.getElementById('serviceDescription')?.value || '';
  updateEl('displayServiceDescription', serviceDescription);
  updateEl('displayServiceDescription2', serviceDescription);

  const itemDescription = document.getElementById('itemDescription')?.value || 'Custom wedding dinner menu';
  updateEl('displayItemDescription', itemDescription);

  // Update dates on invoice display
  const formattedInvoiceDate = formatDate(invoiceDate);
  const formattedCaterDate = formatDate(caterDate);
  updateEl('displayDate', formattedInvoiceDate);
  updateEl('displayCaterDate', formattedCaterDate);
  updateEl('displayCaterDate2', formattedCaterDate);
  updateEl('displayDate2', formattedCaterDate);
  updateEl('displaySignatureDate', formattedInvoiceDate);

  updateEl('displayGuestCount', guestCount);
  updateEl('displayGuestCountTable', guestCount);
  updateEl('pricePerPersonDisplay', `EUR ${formatEUR(pricePerPerson)}`);
  updateEl('displayPricePerPerson', `EUR ${formatEUR(pricePerPerson)}`);
  updateEl('displayRate', formatEUR(rate));
  updateEl('displayItemTotal', `EUR ${formatEUR(itemTotal)}`);
  updateEl('displaySubtotal', `EUR ${formatEUR(itemTotal)}`);
  updateEl('displayServiceFee', `EUR ${formatEUR(serviceFee)}`);
  updateEl('displayAdminFeeLabel', `Admin Fee (3% over EUR ${formatEUR(adminFeeBase)})`);
  updateEl('displayAdminFee', `EUR ${formatEUR(adminFee)}`);
  updateEl('displayGrandTotal', `EUR ${formatEUR(grandTotal)}`);
  updateEl('displayTotal2', `EUR ${formatEUR(grandTotal)}`);
  updateEl('displayTotal', `EUR ${formatEUR(grandTotal)}`);

  // Handle amended invoice (partial payment)
  const isAmended = document.getElementById('isAmendedInvoice')?.checked || false;
  const previouslyPaid = parseFloat(document.getElementById('previouslyPaidAmount')?.value) || 0;
  const balanceDue = grandTotal - previouslyPaid;

  // For amended invoices, deposit due shows balance due (what's left to pay)
  // For normal invoices, deposit due is calculated as before
  const displayDeposit = isAmended ? balanceDue : depositDue;
  updateEl('displayDepositDue', `EUR ${formatEUR(displayDeposit)}`);

  window.selectedMenuItems = selectedItems;
  updateSelectedSummary('invoice');

  // Update amended invoice display on Page 1
  const amendedInfoEl = document.getElementById('amendedInvoiceInfo');
  if (amendedInfoEl) {
    amendedInfoEl.style.display = isAmended ? 'block' : 'none';
  }
  if (isAmended) {
    updateEl('displayOriginalInvoiceNumber', document.getElementById('originalInvoiceNumber')?.value || '');
    updateEl('displayPreviouslyPaid', `EUR ${formatEUR(previouslyPaid)}`);
    updateEl('displayBalanceDue', `EUR ${formatEUR(balanceDue)}`);
  }

  // Update amended invoice display on Page 3
  const previouslyPaidRow = document.getElementById('previouslyPaidRow');
  const balanceDueRow = document.getElementById('balanceDueRow');
  if (previouslyPaidRow) previouslyPaidRow.style.display = isAmended ? '' : 'none';
  if (balanceDueRow) balanceDueRow.style.display = isAmended ? '' : 'none';
  if (isAmended) {
    updateEl('displayPreviouslyPaidPage3', `-EUR ${formatEUR(previouslyPaid)}`);
    updateEl('displayBalanceDuePage3', `EUR ${formatEUR(balanceDue)}`);
  }

  // Keep title as INVOICE (not AMENDED INVOICE)

  // Auto-save draft
  saveDraft('invoice');
}

function calculateQuoteTotals() {
  const isCustomOrder = document.getElementById('quoteIsCustomOrder')?.checked || false;
  const guestCount = parseFloat(document.getElementById('quoteGuestCount')?.value) || 0;
  const discount = parseFloat(document.getElementById('quoteDiscount')?.value) || 0;
  const serviceFee = parseFloat(document.getElementById('quoteServiceFee')?.value) || 0;

  const selectedCheckboxes = document.querySelectorAll('#quoteFormSection .pricing-table tbody tr input[type="checkbox"]:checked');
  let subtotal = 0;
  const selectedItems = [];

  selectedCheckboxes.forEach(checkbox => {
    const row = checkbox.closest('tr');
    const itemName = row.getAttribute('data-item');
    const price = parseFloat(row.getAttribute('data-price')) || 0;
    const qtyInput = row.querySelector('.qty-input');
    const quantity = isCustomOrder ? (parseInt(qtyInput?.value) || 0) : 1;

    if (isCustomOrder) {
      subtotal += price * quantity;
      if (quantity > 0) selectedItems.push({ name: itemName, price: price, quantity: quantity });
    } else {
      subtotal += price;
      selectedItems.push({ name: itemName, price: price });
    }
  });

  const includeMocktail = document.getElementById('quoteIncludeMocktailPackage')?.checked;
  const mocktailHours = parseFloat(document.getElementById('quoteMocktailHours')?.value) || 0;
  const mocktailCostPerPerson = includeMocktail && mocktailHours > 0 ? 11 * mocktailHours : 0;

  let itemTotal, rate, pricePerPerson;

  if (isCustomOrder) {
    itemTotal = subtotal;
    rate = 0;
    pricePerPerson = 0;
  } else {
    pricePerPerson = subtotal - discount + mocktailCostPerPerson;
    rate = pricePerPerson;
    itemTotal = rate * guestCount;
  }

  const includeAdminFee = document.getElementById('quoteIncludeAdminFee')?.checked;
  const adminFeeBase = itemTotal + serviceFee;
  const adminFee = includeAdminFee ? adminFeeBase * 0.03 : 0;
  const grandTotal = itemTotal + serviceFee + adminFee;
  
  const adminFeeRow = document.getElementById('quoteAdminFeeRow');
  if (adminFeeRow) adminFeeRow.style.display = includeAdminFee ? '' : 'none';

  const quoteDate = document.getElementById('quoteDate')?.value;
  const caterDate = document.getElementById('quoteCaterDate')?.value;
  let depositDue = 0;
  
  if (quoteDate && caterDate) {
    const diffDays = Math.ceil((new Date(caterDate) - new Date(quoteDate)) / (1000 * 60 * 60 * 24));
    depositDue = diffDays <= 7 ? grandTotal : grandTotal * 0.5;
  }

  const updateEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  updateEl('quoteDisplayGuestCount', guestCount);
  updateEl('quoteDisplayGuestCountTable', guestCount);
  updateEl('quotePricePerPersonDisplay', `EUR ${formatEUR(pricePerPerson)}`);
  updateEl('quoteDisplayPricePerPerson', `EUR ${formatEUR(pricePerPerson)}`);
  updateEl('quoteDisplayRate', formatEUR(rate));
  updateEl('quoteDisplayItemTotal', `EUR ${formatEUR(itemTotal)}`);
  updateEl('quoteDisplaySubtotal', `EUR ${formatEUR(itemTotal)}`);
  updateEl('quoteDisplayServiceFee', `EUR ${formatEUR(serviceFee)}`);
  updateEl('quoteDisplayAdminFeeLabel', `Admin Fee (3% over EUR ${formatEUR(adminFeeBase)})`);
  updateEl('quoteDisplayAdminFee', `EUR ${formatEUR(adminFee)}`);
  updateEl('quoteDisplayGrandTotal', `EUR ${formatEUR(grandTotal)}`);
  updateEl('quoteDisplayTotal2', `EUR ${formatEUR(grandTotal)}`);
  updateEl('quoteDisplayTotal', `EUR ${formatEUR(grandTotal)}`);
  updateEl('quoteDisplayDepositDue', `EUR ${formatEUR(depositDue)}`);

  window.selectedQuoteMenuItems = selectedItems;
  updateSelectedSummary('quote');
  saveDraft('quote');
}

function calculateEmbassyInvoiceTotals() {
  const isCustomOrder = document.getElementById('embassyInvoiceIsCustomOrder')?.checked || false;
  const guestCount = parseFloat(document.getElementById('embassyInvoiceGuestCount')?.value) || 0;
  const discount = parseFloat(document.getElementById('embassyInvoiceDiscount')?.value) || 0;
  const serviceFee = parseFloat(document.getElementById('embassyInvoiceServiceFee')?.value) || 0;

  const selectedCheckboxes = document.querySelectorAll('#embassyInvoiceFormSection .pricing-table tbody tr input[type="checkbox"]:checked');
  let subtotal = 0;
  const selectedItems = [];

  selectedCheckboxes.forEach(checkbox => {
    const row = checkbox.closest('tr');
    const itemName = row.getAttribute('data-item');
    const price = parseFloat(row.getAttribute('data-price')) || 0;
    const qtyInput = row.querySelector('.qty-input');
    const quantity = isCustomOrder ? (parseInt(qtyInput?.value) || 0) : 1;

    if (isCustomOrder) {
      subtotal += price * quantity;
      if (quantity > 0) selectedItems.push({ name: itemName, price: price, quantity: quantity });
    } else {
      subtotal += price;
      selectedItems.push({ name: itemName, price: price });
    }
  });

  const includeMocktail = document.getElementById('embassyInvoiceIncludeMocktailPackage')?.checked;
  const mocktailHours = parseFloat(document.getElementById('embassyInvoiceMocktailHours')?.value) || 0;
  const mocktailCostPerPerson = includeMocktail && mocktailHours > 0 ? 11 * mocktailHours : 0;

  let itemTotal, rate, pricePerPerson;

  if (isCustomOrder) {
    itemTotal = subtotal;
    rate = 0;
    pricePerPerson = 0;
  } else {
    pricePerPerson = subtotal - discount + mocktailCostPerPerson;
    rate = pricePerPerson;
    itemTotal = rate * guestCount;
  }

  const includeAdminFee = document.getElementById('embassyInvoiceIncludeAdminFee')?.checked;
  const adminFeeBase = itemTotal + serviceFee;
  const adminFee = includeAdminFee ? adminFeeBase * 0.03 : 0;
  const grandTotal = itemTotal + serviceFee + adminFee;

  const adminFeeRow = document.getElementById('embassyInvoiceAdminFeeRow');
  if (adminFeeRow) adminFeeRow.style.display = includeAdminFee ? '' : 'none';

  const updateEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  updateEl('embassyInvoiceDisplayGuestCount', guestCount);
  updateEl('embassyInvoiceDisplayGuestCountTable', guestCount);
  updateEl('embassyInvoicePricePerPersonDisplay', `EUR ${formatEUR(pricePerPerson)}`);
  updateEl('embassyInvoiceDisplayPricePerPerson', `EUR ${formatEUR(pricePerPerson)}`);
  updateEl('embassyInvoiceDisplayPricePerPersonPage1', `€${formatEUR(pricePerPerson)}`);
  updateEl('embassyInvoiceDisplayRate', formatEUR(rate));
  updateEl('embassyInvoiceDisplayItemTotal', `EUR ${formatEUR(itemTotal)}`);
  updateEl('embassyInvoiceDisplaySubtotal', `EUR ${formatEUR(itemTotal)}`);
  updateEl('embassyInvoiceDisplayServiceFee', `EUR ${formatEUR(serviceFee)}`);
  updateEl('embassyInvoiceDisplayAdminFeeLabel', `Admin Fee (3% over EUR ${formatEUR(adminFeeBase)})`);
  updateEl('embassyInvoiceDisplayAdminFee', `EUR ${formatEUR(adminFee)}`);
  updateEl('embassyInvoiceDisplayGrandTotal', `EUR ${formatEUR(grandTotal)}`);
  updateEl('embassyInvoiceDisplayTotalPaymentDetails', `EUR ${formatEUR(grandTotal)}`);

  // Handle amended invoice (partial payment) for embassy invoice
  const isAmended = document.getElementById('embassyInvoiceIsAmended')?.checked || false;
  const previouslyPaid = parseFloat(document.getElementById('embassyInvoicePreviouslyPaid')?.value) || 0;
  const balanceDue = grandTotal - previouslyPaid;

  // Update amended invoice display elements
  const amendedInfoEl = document.getElementById('embassyInvoiceAmendedInfo');
  if (amendedInfoEl) {
    amendedInfoEl.style.display = isAmended ? 'block' : 'none';
  }
  if (isAmended) {
    updateEl('embassyInvoiceDisplayOriginalNumber', document.getElementById('embassyInvoiceOriginalNumber')?.value || '');
    updateEl('embassyInvoiceDisplayPreviouslyPaidPage1', `EUR ${formatEUR(previouslyPaid)}`);
    updateEl('embassyInvoiceDisplayBalanceDuePage1', `EUR ${formatEUR(balanceDue)}`);
  }

  // Update amended invoice rows in totals table
  const previouslyPaidRow = document.getElementById('embassyInvoicePreviouslyPaidRow');
  const balanceDueRow = document.getElementById('embassyInvoiceBalanceDueRow');
  if (previouslyPaidRow) previouslyPaidRow.style.display = isAmended ? '' : 'none';
  if (balanceDueRow) balanceDueRow.style.display = isAmended ? '' : 'none';
  if (isAmended) {
    updateEl('embassyInvoiceDisplayPreviouslyPaid', `-EUR ${formatEUR(previouslyPaid)}`);
    updateEl('embassyInvoiceDisplayBalanceDue', `EUR ${formatEUR(balanceDue)}`);
  }

  window.selectedEmbassyInvoiceMenuItems = selectedItems;
  updateSelectedSummary('embassy-invoice');
  saveDraft('embassy-invoice');
}

// ===== GENERATE FUNCTIONS =====
function generateInvoice() {
  const isCustomOrder = document.getElementById('isCustomOrder')?.checked || false;
  const requiredFields = isCustomOrder
    ? ['invoiceDate', 'caterDate', 'invoiceNumber', 'client', 'serviceDescription']
    : ['invoiceDate', 'caterDate', 'invoiceNumber', 'client', 'guestCount', 'serviceDescription'];
  let valid = true;
  
  requiredFields.forEach(id => {
    const el = document.getElementById(id);
    if (!el?.value) {
      el?.classList.add('invalid');
      valid = false;
    } else {
      el?.classList.remove('invalid');
    }
  });
  
  if (!valid) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  // Set logo on all images before generating
  setLogoOnAllImages();

  const invoiceDate = document.getElementById('invoiceDate').value;
  const caterDate = document.getElementById('caterDate').value;
  const invoiceNumber = document.getElementById('invoiceNumber').value;
  const client = document.getElementById('client').value;
  const guestCount = document.getElementById('guestCount').value;
  const serviceDescription = document.getElementById('serviceDescription').value;
  const itemDescription = document.getElementById('itemDescription').value || 'Custom wedding dinner menu';

  const formattedInvoiceDate = formatDate(invoiceDate);
  const formattedCaterDate = formatDate(caterDate);
  const formattedInvoiceNumber = invoiceNumber.startsWith('#') ? invoiceNumber : '#' + invoiceNumber;

  // Update displays
  document.getElementById('displayDate').textContent = formattedInvoiceDate;
  document.getElementById('displayClient').textContent = client;
  document.getElementById('displayCaterDate').textContent = formattedCaterDate;
  document.getElementById('displayInvoiceNumber').textContent = formattedInvoiceNumber;
  document.getElementById('displayServiceDescription').textContent = serviceDescription;

  // Service fee types
  const serviceFeeTypes = [];
  if (document.getElementById('serviceFeeDelivery')?.checked) serviceFeeTypes.push('delivery');
  if (document.getElementById('serviceFeeBuffet')?.checked) serviceFeeTypes.push('buffet set up');
  if (document.getElementById('serviceFeeDecorations')?.checked) serviceFeeTypes.push('decorations');
  if (document.getElementById('serviceFeeStaff')?.checked) serviceFeeTypes.push('staff');
  document.getElementById('displayServiceFeeType').textContent = formatServiceFeeTypes([...serviceFeeTypes]);

  // Page 2
  document.getElementById('displayCaterDate2').textContent = formattedCaterDate;
  document.getElementById('displayInvoiceNumber2').textContent = formattedInvoiceNumber;
  document.getElementById('displayGuestCount').textContent = guestCount;
  document.getElementById('displayDate2').textContent = formattedCaterDate;
  document.getElementById('displayClient2').textContent = client;
  document.getElementById('displayServiceDescription2').textContent = serviceDescription;
  document.getElementById('displayItemDescription').textContent = itemDescription;

  calculateTotals();

  // Menu items
  const menuList = document.getElementById('displayMenuItems');
  const selectedItems = window.selectedMenuItems || [];

  if (selectedItems.length > 0) {
    if (isCustomOrder) {
      menuList.innerHTML = selectedItems.map(item => `<li>${item.quantity}x ${item.name}</li>`).join('');
    } else {
      menuList.innerHTML = selectedItems.map(item => `<li>- ${item.name}</li>`).join('');
    }
  }

  // Page 3 - Cost breakdown
  document.getElementById('displaySignatureDate').textContent = formattedInvoiceDate;
  const costBreakdownBody = document.getElementById('invoiceCostBreakdownBody');
  if (isCustomOrder && selectedItems.length > 0) {
    costBreakdownBody.innerHTML = selectedItems.map(item =>
      `<tr><td>${item.name}</td><td>${formatEUR(item.price)}</td><td>${item.quantity}</td><td>EUR ${formatEUR(item.price * item.quantity)}</td></tr>`
    ).join('');
  } else {
    // Normal mode: restore single-row template (calculateTotals already set the values)
    costBreakdownBody.innerHTML = `<tr>
      <td id="displayItemDescription"></td>
      <td id="displayRate"></td>
      <td id="displayGuestCountTable"></td>
      <td id="displayItemTotal"></td>
    </tr>`;
    // Re-run calculateTotals to fill in the restored elements
    calculateTotals();
  }

  // Hide guest count and price per person in custom order mode
  const guestCountDisplay = document.getElementById('invoiceGuestCountDisplay');
  const pricePerPersonRow = document.getElementById('invoicePricePerPersonRow');
  if (guestCountDisplay) guestCountDisplay.style.display = isCustomOrder ? 'none' : '';
  if (pricePerPersonRow) pricePerPersonRow.style.display = isCustomOrder ? 'none' : '';

  // Mocktail section
  const includeMocktail = document.getElementById('includeMocktailPackage')?.checked;
  const mocktailSection = document.getElementById('mocktailSection');
  if (mocktailSection) mocktailSection.style.display = includeMocktail ? 'block' : 'none';

  // Show pages
  document.getElementById('invoicePages').style.display = 'block';
  document.getElementById('quotePages').style.display = 'none';
  document.getElementById('embassyInvoicePages').style.display = 'none';
  document.getElementById('invoicePages').scrollIntoView({ behavior: 'smooth' });

  // Set logo on displayed pages (after they're visible)
  setTimeout(() => {
    setLogoOnAllImages();
  }, 100);

  // Note: History is saved on download (printInvoice), not on generation
  clearDraft('invoice');
  showToast('Invoice generated successfully', 'success');
}

function generateQuote() {
  const quoteIsCustomOrder = document.getElementById('quoteIsCustomOrder')?.checked || false;
  const requiredFields = quoteIsCustomOrder
    ? ['quoteDate', 'quoteCaterDate', 'quoteNumber', 'quoteClient', 'quoteServiceDescription']
    : ['quoteDate', 'quoteCaterDate', 'quoteNumber', 'quoteClient', 'quoteGuestCount', 'quoteServiceDescription'];
  let valid = true;
  
  requiredFields.forEach(id => {
    const el = document.getElementById(id);
    if (!el?.value) {
      el?.classList.add('invalid');
      valid = false;
    } else {
      el?.classList.remove('invalid');
    }
  });
  
  if (!valid) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  // Set logo on all images before generating
  setLogoOnAllImages();

  const quoteDate = document.getElementById('quoteDate').value;
  const caterDate = document.getElementById('quoteCaterDate').value;
  const quoteNumber = document.getElementById('quoteNumber').value;
  const client = document.getElementById('quoteClient').value;
  const guestCount = document.getElementById('quoteGuestCount').value;
  const serviceDescription = document.getElementById('quoteServiceDescription').value;
  const itemDescription = document.getElementById('quoteItemDescription').value || 'Custom wedding dinner menu';

  const formattedQuoteDate = formatDate(quoteDate);
  const formattedCaterDate = formatDate(caterDate);
  const formattedQuoteNumber = quoteNumber.startsWith('#') ? quoteNumber : '#' + quoteNumber;

  document.getElementById('quoteDisplayDate').textContent = formattedQuoteDate;
  document.getElementById('quoteDisplayClient').textContent = client;
  document.getElementById('quoteDisplayCaterDate').textContent = formattedCaterDate;
  document.getElementById('quoteDisplayNumber').textContent = formattedQuoteNumber;
  document.getElementById('quoteDisplayServiceDescription').textContent = serviceDescription;

  const serviceFeeTypes = [];
  if (document.getElementById('quoteServiceFeeDelivery')?.checked) serviceFeeTypes.push('delivery');
  if (document.getElementById('quoteServiceFeeBuffet')?.checked) serviceFeeTypes.push('buffet set up');
  if (document.getElementById('quoteServiceFeeDecorations')?.checked) serviceFeeTypes.push('decorations');
  if (document.getElementById('quoteServiceFeeStaff')?.checked) serviceFeeTypes.push('staff');
  document.getElementById('quoteDisplayServiceFeeType').textContent = formatServiceFeeTypes([...serviceFeeTypes]);

  document.getElementById('quoteDisplayCaterDate2').textContent = formattedCaterDate;
  document.getElementById('quoteDisplayNumber2').textContent = formattedQuoteNumber;
  document.getElementById('quoteDisplayGuestCount').textContent = guestCount;
  document.getElementById('quoteDisplayDate2').textContent = formattedCaterDate;
  document.getElementById('quoteDisplayClient2').textContent = client;
  document.getElementById('quoteDisplayServiceDescription2').textContent = serviceDescription;
  document.getElementById('quoteDisplayItemDescription').textContent = itemDescription;

  calculateQuoteTotals();

  const menuList = document.getElementById('quoteDisplayMenuItems');
  const selectedItems = window.selectedQuoteMenuItems || [];

  if (selectedItems.length > 0) {
    if (quoteIsCustomOrder) {
      menuList.innerHTML = selectedItems.map(item => `<li>${item.quantity}x ${item.name}</li>`).join('');
    } else {
      menuList.innerHTML = selectedItems.map(item => `<li>- ${item.name}</li>`).join('');
    }
  }

  // Page 3 - Cost breakdown
  const quoteCostBreakdownBody = document.getElementById('quoteCostBreakdownBody');
  if (quoteIsCustomOrder && selectedItems.length > 0) {
    quoteCostBreakdownBody.innerHTML = selectedItems.map(item =>
      `<tr><td>${item.name}</td><td>${formatEUR(item.price)}</td><td>${item.quantity}</td><td>EUR ${formatEUR(item.price * item.quantity)}</td></tr>`
    ).join('');
  } else {
    quoteCostBreakdownBody.innerHTML = `<tr>
      <td id="quoteDisplayItemDescription"></td>
      <td id="quoteDisplayRate"></td>
      <td id="quoteDisplayGuestCountTable"></td>
      <td id="quoteDisplayItemTotal"></td>
    </tr>`;
    calculateQuoteTotals();
  }

  const includeMocktail = document.getElementById('quoteIncludeMocktailPackage')?.checked;
  const mocktailSection = document.getElementById('quoteMocktailSection');
  if (mocktailSection) mocktailSection.style.display = includeMocktail ? 'block' : 'none';

  // Hide guest count and price per person in custom order mode
  const quoteGuestCountDisplay = document.getElementById('quoteGuestCountDisplay');
  const quotePricePerPersonRow = document.getElementById('quotePricePerPersonRow');
  if (quoteGuestCountDisplay) quoteGuestCountDisplay.style.display = quoteIsCustomOrder ? 'none' : '';
  if (quotePricePerPersonRow) quotePricePerPersonRow.style.display = quoteIsCustomOrder ? 'none' : '';

  document.getElementById('quotePages').style.display = 'block';
  document.getElementById('invoicePages').style.display = 'none';
  document.getElementById('embassyInvoicePages').style.display = 'none';
  document.getElementById('quotePages').scrollIntoView({ behavior: 'smooth' });

  // Set logo on displayed pages (after they're visible)
  setTimeout(() => {
    setLogoOnAllImages();
  }, 100);

  // Note: History is saved on download (printQuote), not on generation
  clearDraft('quote');
  showToast('Quote generated successfully', 'success');
}

function generateEmbassyInvoice() {
  const embassyIsCustomOrder = document.getElementById('embassyInvoiceIsCustomOrder')?.checked || false;
  const requiredFields = embassyIsCustomOrder
    ? ['embassyInvoiceDate', 'embassyInvoiceCaterDate', 'embassyInvoiceNumber', 'embassyInvoiceClient', 'embassyInvoiceServiceDescription']
    : ['embassyInvoiceDate', 'embassyInvoiceCaterDate', 'embassyInvoiceNumber', 'embassyInvoiceClient', 'embassyInvoiceGuestCount', 'embassyInvoiceServiceDescription'];
  let valid = true;
  
  requiredFields.forEach(id => {
    const el = document.getElementById(id);
    if (!el?.value) {
      el?.classList.add('invalid');
      valid = false;
    } else {
      el?.classList.remove('invalid');
    }
  });
  
  if (!valid) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  // Set logo on all images before generating
  setLogoOnAllImages();

  const invoiceDate = document.getElementById('embassyInvoiceDate').value;
  const caterDate = document.getElementById('embassyInvoiceCaterDate').value;
  const invoiceNumber = document.getElementById('embassyInvoiceNumber').value;
  const client = document.getElementById('embassyInvoiceClient').value;
  const guestCount = document.getElementById('embassyInvoiceGuestCount').value;
  const serviceDescription = document.getElementById('embassyInvoiceServiceDescription').value;
  const itemDescription = document.getElementById('embassyInvoiceItemDescription').value || 'Custom wedding dinner menu';

  const formattedInvoiceDate = formatDate(invoiceDate);
  const formattedCaterDate = formatDate(caterDate);
  const formattedInvoiceNumber = invoiceNumber.startsWith('#') ? invoiceNumber : '#' + invoiceNumber;

  document.getElementById('embassyInvoiceDisplayNumber').textContent = formattedInvoiceNumber;
  document.getElementById('embassyInvoiceDisplayDate').textContent = formattedInvoiceDate;
  document.getElementById('embassyInvoiceDisplayClient').textContent = client;
  document.getElementById('embassyInvoiceDisplayServiceDescription').textContent = serviceDescription;
  document.getElementById('embassyInvoiceDisplayCaterDate').textContent = formattedCaterDate;
  document.getElementById('embassyInvoiceDisplayGuestCount').textContent = guestCount;
  document.getElementById('embassyInvoiceDisplayIBAN').textContent = formatIBAN('NL08 ABNA 0517608324');
  document.getElementById('embassyInvoiceDisplayReferenceNumber').textContent = formattedInvoiceNumber;

  const serviceFeeTypes = [];
  if (document.getElementById('embassyInvoiceServiceFeeDelivery')?.checked) serviceFeeTypes.push('delivery');
  if (document.getElementById('embassyInvoiceServiceFeeBuffet')?.checked) serviceFeeTypes.push('buffet set up');
  if (document.getElementById('embassyInvoiceServiceFeeDecorations')?.checked) serviceFeeTypes.push('decorations');
  if (document.getElementById('embassyInvoiceServiceFeeStaff')?.checked) serviceFeeTypes.push('staff');
  document.getElementById('embassyInvoiceDisplayServiceFeeType').textContent = formatServiceFeeTypes([...serviceFeeTypes]);

  document.getElementById('embassyInvoiceDisplayItemDescription').textContent = itemDescription;

  calculateEmbassyInvoiceTotals();

  const selectedItems = window.selectedEmbassyInvoiceMenuItems || [];
  const menuItemsComma = document.getElementById('embassyInvoiceDisplayMenuItemsComma');
  if (menuItemsComma && selectedItems.length > 0) {
    if (embassyIsCustomOrder) {
      menuItemsComma.textContent = selectedItems.map(item => `${item.quantity}x ${item.name}`).join(', ');
    } else {
      menuItemsComma.textContent = selectedItems.map(item => item.name).join(', ');
    }
  }

  // Page 3 - Cost breakdown
  const embassyCostBreakdownBody = document.getElementById('embassyInvoiceCostBreakdownBody');
  if (embassyIsCustomOrder && selectedItems.length > 0) {
    embassyCostBreakdownBody.innerHTML = selectedItems.map(item =>
      `<tr><td>${item.name}</td><td>${formatEUR(item.price)}</td><td>${item.quantity}</td><td>EUR ${formatEUR(item.price * item.quantity)}</td></tr>`
    ).join('');
  } else {
    embassyCostBreakdownBody.innerHTML = `<tr>
      <td id="embassyInvoiceDisplayItemDescription"></td>
      <td id="embassyInvoiceDisplayRate"></td>
      <td id="embassyInvoiceDisplayGuestCountTable"></td>
      <td id="embassyInvoiceDisplayItemTotal"></td>
    </tr>`;
    calculateEmbassyInvoiceTotals();
  }

  // Hide guest count and price per person in custom order mode
  const embassyGuestCountDisplay = document.getElementById('embassyInvoiceGuestCountDisplay');
  const embassyPricePerPersonRow = document.getElementById('embassyInvoicePricePerPersonRow');
  if (embassyGuestCountDisplay) embassyGuestCountDisplay.style.display = embassyIsCustomOrder ? 'none' : '';
  if (embassyPricePerPersonRow) embassyPricePerPersonRow.style.display = embassyIsCustomOrder ? 'none' : '';

  document.getElementById('embassyInvoicePages').style.display = 'block';
  document.getElementById('invoicePages').style.display = 'none';
  document.getElementById('quotePages').style.display = 'none';
  document.getElementById('embassyInvoicePages').scrollIntoView({ behavior: 'smooth' });

  // Set logo on displayed pages (after they're visible)
  setTimeout(() => {
    setLogoOnAllImages();
  }, 100);

  // Note: History is saved on download (printEmbassyInvoice), not on generation
  clearDraft('embassy-invoice');
  showToast('Embassy Invoice generated successfully', 'success');
}

// ===== LOGO EMBEDDED AS BASE64 =====
// Logo embedded directly to avoid CORS issues with file:// protocol
const LOGO_BASE64 = 'data:image/jpeg;base64,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';

// Function to set logo on all images
function setLogoOnAllImages() {
  // Find ALL images that might be logos (including those with logo.png in src)
  const allImages = document.querySelectorAll('img');
  const logoImages = Array.from(allImages).filter(img => {
    const src = img.src || img.getAttribute('src') || '';
    const alt = img.alt || '';
    const className = img.className || '';
    return src.includes('logo') || 
           alt.toLowerCase().includes('logo') || 
           className.includes('logo') ||
           img.closest('.logo-block') !== null;
  });
  
  console.log(`Setting logo on ${logoImages.length} images`);
  
  logoImages.forEach((img, index) => {
    // CRITICAL: Remove inline onerror handlers FIRST
    img.removeAttribute('onerror');
    img.onerror = function() {
      // If logo fails, try again after a moment
      setTimeout(() => {
        img.src = LOGO_BASE64;
      }, 100);
    };
    
    // Force show the image
    img.style.display = '';
    img.style.visibility = 'visible';
    img.style.opacity = '1';
    img.hidden = false;
    
    // Set the embedded logo
    img.src = LOGO_BASE64;
    
    // Hide ALL placeholders in the logo block
    const logoBlock = img.closest('.logo-block');
    if (logoBlock) {
      const placeholders = logoBlock.querySelectorAll('.logo-block-placeholder');
      placeholders.forEach(placeholder => {
        placeholder.style.display = 'none';
      });
    }
    
    // Also check next sibling
    const placeholder = img.nextElementSibling;
    if (placeholder && placeholder.classList.contains('logo-block-placeholder')) {
      placeholder.style.display = 'none';
    }
    
    console.log(`Logo ${index} set:`, {
      src: img.src.substring(0, 50) + '...',
      display: img.style.display,
      visible: img.style.visibility
    });
  });
  
  // Also hide all placeholders globally
  document.querySelectorAll('.logo-block-placeholder').forEach(placeholder => {
    placeholder.style.display = 'none';
  });
}

// ===== PDF GENERATION HELPER =====
async function generatePDF(pagesElement, filename) {
  // Check if libraries are loaded
  const html2canvasLib = window.html2canvas;
  let jsPDF;
  if (window.jspdf && window.jspdf.jsPDF) {
    jsPDF = window.jspdf.jsPDF;
  } else if (window.jspdf) {
    jsPDF = window.jspdf;
  }
  
  if (!html2canvasLib || !jsPDF) {
    showToast('PDF libraries not loaded. Please refresh the page.', 'error');
    return;
  }
  
  showLoading('Generating PDF...');
  
  try {
    // Hide other page wrappers
    const allWrappers = document.querySelectorAll('.pages-wrapper');
    allWrappers.forEach(wrapper => {
      if (wrapper !== pagesElement) {
        wrapper.style.display = 'none';
      }
    });
    pagesElement.style.display = 'block';
    
    // FORCE LOGO TO LOAD - Use embedded base64 logo
    showLoading('Loading logo...');
    
    // Hide ALL placeholders first
    const placeholders = pagesElement.querySelectorAll('.logo-block-placeholder');
    placeholders.forEach(placeholder => {
      placeholder.style.display = 'none';
    });
    
    // Get all logo images in the invoice pages
    const logoImages = pagesElement.querySelectorAll('img[src*="logo"], .logo-block img');
    
    // Use embedded logo - no file loading needed!
    if (LOGO_BASE64) {
      logoImages.forEach(img => {
        // CRITICAL: Remove inline onerror handlers that hide the logo
        img.removeAttribute('onerror');
        img.onerror = function() {}; // Set empty handler to prevent default behavior
        
        // Set the embedded base64 logo
        img.src = LOGO_BASE64;
        img.style.display = '';
        img.style.visibility = 'visible';
        img.style.opacity = '1';
        
        // Force show the image
        img.hidden = false;
        
        // Hide placeholder - check multiple locations
        const placeholder = img.nextElementSibling;
        if (placeholder && placeholder.classList.contains('logo-block-placeholder')) {
          placeholder.style.display = 'none';
        }
        // Also check parent for placeholder
        const parent = img.parentElement;
        if (parent) {
          const parentPlaceholder = parent.querySelector('.logo-block-placeholder');
          if (parentPlaceholder) {
            parentPlaceholder.style.display = 'none';
          }
        }
        // Check siblings
        const siblings = Array.from(img.parentElement?.children || []);
        siblings.forEach(sibling => {
          if (sibling.classList.contains('logo-block-placeholder')) {
            sibling.style.display = 'none';
          }
        });
      });
      
      // Wait for images to actually render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify logos are loaded
      let allLogosLoaded = true;
      logoImages.forEach((img, index) => {
        if (!img.complete || img.naturalWidth === 0) {
          allLogosLoaded = false;
          console.warn(`Logo ${index} not loaded:`, {
            src: img.src,
            complete: img.complete,
            naturalWidth: img.naturalWidth,
            display: img.style.display,
            visibility: img.style.visibility
          });
        } else {
          console.log(`Logo ${index} loaded successfully:`, {
            src: img.src.substring(0, 50) + '...',
            width: img.naturalWidth,
            height: img.naturalHeight
          });
        }
      });
      
      if (!allLogosLoaded) {
        console.warn('Some logos failed to load, waiting more...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`Total logo images found: ${logoImages.length}, Logo embedded: ${!!LOGO_BASE64}`);
    } else {
      console.error('Embedded logo is not available');
    }
    
    // Convert all images to base64 to avoid CORS issues
    // Keep track of images that couldn't be converted (we'll use allowTaint for those)
    showLoading('Preparing images...');
    const images = pagesElement.querySelectorAll('img');
    let hasUnconvertedImages = false;
    
    // First, ensure all images (especially logos) are loaded
    const loadPromises = Array.from(images).map((img) => {
      return new Promise((resolve) => {
        if (img.complete && img.naturalWidth > 0) {
          resolve();
        } else if (img.src) {
          // Force reload if needed
          const originalSrc = img.src;
          img.src = ''; // Clear
          img.src = originalSrc; // Reload
          
          const timeout = setTimeout(() => resolve(), 3000);
          img.onload = () => {
            clearTimeout(timeout);
            resolve();
          };
          img.onerror = () => {
            clearTimeout(timeout);
            resolve(); // Continue even if image fails
          };
        } else {
          resolve();
        }
      });
    });
    
    await Promise.all(loadPromises);
    
    // Wait a bit more for logos to fully render
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const imagePromises = Array.from(images).map((img) => {
      return new Promise((resolve) => {
        // If already base64, skip
        if (img.src && img.src.startsWith('data:')) {
          resolve();
          return;
        }
        
        // Ensure image has crossorigin attribute for local images
        if (img.src && !img.src.startsWith('http') && !img.crossOrigin) {
          img.crossOrigin = 'anonymous';
        }
        
        // If image is already loaded
        if (img.complete && img.naturalWidth > 0) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          try {
            ctx.drawImage(img, 0, 0);
            // Use PNG for maximum quality
            img.src = canvas.toDataURL('image/png', 1.0);
            resolve();
          } catch (e) {
            // If conversion fails, keep image visible and use allowTaint
            console.log('Image conversion failed, will use allowTaint:', img.src);
            hasUnconvertedImages = true;
            resolve();
          }
        } else {
          // Wait for image to load
          const timeout = setTimeout(() => {
            // Don't hide - keep visible
            hasUnconvertedImages = true;
            resolve();
          }, 3000); // Increased timeout for logo to load
          
          img.onload = () => {
            clearTimeout(timeout);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            try {
              ctx.drawImage(img, 0, 0);
              // Use PNG for maximum quality
              img.src = canvas.toDataURL('image/png', 1.0);
            } catch (e) {
              // Keep image visible if conversion fails
              console.log('Image conversion failed, will use allowTaint:', img.src);
              hasUnconvertedImages = true;
            }
            resolve();
          };
          
          img.onerror = () => {
            clearTimeout(timeout);
            // Don't hide on error - keep visible
            hasUnconvertedImages = true;
            resolve();
          };
        }
      });
    });
    
    await Promise.all(imagePromises);
    
    // Wait for display changes
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Create PDF instance with minimal compression for best quality
    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: false // Disable compression for maximum quality
    });
    
    // Get all pages - should be exactly 3
    const pages = pagesElement.querySelectorAll('.page');
    
    if (pages.length === 0) {
      throw new Error('No pages found');
    }
    
    // Process each page individually
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      
      showLoading(`Generating page ${i + 1} of ${pages.length}...`);
      
      // Scroll page into view
      page.scrollIntoView({ behavior: 'auto', block: 'start' });
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check if this page has unconverted images
      const pageImages = page.querySelectorAll('img');
      const pageHasUnconvertedImages = Array.from(pageImages).some(img => 
        img.src && !img.src.startsWith('data:') && img.style.display !== 'none'
      );
      
      // Capture page as canvas with maximum quality
      // Use allowTaint if we have unconverted images (like logo)
      const canvas = await html2canvasLib(page, {
        scale: 3, // Higher scale for better quality (3x = 300 DPI equivalent)
        useCORS: false,
        allowTaint: hasUnconvertedImages || pageHasUnconvertedImages, // Allow tainted canvas if we have unconverted images
        logging: false,
        backgroundColor: '#ffffff',
        width: page.offsetWidth,
        height: page.offsetHeight,
        imageTimeout: 15000, // Longer timeout for images
        removeContainer: false, // Keep container for better rendering
        onclone: (clonedDoc) => {
          // Ensure all images are visible in cloned document
          const clonedImages = clonedDoc.querySelectorAll('img');
          clonedImages.forEach(img => {
            img.style.display = '';
            img.style.visibility = 'visible';
            img.style.opacity = '1';
          });
        }
      });
      
      // Convert to PNG for maximum quality
      // Use toBlob if canvas is tainted, otherwise use toDataURL
      let imgData;
      try {
        imgData = canvas.toDataURL('image/png', 1.0);
      } catch (e) {
        // If toDataURL fails (tainted canvas), use toBlob
        imgData = await new Promise((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          }, 'image/png', 1.0);
        });
      }
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add new page if not first page
      if (i > 0) {
        pdf.addPage();
      }
      
      // Add image to PDF with maximum quality (SLOW compression = best quality)
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'SLOW');
    }
    
    // Save PDF
    pdf.save(filename);
    
    // Restore display
    allWrappers.forEach(wrapper => {
      wrapper.style.display = 'none';
    });
    
    hideLoading();
    showToast('PDF downloaded successfully!', 'success');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    hideLoading();
    
    // Restore displays on error
    const allWrappers = document.querySelectorAll('.pages-wrapper');
    allWrappers.forEach(wrapper => {
      wrapper.style.display = 'none';
    });
    
    showToast(`PDF generation failed: ${error.message || 'Unknown error'}. Check console for details.`, 'error');
  }
}

// ===== PRINT FUNCTIONS =====
function printInvoice() {
  if (!document.getElementById('invoiceNumber')?.value) {
    showToast('Please generate the invoice first', 'error');
    return;
  }

  const invoiceNumber = document.getElementById('invoiceNumber').value;
  const formattedNumber = invoiceNumber.startsWith('#') ? invoiceNumber : '#' + invoiceNumber;
  const filename = `Invoice_${formattedNumber.replace('#', '')}_${formatDate(document.getElementById('invoiceDate').value)}.pdf`;

  const pagesElement = document.getElementById('invoicePages');
  document.getElementById('quotePages').style.display = 'none';
  document.getElementById('embassyInvoicePages').style.display = 'none';

  // Save to history on download
  saveToHistory('invoice', getFormData('invoice'));

  generatePDF(pagesElement, filename);
}

function printQuote() {
  if (!document.getElementById('quoteNumber')?.value) {
    showToast('Please generate the quote first', 'error');
    return;
  }

  const quoteNumber = document.getElementById('quoteNumber').value;
  const formattedNumber = quoteNumber.startsWith('#') ? quoteNumber : '#' + quoteNumber;
  const filename = `Quote_${formattedNumber.replace('#', '')}_${formatDate(document.getElementById('quoteDate').value)}.pdf`;

  const pagesElement = document.getElementById('quotePages');
  document.getElementById('invoicePages').style.display = 'none';
  document.getElementById('embassyInvoicePages').style.display = 'none';

  // Save to history on download
  saveToHistory('quote', getFormData('quote'));

  generatePDF(pagesElement, filename);
}

function printEmbassyInvoice() {
  if (!document.getElementById('embassyInvoiceNumber')?.value) {
    showToast('Please generate the embassy invoice first', 'error');
    return;
  }

  const invoiceNumber = document.getElementById('embassyInvoiceNumber').value;
  const formattedNumber = invoiceNumber.startsWith('#') ? invoiceNumber : '#' + invoiceNumber;
  const filename = `EmbassyInvoice_${formattedNumber.replace('#', '')}_${formatDate(document.getElementById('embassyInvoiceDate').value)}.pdf`;

  const pagesElement = document.getElementById('embassyInvoicePages');
  document.getElementById('invoicePages').style.display = 'none';
  document.getElementById('quotePages').style.display = 'none';

  // Save to history on download
  saveToHistory('embassy-invoice', getFormData('embassy-invoice'));

  generatePDF(pagesElement, filename);
}

// ===== RESET FUNCTIONS =====
function resetForm() {
  document.getElementById('invoiceForm')?.reset();
  document.querySelectorAll('#invoiceFormSection .pricing-table tbody tr input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
    cb.closest('tr').classList.remove('selected');
  });
  document.querySelectorAll('#invoiceFormSection .qty-input').forEach(input => input.value = '');
  document.getElementById('isCustomOrder').checked = false;
  toggleCustomOrder('invoice', false);
  document.getElementById('pricePerPersonDisplay').textContent = 'EUR 0,00';
  document.getElementById('mocktailSection').style.display = 'none';
  clearDraft('invoice');
  updateSelectedSummary('invoice');
  showToast('Form reset', 'success');
}

function resetQuoteForm() {
  document.getElementById('quoteForm')?.reset();
  document.querySelectorAll('#quoteFormSection .pricing-table tbody tr input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
    cb.closest('tr').classList.remove('selected');
  });
  document.querySelectorAll('#quoteFormSection .qty-input').forEach(input => input.value = '');
  document.getElementById('quoteIsCustomOrder').checked = false;
  toggleCustomOrder('quote', false);
  document.getElementById('quotePricePerPersonDisplay').textContent = 'EUR 0,00';
  document.getElementById('quoteMocktailSection').style.display = 'none';
  clearDraft('quote');
  updateSelectedSummary('quote');
  showToast('Form reset', 'success');
}

function resetEmbassyInvoiceForm() {
  document.getElementById('embassyInvoiceForm')?.reset();
  document.getElementById('embassyInvoiceClient').value = 'Embassy of the United Republic of Tanzania, Netherlands';
  document.querySelectorAll('#embassyInvoiceFormSection .pricing-table tbody tr input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
    cb.closest('tr').classList.remove('selected');
  });
  document.querySelectorAll('#embassyInvoiceFormSection .qty-input').forEach(input => input.value = '');
  document.getElementById('embassyInvoiceIsCustomOrder').checked = false;
  toggleCustomOrder('embassy-invoice', false);
  document.getElementById('embassyInvoicePricePerPersonDisplay').textContent = 'EUR 0,00';
  clearDraft('embassy-invoice');
  updateSelectedSummary('embassy-invoice');
  showToast('Form reset', 'success');
}

// ===== GOOGLE SHEETS FETCH =====
async function fetchMenuItemsFromGoogleSheets() {
  if (!CONFIG.GOOGLE_SHEET_ID || CONFIG.GOOGLE_SHEET_ID === 'YOUR_SHEET_ID_HERE') {
    return null;
  }
  
  try {
    const timestamp = Date.now();
    const csvUrl = `https://docs.google.com/spreadsheets/d/${CONFIG.GOOGLE_SHEET_ID}/export?format=csv&gid=0&t=${timestamp}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(csvUrl)}`;
    
    const response = await fetch(proxyUrl, { cache: 'no-store', mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    
    const csvText = await response.text();
    const lines = csvText.split('\n');
    
    const itemsByCategory = {
      [CONFIG.CATEGORIES.MEAT]: [],
      [CONFIG.CATEGORIES.VEG]: [],
      [CONFIG.CATEGORIES.SIDES]: [],
      [CONFIG.CATEGORIES.BITES]: []
    };
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const fields = [];
      let currentField = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          fields.push(currentField.trim());
          currentField = '';
        } else {
          currentField += char;
        }
      }
      fields.push(currentField.trim());
      
      if (fields.length >= 3) {
        const itemName = fields[0].replace(/^"|"$/g, '').trim();
        const priceStr = fields[1].replace(/^"|"$/g, '').trim().replace(/[€$£,]/g, '');
        const price = parseFloat(priceStr);
        const category = fields[2].replace(/^"|"$/g, '').trim();
        
        if (itemName && !isNaN(price) && category) {
          menuPrices[itemName] = price;
          
          for (const [key, value] of Object.entries(CONFIG.CATEGORIES)) {
            if (category.toLowerCase() === value.toLowerCase()) {
              itemsByCategory[value].push({ name: itemName, price: price });
              break;
            }
          }
        }
      }
    }
    
    return itemsByCategory;
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    return null;
  }
}

// ===== POPULATE PRICING TABLES =====
async function populatePricingTables() {
  const defaultMeatItems = [
    "Mshikaki/Skewers", "Goat meat/Mbuzi", "Chicken/Kuku", "Fried Fish/Samaki",
    "Minced meat in tomato sauce", "Chicken biriyani stew", "Mchuzi wa Samaki/Fish stew",
    "Mchuzi wa Kuku/Chicken stew", "Mchuzi wa Nyama/Beef stew",
    "Ndizi wa Nyama/Green bananas and beef", "Urojo/Zanzibar mix"
  ];
  
  const defaultVegItems = [
    "Njegere/Peas", "Kisamvu/cassava leaves", "Kabichi/Fried cabbage", "Mchicha/Spinach",
    "Biriganya/Eggplant", "Vegetarian Biriyani sauce", "Maharage/brown beans",
    "Bamia", "Urojo Vegetarian"
  ];
  
  const defaultSidesItems = [
    "Pilau Veg", "Pilau Beef", "Pilau Chicken", "Wali wa nazi/coconut flavoured rice", "Chapati", "Ugali",
    "Mihogo", "Plantain", "Rice", "Biriyani", "Vegetarian Rices with peas", "Kachumbari", "Salad"
  ];
  
  const defaultBitesItems = [
    "Samosa", "Bahjia with chutney", "Visheti", "Kalimati", "Kachori", "Katlesi/Cutlets", "Eggchop",
    "Kebab", "Mandazi", "Vitumbua", "Coconut cake", "Fresh Fruit", "Fresh juice",
    "Chai ya Maziwa/Milk Tea", "Chai ya Tangawizi/Fresh ginger tea", "Pili Pili"
  ];

  function populateTable(tableId, items, docType) {
    const table = document.getElementById(tableId);
    if (!table) return;

    table.innerHTML = items.map(item => {
      const price = menuPrices[item] || 0;
      return `<tr data-item="${item}" data-price="${price}">
        <td style="text-align: center; padding: 6px 4px;">
          <input type="checkbox" style="cursor: pointer; width: 16px; height: 16px;">
        </td>
        <td>${item}</td>
        <td>€${formatEUR(price)}</td>
        <td class="qty-col" style="display: none; width: 60px;">
          <input type="number" class="qty-input" min="0" value="" placeholder="0" style="width: 50px; padding: 2px 4px; text-align: center; font-size: 12px; border: 1px solid #ccc; border-radius: 4px;">
        </td>
      </tr>`;
    }).join('');

    table.querySelectorAll('tr').forEach(row => {
      const checkbox = row.querySelector('input[type="checkbox"]');
      const qtyInput = row.querySelector('.qty-input');

      row.addEventListener('click', function(e) {
        if (e.target.type !== 'checkbox' && e.target.type !== 'number') {
          checkbox.checked = !checkbox.checked;
          this.classList.toggle('selected', checkbox.checked);
          triggerCalculation(docType);
        }
      });

      checkbox.addEventListener('change', function() {
        row.classList.toggle('selected', this.checked);
        if (!this.checked && qtyInput) qtyInput.value = '';
        triggerCalculation(docType);
      });

      if (qtyInput) {
        qtyInput.addEventListener('input', function() {
          const qty = parseInt(this.value) || 0;
          if (qty > 0 && !checkbox.checked) {
            checkbox.checked = true;
            row.classList.add('selected');
          }
          triggerCalculation(docType);
        });
        qtyInput.addEventListener('click', function(e) {
          e.stopPropagation();
        });
      }
    });
  }
  
  function triggerCalculation(docType) {
    if (docType === 'invoice') calculateTotals();
    else if (docType === 'quote') calculateQuoteTotals();
    else calculateEmbassyInvoiceTotals();
  }

  // Populate with defaults first
  populateTable('meatPricingTable', defaultMeatItems, 'invoice');
  populateTable('vegPricingTable', defaultVegItems, 'invoice');
  populateTable('sidesPricingTable', defaultSidesItems, 'invoice');
  populateTable('bitesPricingTable', defaultBitesItems, 'invoice');
  
  populateTable('quoteMeatPricingTable', defaultMeatItems, 'quote');
  populateTable('quoteVegPricingTable', defaultVegItems, 'quote');
  populateTable('quoteSidesPricingTable', defaultSidesItems, 'quote');
  populateTable('quoteBitesPricingTable', defaultBitesItems, 'quote');
  
  populateTable('embassyInvoiceMeatPricingTable', defaultMeatItems, 'embassy-invoice');
  populateTable('embassyInvoiceVegPricingTable', defaultVegItems, 'embassy-invoice');
  populateTable('embassyInvoiceSidesPricingTable', defaultSidesItems, 'embassy-invoice');
  populateTable('embassyInvoiceBitesPricingTable', defaultBitesItems, 'embassy-invoice');
  
  // Try to fetch from Google Sheets
  const itemsByCategory = await fetchMenuItemsFromGoogleSheets();
  
  if (itemsByCategory) {
    const meatItems = itemsByCategory[CONFIG.CATEGORIES.MEAT]?.length > 0 
      ? itemsByCategory[CONFIG.CATEGORIES.MEAT].map(i => i.name) : defaultMeatItems;
    const vegItems = itemsByCategory[CONFIG.CATEGORIES.VEG]?.length > 0 
      ? itemsByCategory[CONFIG.CATEGORIES.VEG].map(i => i.name) : defaultVegItems;
    const sidesItems = itemsByCategory[CONFIG.CATEGORIES.SIDES]?.length > 0 
      ? itemsByCategory[CONFIG.CATEGORIES.SIDES].map(i => i.name) : defaultSidesItems;
    const bitesItems = itemsByCategory[CONFIG.CATEGORIES.BITES]?.length > 0 
      ? itemsByCategory[CONFIG.CATEGORIES.BITES].map(i => i.name) : defaultBitesItems;

    populateTable('meatPricingTable', meatItems, 'invoice');
    populateTable('vegPricingTable', vegItems, 'invoice');
    populateTable('sidesPricingTable', sidesItems, 'invoice');
    populateTable('bitesPricingTable', bitesItems, 'invoice');
    
    populateTable('quoteMeatPricingTable', meatItems, 'quote');
    populateTable('quoteVegPricingTable', vegItems, 'quote');
    populateTable('quoteSidesPricingTable', sidesItems, 'quote');
    populateTable('quoteBitesPricingTable', bitesItems, 'quote');
    
    populateTable('embassyInvoiceMeatPricingTable', meatItems, 'embassy-invoice');
    populateTable('embassyInvoiceVegPricingTable', vegItems, 'embassy-invoice');
    populateTable('embassyInvoiceSidesPricingTable', sidesItems, 'embassy-invoice');
    populateTable('embassyInvoiceBitesPricingTable', bitesItems, 'embassy-invoice');
  }
}

// ===== KEYBOARD SHORTCUTS =====
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + P = Print/Save PDF
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      const activeType = document.querySelector('.document-type-option.active')?.dataset.type;
      if (activeType === 'invoice') printInvoice();
      else if (activeType === 'quote') printQuote();
      else printEmbassyInvoice();
    }
    
    // Ctrl/Cmd + Enter = Generate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      const activeType = document.querySelector('.document-type-option.active')?.dataset.type;
      if (activeType === 'invoice') generateInvoice();
      else if (activeType === 'quote') generateQuote();
      else generateEmbassyInvoice();
    }
  });
}

// ===== INITIALIZATION =====
window.addEventListener('DOMContentLoaded', function() {
  // Hide pages initially
  document.getElementById('invoicePages').style.display = 'none';
  document.getElementById('quotePages').style.display = 'none';
  document.getElementById('embassyInvoicePages').style.display = 'none';
  
  // Set today's date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('invoiceDate').value = today;
  document.getElementById('quoteDate').value = today;
  document.getElementById('embassyInvoiceDate').value = today;
  
  const formattedToday = formatDate(today);
  document.getElementById('displaySignatureDate').textContent = formattedToday;
  
  // Populate pricing tables
  populatePricingTables();
  
  // Setup event listeners for invoice form
  ['guestCount', 'discount', 'serviceFee', 'invoiceDate', 'caterDate'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', calculateTotals);
    document.getElementById(id)?.addEventListener('change', calculateTotals);
  });
  document.getElementById('includeMocktailPackage')?.addEventListener('change', calculateTotals);
  document.getElementById('mocktailHours')?.addEventListener('input', calculateTotals);
  document.getElementById('includeAdminFee')?.addEventListener('change', calculateTotals);

  // Custom order toggle
  document.getElementById('isCustomOrder')?.addEventListener('change', function() {
    toggleCustomOrder('invoice', this.checked);
  });

  // Amended invoice fields
  document.getElementById('isAmendedInvoice')?.addEventListener('change', function() {
    const amendedFields = document.getElementById('amendedInvoiceFields');
    if (amendedFields) {
      amendedFields.style.display = this.checked ? 'block' : 'none';
    }
    calculateTotals();
  });
  document.getElementById('originalInvoiceNumber')?.addEventListener('input', calculateTotals);
  document.getElementById('previouslyPaidAmount')?.addEventListener('input', calculateTotals);
  
  // Service fee type checkboxes
  ['serviceFeeDelivery', 'serviceFeeBuffet', 'serviceFeeDecorations', 'serviceFeeStaff'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
      const types = [];
      if (document.getElementById('serviceFeeDelivery')?.checked) types.push('delivery');
      if (document.getElementById('serviceFeeBuffet')?.checked) types.push('buffet set up');
      if (document.getElementById('serviceFeeDecorations')?.checked) types.push('decorations');
      if (document.getElementById('serviceFeeStaff')?.checked) types.push('staff');
      document.getElementById('displayServiceFeeType').textContent = formatServiceFeeTypes([...types]);
    });
  });
  
  // Quote form listeners
  ['quoteGuestCount', 'quoteDiscount', 'quoteServiceFee', 'quoteDate', 'quoteCaterDate'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', calculateQuoteTotals);
    document.getElementById(id)?.addEventListener('change', calculateQuoteTotals);
  });
  document.getElementById('quoteIsCustomOrder')?.addEventListener('change', function() {
    toggleCustomOrder('quote', this.checked);
  });
  document.getElementById('quoteIncludeMocktailPackage')?.addEventListener('change', calculateQuoteTotals);
  document.getElementById('quoteMocktailHours')?.addEventListener('input', calculateQuoteTotals);
  document.getElementById('quoteIncludeAdminFee')?.addEventListener('change', calculateQuoteTotals);
  
  // Embassy invoice form listeners
  ['embassyInvoiceGuestCount', 'embassyInvoiceDiscount', 'embassyInvoiceServiceFee', 'embassyInvoiceDate', 'embassyInvoiceCaterDate'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', calculateEmbassyInvoiceTotals);
    document.getElementById(id)?.addEventListener('change', calculateEmbassyInvoiceTotals);
  });
  document.getElementById('embassyInvoiceIsCustomOrder')?.addEventListener('change', function() {
    toggleCustomOrder('embassy-invoice', this.checked);
  });
  document.getElementById('embassyInvoiceIncludeMocktailPackage')?.addEventListener('change', calculateEmbassyInvoiceTotals);
  document.getElementById('embassyInvoiceMocktailHours')?.addEventListener('input', calculateEmbassyInvoiceTotals);
  document.getElementById('embassyInvoiceIncludeAdminFee')?.addEventListener('change', calculateEmbassyInvoiceTotals);

  // Embassy invoice amended fields
  document.getElementById('embassyInvoiceIsAmended')?.addEventListener('change', function() {
    const amendedFields = document.getElementById('embassyInvoiceAmendedFields');
    if (amendedFields) {
      amendedFields.style.display = this.checked ? 'block' : 'none';
    }
    calculateEmbassyInvoiceTotals();
  });
  document.getElementById('embassyInvoiceOriginalNumber')?.addEventListener('input', calculateEmbassyInvoiceTotals);
  document.getElementById('embassyInvoicePreviouslyPaid')?.addEventListener('input', calculateEmbassyInvoiceTotals);

  // Menu search functionality
  document.querySelectorAll('.menu-search').forEach(input => {
    input.addEventListener('input', (e) => {
      const docType = e.target.closest('.document-section').id.replace('FormSection', '');
      filterMenuItems(e.target.value, docType);
    });
  });
  
  // History toggle
  document.getElementById('historyToggle')?.addEventListener('click', () => {
    document.getElementById('historyContent')?.classList.toggle('show');
  });
  
  // Load drafts and render history
  loadDraft('invoice');

  // Initialize history (try API first, fallback to localStorage)
  renderHistory().catch(err => {
    console.log('History render error, falling back to localStorage:', err);
    useAPIForHistory = false;
    renderHistoryLocal();
  });

  // Set embedded logo on all images immediately
  setLogoOnAllImages();
  
  // Setup keyboard shortcuts
  setupKeyboardShortcuts();
  
  console.log('Moto Kitchen Invoice System v1 loaded');
});
