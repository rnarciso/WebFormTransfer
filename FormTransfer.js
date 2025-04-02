// Helper function to get a unique, deterministic identifier for a field instance
// Accepts the specific form and the field element.
function getFieldInstanceIdentifier(formElement, fieldElement) {
    if (!formElement || !fieldElement) return null;

    const originalName = fieldElement.name || fieldElement.id;
    if (!originalName) return null; // Skip fields without name/id

    // 1. Get all relevant fields within the specific form
    const allFieldsInForm = Array.from(formElement.querySelectorAll('input, select, textarea'));

    // 2. Filter this list manually to find elements with the exact same original name or ID
    // This avoids issues with special characters in CSS selectors.
    const relevantFields = allFieldsInForm.filter(f => {
        // Ignore buttons and fields without name/id during counting
        if ((f.type === 'submit' || f.type === 'button' || f.type === 'reset') || (!f.name && !f.id)) {
             return false;
        }
        return (f.name === originalName || f.id === originalName);
    });

    // 3. Find the index of the current element within this filtered list
    const index = relevantFields.indexOf(fieldElement);

    // 4. Return the identifier (e.g., "fieldName_0", "fieldName_1")
    // If index is -1 (shouldn't happen if fieldElement is in the list), handle gracefully
    return index !== -1 ? `${originalName}_${index}` : `${originalName}_error`; // Or null?
}


// Função para extrair dados de um formulário específico
function extractFormData(formElement) {
    if (!formElement) {
        alert("Elemento de formulário não fornecido para extração!");
        return;
    }

    const formData = {};

    // Coleta todos os elementos de entrada do formulário específico
    const inputs = formElement.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        // Ignora botões
        if (input.type === 'submit' || input.type === 'button' || input.type === 'reset') {
            return;
        }

        // Pass the formElement to the identifier function
        const identifier = getFieldInstanceIdentifier(formElement, input);
        if (!identifier) return; // Skip if identifier couldn't be generated or field is irrelevant

        // Trata diferentes tipos de input
        if (input.type === 'checkbox') {
             // For checkboxes, store an array if multiple have the same identifier base
             // This handles checkbox groups correctly even with unique identifiers
             const baseName = input.name || input.id;
             if (!formData[baseName]) {
                 formData[baseName] = [];
             }
             if (input.checked) {
                 formData[baseName].push(input.value || 'on'); // Store value if checked
             }
             // Note: The unique identifier helps distinguish *which* checkbox group instance,
             // but standard handling often relies on the shared name. We store under base name.
             // If distinguishing individual checkboxes within a group instance is critical,
             // the identifier could be used directly: formData[identifier] = input.checked;
        } else if (input.type === 'radio') {
            // For radio buttons, only store the value of the selected one per group name
            const baseName = input.name || input.id;
            if (input.checked) {
                formData[baseName] = input.value;
            } else if (formData[baseName] === undefined) {
                // Ensure the key exists even if none are checked initially
                formData[baseName] = null;
            }
             // Similar to checkboxes, standard handling uses the shared name.
             // If distinguishing radio groups instances is needed:
             // if (input.checked) { formData[identifier] = input.value; }
        } else if (input.type === 'file') {
            // Arquivos não podem ser facilmente serializados
            formData[identifier] = null;
        } else if (input.multiple && input.tagName === 'SELECT') {
            // Handle multi-select
            formData[identifier] = Array.from(input.selectedOptions).map(option => option.value);
        }
         else {
            formData[identifier] = input.value;
        }
    });

    return formData;
}

// Função para salvar os dados como um arquivo JSON
function saveAsJson(data) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'form_data.json';
    
    // Adiciona o link ao documento e clica automaticamente
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    // Limpa
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
    
    alert("Dados do formulário salvos com sucesso! Para preencher outro formulário, vá até a página desejada e clique no botão 'Carregar e Preencher Formulário'.");
}

