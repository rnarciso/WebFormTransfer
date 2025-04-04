// Helper function to get a unique, deterministic identifier for a field instance
// Accepts the specific form and the field element.
function getFieldInstanceIdentifier(formElement, fieldElement) {
    if (!formElement || !fieldElement) {
        console.error("getFieldInstanceIdentifier: Missing form or field element.");
        return null;
    }

    const fieldName = fieldElement.name || fieldElement.id;
    if (!fieldName) {
        // Skip fields without a name or ID, as they cannot be reliably identified.
        return null;
    }

    // 1. Get all potentially relevant fields within the specific form.
    const allFieldsInForm = Array.from(formElement.querySelectorAll('input, select, textarea'));

    // 2. Filter to find fields with the *exact* same name or ID.
    //    Manual filtering avoids potential issues with complex CSS selectors.
    const fieldsWithSameName = allFieldsInForm.filter(field => {
        // Ignore buttons and fields without a name/id during the counting process.
        const isButton = ['submit', 'button', 'reset'].includes(field.type);
        const lacksNameOrId = !field.name && !field.id;
        if (isButton || lacksNameOrId) {
            return false;
        }
        // Check if the current field in the loop matches the target field's name/id.
        return (field.name === fieldName || field.id === fieldName);
    });

    // 3. Find the index of the *current* fieldElement within this filtered list.
    const index = fieldsWithSameName.indexOf(fieldElement);

    // 4. Construct the identifier (e.g., "fieldName_0", "fieldName_1").
    //    If the index is -1 (which implies fieldElement wasn't found in its own group,
    //    shouldn't happen if the logic is correct), return null.
    return index !== -1 ? `${fieldName}_${index}` : null;
}


// Função para extrair dados de um formulário específico
// Function to extract data from a specific form element.
function extractFormData(formElement) {
    if (!formElement) {
        console.error("extractFormData: Form element not provided.");
        return null; // Return null instead of undefined implicitly
    }

    const formData = {};
    const formInputs = formElement.querySelectorAll('input, select, textarea');

    formInputs.forEach(inputElement => {
        // Ignore buttons
        if (['submit', 'button', 'reset'].includes(inputElement.type)) {
            return;
        }

        // Pass the formElement to the identifier function
        const identifier = getFieldInstanceIdentifier(formElement, inputElement);
        if (!identifier) return; // Skip if identifier couldn't be generated or field is irrelevant

        // Handle different input types
        const inputType = inputElement.type;
        const baseName = inputElement.name || inputElement.id; // Used for grouping radios/checkboxes

        if (inputType === 'checkbox') {
             // For checkboxes, store an array if multiple have the same identifier base
             // This handles checkbox groups correctly even with unique identifiers
             if (!formData[baseName]) {
                 formData[baseName] = [];
             }
             if (inputElement.checked) {
                 formData[baseName].push(inputElement.value || 'on'); // Store value if checked
             }
             // Note: The unique identifier helps distinguish *which* checkbox group instance,
             // but standard handling often relies on the shared name. We store under base name.
             // If distinguishing individual checkboxes within a group instance is critical,
             // the identifier could be used directly: formData[identifier] = input.checked;
        } else if (inputType === 'radio') {
            // For radio buttons, only store the value of the selected one per group name
           if (inputElement.checked) {
                formData[baseName] = inputElement.value;
            } else if (formData[baseName] === undefined) {
                // Ensure the key exists even if none are checked initially
                formData[baseName] = null;
            }
             // Similar to checkboxes, standard handling uses the shared name.
             // If distinguishing radio groups instances is needed:
             // if (inputElement.checked) { formData[identifier] = inputElement.value; }
        } else if (inputType === 'file') {
            // Files cannot be easily serialized to JSON, store null or placeholder.
            formData[identifier] = null;
        } else if (inputElement.multiple && inputElement.tagName === 'SELECT') {
            // Handle multi-select
            formData[identifier] = Array.from(inputElement.selectedOptions).map(option => option.value);
        }
         else {
             // Default case for text, password, hidden, select-one, textarea, etc.
            formData[identifier] = inputElement.value;
        }
    });

    return formData;
}

// Function to save data as a JSON file
function saveAsJson(data) {
    if (!data) {
        console.error("saveAsJson: No data provided to save.");
        return;
    }
    const jsonString = JSON.stringify(data, null, 2); // Pretty print JSON
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'form_data.json';
    
    // Add the link to the document and click it automatically
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    // Clean up
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
    
    // Consider a less intrusive notification method if alerts are disruptive
    console.log("Form data saved successfully as form_data.json.");
    alert("Form data saved successfully! To fill another form, navigate to the desired page and click 'Load and Fill Form'.");
}