// Função para carregar um arquivo JSON
function loadJsonFile() {
    return new Promise((resolve, reject) => {
        // Cria uma div modal para o input file
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '10000';
        
        // Cria o painel de upload
        const panel = document.createElement('div');
        panel.style.backgroundColor = '#fff';
        panel.style.padding = '20px';
        panel.style.borderRadius = '5px';
        panel.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
        panel.style.maxWidth = '500px';
        panel.style.width = '80%';
        
        const title = document.createElement('h3');
        title.textContent = 'Selecione o arquivo JSON com os dados do formulário';
        title.style.marginTop = '0';
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'block';
        fileInput.style.margin = '20px 0';
        fileInput.style.width = '100%';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancelar';
        cancelButton.style.marginRight = '10px';
        cancelButton.style.padding = '8px 16px';
        cancelButton.style.backgroundColor = '#f44336';
        cancelButton.style.color = 'white';
        cancelButton.style.border = 'none';
        cancelButton.style.borderRadius = '4px';
        cancelButton.style.cursor = 'pointer';
        
        const loadButton = document.createElement('button');
        loadButton.textContent = 'Carregar';
        loadButton.style.padding = '8px 16px';
        loadButton.style.backgroundColor = '#4CAF50';
        loadButton.style.color = 'white';
        loadButton.style.border = 'none';
        loadButton.style.borderRadius = '4px';
        loadButton.style.cursor = 'pointer';
        loadButton.disabled = true;
        
        // Habilita o botão de carregar apenas quando um arquivo for selecionado
        fileInput.addEventListener('change', () => {
            loadButton.disabled = !fileInput.files.length;
        });
        
        cancelButton.onclick = () => {
            document.body.removeChild(modal);
            reject("Operação cancelada pelo usuário");
        };
        
        loadButton.onclick = () => {
            const file = fileInput.files[0];
            if (!file) {
                alert("Por favor, selecione um arquivo JSON");
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    document.body.removeChild(modal);
                    resolve(jsonData);
                } catch (error) {
                    alert("Erro ao analisar o arquivo JSON: " + error.message);
                }
            };
            reader.onerror = () => {
                alert("Erro ao ler o arquivo");
                document.body.removeChild(modal);
                reject("Erro ao ler o arquivo");
            };
            reader.readAsText(file);
        };
        
        // Monta a estrutura do modal
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(loadButton);
        
        panel.appendChild(title);
        panel.appendChild(fileInput);
        panel.appendChild(buttonContainer);
        
        modal.appendChild(panel);
        document.body.appendChild(modal);
        
        // Permite fechar o modal clicando fora do painel
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
                reject("Operação cancelada pelo usuário");
            }
        });
    });
}

// Função para preencher um formulário específico com dados JSON
function fillFormWithJson(formElement, data) { // Added formElement parameter
    if (!formElement) { // Check formElement
        alert("Elemento de formulário não fornecido para preenchimento!");
        return;
    }
    if (!data) { // Check data
         alert("Dados para preenchimento não fornecidos!");
         return;
    }

    const inputs = formElement.querySelectorAll('input, select, textarea'); // Use formElement

    inputs.forEach(input => {
        // Ignora botões
        if (input.type === 'submit' || input.type === 'button' || input.type === 'reset') {
            return;
        }

        // Pass the formElement to the identifier function
        const identifier = getFieldInstanceIdentifier(formElement, input);
        const originalName = input.name || input.id; // Needed for radio/checkbox group logic

        if (identifier && data.hasOwnProperty(identifier)) {
            // Handle fields identified uniquely (most common case)
            const value = data[identifier];

            if (input.type === 'checkbox') {
                // Simple checked state based on unique ID (if stored that way)
                 input.checked = !!value;
                 // If data was stored per group (array of values), this needs adjustment
                 // Example: if (data[originalName] && data[originalName].includes(input.value)) { input.checked = true; }
            } else if (input.type === 'radio') {
                 // Simple check based on unique ID (if stored that way)
                 if (input.value === value) {
                     input.checked = true;
                 }
                 // If data was stored per group:
                 // Example: if (data[originalName] === input.value) { input.checked = true; }
            } else if (input.type !== 'file') { // Ignora inputs tipo file
                 if (input.multiple && input.tagName === 'SELECT') {
                     // Handle multi-select specifically
                     if (Array.isArray(value)) { // Ensure data is an array
                         const valuesSet = new Set(value); // Use Set for efficient lookup
                         Array.from(input.options).forEach(option => {
                             option.selected = valuesSet.has(option.value);
                         });
                     } else {
                         console.warn(`Expected array for multi-select '${identifier}', but got:`, value);
                         // Attempt to set single value if not array? Or clear selection?
                         // For now, we log a warning and don't change selection if data is wrong type.
                     }
                 } else {
                    // Handle single-value fields
                    input.value = value;
                 }

                // Dispara evento de mudança para acionar validações
                const changeEvent = new Event('change', { bubbles: true });
                input.dispatchEvent(changeEvent);

                // Também aciona o evento input para campos que usam input listeners
                const inputEvent = new Event('input', { bubbles: true });
                input.dispatchEvent(inputEvent);
            }
        } else if (originalName && data.hasOwnProperty(originalName)) {
             // Fallback/Alternative: Handle fields based on original name (for radio/checkbox groups stored by group name)
             const value = data[originalName];

             if (input.type === 'checkbox') {
                 // Assumes data[originalName] is an array of checked values for the group
                 if (Array.isArray(value)) {
                     input.checked = value.includes(input.value || 'on');
                 } else {
                     // Handle case where single checkbox group was saved as boolean? (Less common)
                     input.checked = !!value && input.value === (input.value || 'on'); // Check if the value matches this specific checkbox
                 }
             } else if (input.type === 'radio') {
                 // Assumes data[originalName] is the single value for the selected radio in the group
                 input.checked = (input.value === value);
             }
             // Potentially trigger events here too if needed for fallback cases
        }
    });

    // Feedback visual para o usuário
    highlightFilledFields();
}