// Function to load data from a JSON file via a user prompt
function loadJsonFile() {
    return new Promise((resolve, reject) => {
        // Create a modal div for the file input
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
        
        // Create the upload panel within the modal
        const panel = document.createElement('div');
        panel.style.backgroundColor = '#fff';
        panel.style.padding = '20px';
        panel.style.borderRadius = '5px';
        panel.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
        panel.style.maxWidth = '500px';
        panel.style.width = '80%';
        
        const title = document.createElement('h3');
        title.textContent = 'Select the JSON file with the form data';
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
        cancelButton.textContent = 'Cancel';
        cancelButton.style.marginRight = '10px';
        cancelButton.style.padding = '8px 16px';
        cancelButton.style.backgroundColor = '#f44336';
        cancelButton.style.color = 'white';
        cancelButton.style.border = 'none';
        cancelButton.style.borderRadius = '4px';
        cancelButton.style.cursor = 'pointer';
        
        const loadButton = document.createElement('button');
        loadButton.textContent = 'Load';
        loadButton.style.padding = '8px 16px';
        loadButton.style.backgroundColor = '#4CAF50';
        loadButton.style.color = 'white';
        loadButton.style.border = 'none';
        loadButton.style.borderRadius = '4px';
        loadButton.style.cursor = 'pointer';
        loadButton.disabled = true;
        
        // Enable the load button only when a file is selected
        fileInput.addEventListener('change', () => {
            loadButton.disabled = !fileInput.files.length;
        });
        
        cancelButton.onclick = () => {
            document.body.removeChild(modal);
            console.log("File load operation cancelled by user.");
            reject("User cancelled the operation"); // Reject promise on cancel
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

// Function to fill a specific form element with data from a JSON object
function fillFormWithJson(formElement, data) { // Added formElement parameter
    if (!formElement) { // Check formElement
        console.error("fillFormWithJson: Form element not provided.");
        return;
    }
    if (!data) { // Check data
         console.error("fillFormWithJson: Data not provided.");
         return;
    }

    const formInputs = formElement.querySelectorAll('input, select, textarea'); // Use formElement

    formInputs.forEach(inputElement => {
        // Ignore buttons
        if (['submit', 'button', 'reset'].includes(inputElement.type)) {
            return;
        }

        // Pass the formElement to the identifier function
        const identifier = getFieldInstanceIdentifier(formElement, inputElement);
        const originalName = inputElement.name || inputElement.id; // Needed for radio/checkbox group logic
        const inputType = inputElement.type;

        if (identifier && data.hasOwnProperty(identifier)) {
            // Handle fields identified uniquely (most common case)
            const value = data[identifier];

            if (inputType === 'checkbox') {
                // Simple checked state based on unique ID (if stored that way)
                 inputElement.checked = !!value;
                 // If data was stored per group (array of values), this needs adjustment
                 // Example: if (data[originalName] && data[originalName].includes(inputElement.value)) { inputElement.checked = true; }
            } else if (inputType === 'radio') {
                 // Simple check based on unique ID (if stored that way)
                 if (inputElement.value === value) {
                     inputElement.checked = true;
                 }
                 // If data was stored per group:
                 // Example: if (data[originalName] === inputElement.value) { inputElement.checked = true; }
            } else if (inputType !== 'file') { // Ignore file inputs
                 if (inputElement.multiple && inputElement.tagName === 'SELECT') {
                     // Handle multi-select specifically
                     if (Array.isArray(value)) { // Ensure data is an array
                         const valuesSet = new Set(value); // Use Set for efficient lookup
                         Array.from(inputElement.options).forEach(option => {
                             option.selected = valuesSet.has(option.value);
                         });
                     } else {
                         console.warn(`Expected array for multi-select '${identifier}', but got:`, value);
                         // Attempt to set single value if not array? Or clear selection?
                         // For now, we log a warning and don't change selection if data is wrong type.
                     }
                 } else {
                    // Handle single-value fields
                    inputElement.value = value;
                 }

                // Dispatch change event to trigger potential listeners/validations
                const changeEvent = new Event('change', { bubbles: true });
                inputElement.dispatchEvent(changeEvent);

                // Also dispatch input event for fields that use input listeners
                const inputEvent = new Event('input', { bubbles: true });
                inputElement.dispatchEvent(inputEvent);
            }
        } else if (originalName && data.hasOwnProperty(originalName)) {
             // Fallback/Alternative: Handle fields based on original name (for radio/checkbox groups stored by group name)
             const value = data[originalName];

             if (inputType === 'checkbox') {
                 // Assumes data[originalName] is an array of checked values for the group
                 if (Array.isArray(value)) {
                     inputElement.checked = value.includes(inputElement.value || 'on');
                 } else {
                     // Handle case where single checkbox group was saved as boolean? (Less common)
                     inputElement.checked = !!value && inputElement.value === (inputElement.value || 'on'); // Check if the value matches this specific checkbox
                 }
             } else if (inputType === 'radio') {
                 // Assumes data[originalName] is the single value for the selected radio in the group
                 inputElement.checked = (inputElement.value === value);
             }
             // Potentially trigger events here too if needed for fallback cases
            // Consider dispatching change/input events here as well if this fallback is used
         }
     });

    // Provide visual feedback to the user
    highlightFilledFields(formElement); // Pass the form element
 }
// Function to visually highlight filled fields within a specific form
function highlightFilledFields(formElement) {
    if (!formElement) return; // Don't proceed if form element is missing

    const inputs = formElement.querySelectorAll('input, select, textarea');
    const highlightColor = '#e6ffe6'; // Light green
    const highlightDuration = 1500; // ms
    const transitionTime = '1s';

    inputs.forEach(inputElement => {
        // Ignore buttons
        if (['submit', 'button', 'reset'].includes(inputElement.type)) {
            return;
        }

        // Add a subtle animation to show the field was populated
        const originalBackground = inputElement.style.backgroundColor;
        inputElement.style.transition = `background-color ${transitionTime}`;
        inputElement.style.backgroundColor = highlightColor;

        // Reset background after a delay
        setTimeout(() => {
            // Check if the background color is still the highlight color before resetting
            // This prevents overriding manual changes made during the highlight period
            if (inputElement.style.backgroundColor === highlightColor) {
                 inputElement.style.backgroundColor = originalBackground;
            }
            // Consider removing the transition style after completion
            // setTimeout(() => { inputElement.style.transition = ''; }, highlightDuration + 50);
        }, highlightDuration);
    });
}


// --- Botões de Interface ---

// Adds a button to extract and save form data
function addExtractButton() {
    const button = document.createElement('button');
    button.textContent = 'Extract & Save Form Data';
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
    button.id = 'form-transfer-save-button'; // Add an ID for easier selection/checking
    
    button.onclick = () => {
        // Find the target form (e.g., the first one on the page for now)
        // TODO: Make form selection more robust (e.g., allow user selection, target specific ID)
        const targetForm = document.querySelector('form');
        if (!targetForm) {
            alert("No form found on the page to extract data from!");
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
    button.id = 'form-transfer-load-button'; // Add an ID
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

// --- Main Script Logic ---

// Adiciona os botões quando a página carrega
// Initializes the script by adding the UI buttons.
function init() {
    // Check if buttons already exist to prevent duplication if script runs multiple times.
    const saveButtonExists = document.getElementById('form-transfer-save-button');
    const loadButtonExists = document.getElementById('form-transfer-load-button');

    if (!saveButtonExists) {
        addExtractButton(); // ID is now set within this function
    }
    if (!loadButtonExists) {
        addLoadButton(); // ID is now set within this function
    }

    if (!saveButtonExists || !loadButtonExists) {
        console.log("Form Transfer script initialized and buttons added/verified.");
    } else {
        console.log("Form Transfer buttons already exist.");
    }
}

// Executa a inicialização quando o DOM estiver completamente carregado
// Execute initialization when the DOM is ready.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM is already loaded
    init();
}

// --- Versão como Bookmarklet ---
// --- Bookmarklet Version Notes ---
// To use as a bookmarklet, create a new bookmark and paste the minified code
// prefixed with 'javascript:' into the URL/Location field.
/*
javascript:(function(){
    const script = document.createElement('script');
    script.src = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(`
        // Paste the entire script content here, ideally minified.
    `);
    document.body.appendChild(script);
})();
*/
// The script now initializes itself based on DOMContentLoaded or immediately if already loaded.
// The explicit init() call at the end is removed to avoid potential double initialization.