// Função para destacar visualmente os campos preenchidos
function highlightFilledFields() {
    const form = document.querySelector('form');
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        // Ignora botões
        if (input.type === 'submit' || input.type === 'button' || input.type === 'reset') {
            return;
        }
        
        // Adiciona uma animação sutil para mostrar que o campo foi preenchido
        const originalBackground = input.style.backgroundColor;
        input.style.transition = 'background-color 1s';
        input.style.backgroundColor = '#e6ffe6'; // Verde claro
        
        setTimeout(() => {
            input.style.backgroundColor = originalBackground;
        }, 1500);
    });
}

// --- Botões de Interface ---

// Adiciona um botão para extrair e salvar dados
function addExtractButton() {
    const button = document.createElement('button');
    button.textContent = 'Extrair e Salvar Dados do Formulário';
    button.style.position = 'fixed';
    button.style.top = '10px';
    button.style.right = '10px';
    button.style.zIndex = '9999';
    button.style.padding = '10px';
    button.style.backgroundColor = '#4CAF50';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    
    button.onclick = () => {
        // Find the target form (e.g., the first one on the page for now)
        const targetForm = document.querySelector('form');
        if (!targetForm) {
            alert("Nenhum formulário encontrado na página para extrair dados!");
            return;
        }
        const data = extractFormData(targetForm); // Pass the form element
        if (data) {
            saveAsJson(data); // saveAsJson doesn't need the form
        }
    };
    
    document.body.appendChild(button);
    return button;
}

// Adiciona um botão para carregar e preencher o formulário
function addLoadButton() {
    const button = document.createElement('button');
    button.textContent = 'Carregar e Preencher Formulário';
    button.style.position = 'fixed';
    button.style.top = '60px';
    button.style.right = '10px';
    button.style.zIndex = '9999';
    button.style.padding = '10px';
    button.style.backgroundColor = '#2196F3';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    
    button.onclick = async () => {
        try {
            const data = await loadJsonFile(); // loadJsonFile gets the data
            if (data) {
                 // Find the target form (e.g., the first one on the page for now)
                 const targetForm = document.querySelector('form');
                 if (!targetForm) {
                     alert("Nenhum formulário encontrado na página para preencher!");
                     return;
                 }
                 fillFormWithJson(targetForm, data); // Pass the form and data
                 alert("Formulário preenchido com sucesso!");
            }
        } catch (error) {
             // Don't show alert if user cancelled file selection (error is string)
             if (typeof error !== 'string' || !error.includes("cancelada")) {
                  alert("Falha ao carregar ou preencher o formulário.");
             }
             console.log("Operação de carregamento/preenchimento cancelada ou falhou:", error);
        }
    };
    
    document.body.appendChild(button);
    return button;
}

// --- Script principal ---

// Adiciona os botões quando a página carrega
function init() {
    // Verifica se os botões já existem para evitar duplicações
    if (!document.querySelector('#form-extractor-save') && 
        !document.querySelector('#form-extractor-load')) {
        
        const saveButton = addExtractButton();
        saveButton.id = 'form-extractor-save';
        
        const loadButton = addLoadButton();
        loadButton.id = 'form-extractor-load';
        
        console.log("Extrator de formulário inicializado!");
    }
}

// Executa a inicialização quando o DOM estiver completamente carregado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// --- Versão como Bookmarklet ---
// Para usar como bookmarklet, crie um novo favorito e cole o código abaixo na URL:
/*
javascript:(function(){
    const script = document.createElement('script');
    script.src = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(`
        // Cole aqui o código acima, removendo comentários e condensando
    `);
    document.body.appendChild(script);
})();
*/

// Inicia o script automaticamente
init();